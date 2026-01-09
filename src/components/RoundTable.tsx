"use client";

import type { Participant } from "@/types";

interface RoundTableProps {
  tableId: number;
  participants: Participant[];
  seatsPerTable: number;
  selectedSeat?: { tableId: number; seatNumber: number } | null;
  onSeatClick?: (
    tableId: number,
    seatNumber: number,
    participantId?: string
  ) => void;
}

export function RoundTable({
  tableId,
  participants,
  seatsPerTable,
  selectedSeat,
  onSeatClick,
}: RoundTableProps) {
  // Setup seats with participant data
  const seats = Array.from({ length: seatsPerTable }, (_, i) => {
    const participant = participants.find((p) => p.seatNumber === i);
    return { seatNumber: i, participant };
  });

  // Adaptive SVG sizing based on seats per table
  const svgSize = Math.max(280, Math.min(400, seatsPerTable * 30));
  const radius = svgSize * 0.25;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Calculate positions for circular layout
  const getSeatPosition = (seatNumber: number) => {
    const angle = (seatNumber / seatsPerTable) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  const isSelected = (seatNumber: number) => {
    return (
      selectedSeat?.tableId === tableId &&
      selectedSeat?.seatNumber === seatNumber
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white">
        Table {tableId + 1}
      </h3>

      {/* Circular Table */}
      <div className="flex justify-center overflow-visible">
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="drop-shadow-lg"
        >
          {/* Table circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - 20}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Seats */}
          {seats.map(({ seatNumber, participant }) => {
            const { x, y } = getSeatPosition(seatNumber);
            const seatIsSelected = isSelected(seatNumber);

            return (
              <g key={seatNumber}>
                {/* Seat circle background */}
                <circle
                  cx={x}
                  cy={y}
                  r={participant ? 22 : 18}
                  fill={participant ? "#fff" : "#f1f5f9"}
                  stroke={
                    seatIsSelected
                      ? "#ec4899"
                      : participant
                        ? "#94a3b8"
                        : "#cbd5e1"
                  }
                  strokeWidth={seatIsSelected ? "3" : "2"}
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() =>
                    onSeatClick?.(tableId, seatNumber, participant?.id)
                  }
                />

                {/* Seat content */}
                {participant ? (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none text-xs font-bold text-slate-900 select-none"
                    fill="currentColor"
                    style={{ userSelect: "none" }}
                  >
                    {participant.name.substring(0, 12)}
                  </text>
                ) : (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none text-xs text-slate-400 select-none"
                    fill="currentColor"
                  >
                    {seatNumber + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Participant list for this table */}
      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {participants.length} / {seatsPerTable} seats
        </p>
        <div className="space-y-1">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex cursor-default items-center justify-between gap-2 rounded bg-white p-2 text-xs transition-all dark:bg-slate-800"
            >
              <span className="font-medium text-slate-900 dark:text-white">
                Seat {p.seatNumber! + 1}: {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
