import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/ExerciseCard';
import { Button, Sub, useNow, styles } from '@/components/ui';
import { fmtDuration } from '@/lib/format';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

export default function Workout() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const store = useStore();
  const { data, exerciseById, setCurrentBlock, startExercise, finishWorkout, discardWorkout } = store;
  const a = data.active;
  const pager = useRef<ScrollView>(null);
  const now = useNow();

  const current = a?.currentBlock ?? 0;
  const blockIds = a?.blocks[current]?.exerciseIds.join(',') ?? '';

  // Start the exercise timers for whatever page is showing
  useEffect(() => {
    blockIds.split(',').filter(Boolean).forEach(startExercise);
  }, [blockIds, startExercise]);

  // Restore position after reopening the app mid-workout
  useEffect(() => {
    if (a) setTimeout(() => pager.current?.scrollTo({ x: a.currentBlock * width, animated: false }), 0);
  }, [width]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Sub>No workout in progress.</Sub>
        <Button title="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(a.blocks.length - 1, i));
    pager.current?.scrollTo({ x: clamped * width, animated: true });
    setCurrentBlock(clamped);
  };

  const finish = () => {
    const logged = Object.values(a.logs).some((l) => l.sets.length);
    Alert.alert('Finish workout?', logged ? 'Saves to History.' : 'Nothing logged yet, so nothing will be saved.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.back();
        },
      },
      {
        text: 'Finish & save',
        onPress: () => {
          finishWorkout();
          router.back();
        },
      },
    ]);
  };

  // Auto-advance once every exercise on this page is complete
  const onComplete = (blockIndex: number, exId: string) => {
    const ids = a.blocks[blockIndex].exerciseIds;
    const allDone = ids.every((id) => id === exId || a.logs[id]?.completed);
    if (!allDone) return;
    if (blockIndex < a.blocks.length - 1) setTimeout(() => goTo(blockIndex + 1), 350);
    else setTimeout(finish, 350);
  };

  const doneBlocks = a.blocks.filter((b) => b.exerciseIds.every((id) => a.logs[id]?.completed)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
              {a.title}
            </Text>
            <Sub>
              Total {fmtDuration((now - a.startedAt) / 1000)} · {doneBlocks}/{a.blocks.length} done
            </Sub>
          </View>
          <Button title="Finish" small onPress={finish} />
        </View>
        <View style={[styles.row, { justifyContent: 'center', gap: 6 }]}>
          {a.blocks.map((b, i) => {
            const complete = b.exerciseIds.every((id) => a.logs[id]?.completed);
            return (
              <Text
                key={i}
                onPress={() => goTo(i)}
                style={{ color: i === current ? t.accent : complete ? t.good : t.sub, fontSize: i === current ? 16 : 12 }}
              >
                ●
              </Text>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={(e) => setCurrentBlock(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {a.blocks.map((b, i) => {
            const label =
              b.exerciseIds.length === 3 ? 'Tri-set' : b.exerciseIds.length === 2 ? 'Superset: alternate sets' : 'Exercise';
            return (
              <ScrollView
                key={i}
                style={{ width }}
                contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 60 }}
                keyboardShouldPersistTaps="handled"
              >
                <Sub>
                  {i + 1} of {a.blocks.length} · {label}
                </Sub>
                {b.exerciseIds
                  .filter((id) => exerciseById.has(id))
                  .map((id) => (
                    <ExerciseCard key={id} exerciseId={id} compact={b.exerciseIds.length > 1} onComplete={() => onComplete(i, id)} />
                  ))}
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Button title="‹ Prev" kind="ghost" small disabled={i === 0} onPress={() => goTo(i - 1)} />
                  <Button title="Next ›" kind="ghost" small disabled={i === a.blocks.length - 1} onPress={() => goTo(i + 1)} />
                </View>
              </ScrollView>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
