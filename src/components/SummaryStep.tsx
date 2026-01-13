"use client";

import type { Participant, Table } from "@/types";

interface SummaryStepProps {
  tables: Table[];
  totalParticipants: number;
  seatsPerTable: number;
  onBack: () => void;
  onReset: () => void;
}

export function SummaryStep({
  tables,
  totalParticipants,
  seatsPerTable,
  onBack,
  onReset,
}: SummaryStepProps) {
  const filledSeats = tables.reduce(
    (sum, table) => sum + table.participants.length,
    0
  );
  const totalSeats = tables.length * seatsPerTable;
  const emptySeats = totalSeats - filledSeats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Assignment Complete! 🎉
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Step 3 of 3: Summary
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Tables", value: tables.length, icon: "🪑" },
          { label: "Total Participants", value: totalParticipants, icon: "👥" },
          { label: "Filled Seats", value: filledSeats, icon: "✓" },
          { label: "Empty Seats", value: emptySeats, icon: "○" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
          >
            <div className="mb-2 text-3xl">{stat.icon}</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tables Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          Table Details
        </h2>

        <div className="space-y-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Table {table.id + 1}
                </h3>
                <span className="bg-primary/20 text-primary inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold">
                  {table.participants.length}/{seatsPerTable}
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {table.participants
                  .sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm dark:bg-slate-800"
                    >
                      {p.seatNumber !== null ? (
                        <span className="bg-primary/20 text-primary inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                          {p.seatNumber + 1}
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/20 text-xs font-bold text-slate-600 dark:bg-slate-600/20 dark:text-slate-400">
                          -
                        </span>
                      )}
                      <span className="text-slate-900 dark:text-white">
                        {p.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Message */}
      <div className="border-secondary bg-secondary/5 rounded-2xl border-l-4 p-6">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          ✨ Your seating arrangement has been successfully created! You can go
          back to make adjustments or start a new assignment.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onBack}
          className="hover:border-primary hover:bg-primary/5 rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-900 transition-all dark:border-slate-700 dark:text-white"
        >
          ← Back to Adjustment
        </button>
        <button
          onClick={onReset}
          className="from-primary to-secondary flex-1 rounded-lg bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
        >
          🔄 Create New Assignment
        </button>
      </div>
    </div>
  );
}
