import type { Exercise, SetLog, Session } from '@/types';
import { setVolume } from './format';

export type ExerciseHistory = {
  sessions: number;
  avgSets: number | null;
  avgReps: number | null;
  lastSets: SetLog[] | null;
  points: { date: string; topWeight: number | null; volume: number; reps: number }[];
};

export function exerciseHistory(exerciseId: string, sessions: Session[]): ExerciseHistory {
  const hits = sessions
    .map((s) => ({ s, log: s.exercises.find((e) => e.exerciseId === exerciseId) }))
    .filter((x) => x.log && x.log.sets.length)
    .sort((a, b) => a.s.date.localeCompare(b.s.date) || (a.s.startedAt ?? 0) - (b.s.startedAt ?? 0));

  if (!hits.length) return { sessions: 0, avgSets: null, avgReps: null, lastSets: null, points: [] };

  const allSets = hits.flatMap((h) => h.log!.sets);
  return {
    sessions: hits.length,
    avgSets: allSets.length / hits.length,
    avgReps: allSets.reduce((a, s) => a + s.reps, 0) / allSets.length,
    lastSets: hits[hits.length - 1].log!.sets,
    points: hits.map(({ s, log }) => {
      const weights = log!.sets.flatMap((st) => st.drops ?? (st.weight != null ? [st.weight] : []));
      return {
        date: s.date,
        topWeight: weights.length ? Math.max(...weights) : null,
        volume: log!.sets.reduce((a, st) => a + setVolume(st, log!.perSide), 0),
        reps: log!.sets.reduce((a, st) => a + st.reps, 0),
      };
    }),
  };
}

// Pre-fill for the next set: same set from last time, else last logged set today, else the target
export function prefillSet(e: Exercise, setIndex: number, today: SetLog[], hist: ExerciseHistory): SetLog {
  const last = hist.lastSets?.[setIndex] ?? hist.lastSets?.[hist.lastSets.length - 1];
  const prevToday = today[today.length - 1];
  const src = prevToday ?? last;
  if (src) return { reps: src.reps, weight: src.weight, drops: src.drops };
  return { reps: e.repsMin ?? 10, weight: e.weight.value, drops: e.weight.drops };
}
