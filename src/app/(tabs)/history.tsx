import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, Chip, H, Sub, styles } from '@/components/ui';
import { fmtDuration, fmtSet, prettyDate, sessionVolume } from '@/lib/format';
import { exerciseHistory } from '@/lib/stats';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function History() {
  const t = useTheme();
  const { data, exerciseById, deleteSession } = useStore();
  const sessions = useMemo(() => [...data.sessions].sort((a, b) => b.date.localeCompare(a.date)), [data.sessions]);

  const latest = sessions[0]?.date;
  const init = latest ? new Date(latest + 'T12:00:00') : new Date();
  const [month, setMonth] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const [selected, setSelected] = useState<string | null>(latest ?? null);

  const byDate = useMemo(() => {
    const m = new Map<string, typeof sessions>();
    sessions.forEach((s) => m.set(s.date, [...(m.get(s.date) ?? []), s]));
    return m;
  }, [sessions]);

  const key = (d: number) => `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const firstDow = new Date(month.y, month.m, 1).getDay();
  const daysIn = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  const monthSessions = sessions.filter((s) => s.date.startsWith(key(1).slice(0, 7)));
  const monthTime = monthSessions.reduce((a, s) => a + (s.durationSec ?? 0), 0);
  const monthVol = monthSessions.reduce((a, s) => a + sessionVolume(s), 0);

  const shift = (d: number) => {
    const nd = new Date(month.y, month.m + d, 1);
    setMonth({ y: nd.getFullYear(), m: nd.getMonth() });
  };

  // Exercises with any history, for the progression view
  const tracked = useMemo(() => {
    const ids = new Set(data.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)));
    return data.exercises.filter((e) => ids.has(e.id)).sort((a, b) => a.order - b.order);
  }, [data.sessions, data.exercises]);
  const [progId, setProgId] = useState<string | null>(null);
  const prog = progId ?? tracked[0]?.id ?? null;
  const progHist = prog ? exerciseHistory(prog, data.sessions) : null;
  const maxW = Math.max(1, ...(progHist?.points.map((p) => p.topWeight ?? 0) ?? [1]));

  const daySessions = selected ? byDate.get(selected) ?? [] : [];

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Pressable onPress={() => shift(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </Pressable>
          <H size={17}>{new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</H>
          <Pressable onPress={() => shift(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={t.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={{ flex: 1, textAlign: 'center', color: t.sub, fontSize: 12 }}>
              {w}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            const k = d ? key(d) : '';
            const has = d != null && byDate.has(k);
            const sel = k === selected;
            return (
              <Pressable key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }} disabled={!d} onPress={() => setSelected(k)}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sel ? t.accent : has ? t.chip : 'transparent',
                    borderWidth: has && !sel ? 1.5 : 0,
                    borderColor: t.accent,
                  }}
                >
                  {d && <Text style={{ color: sel ? t.accentText : t.text, fontWeight: has ? '800' : '400' }}>{d}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Sub>
          {monthSessions.length} workout{monthSessions.length === 1 ? '' : 's'} · {fmtDuration(monthTime)} · {Math.round(monthVol).toLocaleString()} lb lifted
        </Sub>
      </Card>

      {selected && (
        <View style={{ gap: 10 }}>
          <H size={17}>{prettyDate(selected)}</H>
          {!daySessions.length && <Sub>No workout this day.</Sub>}
          {daySessions.map((s) => (
            <Pressable
              key={s.id}
              onLongPress={() =>
                Alert.alert('Delete workout?', s.title, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteSession(s.id) },
                ])
              }
            >
              <Card>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{s.title}</Text>
                  {s.imported && <Sub style={{ fontSize: 12 }}>from sheet</Sub>}
                </View>
                <Sub>
                  ⏱ {fmtDuration(s.durationSec)} · {Math.round(sessionVolume(s)).toLocaleString()} lb · {s.exercises.length} exercises
                </Sub>
                {s.exercises.map((e) => (
                  <View key={e.exerciseId} style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <Text style={{ color: t.text, flex: 1 }} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Sub style={{ fontSize: 13, flex: 1, textAlign: 'right' }}>
                      {e.sets.map((st) => fmtSet(st, e.perSide)).join(', ')}
                    </Sub>
                  </View>
                ))}
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      {tracked.length > 0 && progHist && (
        <View style={{ gap: 10 }}>
          <H size={17}>Progression</H>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {tracked.map((e) => (
              <Chip key={e.id} label={e.name.length > 24 ? e.name.slice(0, 23) + '…' : e.name} active={e.id === prog} onPress={() => setProgId(e.id)} />
            ))}
          </ScrollView>
          <Card>
            <Text style={{ color: t.text, fontWeight: '700' }}>{exerciseById.get(prog!)?.name}</Text>
            <Sub>
              {progHist.sessions} session{progHist.sessions === 1 ? '' : 's'} · avg {progHist.avgSets?.toFixed(1)} sets × {progHist.avgReps?.toFixed(1)} reps
            </Sub>
            {progHist.points.map((p, i) => (
              <View key={i} style={{ gap: 3 }}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Sub style={{ fontSize: 12 }}>{prettyDate(p.date)}</Sub>
                  <Sub style={{ fontSize: 12 }}>
                    top {p.topWeight ?? 'BW'} · {p.reps} reps · {Math.round(p.volume).toLocaleString()} lb
                  </Sub>
                </View>
                <View style={{ height: 8, backgroundColor: t.chip, borderRadius: 4 }}>
                  <View style={{ height: 8, width: `${((p.topWeight ?? 0) / maxW) * 100}%`, backgroundColor: t.accent, borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
