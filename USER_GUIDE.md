# Round Mate - User Guide

## Getting Started

### 1. **Start the Application**

```bash
pnpm dev
# Visit http://localhost:3000
```

---

## Step-by-Step Workflow

### **Step 1: Add Participants**

#### Option A: Bulk Upload (Recommended for 20+ participants)

1. Click **"📥 Download Template"**
2. Open the Excel file in your spreadsheet app
3. Fill in participant names in the "Name" column
4. Save the file
5. Click the upload area or drag-and-drop your file
6. Participants will be automatically added

#### Option B: Manual Entry

1. Type a participant name in the text field
2. Press Enter or click "Add" button
3. Repeat for all participants
4. You can edit names by clicking on them in the list

#### Step 1 Settings

- **Seats Per Table**: Set how many people per table (default: 10)
  - For 48 people with 10 seats: Creates 5 tables (4 full + 1 with 8 people)

#### When Ready

- Click **"Proceed to Assignment →"** button

---

### **Step 2: Review & Adjust Seating**

#### View Your Tables

- See all assigned tables with participants
- Each table shows seat layout (circular) and participant list

#### Swap Participants

**Method 1: Drag from Participant List**

1. Find the participant you want to move
2. Drag their name from the list
3. Drop onto any empty seat in the circular table

**Method 2: Swap with Another Participant**

1. Drag a participant from one seat
2. Drop on another participant to swap their positions

#### Export Options

- **📸 Export as Image**: Save table layout as PNG (great for printing)
- **📊 Export as Excel**: Download detailed assignment spreadsheet
- Both can be done while reviewing before finalizing

#### Next Step

- Click **"Continue →"** to see the final summary

---

### **Step 3: Summary & Statistics**

#### View Statistics

- **Total Tables**: Number of tables created
- **Total Participants**: People assigned
- **Filled Seats**: Occupied seats
- **Empty Seats**: Available spots

#### Table Details

- See every participant and their assigned table/seat
- Make final adjustments if needed

#### Final Actions

- **← Back to Adjustment**: Make more changes if needed
- **🔄 Create New Assignment**: Start fresh with different participants

---

## Tips & Tricks

### ✨ **Best Practices**

- For events with 50+ people, use Excel bulk upload to save time
- Review seating before exporting to ensure it meets your needs
- Export both image (for printing) and Excel (for records)

### 🎯 **Customization**

- Change seats per table to create different group sizes
- For 6-person tables: set to 6
- For 8-person tables: set to 8

### 🔄 **Making Changes**

- You can go back at any step
- The app remembers your participants as you navigate
- To start completely fresh, click the "Home" button in the navigation

---

## Troubleshooting

### **Excel File Won't Upload**

- Ensure file is in .xlsx, .xls, or .csv format
- Check that names are in the first column
- Make sure the file isn't corrupted

### **Drag-and-Drop Not Working**

- Try dragging from the participant list (easier than SVG circles)
- Ensure you're dragging the entire row
- Check that the target seat is in the same or different table

### **Export Issues**

- For images: Ensure your browser allows pop-ups
- For Excel: Check browser download settings
- Try a different browser if issues persist

---

## Keyboard Shortcuts

| Action           | Shortcut                    |
| ---------------- | --------------------------- |
| Add Participant  | Enter (when in input field) |
| Start Assignment | Click button or scroll down |
| Export Image     | Button click                |
| Export Excel     | Button click                |
| Home             | Click logo in navigation    |

---

## File Formats

### **Excel Template Format**

```
Name
John Doe
Jane Smith
Bob Johnson
...
```

### **Excel Export Format**

```
Table | Seat | Name
------|------|-------
1     | 1    | John Doe
1     | 2    | Jane Smith
2     | 1    | Bob Johnson
...
```

---

## Support & Feedback

For issues or feature requests, please contact support.

Happy seating! 🎉
