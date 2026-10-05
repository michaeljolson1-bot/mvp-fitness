import type { Exercise, SetLog, Session, Weight } from '@/types';

export function fmtDuration(sec: number | null | undefined): string {
  if (sec == null) return '--';
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function fmtWeight(w: Weight): string {
  if (w.text) return w.text;
  if (w.value == null) return 'BW';
  return `${w.value}${w.perSide ? ' ea' : ''}`;
}

export function fmtTarget(e: Exercise): string {
  const reps = e.repsText || '?';
  return `${e.sets} × ${reps} @ ${fmtWeight(e.weight)}`;
}

export function fmtSet(s: SetLog, perSide: boolean): string {
  const w = s.drops?.length ? s.drops.join('/') : s.weight != null ? `${s.weight}` : 'BW';
  return `${s.reps} × ${w}${perSide && !s.drops ? ' ea' : ''}`;
}

export function setVolume(s: SetLog, perSide: boolean): number {
  const loads = s.drops?.length ? s.drops : s.weight != null ? [s.weight] : [];
  return loads.reduce((a, w) => a + w * s.reps, 0) * (perSide ? 2 : 1);
}

export function sessionVolume(s: Session): number {
  return s.exercises.reduce((a, e) => a + e.sets.reduce((b, st) => b + setVolume(st, e.perSide), 0), 0);
}

// "130, 110, 90" -> drops; "45" -> weight; "" -> bodyweight
export function parseWeightInput(text: string): { weight: number | null; drops: number[] | null } {
  const nums = (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length > 1 && text.includes(',')) return { weight: nums[0], drops: nums };
  return { weight: nums.length ? nums[0] : null, drops: null };
}

export function weightInputText(s: { weight: number | null; drops: number[] | null }): string {
  if (s.drops?.length) return s.drops.join(', ');
  return s.weight != null ? String(s.weight) : '';
}

export function isoDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
