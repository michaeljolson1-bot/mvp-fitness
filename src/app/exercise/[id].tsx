import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { NoteEntry } from '@/components/NoteEntry';
import { Button, Card, Chip, Input, Sub, styles } from '@/components/ui';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import { MOVEMENTS, MUSCLES } from '@/types';

export default function EditExercise() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, exerciseById, updateExercise, addNote } = useStore();
  const ex = exerciseById.get(id);

  const [name, setName] = useState(ex?.name ?? '');
  const [tips, setTips] = useState(ex?.tips ?? '');
  const [sets, setSets] = useState(String(ex?.sets ?? 3));
  const [reps, setReps] = useState(ex?.repsText ?? '');
  const [weight, setWeight] = useState(ex?.weight.text || (ex?.weight.value != null ? String(ex.weight.value) : ''));
  const [muscle, setMuscle] = useState(ex?.muscle ?? 'Chest');
  const [movement, setMovement] = useState(ex?.movement ?? 'Push');
  const [asking, setAsking] = useState<'text' | 'voice' | null>(null);

  if (!ex) return <Sub>Exercise not found.</Sub>;

  const qa = data.notes.filter((n) => n.exerciseId === id && n.kind === 'question');

  const save = () => {
    const rn = (reps.match(/\d+/g) ?? []).map(Number);
    const wn = (weight.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
    updateExercise(ex.id, {
      name: name.trim() || ex.name,
      tips: tips.trim(),
      sets: Math.max(1, Number(sets) || ex.sets),
      repsText: reps.trim(),
      repsMin: rn.length ? Math.min(...rn) : null,
      repsMax: rn.length ? Math.max(...rn) : null,
      weight: {
        value: wn.length ? wn[0] : null,
        perSide: /\bea\b/.test(weight),
        drops: weight.includes(',') && wn.length > 1 ? wn : null,
        text: weight.trim(),
      },
      muscle,
      movement,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ title: `${ex.dayLabel} ${ex.slot}`, headerRight: () => <Button title="Save" kind="ghost" small onPress={save} /> }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Field label="Exercise">
          <Input value={name} onChangeText={setName} />
        </Field>
        <Field label="Tips (yours to edit over time)">
          <Input value={tips} onChangeText={setTips} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="Form cues, seat settings…" />
        </Field>
        <View style={styles.row}>
          <Field label="Sets" flex={1}>
            <Input value={sets} onChangeText={setSets} keyboardType="number-pad" />
          </Field>
          <Field label="Reps" flex={1.3}>
            <Input value={reps} onChangeText={setReps} placeholder="8-10" />
          </Field>
          <Field label="Weight" flex={1.6}>
            <Input value={weight} onChangeText={setWeight} placeholder="25 ea" />
          </Field>
        </View>
        <Sub style={{ fontSize: 12 }}>Weight: "25 ea" = per dumbbell, "130, 110, 90" = drop set, words like "red/grey" are fine.</Sub>
        <Field label="Muscle group">
          <View style={styles.wrap}>
            {MUSCLES.map((m) => (
              <Chip key={m} label={m} active={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </View>
        </Field>
        <Field label="Movement">
          <View style={styles.row}>
            {MOVEMENTS.map((m) => (
              <Chip key={m} label={m} active={movement === m} onPress={() => setMovement(m)} />
            ))}
          </View>
        </Field>

        <Card>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={{ color: t.text, fontWeight: '700' }}>James Q&A</Text>
            <View style={styles.row}>
              <Button title="✏️ Ask" kind="secondary" small onPress={() => setAsking('text')} />
              <Button title="🎤" kind="secondary" small onPress={() => setAsking('voice')} />
            </View>
          </View>
          {!qa.length && <Sub>No questions on this one yet.</Sub>}
          {qa.map((q) => (
            <View key={q.id} style={{ gap: 2 }}>
              <Sub style={{ fontSize: 13 }}>Q: {q.text}</Sub>
              <Text style={{ color: q.answer ? t.text : t.warn }}>{q.answer ? `James: ${q.answer}` : 'Waiting on James (answer in the Questions tab)'}</Text>
            </View>
          ))}
        </Card>

        <Button title="Save" onPress={save} />
      </ScrollView>
      <NoteEntry
        visible={asking != null}
        mode={asking ?? 'text'}
        exerciseName={ex.name}
        onClose={() => setAsking(null)}
        onSave={(n) => addNote({ ...n, exerciseId: ex.id })}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, flex }: { label: string; children: ReactNode; flex?: number }) {
  return (
    <View style={{ gap: 6, flex }}>
      <Sub style={{ fontSize: 13, fontWeight: '600' }}>{label}</Sub>
      {children}
    </View>
  );
}
