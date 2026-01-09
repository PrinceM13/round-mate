"use client";

import { useState, useRef } from "react";
import type { Participant, Table } from "@/types";
import { swapParticipants, generateTables } from "@/lib/assignment";
import { RoundTable } from "./RoundTable";
import html2canvas from "html2canvas";
import { exportToExcel } from "@/lib/excel";

interface AssignmentStepProps {
  participants: Participant[];
  tables: Table[];
  seatsPerTable: number;
  onNext: () => void;
  onBack: () => void;
}

export function AssignmentStep({
  participants: initialParticipants,
  tables: initialTables,
  seatsPerTable,
  onNext,
  onBack,
}: AssignmentStepProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [selectedSeat, setSelectedSeat] = useState<{
    tableId: number;
    seatNumber: number;
    participantId?: string;
  } | null>(null);
  const tablesRef = useRef<HTMLDivElement>(null);

  const tables = generateTables(participants, seatsPerTable);

  const handleSeatClick = (
    tableId: number,
    seatNumber: number,
    participantId?: string
  ) => {
    // If this seat is already selected, deselect it
    if (
      selectedSeat?.tableId === tableId &&
      selectedSeat?.seatNumber === seatNumber
    ) {
      setSelectedSeat(null);
      return;
    }

    // If no seat is selected yet, select this one
    if (!selectedSeat) {
      setSelectedSeat({ tableId, seatNumber, participantId });
      return;
    }

    // If a seat is already selected, swap
    const firstParticipant = participants.find(
      (p) =>
        p.tableId === selectedSeat.tableId &&
        p.seatNumber === selectedSeat.seatNumber
    );
    const secondParticipant = participants.find(
      (p) => p.tableId === tableId && p.seatNumber === seatNumber
    );

    if (firstParticipant && secondParticipant) {
      // Swap two participants
      const updated = swapParticipants(
        participants,
        firstParticipant.id,
        secondParticipant.id
      );
      setParticipants(updated);
    } else if (firstParticipant && !secondParticipant) {
      // Move one participant to empty seat
      setParticipants(
        participants.map((p) =>
          p.id === firstParticipant.id ? { ...p, tableId, seatNumber } : p
        )
      );
    }

    setSelectedSeat(null);
  };

  const handleExportImage = async () => {
    if (!participants.length) {
      alert("No data to export");
      return;
    }

    try {
      // Create a clean screenshot by rendering just the table data
      const screenshotDiv = document.createElement("div");
      screenshotDiv.style.position = "fixed";
      screenshotDiv.style.left = "-9999px";
      screenshotDiv.style.top = "0";
      screenshotDiv.style.width = "900px";
      screenshotDiv.style.background = "white";
      screenshotDiv.style.padding = "40px";
      screenshotDiv.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      // Create header
      const header = document.createElement("h1");
      header.textContent = "Round Mate - Table Assignments";
      header.style.textAlign = "center";
      header.style.color = "#1f2937";
      header.style.marginBottom = "10px";
      header.style.fontSize = "28px";
      header.style.fontWeight = "bold";
      screenshotDiv.appendChild(header);

      const dateInfo = document.createElement("p");
      dateInfo.textContent = `Generated on ${new Date().toLocaleString()}`;
      dateInfo.style.textAlign = "center";
      dateInfo.style.color = "#6b7280";
      dateInfo.style.marginBottom = "30px";
      dateInfo.style.fontSize = "14px";
      screenshotDiv.appendChild(dateInfo);

      // Create tables for each seating arrangement
      tables.forEach((table) => {
        const tableContainer = document.createElement("div");
        tableContainer.style.marginBottom = "30px";
        tableContainer.style.pageBreakInside = "avoid";

        const tableTitle = document.createElement("h2");
        tableTitle.textContent = `Table ${table.id + 1}`;
        tableTitle.style.fontSize = "18px";
        tableTitle.style.fontWeight = "bold";
        tableTitle.style.marginBottom = "12px";
        tableTitle.style.color = "#1f2937";
        tableContainer.appendChild(tableTitle);

        const table_el = document.createElement("table");
        table_el.style.width = "100%";
        table_el.style.borderCollapse = "collapse";
        table_el.style.marginBottom = "20px";

        // Header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.style.backgroundColor = "#f3f4f6";
        const seatHeader = document.createElement("th");
        seatHeader.textContent = "Seat";
        seatHeader.style.padding = "12px";
        seatHeader.style.textAlign = "left";
        seatHeader.style.border = "1px solid #d1d5db";
        seatHeader.style.fontWeight = "bold";
        seatHeader.style.color = "#1f2937";
        const nameHeader = document.createElement("th");
        nameHeader.textContent = "Participant Name";
        nameHeader.style.padding = "12px";
        nameHeader.style.textAlign = "left";
        nameHeader.style.border = "1px solid #d1d5db";
        nameHeader.style.fontWeight = "bold";
        nameHeader.style.color = "#1f2937";
        headerRow.appendChild(seatHeader);
        headerRow.appendChild(nameHeader);
        thead.appendChild(headerRow);
        table_el.appendChild(thead);

        // Body
        const tbody = document.createElement("tbody");
        Array.from({ length: seatsPerTable }).forEach((_, i) => {
          const participant = participants.find(
            (p) => p.tableId === table.id && p.seatNumber === i
          );
          const row = document.createElement("tr");
          row.style.backgroundColor = i % 2 === 0 ? "#ffffff" : "#f9fafb";

          const seatCell = document.createElement("td");
          seatCell.textContent = String(i + 1);
          seatCell.style.padding = "12px";
          seatCell.style.border = "1px solid #d1d5db";
          seatCell.style.color = "#6366f1";
          seatCell.style.fontWeight = "bold";

          const nameCell = document.createElement("td");
          nameCell.textContent = participant?.name || "-";
          nameCell.style.padding = "12px";
          nameCell.style.border = "1px solid #d1d5db";
          nameCell.style.color = "#1f2937";

          row.appendChild(seatCell);
          row.appendChild(nameCell);
          tbody.appendChild(row);
        });
        table_el.appendChild(tbody);
        tableContainer.appendChild(table_el);
        screenshotDiv.appendChild(tableContainer);
      });

      document.body.appendChild(screenshotDiv);

      const canvas = await html2canvas(screenshotDiv, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 900,
        windowHeight: document.body.scrollHeight,
      });

      document.body.removeChild(screenshotDiv);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "round-mate-assignment.png";
      link.click();
    } catch (error) {
      console.error("Export error:", error);
      alert(
        "Export failed. You can:\n\n1. Export as Excel instead (more reliable)\n2. Use your browser's screenshot tool (Cmd+Shift+4 on Mac, Windows+Shift+S on Windows)"
      );
    }
  };

  const handleExportExcel = () => {
    const exportTables = tables.map((table) => ({
      id: table.id,
      participants: participants
        .filter((p) => p.tableId === table.id)
        .sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0))
        .map((p) => ({
          name: p.name,
          seatNumber: p.seatNumber,
        })),
    }));

    exportToExcel(exportTables);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Round Mate Assignment
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Step 2 of 3: Review & Adjust
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <div className="border-primary bg-primary/5 rounded-2xl border-l-4 p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>Click to Swap:</strong>
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Click 2 seats on the table to exchange them. First seat will be
            highlighted in pink.
          </p>
        </div>
      </div>

      {/* Click-to-swap indicator - overlay at bottom */}
      {selectedSeat && (
        <div
          className="fixed bottom-20 left-1/2 z-40 rounded-lg px-6 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-lg"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "rgba(236, 72, 153, 0.9)",
          }}
        >
          🎯 Selected: Table {selectedSeat.tableId + 1}, Seat{" "}
          {selectedSeat.seatNumber + 1}
          {selectedSeat.participantId && (
            <span className="ml-2 font-normal">
              (
              {
                participants.find((p) => p.id === selectedSeat.participantId)
                  ?.name
              }
              )
            </span>
          )}
          <p className="mt-1 text-xs font-normal opacity-90">
            Click another seat to swap
          </p>
        </div>
      )}

      {/* Tables Display */}
      <div
        ref={tablesRef}
        className="space-y-8 rounded-2xl bg-white p-8 dark:bg-slate-950"
      >
        {tables.length === 0 ? (
          <p className="text-center text-slate-500">No tables to display</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
                onDragOver={(e) => e.preventDefault()}
              >
                <RoundTable
                  tableId={table.id}
                  participants={table.participants}
                  seatsPerTable={seatsPerTable}
                  selectedSeat={selectedSeat}
                  onSeatClick={handleSeatClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onBack}
          className="hover:border-primary hover:bg-primary/5 rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-900 transition-all dark:border-slate-700 dark:text-white"
        >
          ← Back
        </button>
        <button
          onClick={handleExportImage}
          className="bg-accent hover:shadow-accent/50 flex-1 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          📸 Export as Image
        </button>
        <button
          onClick={handleExportExcel}
          className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-green-600/50"
        >
          📊 Export as Excel
        </button>
        <button
          onClick={onNext}
          className="from-primary to-secondary flex-1 rounded-lg bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
