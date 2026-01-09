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
    if (tablesRef.current) {
      try {
        const canvas = await html2canvas(tablesRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          logging: true,
          ignoreElements: (element) => {
            return element.classList.contains("no-export");
          },
        });

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "round-mate-assignment.png";
        link.click();
      } catch (error) {
        console.error("Export error:", error);
        alert(
          "Failed to export image. This may be due to SVG rendering. Try taking a screenshot instead."
        );
      }
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
            <strong>Two ways to swap:</strong>
          </p>
          <ul className="mt-2 ml-4 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <li>
              ✨ <strong>Click to Swap:</strong> Click 2 seats on the table to
              exchange them
            </li>
          </ul>
        </div>

        {/* Click-to-swap indicator */}
        {selectedSeat && (
          <div className="border-secondary bg-secondary/5 rounded-2xl border-l-4 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              🎯 First seat selected: Table {selectedSeat.tableId + 1}, Seat{" "}
              {selectedSeat.seatNumber + 1}
              {selectedSeat.participantId && (
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  (
                  {
                    participants.find(
                      (p) => p.id === selectedSeat.participantId
                    )?.name
                  }
                  )
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Click another seat to swap, or click this seat again to cancel
            </p>
          </div>
        )}
      </div>

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
