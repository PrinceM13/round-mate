import * as XLSX from "xlsx";

/**
 * Parse Excel file and extract participant names
 */
export async function parseExcelFile(
  file: File
): Promise<{ names: string[]; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON - looks for "Name" or "name" column
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    // Extract names from first column or "Name" column
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

    return { names };
  } catch (error) {
    return {
      names: [],
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
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
 * Export assignment results to Excel
 */
export function exportToExcel(
  tables: Array<{
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
