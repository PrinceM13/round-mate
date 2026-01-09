"use client";

import type { Participant } from "@/types";

interface RoundTableProps {
  tableId: number;
  participants: Participant[];
  seatsPerTable: number;
  onSeatClick?: (participantId: string) => void;
  selectedParticipantId?: string | null;
  draggingParticipantId?: string | null;
  onDragStart?: (participantId: string, tableId: number) => void;
  onDrop?: (tableId: number, seatNumber: number) => void;
  onDragEnd?: () => void;
}

export function RoundTable({
  tableId,
  participants,
  seatsPerTable,
  onSeatClick,
  selectedParticipantId,
  draggingParticipantId,
  onDragStart,
  onDrop,
  onDragEnd,
}: RoundTableProps) {
  const seats = Array.from({ length: seatsPerTable }, (_, i) => {
    const participant = participants.find((p) => p.seatNumber === i);
    return { seatNumber: i, participant };
  });

  // Calculate positions for circular layout
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  const getSeatPosition = (seatNumber: number) => {
    const angle = (seatNumber / seatsPerTable) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white">
        Table {tableId + 1}
      </h3>

      {/* Circular Table with drag support */}
      <div
        className="flex justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <svg width="300" height="300" className="drop-shadow-lg">
          {/* Table circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={100}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Seats */}
          {seats.map(({ seatNumber, participant }) => {
            const { x, y } = getSeatPosition(seatNumber);
            const isSelected = selectedParticipantId === participant?.id;
            const isDragging = draggingParticipantId === participant?.id;

            return (
              <g key={seatNumber}>
                {/* Seat circle background */}
                <circle
                  cx={x}
                  cy={y}
                  r={participant ? 28 : 22}
                  fill={
                    isDragging ? "#6366f1" : participant ? "#fff" : "#f1f5f9"
                  }
                  stroke={
                    isSelected ? "#6366f1" : participant ? "#94a3b8" : "#cbd5e1"
                  }
                  strokeWidth={isSelected ? "3" : "2"}
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => {
                    if (participant) {
                      onSeatClick?.(participant.id);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDrop?.(tableId, seatNumber);
                  }}
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
              draggable
              onDragStart={() => onDragStart?.(p.id, tableId)}
              onDragEnd={onDragEnd}
              className="flex cursor-grab items-center justify-between gap-2 rounded bg-white p-2 text-xs transition-all active:cursor-grabbing dark:bg-slate-800"
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
