# Upload & Resume Feature - Visual Guide

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME SCREEN                              │
│                       (Step: "home")                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
        Click "Get Started" or
        Navigate to Input Step
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INPUT STEP                                   │
│                   (Step: "input")                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📥 Download Template                                            │
│  📤 Upload Excel File  ←── User uploads file here               │
│  ➕ Add Manually                                                 │
│                                                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─── File Upload Handler
                 │
                 ↓
    ┌──────────────────────────────────┐
    │  parseExcelFile(file)            │
    │  ✓ Detects file type             │
    │  ✓ Auto-identifies mode          │
    └──────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         ↓                   ↓
    TEMPLATE MODE      ASSIGNMENT MODE
    (Names only)       (Full data)
         │                   │
         ├─ Green message    ├─ Green message
         │  "Loaded X        │  "Loaded assignment
         │   participant(s)" │   with X people..."
         │                   │
         ├─ Add names to     ├─ Set state
         │  participant list │  (participants, tables,
         │                   │   seatsPerTable)
         │                   │
         └─────────┬─────────┘
                   │
        Has all participants?
                   │
         ┌─────────┴──────────┐
         ↓                    ↓
       YES (from              YES (from
      template)            assignment)
         │                    │
         ├─ Show status       ├─ Auto-navigate
         │  message           │  after 1 second
         │                    │
         └─────────┬──────────┘
                   │
         ┌─────────┴──────────┐
         ↓                    ↓
    ASSIGNMENT STEP      SUMMARY STEP
    (Step: "assignment") (Step: "summary")
         │                    │
         ├─ Assign            ├─ Display results
         │  people to         ├─ Allow download
         │  tables            ├─ Option to go back
         │                    │  and reassign
         │                    │
         └─────────┬──────────┘
                   │
         User clicks "Save"
                   │
                   ↓
    ┌──────────────────────────┐
    │  exportToExcel()         │
    │  ✓ Exports full data     │
    │  ✓ Table + Seat + Name   │
    │                          │
    │  Download:               │
    │  round-mate-assignment   │
    │  .xlsx                   │
    └──────────────────────────┘
```

---

## File Format Decision Tree

```
           ┌─────────────────┐
           │  Excel Uploaded │
           └────────┬────────┘
                    │
         Check column headers
                    │
         ┌──────────┴──────────┐
         ↓                     ↓
    Has "Table"?         Has "Table"?
    Has "Seat"?          No
    Has "Name"?
         │ YES               │ NO
         │                   │
         ↓                   ↓
    ASSIGNMENT MODE    TEMPLATE MODE
    (Resume Work)      (Start Fresh)
         │                   │
         ├─ Parse full      ├─ Extract names
         │  assignments     │  from column 1
         │                  │
         ├─ Load table data ├─ Create empty
         │                  │  assignments
         │
         ├─ Load seat       ├─ Await user
         │  assignments     │  to proceed
         │
         └─ AUTO-SKIP TO    └─ Show "Add
            SUMMARY VIEW       Manual" or
                               "Proceed"
```

---

## Data Structure After Resume

### Before Upload (Empty State)

```javascript
{
  step: "input",
  participants: [],
  tables: [],
  seatsPerTable: 10
}
```

### After Assignment File Upload

```javascript
{
  step: "summary",  // ← Auto-changed!
  participants: [
    {
      id: "abc123",
      name: "John Doe",
      tableId: 0,        // ← Preserved from file
      seatNumber: 0      // ← Preserved from file
    },
    ...
  ],
  tables: [
    {
      id: 0,
      seatsPerTable: 10,
      participants: [/* matching participants */]
    },
    {
      id: 1,
      seatsPerTable: 10,
      participants: [/* matching participants */]
    }
  ],
  seatsPerTable: 10  // ← Loaded from file
}
```

---

## File Export/Import Cycle

```
Step 1: Create Assignment
  ┌─────────────────────────┐
  │ User assigns 30 people  │
  │ across 3 tables         │
  └────────────┬────────────┘
               │
               ↓
