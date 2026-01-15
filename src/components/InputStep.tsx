"use client";

import { useState, useRef } from "react";
import type { Participant, Table } from "@/types";
import type { ValidationIssue } from "@/lib/excel";
import { parseExcelFile, generateExcelTemplate } from "@/lib/excel";

interface InputStepProps {
  onNext: (
    participants: Participant[],
    seatsPerTable: number,
    randomize: boolean
  ) => void;
  onResume?: (
    participants: Participant[],
    tables: Table[],
    seatsPerTable: number
  ) => void;
  initialParticipants?: Participant[];
  initialSeatsPerTable?: number;
}

interface ValidationModal {
  isOpen: boolean;
  issues: ValidationIssue[];
  skippedRows: number;
  totalRows: number;
  participants: Participant[];
  tables: Table[];
  seatsPerTable: number;
}

export function InputStep({
  onNext,
  onResume,
  initialParticipants = [],
  initialSeatsPerTable = 10,
}: InputStepProps) {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [seatsPerTable, setSeatsPerTable] = useState(initialSeatsPerTable);
  const [randomizeSeating, setRandomizeSeating] = useState(false);
  const [newName, setNewName] = useState("");
  const [excelError, setExcelError] = useState("");
  const [fileStatus, setFileStatus] = useState<{
    type: "template" | "assignment";
    message: string;
  } | null>(null);
  const [validationModal, setValidationModal] = useState<ValidationModal>({
    isOpen: false,
    issues: [],
    skippedRows: 0,
    totalRows: 0,
    participants: [],
    tables: [],
    seatsPerTable: 10,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setFileStatus(null);
        return;
      }

      setExcelError("");

      // ASSIGNMENT MODE: User uploaded a saved assignment file
      if (
        result.mode === "assignment" &&
        result.participants &&
        result.tables &&
        onResume
      ) {
        // Check if there are validation issues
        if (result.validationIssues && result.validationIssues.length > 0) {
          // Show validation modal
          setValidationModal({
            isOpen: true,
            issues: result.validationIssues,
            skippedRows: result.skippedRows || 0,
            totalRows: result.participants.length + (result.skippedRows || 0),
            participants: result.participants,
            tables: result.tables,
            seatsPerTable: result.seatsPerTable || 10,
          });
          return;
        }

        setFileStatus({
          type: "assignment",
          message: `✓ Loaded assignment with ${result.participants.length} participants across ${result.tables.length} tables`,
        });
        setParticipants(result.participants);
        // Auto-proceed to resume
        setTimeout(() => {
          onResume(
            result.participants!,
            result.tables!,
            result.seatsPerTable || 10
          );
        }, 1000);
        return;
      }

      // TEMPLATE MODE: User uploaded a template with just names
      if (result.mode === "template" && result.names) {
        setFileStatus({
          type: "template",
          message: `✓ Loaded ${result.names.length} participant(s) from template`,
        });
        const newParticipants: Participant[] = result.names.map((name) => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          tableId: null,
          seatNumber: null,
        }));
        setParticipants([...participants, ...newParticipants]);
      }
    }
  };

  const handleValidationConfirm = () => {
    // User accepts the data with warnings
    setParticipants(validationModal.participants);
    setValidationModal({ ...validationModal, isOpen: false });

    setFileStatus({
      type: "assignment",
      message: `✓ Loaded assignment with ${validationModal.participants.length} participants (${validationModal.skippedRows} rows skipped due to missing data)`,
    });

    // Auto-proceed to resume
    setTimeout(() => {
      onResume!(
        validationModal.participants,
        validationModal.tables,
        validationModal.seatsPerTable
      );
    }, 1000);
  };

  const handleValidationCancel = () => {
    // User rejects the file
    setValidationModal({ ...validationModal, isOpen: false });
    setExcelError(
      `File rejected: ${validationModal.skippedRows} rows had missing required data. Please fix the file and try again.`
    );
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
        setFileStatus(null);
        return;
      }

      setExcelError("");

      // ASSIGNMENT MODE: Resume from saved file
      if (
        result.mode === "assignment" &&
        result.participants &&
        result.tables &&
        onResume
      ) {
        // Check if there are validation issues
        if (result.validationIssues && result.validationIssues.length > 0) {
          setValidationModal({
            isOpen: true,
            issues: result.validationIssues,
            skippedRows: result.skippedRows || 0,
            totalRows: result.participants.length + (result.skippedRows || 0),
            participants: result.participants,
            tables: result.tables,
            seatsPerTable: result.seatsPerTable || 10,
          });
          return;
        }

        setFileStatus({
          type: "assignment",
          message: `✓ Loaded assignment with ${result.participants.length} participants across ${result.tables.length} tables`,
        });
        setParticipants(result.participants);
        setTimeout(() => {
          onResume(
            result.participants!,
            result.tables!,
            result.seatsPerTable || 10
          );
        }, 1000);
        return;
      }

      // TEMPLATE MODE: Start fresh
      if (result.mode === "template" && result.names) {
        setFileStatus({
          type: "template",
          message: `✓ Loaded ${result.names.length} participant(s) from template`,
        });
        const newParticipants: Participant[] = result.names.map((name) => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          tableId: null,
          seatNumber: null,
        }));
        setParticipants([...participants, ...newParticipants]);
      }
    }
  };

  const handleProceed = () => {
    if (participants.length === 0) {
      alert("Please add at least one participant");
      return;
    }
    onNext(participants, seatsPerTable, randomizeSeating);
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

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left: Upload & Add Participants */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          {/* Seats Per Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
              Seats Per Table
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={seatsPerTable || ""}
              onBlur={() => {
                if (seatsPerTable === 0 || seatsPerTable < 1) {
                  setSeatsPerTable(10);
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
                  ref={fileInputRef}
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
            {fileStatus && (
              <p
                className={`mt-3 text-sm ${
                  fileStatus.type === "assignment"
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {fileStatus.message}
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
                disabled={!newName.trim()}
                className="bg-primary hover:bg-opacity-90 rounded-lg px-6 py-2 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold">
                {participants.length}
              </span>
              {participants.length > 0 && (
                <button
                  onClick={() => {
                    setParticipants([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    setFileStatus(null);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
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

          {/* Randomize Seating Option - only show for initial assignment */}
          {!participants.some(
            (p) => p.tableId !== null && p.seatNumber !== null
          ) && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <input
                type="checkbox"
                id="randomize"
                checked={randomizeSeating}
                onChange={(e) => setRandomizeSeating(e.target.checked)}
                className="text-primary focus:ring-primary h-5 w-5 rounded border-slate-300 focus:ring-2 dark:border-slate-700"
              />
              <label
                htmlFor="randomize"
                className="cursor-pointer text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="font-semibold">Randomize seating order</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When unchecked, participants will be assigned to tables in the
                  order they appear in the list
                </p>
              </label>
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={participants.length === 0}
            className="from-primary to-secondary mt-6 w-full rounded-lg bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Assignment →
          </button>
        </div>
      </div>

      {/* Validation Issues Modal */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-96 w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                ⚠️ Data Issues Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {validationModal.skippedRows} of {validationModal.totalRows}{" "}
                rows have missing or invalid data
              </p>
            </div>

            {/* Issues List */}
            <div className="mb-6 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              {validationModal.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    issue.severity === "error"
                      ? "bg-red-50 dark:bg-red-950"
                      : "bg-yellow-50 dark:bg-yellow-950"
                  }`}
                >
                  <div
                    className={`mt-1 text-lg ${
                      issue.severity === "error"
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {issue.severity === "error" ? "❌" : "⚠️"}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        issue.severity === "error"
                          ? "text-red-900 dark:text-red-100"
                          : "text-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {issue.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Summary:</strong> {validationModal.participants.length}{" "}
                valid participants will be loaded. The{" "}
                {validationModal.skippedRows} rows with errors will be skipped.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleValidationConfirm}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700"
              >
                ✓ Load Valid Data ({validationModal.participants.length})
              </button>
              <button
                onClick={handleValidationCancel}
                className="flex-1 rounded-lg border-2 border-red-300 bg-white px-4 py-3 font-semibold text-red-600 transition-all hover:bg-red-50 dark:border-red-700 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                ✕ Reject & Fix File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
