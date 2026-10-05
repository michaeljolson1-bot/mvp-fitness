import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Chip, H, Input, Sub, styles } from '@/components/ui';
import { fmtTarget } from '@/lib/format';
import { estimateMinutes, matches, planFromPrompt } from '@/lib/planner';
import { templateBlocks, useStore } from '@/store';
import { useTheme } from '@/theme';
import { MOVEMENTS, MUSCLES, type Block, type Movement, type Muscle } from '@/types';

type DraftItem = { id: string; linkNext: boolean };

const DAYS = [
  { id: 'chest-bicep', label: 'Chest & Bicep' },
  { id: 'back-triceps', label: 'Back & Triceps' },
];

export default function Home() {
  const t = useTheme();
  const { data, exerciseById, startWorkout, reloadSheet } = useStore();
  const [prompt, setPrompt] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [title, setTitle] = useState('Custom workout');

  const filtered = useMemo(
    () => data.exercises.filter((e) => matches(e, movements, muscles)).sort((a, b) => a.order - b.order),
    [data.exercises, movements, muscles],
  );
  const inDraft = new Set(draft.map((d) => d.id));
  const draftMinutes = draft.reduce((a, d) => a + estimateMinutes(exerciseById.get(d.id)!), 0);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const build = () => {
    const { parsed, ids, minutes } = planFromPrompt(prompt, data.exercises);
    const what = [...parsed.movements, ...parsed.muscles].join(' + ') || 'Full body';
    setTitle(`${what} · ${parsed.minutes} min`);
    setSummary(`${what}, ${parsed.minutes} min → ${ids.length} exercises (~${minutes} min). Edit below, then Start.`);
    setDraft(ids.map((id) => ({ id, linkNext: false })));
  };

  const draftBlocks = (): Block[] => {
    const blocks: Block[] = [];
    let cur: string[] = [];
    draft.forEach((d, i) => {
      cur.push(d.id);
      if (!d.linkNext || i === draft.length - 1) {
        blocks.push({ exerciseIds: cur });
        cur = [];
      }
    });
    return blocks;
  };

  const start = (name: string, blocks: Block[]) => {
    if (data.active) return router.push('/workout');
    startWorkout(name, blocks);
    router.push('/workout');
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft(next);
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {data.active && (
        <Pressable onPress={() => router.push('/workout')}>
          <Card style={{ borderColor: t.accent, borderWidth: 1.5 }}>
            <H size={17}>▶ Resume: {data.active.title}</H>
            <Sub>Workout in progress. Tap to jump back in.</Sub>
          </Card>
        </Pressable>
      )}

      <Card>
        <H size={17}>What are we doing today?</H>
        <Input
          value={prompt}
          onChangeText={setPrompt}
          placeholder='e.g. "I have 20 mins for a pull workout"'
          returnKeyType="go"
          onSubmitEditing={build}
        />
        <Button title="Build my workout" onPress={build} disabled={!prompt.trim()} />
        {summary && <Sub>{summary}</Sub>}
      </Card>

      <View style={{ gap: 8 }}>
        <H size={17}>Quick start from the sheet</H>
        <View style={styles.row}>
          {DAYS.map((d) => {
            const blocks = templateBlocks(data.exercises, d.id);
            const mins = blocks.flatMap((b) => b.exerciseIds).reduce((a, id) => a + estimateMinutes(exerciseById.get(id)!), 0);
            return (
              <Pressable key={d.id} style={{ flex: 1 }} onPress={() => start(d.label, blocks)}>
                <Card>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{d.label}</Text>
                  <Sub>
                    {blocks.length} blocks · ~{mins} min
                  </Sub>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </View>

      {draft.length > 0 && (
        <Card style={{ borderColor: t.accent }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <H size={17}>Your workout</H>
            <Sub>~{draftMinutes} min</Sub>
          </View>
          <Input value={title} onChangeText={setTitle} placeholder="Workout name" />
          <Sub style={{ fontSize: 12 }}>Tap 🔗 to superset an exercise with the one below it.</Sub>
          {draft.map((d, i) => {
            const e = exerciseById.get(d.id)!;
            const linkedAbove = i > 0 && draft[i - 1].linkNext;
            return (
              <View
                key={d.id}
                style={[
                  styles.row,
                  { paddingVertical: 6, borderLeftWidth: 3, paddingLeft: 8, borderLeftColor: d.linkNext || linkedAbove ? t.accent : 'transparent' },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '600' }} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Sub style={{ fontSize: 12 }}>
                    {e.muscle} · {fmtTarget(e)}
                  </Sub>
                </View>
                <Pressable onPress={() => move(i, -1)} hitSlop={6}>
                  <Ionicons name="arrow-up" size={20} color={t.sub} />
                </Pressable>
                <Pressable onPress={() => move(i, 1)} hitSlop={6}>
                  <Ionicons name="arrow-down" size={20} color={t.sub} />
                </Pressable>
                {i < draft.length - 1 && (
                  <Pressable
                    onPress={() => setDraft(draft.map((x, j) => (j === i ? { ...x, linkNext: !x.linkNext } : x)))}
                    hitSlop={6}
                  >
                    <Ionicons name="link" size={20} color={d.linkNext ? t.accent : t.sub} />
                  </Pressable>
                )}
                <Pressable onPress={() => setDraft(draft.filter((_, j) => j !== i))} hitSlop={6}>
                  <Ionicons name="close" size={22} color={t.danger} />
                </Pressable>
              </View>
            );
          })}
          <View style={styles.row}>
            <Button title="Clear" kind="secondary" onPress={() => setDraft([])} style={{ flex: 1 }} />
            <Button title="Start workout" onPress={() => start(title.trim() || 'Custom workout', draftBlocks())} style={{ flex: 2 }} />
          </View>
        </Card>
      )}

      <View style={{ gap: 10 }}>
        <H size={17}>Or pick exercises</H>
        <View style={styles.wrap}>
          {MOVEMENTS.map((m) => (
            <Chip key={m} label={m} active={movements.includes(m)} onPress={() => setMovements(toggle(movements, m))} />
          ))}
        </View>
        <View style={styles.wrap}>
          {MUSCLES.map((m) => (
            <Chip key={m} label={m} active={muscles.includes(m)} onPress={() => setMuscles(toggle(muscles, m))} />
          ))}
        </View>
        <Sub>{filtered.length} exercises · tap to add, long-press to edit</Sub>
        {filtered.map((e) => {
          const on = inDraft.has(e.id);
          return (
            <Pressable
              key={e.id}
              onPress={() => setDraft(on ? draft.filter((d) => d.id !== e.id) : [...draft, { id: e.id, linkNext: false }])}
              onLongPress={() => router.push({ pathname: '/exercise/[id]', params: { id: e.id } })}
            >
              <Card style={[styles.row, { paddingVertical: 10 }, on && { borderColor: t.accent, borderWidth: 1.5 }]}>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? t.accent : t.sub} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{e.name}</Text>
                  <Sub style={{ fontSize: 12 }}>
                    {e.dayLabel} {e.slot} · {e.muscle} · {e.movement} · {fmtTarget(e)}
                  </Sub>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Button
        title="Re-import sheet data"
        kind="ghost"
        small
        onPress={() =>
          Alert.alert('Re-import from the sheet?', 'Refreshes targets from the spreadsheet. Your tips, history, and questions are kept.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Re-import', onPress: reloadSheet },
          ])
        }
      />
    </ScrollView>
  );
}
