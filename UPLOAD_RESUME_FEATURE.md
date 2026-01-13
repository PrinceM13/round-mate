# Upload & Resume Feature Documentation

## Overview

Your Round Mate application now supports **uploading previously saved assignment files** to resume work without starting from scratch. This uses a **single unified file format** that automatically detects whether a file contains just names (template) or complete assignment data.

---

## How It Works

### Two-Mode File Format

The system automatically detects the file type by examining the columns:

#### **Mode 1: Template (Names Only)**

- **File**: `round-mate-template.xlsx`
- **Columns**: Only "Name" column
- **Behavior**: Starts fresh from Step 1 (Input)
- **Use Case**: First-time setup or starting a new assignment

```
| Name          |
|---------------|
| John Doe      |
| Jane Smith    |
| Bob Johnson   |
```

#### **Mode 2: Assignment (Full Data)**

- **File**: `round-mate-assignment.xlsx`
- **Columns**: "Table", "Seat", "Name"
- **Behavior**: Jumps directly to Summary view (skips assignment step)
- **Use Case**: Resuming previous work

```
| Table   | Seat | Name      |
|---------|------|-----------|
| Table 1 | 1    | Sasa      |
| Table 1 | 2    | Ken       |
| Table 2 | 1    | Jan       |
| Table 2 | 2    | Ito       |
```

---

## User Journey

### **Scenario 1: Starting Fresh**

1. User uploads `round-mate-template.xlsx` (or clicks "Download Template")
2. File detected as **template mode** ✓
3. Names are added to participant list
4. User proceeds through Steps 2-3 normally

### **Scenario 2: Resuming Previous Work**

1. User uploads previously exported `round-mate-assignment.xlsx`
2. File detected as **assignment mode** ✓
3. System loads all participants with their table assignments
4. **Auto-navigates to Summary** (displays final result)
5. User can:
   - Download the file again
   - Go back to reassign
   - Start a new assignment

---

## Technical Implementation

### **File Processing**

**Location**: `src/lib/excel.ts`

```typescript
// New interface for parse results
interface ParseResult {
  names?: string[]; // For template mode
  participants?: Participant[]; // For assignment mode
  tables?: Table[]; // For assignment mode
  seatsPerTable?: number; // For assignment mode
  mode: "template" | "assignment";
  error?: string;
}

// Main function
async function parseExcelFile(file: File): Promise<ParseResult>;
```

**Auto-Detection Logic**:

```typescript
const hasTableColumn = headerRow.some((h) => /^table$/i.test(h));
const hasSeatColumn = headerRow.some((h) => /^seat$/i.test(h));
const hasNameColumn = headerRow.some((h) => /^name$/i.test(h));

if (hasTableColumn && hasSeatColumn && hasNameColumn) {
  // ASSIGNMENT MODE
  return parseAssignmentMode(data);
}
// DEFAULT: TEMPLATE MODE
return parseTemplateMode(data);
```

### **UI Updates**

**Location**: `src/components/InputStep.tsx`

Added feedback when file is uploaded:

```typescript
{fileStatus && (
  <p className={`text-sm ${
    fileStatus.type === "assignment"
      ? "text-green-600"  // Resume file
      : "text-blue-600"   // Template file
  }`}>
    {fileStatus.message}
  </p>
)}
```

### **Navigation Flow**

**Location**: `src/app/page.tsx`

New handler for assignment resume:

```typescript
const handleResumeAssignment = (
  resumedParticipants: Participant[],
  resumedTables: Table[],
  seats: number
) => {
  setParticipants(resumedParticipants);
  setTables(resumedTables);
  setSeatsPerTable(seats);
  setStep("summary"); // Skip assignment, go straight to summary
};
```

---

## File Export

When users click "Download" on the Summary page, they get the **complete assignment file** with all three columns:

```typescript
export function exportToExcel(tables: Table[]): void {
  const data: (string | number)[][] = [["Table", "Seat", "Name"]];

  // Builds complete assignment data
  tables.forEach((table) => {
    table.participants.forEach((p) => {
      data.push([
        `Table ${table.id + 1}`,
        p.seatNumber !== null ? p.seatNumber + 1 : "",
        p.name,
      ]);
    });
  });

  XLSX.writeFile(workbook, "round-mate-assignment.xlsx");
}
```

This file can be re-imported to resume work anytime.

---

## Best Practices (Why One Format?)

### ✅ Advantages of Single Format

1. **No Confusion**: Users don't need to remember which file is which
2. **Automatic Detection**: Smart logic handles both cases
3. **Seamless Workflow**: Works whether resuming or starting fresh
4. **Backward Compatible**: Old template files still work
5. **Future-Proof**: Easy to add more data without changing format

### Example Workflow Cycle

```
1. Download Template
   ↓
2. Fill with names
   ↓
3. Do assignment
   ↓
4. Export Assignment (round-mate-assignment.xlsx)
   ↓
5. [Later] Upload same file to resume
   ↓
6. See results in summary
   ↓
7. Can re-export and re-upload indefinitely
```

---

## Testing the Feature

### **Test Case 1: Upload Template**

```
✓ Download template.xlsx
✓ Upload it back
✓ Should show "Loaded X participant(s) from template" (blue message)
✓ Proceed to assignment normally
```

### **Test Case 2: Upload Assignment**

```
✓ Create assignment (3 tables, 10 participants)
✓ Export assignment file
✓ Home → Upload that file
✓ Should show "Loaded assignment with 10 participants across 3 tables" (green message)
✓ Auto-navigate to Summary (skip Step 2)
✓ Verify all assignments match
```

### **Test Case 3: Mixed Usage**

```
✓ Upload template 1 (5 people)
✓ Do assignment
✓ Export assignment
✓ Upload template 2 (3 people) - appends to list
✓ Verify both groups are there
```

---

## File Specifications

### Template Format

```xlsx
| Name          |
| John Doe      |
| Jane Smith    |
```

- Header: "Name" (required for detection)
- Data: One name per row
- Optional: Any number of empty rows

### Assignment Format

```xlsx
| Table   | Seat | Name      |
| Table 1 | 1    | John Doe  |
| Table 1 | 2    | Jane Smith|
| Table 2 | 1    | Bob       |
```

- Headers: Must have "Table", "Seat", and "Name" (case-insensitive)
- Table format: "Table X" (extracts number)
- Seat: 1-indexed (user-friendly)
- Preserves exact assignments

---

## Error Handling

The system handles various edge cases:

```typescript
// Invalid file
→ Shows error message, doesn't navigate

// Empty file
→ "Excel file is empty" error

// Missing columns in assignment
→ Falls back to template mode
→ Treats as name list

// Malformed data
→ Skips invalid rows
→ Shows what was parsed successfully
```

---

## Future Enhancements

Possible improvements:

1. **Timestamps**: Add "Last Modified" column
2. **Notes**: Allow per-table notes
3. **Multiple Sheets**: Support different assignment versions
4. **Undo/Redo**: In-app revision history
5. **Cloud Sync**: Save to cloud storage
6. **Email Export**: Send assignments via email

---

## Summary

The new feature provides a seamless, intuitive way to:

- ✅ Save work to Excel
- ✅ Resume from saved files
- ✅ Start fresh with templates
- ✅ No manual format selection needed
- ✅ One file format for all scenarios

Users can now work on assignments across multiple sessions without losing progress!
