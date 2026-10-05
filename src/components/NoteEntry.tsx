import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { Note } from '@/types';
import { Button, Chip, H, Input, Sub, styles } from './ui';

type Props = {
  visible: boolean;
  mode: 'text' | 'voice';
  exerciseName: string;
  onSave: (n: Pick<Note, 'kind' | 'text' | 'source'>) => void;
  onClose: () => void;
};

// Voice uses the iOS keyboard mic (works in Expo Go), then a preview step to confirm the transcript
export function NoteEntry({ visible, mode, exerciseName, onSave, onClose }: Props) {
  const t = useTheme();
  const [kind, setKind] = useState<Note['kind']>('question');
  const [text, setText] = useState('');
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (visible) {
      setText('');
      setPreviewing(false);
    }
  }, [visible]);

  const save = () => {
    onSave({ kind, text: text.trim(), source: mode });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: t.card, padding: 18, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          {!previewing ? (
            <>
              <H size={18}>{mode === 'voice' ? '🎤 Voice note' : 'Add note'}</H>
              <Sub>{exerciseName}</Sub>
              <View style={styles.row}>
                <Chip label="Question for James" active={kind === 'question'} onPress={() => setKind('question')} />
                <Chip label="Feedback" active={kind === 'feedback'} onPress={() => setKind('feedback')} />
              </View>
              {mode === 'voice' && <Sub>Tap the 🎤 on your keyboard and talk. Tap Review when you're done.</Sub>}
              <Input
                autoFocus
                multiline
                value={text}
                onChangeText={setText}
                placeholder={kind === 'question' ? 'e.g. Should my elbows flare on this?' : 'e.g. Left shoulder felt tight'}
                style={{ minHeight: 90, textAlignVertical: 'top' }}
              />
              <View style={styles.row}>
                <Button title="Cancel" kind="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button
                  title={mode === 'voice' ? 'Review' : 'Save'}
                  disabled={!text.trim()}
                  onPress={mode === 'voice' ? () => setPreviewing(true) : save}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <H size={18}>Did we get that right?</H>
              <Sub>{kind === 'question' ? 'Question for James' : 'Feedback'} · {exerciseName}</Sub>
              <View style={{ backgroundColor: t.input, borderRadius: 12, padding: 14 }}>
                <Text style={{ color: t.text, fontSize: 18, lineHeight: 26 }}>"{text.trim()}"</Text>
              </View>
              <View style={styles.row}>
                <Button title="Edit" kind="secondary" onPress={() => setPreviewing(false)} style={{ flex: 1 }} />
                <Button title="Looks good, save" onPress={save} style={{ flex: 2 }} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
