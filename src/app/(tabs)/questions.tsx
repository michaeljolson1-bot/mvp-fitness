import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Button, Card, Chip, Input, Sub, styles } from '@/components/ui';
import { useStore } from '@/store';
import { useTheme } from '@/theme';
import type { Note } from '@/types';

type Filter = 'open' | 'answered' | 'all';

export default function Questions() {
  const t = useTheme();
  const { data, exerciseById, deleteNote } = useStore();
  const [filter, setFilter] = useState<Filter>('open');

  const questions = data.notes.filter((n) => n.kind === 'question').sort((a, b) => b.createdAt - a.createdAt);
  const open = questions.filter((q) => !q.answer);
  const shown = filter === 'open' ? open : filter === 'answered' ? questions.filter((q) => q.answer) : questions;
  const feedback = data.notes.filter((n) => n.kind === 'feedback').sort((a, b) => b.createdAt - a.createdAt);

  const share = () => {
    const body = open.map((q, i) => `${i + 1}. ${exerciseById.get(q.exerciseId)?.name ?? 'Exercise'}: ${q.text}`).join('\n');
    Share.share({ message: `Questions for James:\n${body}` });
  };

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={styles.row}>
          <Chip label={`Open (${open.length})`} active={filter === 'open'} onPress={() => setFilter('open')} />
          <Chip label="Answered" active={filter === 'answered'} onPress={() => setFilter('answered')} />
          <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        </View>
        {open.length > 0 && <Button title="Share" kind="ghost" small onPress={share} />}
      </View>

      {!shown.length && (
        <Card>
          <Sub>
            {filter === 'open'
              ? 'No open questions. Log one from any exercise card with ✏️ Note or 🎤 Voice.'
              : 'Nothing here yet.'}
          </Sub>
        </Card>
      )}

      {shown.map((q) => (
        <QuestionCard
          key={q.id}
          q={q}
          exerciseName={exerciseById.get(q.exerciseId)?.name ?? 'Exercise'}
          onOpenExercise={() => router.push({ pathname: '/exercise/[id]', params: { id: q.exerciseId } })}
          onDelete={() =>
            Alert.alert('Delete question?', q.text, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteNote(q.id) },
            ])
          }
        />
      ))}

      {feedback.length > 0 && filter === 'all' && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>Workout feedback</Text>
          {feedback.map((f) => (
            <Card key={f.id}>
              <Sub style={{ fontSize: 12 }}>
                {exerciseById.get(f.exerciseId)?.name} · {new Date(f.createdAt).toLocaleDateString()}
              </Sub>
              <Text style={{ color: t.text }}>📝 {f.text}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function QuestionCard({ q, exerciseName, onOpenExercise, onDelete }: { q: Note; exerciseName: string; onOpenExercise: () => void; onDelete: () => void }) {
  const t = useTheme();
  const { answerQuestion } = useStore();
  const [editing, setEditing] = useState(!q.answer);
  const [answer, setAnswer] = useState(q.answer ?? '');

  return (
    <Pressable onLongPress={onDelete}>
      <Card>
        <Pressable onPress={onOpenExercise}>
          <Sub style={{ fontSize: 12 }}>
            {exerciseName} › · {new Date(q.createdAt).toLocaleDateString()} {q.source === 'voice' ? '· 🎤' : ''}
          </Sub>
        </Pressable>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{q.text}</Text>
        {editing ? (
          <>
            <Input value={answer} onChangeText={setAnswer} multiline placeholder="James's answer…" style={{ minHeight: 60, textAlignVertical: 'top' }} />
            <View style={styles.row}>
              {q.answer && <Button title="Cancel" kind="secondary" small onPress={() => setEditing(false)} />}
              <Button
                title="Save answer"
                small
                disabled={!answer.trim()}
                onPress={() => {
                  answerQuestion(q.id, answer);
                  setEditing(false);
                }}
              />
            </View>
          </>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            <View style={{ backgroundColor: t.input, borderRadius: 10, padding: 10 }}>
              <Text style={{ color: t.good, fontWeight: '700', fontSize: 12 }}>JAMES · shows on the exercise card</Text>
              <Text style={{ color: t.text }}>{q.answer}</Text>
            </View>
          </Pressable>
        )}
      </Card>
    </Pressable>
  );
}
