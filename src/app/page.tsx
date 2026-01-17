"use client";

import { useState } from "react";
import Image from "next/image";
import type { Participant, Table } from "@/types";
import { InputStep } from "@/components/InputStep";
import { AssignmentStep } from "@/components/AssignmentStep";
import { SummaryStep } from "@/components/SummaryStep";
import { autoAssignParticipants } from "@/lib/assignment";

type Step = "home" | "input" | "assignment" | "summary";

export default function Home() {
  const [step, setStep] = useState<Step>("home");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [seatsPerTable, setSeatsPerTable] = useState(10);

  const handleStartAssignment = (
    newParticipants: Participant[],
    seats: number,
    randomize: boolean
  ) => {
    setSeatsPerTable(seats);

    // Check if participants already have assignments (coming back from assignment step)
    const hasExistingAssignments = newParticipants.some(
      (p) => p.tableId !== null && p.seatNumber !== null
    );

    if (hasExistingAssignments) {
      // Preserve existing assignments, only auto-assign new participants without assignments
      const participantsWithoutAssignment = newParticipants.filter(
        (p) => p.tableId === null || p.seatNumber === null
      );

      if (participantsWithoutAssignment.length > 0) {
        // Find vacant seats in existing tables
        const participantsWithAssignment = newParticipants.filter(
          (p) => p.tableId !== null && p.seatNumber !== null
        );

        // Build table occupancy map
        const tableOccupancy = new Map<number, Set<number>>();
        participantsWithAssignment.forEach((p) => {
          if (p.tableId !== null && p.seatNumber !== null) {
            if (!tableOccupancy.has(p.tableId)) {
              tableOccupancy.set(p.tableId, new Set());
            }
            tableOccupancy.get(p.tableId)!.add(p.seatNumber);
          }
        });

        // Assign new participants to vacant seats
        const updatedNewParticipants = [...participantsWithoutAssignment];
        let assignmentIndex = 0;

        // Find the maximum table ID
        const maxTableId = Math.max(
          ...participantsWithAssignment.map((p) => p.tableId ?? -1),
          -1
        );

        // Try to fill vacant seats in existing tables first
        for (
          let tableId = 0;
          tableId <= maxTableId &&
          assignmentIndex < updatedNewParticipants.length;
          tableId++
        ) {
          const occupiedSeats = tableOccupancy.get(tableId) || new Set();

          for (
            let seatNumber = 0;
            seatNumber < seats &&
            assignmentIndex < updatedNewParticipants.length;
            seatNumber++
          ) {
            if (!occupiedSeats.has(seatNumber)) {
              updatedNewParticipants[assignmentIndex] = {
                ...updatedNewParticipants[assignmentIndex],
                tableId,
                seatNumber,
              };
              assignmentIndex++;
            }
          }
        }

        // If there are still unassigned participants, add them to the dummy table
        let dummyTableId = maxTableId + 1;
        let dummySeatNumber = 0;
        while (assignmentIndex < updatedNewParticipants.length) {
          updatedNewParticipants[assignmentIndex] = {
            ...updatedNewParticipants[assignmentIndex],
            tableId: dummyTableId,
            seatNumber: dummySeatNumber,
          };
          assignmentIndex++;
          dummySeatNumber++;

          // Move to next dummy table if current one is full
          if (dummySeatNumber >= seats) {
            dummyTableId++;
            dummySeatNumber = 0;
          }
        }

        // Merge with existing assignments
        const allParticipants = newParticipants.map((p) => {
          if (p.tableId !== null && p.seatNumber !== null) {
            return p; // Keep existing assignment
          }
          return updatedNewParticipants.find((np) => np.id === p.id) || p;
        });

        setParticipants(allParticipants);
      } else {
        setParticipants(newParticipants);
      }

      // Rebuild tables from participant assignments
      const tableMap = new Map<number, Participant[]>();
      newParticipants.forEach((p) => {
        if (p.tableId !== null) {
          if (!tableMap.has(p.tableId)) {
            tableMap.set(p.tableId, []);
          }
          tableMap.get(p.tableId)!.push(p);
        }
      });

      const rebuiltTables: Table[] = Array.from(tableMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([tableId, participants]) => ({
          id: tableId,
          seatsPerTable: seats,
          participants: participants.sort(
            (a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0)
          ),
        }));

      // Add one extra empty dummy table
      const maxTableId = Math.max(...rebuiltTables.map((t) => t.id), -1);
      rebuiltTables.push({
        id: maxTableId + 1,
        seatsPerTable: seats,
        participants: [],
      });

      setTables(rebuiltTables);
    } else {
      // First time assignment - use randomize option from user
      const { participants: assigned, tables: generatedTables } =
        autoAssignParticipants(newParticipants, seats, randomize);
      setParticipants(assigned);
      setTables(generatedTables);
    }

    setStep("assignment");
  };

  const handleResumeAssignment = (
    resumedParticipants: Participant[],
    resumedTables: Table[],
    seats: number
  ) => {
    setSeatsPerTable(seats);
    setParticipants(resumedParticipants);
    setTables(resumedTables);
    setStep("summary"); // Skip to summary since assignment is already done
  };

  const handleAssignmentComplete = (
    updatedParticipants: Participant[],
    updatedTables: Table[]
  ) => {
    setParticipants(updatedParticipants);
    setTables(updatedTables);
    setStep("summary");
  };

  const handleReset = () => {
    setStep("home");
    setParticipants([]);
    setTables([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <Image
                src="/images/round-mate-logo-no-text.png"
                alt="Round Mate Logo"
                width={48}
                height={48}
                priority
              />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Round Mate
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              v0.1.0
            </span>
          </button>
          {step !== "home" && (
            <button
              onClick={handleReset}
              className="hover:border-primary hover:bg-primary/5 rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-all dark:border-slate-700 dark:text-white"
            >
              Home
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {step === "home" && (
          <>
            {/* Hero Section */}
            <section className="mb-12 grid gap-8 sm:mb-20 sm:gap-12 lg:grid-cols-2 lg:gap-8">
              {/* Content */}
              <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <h1 className="text-3xl leading-tight font-bold text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                    Smart Table Assignment,
                    <span className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                      {" "}
                      Perfectly Rounded
                    </span>
                  </h1>
                  <p className="text-base text-slate-600 sm:text-lg lg:text-xl dark:text-slate-400">
                    Round Mate simplifies seating arrangements with intelligent
                    auto-assignment. Create balanced, harmonious groups in
                    seconds, not hours.
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 mt-1 rounded-full p-2">
                      <svg
                        className="text-primary h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Intelligent Auto-Assign
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Let our system handle complex seating logic
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 mt-1 rounded-full p-2">
                      <svg
                        className="text-primary h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Visual & Intuitive
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Beautiful rounded tables for easy management
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 mt-1 rounded-full p-2">
                      <svg
                        className="text-primary h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Easy Swapping
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Drag and drop to swap participants anytime
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep("input")}
                  className="from-primary to-secondary hover:shadow-primary/50 w-fit rounded-lg bg-gradient-to-r px-8 py-4 font-bold text-white transition-all hover:shadow-lg"
                >
                  Start Assignment →
                </button>
              </div>

              {/* Logo Section */}
              <div className="flex items-center justify-center">
                <div className="relative h-64 w-64 sm:h-96 sm:w-96">
                  <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-3xl bg-gradient-to-br blur-3xl" />
                  <div className="relative flex items-center justify-center rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
                    <Image
                      src="/images/round-mate-logo.png"
                      alt="Round Mate Full Logo"
                      width={300}
                      height={300}
                      priority
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 sm:p-12 dark:border-slate-800 dark:bg-slate-900/30">
              <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:mb-12 sm:text-3xl dark:text-white">
                Complete Workflow
              </h2>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                {[
                  {
                    step: "1",
                    title: "Add Participants",
                    desc: "Upload from Excel or add manually",
                  },
                  {
                    step: "2",
                    title: "Auto Assign",
                    desc: "System balances participants evenly",
                  },
                  {
                    step: "3",
                    title: "Export & Share",
                    desc: "Download as image or Excel file",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="bg-primary/20 text-primary mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                      {item.step}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {step === "input" && (
          <InputStep
            onNext={handleStartAssignment}
            onResume={handleResumeAssignment}
            initialParticipants={participants}
            initialSeatsPerTable={seatsPerTable}
          />
        )}

        {step === "assignment" && (
          <AssignmentStep
            participants={participants}
            tables={tables}
            seatsPerTable={seatsPerTable}
            onNext={handleAssignmentComplete}
            onBack={(updatedParticipants) => {
              setParticipants(updatedParticipants);
              setStep("input");
            }}
          />
        )}

        {step === "summary" && (
          <SummaryStep
            tables={tables}
            totalParticipants={participants.length}
            seatsPerTable={seatsPerTable}
            onBack={() => setStep("assignment")}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
