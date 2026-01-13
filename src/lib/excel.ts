import * as XLSX from "xlsx";
import type { Participant, Table } from "@/types";

export interface ValidationIssue {
  row: number;
  issue: string;
  severity: "warning" | "error";
}

export interface ParseResult {
  names?: string[]; // For template mode (only names)
  participants?: Participant[]; // For assignment mode (full data)
  tables?: Table[]; // For assignment mode (table assignments)
  seatsPerTable?: number; // For assignment mode
  mode: "template" | "assignment"; // Indicates which mode was detected
  error?: string;
  validationIssues?: ValidationIssue[]; // Data quality warnings/errors
  skippedRows?: number; // Number of rows skipped due to missing data
}

/**
 * Parse Excel file - supports both template (names only) and assignment (with table data)
 * Auto-detects the file type based on columns present
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    if (data.length === 0) {
      return {
        mode: "template",
        names: [],
        error: "Excel file is empty",
      };
    }

    // Detect file type by checking headers and columns
    const headerRow = data[0] as (string | undefined)[];
    const hasTableColumn = headerRow.some((h) =>
      h ? /^table$/i.test(h.toString()) : false
    );
    const hasSeatColumn = headerRow.some((h) =>
      h ? /^seat$/i.test(h.toString()) : false
    );
    const hasNameColumn = headerRow.some((h) =>
      h ? /^name$/i.test(h.toString()) : false
    );

    // ASSIGNMENT MODE: File has Table + Seat + Name columns
    if (hasTableColumn && hasSeatColumn && hasNameColumn) {
      return parseAssignmentMode(data as string[][]);
    }

    // TEMPLATE MODE: File has only names (or first column is name-like)
    return parseTemplateMode(data as string[][]);
  } catch (error) {
    return {
      mode: "template",
      names: [],
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Parse template mode: Extract participant names from first column
 */
function parseTemplateMode(data: string[][]): ParseResult {
  const names: string[] = [];

  if (data.length > 0) {
    // Check if first row is header
    const firstRow = data[0];
    const isHeader =
      firstRow.length > 0 && typeof firstRow[0] === "string"
        ? /^name$/i.test(firstRow[0])
        : false;

    const startRow = isHeader ? 1 : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        const name = String(row[0]).trim();
        if (name) {
          names.push(name);
        }
      }
    }
  }

  return {
    mode: "template",
    names,
  };
}

/**
 * Parse assignment mode: Extract full table + seat + participant assignments
 * Validates data and reports issues without silently skipping
 */
function parseAssignmentMode(data: string[][]): ParseResult {
  try {
    // Find column indices
    const headers = data[0];
    const tableColIdx = headers.findIndex((h) => /^table$/i.test(h.toString()));
    const seatColIdx = headers.findIndex((h) => /^seat$/i.test(h.toString()));
    const nameColIdx = headers.findIndex((h) => /^name$/i.test(h.toString()));

    if (tableColIdx === -1 || nameColIdx === -1) {
      throw new Error(
        "Invalid assignment file format: missing Table or Name column"
      );
    }

    const participants: Participant[] = [];
    const tableMap = new Map<
      number,
      { id: number; seatsPerTable: number; participants: Participant[] }
    >();
    let maxSeatsPerTable = 10; // default
    const validationIssues: ValidationIssue[] = [];
    let skippedRows = 0;

    // Parse data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const tableStr = String(row[tableColIdx]).trim();
      const seatStr = String(row[seatColIdx]).trim();
      const name = String(row[nameColIdx]).trim();

      // Validation: Check for missing name
      if (!name) {
        validationIssues.push({
          row: i + 1,
          issue: `Missing name in row ${i + 1}`,
          severity: "error",
        });
        skippedRows++;
        continue;
      }

      // Validation: Check for missing table
      if (!tableStr) {
        validationIssues.push({
          row: i + 1,
          issue: `Missing table assignment for "${name}"`,
          severity: "error",
        });
        skippedRows++;
        continue;
      }

      // Extract table number (e.g., "Table 1" -> 1)
      const tableMatch = tableStr.match(/\d+/);
      if (!tableMatch) {
        validationIssues.push({
          row: i + 1,
          issue: `Invalid table format "${tableStr}" for "${name}" (expected "Table X")`,
          severity: "error",
        });
        skippedRows++;
        continue;
      }

      // Note: Missing seat number is OK - it will be null and displayed as "-"
      // No warning needed for this case

      const tableNum = parseInt(tableMatch[0]) - 1; // Convert to 0-indexed
      const seatNum = seatStr ? parseInt(seatStr) - 1 : null; // Convert to 0-indexed, handle empty seats

      // Create participant
      const participant: Participant = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        tableId: tableNum,
        seatNumber: seatNum,
      };

      participants.push(participant);

      // Build table structure
      if (!tableMap.has(tableNum)) {
        tableMap.set(tableNum, {
          id: tableNum,
          seatsPerTable: 10,
          participants: [],
        });
      }

      tableMap.get(tableNum)!.participants.push(participant);

      // Track max seats seen
      if (seatNum !== null && seatNum + 1 > maxSeatsPerTable) {
        maxSeatsPerTable = seatNum + 1;
      }
    }

    // Update all tables with consistent seatsPerTable
    tableMap.forEach((table) => {
      table.seatsPerTable = maxSeatsPerTable;
    });

    // Convert map to array and sort by table id
    const tables: Table[] = Array.from(tableMap.values()).sort(
      (a, b) => a.id - b.id
    );

    // Check if we have valid data
    if (participants.length === 0) {
      return {
        mode: "assignment",
        participants: [],
        tables: [],
        error: "No valid participants found in assignment file. Please check the data format.",
        validationIssues,
        skippedRows,
      };
    }

    return {
      mode: "assignment",
      participants,
      tables,
      seatsPerTable: maxSeatsPerTable,
      validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
      skippedRows: skippedRows > 0 ? skippedRows : undefined,
    };
  } catch (error) {
    return {
      mode: "template",
      names: [],
      error: `Failed to parse assignment file: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Generate Excel template for download
 */
export function generateExcelTemplate(): void {
  const data = [["Name"], ["John Doe"], ["Jane Smith"], [""], [""]];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column width
  worksheet["!cols"] = [{ wch: 30 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
  XLSX.writeFile(workbook, "round-mate-template.xlsx");
}

/**
 * Export assignment results to Excel (full assignment data)
 * This creates the complete assignment file that can be re-imported to resume work
 */
export function exportToExcel(
  tables:
    | Table[]
    | Array<{
        id: number;
        participants: Array<{ name: string; seatNumber: number | null }>;
      }>
): void {
  const data: (string | number)[][] = [["Table", "Seat", "Name"]];

  tables.forEach((table) => {
    table.participants.forEach((p) => {
      data.push([
        `Table ${table.id + 1}`,
        p.seatNumber !== null ? p.seatNumber + 1 : "",
        p.name,
      ]);
    });
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [{ wch: 15 }, { wch: 8 }, { wch: 25 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Assignment");
  XLSX.writeFile(workbook, "round-mate-assignment.xlsx");
}