Step 2: Export to Excel
  ┌──────────────────────────────────────┐
  │ Downloads: round-mate-assignment.xlsx│
  │ Contains:                            │
  │ ├─ Table 1 (10 people)               │
  │ ├─ Table 2 (10 people)               │
  │ └─ Table 3 (10 people)               │
  └────────────┬─────────────────────────┘
               │
    [File saved to Downloads folder]
               │
               ↓
Step 3: Close App (work ends for today)
  ┌─────────────────────────────────────┐
  │ User leaves browser/closes computer  │
  └─────────────────────────────────────┘
               │
    [Next day or later...]
               │
               ↓
Step 4: Reopen App
  ┌─────────────────────────────────────┐
  │ User goes to Round Mate website      │
  │ Starts fresh (no data in browser)    │
  └────────────┬────────────────────────┘
               │
               ↓
Step 5: Upload Saved File
  ┌────────────────────────────────────────┐
  │ User drags round-mate-assignment.xlsx  │
  │ onto upload area                       │
  │                                        │
  │ ✓ File detected as ASSIGNMENT MODE     │
  │ ✓ Auto-loads all 30 participants       │
  │ ✓ Auto-loads all 3 table assignments   │
  │ ✓ Auto-navigates to Summary            │
  └────────────┬─────────────────────────┘
               │
               ↓
Step 6: Resume/Review/Modify
  ┌────────────────────────────────────────┐
  │ User sees all previous work intact     │
  │ Can:                                   │
  │ ├─ Review assignments                  │
  │ ├─ Make edits (go back to reassign)    │
  │ ├─ Download again                      │
  │ └─ Or start a new assignment           │
  └────────────────────────────────────────┘
```

---

## Comparison: Old vs New Workflow

### ❌ OLD WORKFLOW (Without Resume)

```
Day 1:
  Start → Add 30 names → Auto-assign → View summary

Day 2:
  😞 Start over → Re-type 30 names → Auto-assign again

Day 3:
  😞 Start over → Re-type 30 names → Auto-assign again
```

### ✅ NEW WORKFLOW (With Resume)

```
Day 1:
  Start → Add 30 names → Auto-assign → View summary → EXPORT

Day 2:
  😊 Start → UPLOAD previous file → Instantly see results

Day 3:
  😊 Start → UPLOAD previous file → Instantly see results
```

---

## Implementation Checklist

- ✅ Enhanced `parseExcelFile()` for dual-mode parsing
- ✅ Auto-detection based on column headers
- ✅ `parseTemplateMode()` for name-only files
- ✅ `parseAssignmentMode()` for complete data files
- ✅ Updated `InputStep` with `onResume` callback
- ✅ File upload status messages (blue/green indicators)
- ✅ Added `handleResumeAssignment()` in main page
- ✅ Auto-navigation to summary on assignment file upload
- ✅ Exported data structure maintains all assignment data

---

## Error Scenarios Handled

```
Scenario 1: Corrupted File
  Input:  Invalid .xlsx format
  Output: Error message shown
  Action: User can try different file

Scenario 2: Empty File
  Input:  .xlsx with no data rows
  Output: "Excel file is empty"
  Action: User downloads template instead

Scenario 3: Partial Assignment
  Input:  File with Table & Name but no Seat column
  Output: Falls back to TEMPLATE mode
  Action: Treated as name list (safe fallback)

Scenario 4: Mixed Data
  Input:  File with some rows having assignments, some not
  Output: Intelligently parses available data
  Action: Loads participants with available seat info

Scenario 5: Duplicate Names
  Input:  File with duplicate participant names
  Output: All names loaded (system assigns unique IDs)
  Action: Works normally (IDs prevent conflicts)
```

---

## Summary

The feature elegantly handles both starting fresh and resuming work through:

1. **Smart Auto-Detection**: Examines file columns to determine mode
2. **Single Format**: Uses `round-mate-assignment.xlsx` for everything
3. **Seamless Navigation**: Auto-skips to appropriate step
4. **User Feedback**: Clear status messages for uploaded files
5. **Data Preservation**: All assignments perfectly restored

Users can now work at their own pace across multiple sessions! 🎉
