export type Muscle = 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Other';
export type Movement = 'Push' | 'Pull';

export const MUSCLES: Muscle[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'];
export const MOVEMENTS: Movement[] = ['Push', 'Pull'];

export type Weight = {
  value: number | null; // first number in the cell, used for pre-fill and volume
  perSide: boolean; // "25ea" = 25 lb per dumbbell
  drops: number[] | null; // drop set "130, 110, 90"
  text: string; // as written: "red/grey", "light (35)", "25-30"
};

export type Exercise = {
  id: string;
  day: string;
  dayLabel: string;
  slot: string; // 1a, 3a.2
  group: string; // exercises sharing a group are a superset in the sheet template
  order: number;
  name: string;
  parent: string | null;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  repsText: string;
  weight: Weight;
  muscle: Muscle;
  movement: Movement;
  tips: string;
};

export type SetLog = { reps: number; weight: number | null; drops: number[] | null };

export type ExerciseLog = {
  exerciseId: string;
  name: string;
  perSide: boolean;
  sets: SetLog[];
  durationSec: number | null;
};

export type Session = {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  startedAt: number | null;
  durationSec: number | null;
  exercises: ExerciseLog[];
  imported?: boolean;
};

export type Note = {
  id: string;
  exerciseId: string;
  kind: 'feedback' | 'question';
  text: string;
  source: 'text' | 'voice';
  createdAt: number;
  answer?: string;
  answeredAt?: number;
};

// A block is one page in the active workout: a single exercise or a superset/tri-set
export type Block = { exerciseIds: string[] };

export type ActiveLog = {
  startedAt: number | null;
  endedAt: number | null;
  sets: SetLog[];
  completed: boolean;
};

export type ActiveWorkout = {
  id: string;
  title: string;
  startedAt: number;
  blocks: Block[];
  logs: Record<string, ActiveLog>;
  currentBlock: number;
};

export type AppData = {
  version: 1;
  exercises: Exercise[];
  sessions: Session[];
  notes: Note[];
  active: ActiveWorkout | null;
};
