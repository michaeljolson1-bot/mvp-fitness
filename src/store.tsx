import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import seed from '@/data/seed.json';
import { isoDate, uid } from '@/lib/format';
import type { ActiveWorkout, AppData, Block, Exercise, Note, Session, SetLog } from '@/types';

const KEY = 'mvp-fitness-v1';

function fromSeed(): AppData {
  return {
    version: 1,
    exercises: seed.exercises as Exercise[],
    sessions: seed.sessions as Session[],
    notes: [],
    active: null,
  };
}

function load(): AppData {
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    // corrupt or missing storage falls back to the sheet
  }
  return fromSeed();
}

// The sheet's own supersets for a day, in sheet order
export function templateBlocks(exercises: Exercise[], day: string): Block[] {
  const blocks: Block[] = [];
  const index = new Map<string, Block>();
  for (const e of exercises.filter((x) => x.day === day).sort((a, b) => a.order - b.order)) {
    let b = index.get(e.group);
    if (!b) {
      b = { exerciseIds: [] };
      index.set(e.group, b);
      blocks.push(b);
    }
    b.exerciseIds.push(e.id);
  }
  return blocks;
}

function useStoreValue() {
  const [data, setData] = useState<AppData>(load);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Storage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const patchActive = useCallback((fn: (a: ActiveWorkout) => ActiveWorkout) => {
    setData((d) => (d.active ? { ...d, active: fn(d.active) } : d));
  }, []);

  const patchLog = useCallback(
    (exId: string, fn: (l: ActiveWorkout['logs'][string]) => ActiveWorkout['logs'][string]) =>
      patchActive((a) => {
        const cur = a.logs[exId] ?? { startedAt: null, endedAt: null, sets: [], completed: false };
        return { ...a, logs: { ...a.logs, [exId]: fn(cur) } };
      }),
    [patchActive],
  );

  const actions = useMemo(
    () => ({
      updateExercise: (id: string, patch: Partial<Exercise>) =>
        setData((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      startWorkout: (title: string, blocks: Block[]) =>
        setData((d) => ({
          ...d,
          active: { id: uid(), title, startedAt: Date.now(), blocks, logs: {}, currentBlock: 0 },
        })),

      setCurrentBlock: (i: number) => patchActive((a) => ({ ...a, currentBlock: i })),

      // Exercise timer starts the first time its page is shown (or a set is logged)
      startExercise: (exId: string) =>
        patchLog(exId, (l) => (l.startedAt || l.completed ? l : { ...l, startedAt: Date.now() })),

      logSet: (exId: string, set: SetLog) =>
        patchLog(exId, (l) => ({ ...l, startedAt: l.startedAt ?? Date.now(), sets: [...l.sets, set] })),

      editSet: (exId: string, i: number, set: SetLog | null) =>
        patchLog(exId, (l) => ({
          ...l,
          sets: set ? l.sets.map((s, j) => (j === i ? set : s)) : l.sets.filter((_, j) => j !== i),
        })),

      completeExercise: (exId: string) =>
        patchLog(exId, (l) => ({ ...l, completed: true, endedAt: Date.now(), startedAt: l.startedAt ?? Date.now() })),

      reopenExercise: (exId: string) => patchLog(exId, (l) => ({ ...l, completed: false, endedAt: null })),

      finishWorkout: () =>
        setData((d) => {
          const a = d.active;
          if (!a) return d;
          const now = Date.now();
          const exercises = a.blocks
            .flatMap((b) => b.exerciseIds)
            .map((id) => {
              const ex = d.exercises.find((e) => e.id === id);
              const l = a.logs[id];
              if (!ex || !l || !l.sets.length) return null;
              const end = l.endedAt ?? now;
              return {
                exerciseId: id,
                name: ex.name,
                perSide: ex.weight.perSide,
                sets: l.sets,
                durationSec: l.startedAt ? Math.round((end - l.startedAt) / 1000) : null,
              };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
          const session: Session = {
            id: a.id,
            date: isoDate(a.startedAt),
            title: a.title,
            startedAt: a.startedAt,
            durationSec: Math.round((now - a.startedAt) / 1000),
            exercises,
          };
          return { ...d, active: null, sessions: exercises.length ? [...d.sessions, session] : d.sessions };
        }),

      discardWorkout: () => setData((d) => ({ ...d, active: null })),

      deleteSession: (id: string) => setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) })),

      addNote: (n: Omit<Note, 'id' | 'createdAt'>) =>
        setData((d) => ({ ...d, notes: [...d.notes, { ...n, id: uid(), createdAt: Date.now() }] })),

      answerQuestion: (id: string, answer: string) =>
        setData((d) => ({
          ...d,
          notes: d.notes.map((n) =>
            n.id === id ? { ...n, answer: answer.trim() || undefined, answeredAt: answer.trim() ? Date.now() : undefined } : n,
          ),
        })),

      deleteNote: (id: string) => setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) })),

      // Re-import exercises from the sheet; keeps tip edits, history, and notes
      reloadSheet: () =>
        setData((d) => {
          const s = fromSeed();
          const tips = new Map(d.exercises.map((e) => [e.id, e.tips]));
          const have = new Set(d.sessions.map((x) => x.id));
          return {
            ...d,
            exercises: s.exercises.map((e) => ({ ...e, tips: tips.get(e.id) ?? e.tips })),
            sessions: [...d.sessions, ...s.sessions.filter((x) => !have.has(x.id))],
          };
        }),
    }),
    [patchActive, patchLog],
  );

  const exerciseById = useMemo(() => new Map(data.exercises.map((e) => [e.id, e])), [data.exercises]);

  return { data, exerciseById, ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
