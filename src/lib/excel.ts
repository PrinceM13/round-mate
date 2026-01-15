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
    // Check both row 0 and row 1 (in case row 0 is metadata)
    const row0 = data[0] as (string | undefined)[];
    const row1 = data[1] as (string | undefined)[];

    const checkRow = (row: (string | undefined)[]) => ({
      hasTableColumn: row.some((h) =>
        h ? /^table$/i.test(h.toString()) : false
      ),
      hasSeatColumn: row.some((h) =>
        h ? /^seat$/i.test(h.toString()) : false
      ),
      hasNameColumn: row.some((h) =>
        h ? /^name$/i.test(h.toString()) : false
      ),
    });

    const row0Check = checkRow(row0);
    const row1Check = checkRow(row1);

    // ASSIGNMENT MODE: File has Table + Seat + Name columns (in either row 0 or row 1)
    if (
      (row0Check.hasTableColumn &&
        row0Check.hasSeatColumn &&
        row0Check.hasNameColumn) ||
      (row1Check.hasTableColumn &&
        row1Check.hasSeatColumn &&
        row1Check.hasNameColumn)
    ) {
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
    // Check if first row is metadata (SeatsPerTable info)
    let metadataSeatsPerTable: number | null = null;
    let headerRowIdx = 0;

    if (
      data[0] &&
      data[0][0] &&
      /^seatspertable$/i.test(data[0][0].toString())
    ) {
      // First row is metadata
      const seatsValue = data[0][1];
      metadataSeatsPerTable = seatsValue ? parseInt(String(seatsValue)) : null;
      headerRowIdx = 1; // Headers are in second row
    }

    // Find column indices
    const headers = data[headerRowIdx];
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
    let maxSeatsPerTable = metadataSeatsPerTable ?? 10; // Use metadata value or default to 10
    const validationIssues: ValidationIssue[] = [];
    let skippedRows = 0;

    // Parse data rows (start after header row, which may be row 0 or 1 if metadata present)
    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const tableStr = String(row[tableColIdx]).trim();
      const seatStr = String(row[seatColIdx]).trim();
      const name = String(row[nameColIdx]).trim();

      // ASSIGNMENT MODE: STRICT VALIDATION
      // In assignment mode with explicit columns, we expect:
      // - Table + Name (required)
      // - Seat (required if Seat column exists in header)

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

      // Validation: Check for missing table - this is REQUIRED in assignment mode
      if (!tableStr) {
        validationIssues.push({
          row: i + 1,
          issue: `Missing table assignment for "${name}" - in assignment format, Table is required for all rows`,
          severity: "error",
        });
        skippedRows++;
        continue;
      }

      // Validation: Check for missing seat - REQUIRED if Seat column exists
      if (seatColIdx !== -1 && !seatStr) {
        validationIssues.push({
          row: i + 1,
          issue: `Missing seat number for "${name}" at "${tableStr}" - Seat is required in assignment format`,
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

      // Parse seat number - must be valid if it exists
      let seatNum: number | null = null;
      if (seatStr) {
        const seatNum_parsed = parseInt(seatStr);
        if (isNaN(seatNum_parsed)) {
          validationIssues.push({
            row: i + 1,
            issue: `Invalid seat number "${seatStr}" for "${name}" - must be a number`,
            severity: "error",
          });
          skippedRows++;
          continue;
        }
        seatNum = seatNum_parsed - 1; // Convert to 0-indexed
      }

      const tableNum = parseInt(tableMatch[0]) - 1; // Convert to 0-indexed

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

      // Track max seats seen (only if we didn't get it from metadata)
      if (
        metadataSeatsPerTable === null &&
        seatNum !== null &&
        seatNum + 1 > maxSeatsPerTable
      ) {
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

    // Check for validation errors (strict mode for assignment files)
    const hasErrors = validationIssues.some(
      (issue) => issue.severity === "error"
    );

    if (hasErrors && participants.length === 0) {
      // No valid participants at all - reject the file
      return {
        mode: "assignment",
        participants: [],
        tables: [],
        error:
          "Invalid assignment file format: All rows have missing required data (Table and/or Name fields). Please ensure all rows have both Table and Name values.",
        validationIssues,
        skippedRows,
      };
    }

    if (hasErrors && participants.length > 0) {
      // Some rows are valid, some aren't - show modal to let user decide
      return {
        mode: "assignment",
        participants,
        tables,
        seatsPerTable: maxSeatsPerTable,
        validationIssues,
        skippedRows,
      };
    }

    // All data is valid - no validation issues to report
    return {
      mode: "assignment",
      participants,
      tables,
      seatsPerTable: maxSeatsPerTable,
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
        seatsPerTable?: number;
        participants: Array<{ name: string; seatNumber: number | null }>;
      }>
): void {
  // Get seatsPerTable from first table (they should all have the same value)
  const seatsPerTable = tables[0]?.seatsPerTable || 10;

  // Add metadata row with seatsPerTable info, then header row, then data
  const data: (string | number)[][] = [
    ["SeatsPerTable", seatsPerTable, "", ""], // Metadata row
    ["Table", "Seat", "Name"], // Header row
  ];

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
