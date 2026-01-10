"use client";

import { useState } from "react";
import type { Participant } from "@/types";
import { parseExcelFile, generateExcelTemplate } from "@/lib/excel";

interface InputStepProps {
  onNext: (participants: Participant[], seatsPerTable: number) => void;
}

export function InputStep({ onNext }: InputStepProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [seatsPerTable, setSeatsPerTable] = useState(10);
  const [newName, setNewName] = useState("");
  const [excelError, setExcelError] = useState("");

  const handleAddParticipant = () => {
    if (newName.trim()) {
      setParticipants([
        ...participants,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newName.trim(),
          tableId: null,
          seatNumber: null,
        },
      ]);
      setNewName("");
    }
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleUpdateParticipant = (id: string, newName: string) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await parseExcelFile(file);
      if (result.error) {
        setExcelError(result.error);
      } else {
        const newParticipants: Participant[] = result.names.map((name) => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          tableId: null,
          seatNumber: null,
        }));
        setParticipants([...participants, ...newParticipants]);
        setExcelError("");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const result = await parseExcelFile(file);
      if (result.error) {
        setExcelError(result.error);
      } else {
        const newParticipants: Participant[] = result.names.map((name) => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          tableId: null,
          seatNumber: null,
        }));
        setParticipants([...participants, ...newParticipants]);
        setExcelError("");
      }
    }
  };

  const handleProceed = () => {
    if (participants.length === 0) {
      alert("Please add at least one participant");
      return;
    }
    onNext(participants, seatsPerTable);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Round Mate Assignment
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Step 1 of 3: Add Participants
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Upload & Add Participants */}
        <div className="space-y-6 lg:col-span-2">
          {/* Seats Per Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
              Seats Per Table
            </label>
            <input
              type="number"
              min="1"
              value={seatsPerTable}
              onBlur={(e) => {
                const val = e.target.value;
                if (val === "" || parseInt(val) < 1) {
                  setSeatsPerTable(1);
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setSeatsPerTable(0);
                } else {
                  const parsed = parseInt(val);
                  if (!isNaN(parsed) && parsed >= 1) {
                    setSeatsPerTable(parsed);
                  }
                }
              }}
              className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-400"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Default: 10. This will create tables with this many seats.
            </p>
          </div>

          {/* Excel Upload */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Bulk Upload
            </h2>
            <div className="space-y-3">
              <button
                onClick={generateExcelTemplate}
                className="border-primary text-primary hover:bg-primary/5 w-full rounded-lg border-2 bg-white px-6 py-3 font-semibold transition-all dark:bg-slate-900"
              >
                📥 Download Template
              </button>
              <div
                className="relative"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="hover:border-primary hover:bg-primary/5 flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition-all dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      📤 Upload Excel File
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Drag and drop or click to select
                    </p>
                  </div>
                </label>
              </div>
            </div>
            {excelError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {excelError}
              </p>
            )}
          </div>

          {/* Manual Add */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Add Manually
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter participant name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddParticipant();
                  }
                }}
                className="focus:border-primary focus:ring-primary/20 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-400"
              />
              <button
                onClick={handleAddParticipant}
                className="bg-primary hover:bg-opacity-90 rounded-lg px-6 py-2 font-semibold text-white transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Right: Participant List */}
        <div className="sticky top-20 h-fit rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Participants
            </h2>
            <span className="bg-primary/20 text-primary inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold">
              {participants.length}
            </span>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No participants yet
              </p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
                >
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) =>
                      handleUpdateParticipant(p.id, e.target.value)
                    }
                    className="flex-1 bg-transparent text-sm font-medium text-slate-900 focus:outline-none dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="text-slate-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleProceed}
            disabled={participants.length === 0}
            className="from-primary to-secondary mt-6 w-full rounded-lg bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Assignment →
          </button>
        </div>
      </div>
    </div>
  );
}
