import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fmtDuration, fmtSet, fmtTarget, parseWeightInput, weightInputText } from '@/lib/format';
import { exerciseHistory, prefillSet } from '@/lib/stats';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import { NoteEntry } from './NoteEntry';
import { Button, Card, Input, Sub, styles, useNow } from './ui';

type Props = { exerciseId: string; compact?: boolean; onComplete: () => void };

export function ExerciseCard({ exerciseId, compact, onComplete }: Props) {
  const t = useTheme();
  const { data, exerciseById, logSet, editSet, completeExercise, reopenExercise, addNote } = useStore();
  const ex = exerciseById.get(exerciseId)!;
  const log = data.active?.logs[exerciseId] ?? { startedAt: null, endedAt: null, sets: [], completed: false };
  const hist = useMemo(() => exerciseHistory(exerciseId, data.sessions), [exerciseId, data.sessions]);
  const notes = data.notes.filter((n) => n.exerciseId === exerciseId);
  const answered = notes.filter((n) => n.kind === 'question' && n.answer);
  const feedback = notes.filter((n) => n.kind === 'feedback');

  const [editing, setEditing] = useState<number | null>(null);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [showTips, setShowTips] = useState(!compact);
  const [noteMode, setNoteMode] = useState<'text' | 'voice' | null>(null);

  // Pre-fill the entry row whenever the set count changes or a set is picked for editing
  useEffect(() => {
    const src = editing != null ? log.sets[editing] : prefillSet(ex, log.sets.length, log.sets, hist);
    setReps(src ? String(src.reps) : '');
    setWeight(src ? weightInputText(src) : '');
  }, [log.sets.length, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useNow();
  const elapsed = log.startedAt ? ((log.endedAt ?? now) - log.startedAt) / 1000 : 0;

  const submit = () => {
    const set = { reps: Number(reps) || 0, ...parseWeightInput(weight) };
    if (editing != null) {
      editSet(exerciseId, editing, set);
      setEditing(null);
    } else logSet(exerciseId, set);
  };

  const done = log.completed;
  const remaining = Math.max(0, ex.sets - log.sets.length);

  return (
    <Card style={done ? { opacity: 0.7 } : undefined}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={[styles.row, { flex: 1 }]}>
          <View style={{ backgroundColor: t.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: t.accentText, fontWeight: '800' }}>{ex.slot}</Text>
          </View>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', flex: 1 }} numberOfLines={2}>
            {ex.name}
          </Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: ex.id } })} hitSlop={10}>
          <Ionicons name="create-outline" size={22} color={t.sub} />
        </Pressable>
      </View>

      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Sub>
          {ex.muscle} · {ex.movement} · Target {fmtTarget(ex)}
        </Sub>
        <Text style={{ color: done ? t.good : t.accent, fontVariant: ['tabular-nums'], fontWeight: '700', fontSize: 16 }}>
          ⏱ {fmtDuration(elapsed)}
        </Text>
      </View>

      <Sub>
        {hist.sessions
          ? `History (${hist.sessions}x): avg ${hist.avgSets!.toFixed(1)} sets × ${hist.avgReps!.toFixed(1)} reps · last ${hist.lastSets!
              .map((s) => fmtSet(s, ex.weight.perSide))
              .join(', ')}`
          : 'History: first time logging this one'}
      </Sub>

      {!!log.sets.length && (
        <View style={styles.wrap}>
          {log.sets.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => setEditing(editing === i ? null : i)}
              style={{
                backgroundColor: editing === i ? t.accent : t.chip,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: editing === i ? t.accentText : t.text, fontWeight: '600' }}>
                {i + 1}: {fmtSet(s, ex.weight.perSide)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!done && (
        <View style={styles.row}>
          <Text style={{ color: t.sub, width: 46 }}>{editing != null ? `Set ${editing + 1}` : `Set ${log.sets.length + 1}`}</Text>
          <Input value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="reps" style={{ flex: 1 }} selectTextOnFocus />
          <Input
            value={weight}
            onChangeText={setWeight}
            keyboardType="numbers-and-punctuation"
            placeholder={ex.weight.perSide ? 'lb ea' : 'lb'}
            style={{ flex: 1.3 }}
            selectTextOnFocus
          />
          <Button title={editing != null ? 'Save' : '✓ Log'} small onPress={submit} />
          {editing != null && (
            <Pressable
              onPress={() => {
                editSet(exerciseId, editing, null);
                setEditing(null);
              }}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color={t.danger} />
            </Pressable>
          )}
        </View>
      )}
      {!done && editing == null && (
        <Sub style={{ fontSize: 12 }}>
          {remaining ? `${remaining} set${remaining > 1 ? 's' : ''} to go. ` : 'Target sets done. '}Pre-filled from last time; edit if different.
        </Sub>
      )}

      {(!!ex.tips || answered.length > 0 || feedback.length > 0) && (
        <Pressable onPress={() => setShowTips(!showTips)} style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={{ color: t.text, fontWeight: '600' }}>Tips & notes</Text>
          <Ionicons name={showTips ? 'chevron-up' : 'chevron-down'} size={18} color={t.sub} />
        </Pressable>
      )}
      {showTips && (
        <View style={{ gap: 6 }}>
          {!!ex.tips && <Text style={{ color: t.text }}>💡 {ex.tips}</Text>}
          {answered.map((q) => (
            <View key={q.id} style={{ backgroundColor: t.input, borderRadius: 10, padding: 10, gap: 2 }}>
              <Sub style={{ fontSize: 13 }}>Q: {q.text}</Sub>
              <Text style={{ color: t.text }}>James: {q.answer}</Text>
            </View>
          ))}
          {feedback.slice(-3).map((f) => (
            <Sub key={f.id} style={{ fontSize: 13 }}>
              📝 {f.text}
            </Sub>
          ))}
        </View>
      )}

      <View style={styles.row}>
        <Button title="✏️ Note" kind="secondary" small onPress={() => setNoteMode('text')} />
        <Button title="🎤 Voice" kind="secondary" small onPress={() => setNoteMode('voice')} />
        <View style={{ flex: 1 }} />
        {done ? (
          <Button title="✅ Done (undo)" kind="ghost" small onPress={() => reopenExercise(exerciseId)} />
        ) : (
          <Button
            title="Complete Exercise"
            small
            onPress={() => {
              completeExercise(exerciseId);
              onComplete();
            }}
          />
        )}
      </View>

      <NoteEntry
        visible={noteMode != null}
        mode={noteMode ?? 'text'}
        exerciseName={ex.name}
        onClose={() => setNoteMode(null)}
        onSave={(n) => addNote({ ...n, exerciseId })}
      />
    </Card>
  );
}
