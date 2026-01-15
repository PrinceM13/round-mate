import type { Participant, Table } from "@/types";

/**
 * Auto-assign participants to tables with balanced distribution
 */
export function autoAssignParticipants(
  participants: Participant[],
  seatsPerTable: number,
  randomize: boolean = false
): { participants: Participant[]; tables: Table[] } {
  // Shuffle participants randomly if randomize is true, otherwise keep original order
  const shuffled = randomize
    ? [...participants].sort(() => Math.random() - 0.5)
    : [...participants];

  // Calculate number of tables needed + 1 extra dummy table
  const numTables = Math.ceil(shuffled.length / seatsPerTable) + 1;
  console.log(
    `autoAssignParticipants: ${shuffled.length} participants, ${seatsPerTable} seats/table = ${numTables} tables (randomize: ${randomize})`
  );

  // Initialize tables
  const tables: Table[] = Array.from({ length: numTables }, (_, i) => ({
    id: i,
    seatsPerTable,
    participants: [],
  }));

  // Assign participants to tables
  const assignedParticipants: Participant[] = shuffled.map((p, index) => {
    const tableId = Math.floor(index / seatsPerTable);
    const seatNumber = index % seatsPerTable;
    return {
      ...p,
      tableId,
      seatNumber,
    };
  });

  // Populate table participants
  assignedParticipants.forEach((p) => {
    if (p.tableId !== null) {
      tables[p.tableId].participants.push(p);
    }
  });

  return { participants: assignedParticipants, tables };
}

/**
 * Swap two participants
 */
export function swapParticipants(
  participants: Participant[],
  participant1Id: string,
  participant2Id: string
): Participant[] {
  const p1 = participants.find((p) => p.id === participant1Id);
  const p2 = participants.find((p) => p.id === participant2Id);

  if (!p1 || !p2) return participants;

  const updated = participants.map((p) => {
    if (p.id === participant1Id) {
      return { ...p, tableId: p2.tableId, seatNumber: p2.seatNumber };
    }
    if (p.id === participant2Id) {
      return { ...p, tableId: p1.tableId, seatNumber: p1.seatNumber };
    }
    return p;
  });

  return updated;
}

/**
 * Generate tables from participants
 */
export function generateTables(
  participants: Participant[],
  seatsPerTable: number,
  numTables?: number
): Table[] {
  // Use provided numTables or calculate based on participants
  const tableCount =
    numTables ?? Math.ceil(participants.length / seatsPerTable);

  return Array.from({ length: tableCount }, (_, tableId) => ({
    id: tableId,
    seatsPerTable,
    participants: participants.filter((p) => p.tableId === tableId),
  }));
}
