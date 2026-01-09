export interface Participant {
  id: string;
  name: string;
  tableId: number | null;
  seatNumber: number | null;
}

export interface Table {
  id: number;
  seatsPerTable: number;
  participants: Participant[];
}

export interface AssignmentState {
  participants: Participant[];
  tables: Table[];
  seatsPerTable: number;
  totalParticipants: number;
}
