import type { Exercise, Movement, Muscle } from '@/types';

// Offline parser for prompts like "I have 20 mins for a pull workout"
export type ParsedPrompt = { minutes: number; movements: Movement[]; muscles: Muscle[] };

const MUSCLE_WORDS: [RegExp, Muscle[]][] = [
  [/\b(chest|pecs?)\b/, ['Chest']],
  [/\b(back|lats?)\b/, ['Back']],
  [/\b(shoulders?|delts?|traps?)\b/, ['Shoulders']],
  [/\b(bi|bis|bi's|biceps?)\b/, ['Biceps']],
  [/\b(tri|tris|tri's|triceps?)\b/, ['Triceps']],
  [/\barms?\b/, ['Biceps', 'Triceps']],
];

export function parsePrompt(prompt: string): ParsedPrompt {
  const p = prompt.toLowerCase();
  let minutes = 30;
  const hr = p.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  const min = p.match(/(\d+)\s*(m|min|mins|minutes?)\b/);
  if (hr) minutes = Number(hr[1]) * 60 + (min ? Number(min[1]) : 0);
  else if (min) minutes = Number(min[1]);
  else if (/half (an )?hour/.test(p)) minutes = 30;
  else if (/\b(an|one) hour\b/.test(p)) minutes = 60;
  else if (/\b(\d+)\b/.test(p)) minutes = Number(p.match(/\b(\d+)\b/)![1]);

  const movements: Movement[] = [];
  if (/\bpush\b/.test(p)) movements.push('Push');
  if (/\bpull\b/.test(p)) movements.push('Pull');

  const muscles = new Set<Muscle>();
  for (const [re, ms] of MUSCLE_WORDS) if (re.test(p)) ms.forEach((m) => muscles.add(m));
  return { minutes, movements, muscles: [...muscles] };
}

// ~2 min per set (work + rest) plus a minute to set up
export function estimateMinutes(e: Exercise): number {
  return e.sets * 2 + 1;
}

export function matches(e: Exercise, movements: Movement[], muscles: Muscle[]): boolean {
  if (movements.length && !movements.includes(e.movement)) return false;
  if (muscles.length && !muscles.includes(e.muscle)) return false;
  return true;
}

export function planFromPrompt(prompt: string, all: Exercise[]): { parsed: ParsedPrompt; ids: string[]; minutes: number } {
  const parsed = parsePrompt(prompt);
  const pool = all.filter((e) => matches(e, parsed.movements, parsed.muscles)).sort((a, b) => a.order - b.order);

  // Round-robin across muscles so a "pull" day mixes back and biceps.
  // First pass takes one variation per parent exercise, second pass fills the rest.
  const byMuscle = new Map<Muscle, Exercise[]>();
  const seenParent = new Set<string>();
  const firstPass: Exercise[] = [];
  const rest: Exercise[] = [];
  for (const e of pool) {
    const key = e.parent ?? e.id;
    if (e.parent && seenParent.has(key)) rest.push(e);
    else {
      seenParent.add(key);
      firstPass.push(e);
    }
  }
  for (const e of firstPass) byMuscle.set(e.muscle, [...(byMuscle.get(e.muscle) ?? []), e]);
  const ordered: Exercise[] = [];
  // Big muscle groups lead, arms follow
  const priority: Muscle[] = ['Back', 'Chest', 'Biceps', 'Triceps', 'Shoulders', 'Other'];
  const queues = priority.filter((m) => byMuscle.has(m)).map((m) => byMuscle.get(m)!);
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) ordered.push(q.shift()!);
  ordered.push(...rest);

  const ids: string[] = [];
  let used = 0;
  for (const e of ordered) {
    const t = estimateMinutes(e);
    if (ids.length && used + t > parsed.minutes) continue;
    ids.push(e.id);
    used += t;
  }
  return { parsed, ids, minutes: used };
}
