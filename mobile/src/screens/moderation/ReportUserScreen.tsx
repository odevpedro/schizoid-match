import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/common/Button';
import { moderationService } from '../../services/moderation.service';

const REASONS: Record<string, string> = {
  inappropriate_content: 'Conteúdo inapropriado',
  harassment: 'Assédio',
  fake_profile: 'Perfil falso',
  underage: 'Menor de idade',
  spam: 'Spam',
  offline_behavior: 'Comportamento fora do app',
  other: 'Outro',
};

const REASON_KEYS = Object.keys(REASONS);

export const ReportUserScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { targetUserId, matchId } = route.params as { targetUserId: string; matchId?: string };
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Selecione um motivo para a denúncia.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await moderationService.reportUser({
        targetUserId,
        reason,
        description: description.trim() || undefined,
        matchId,
      });
      Alert.alert(
        'Denúncia enviada',
        'Sua denúncia foi registrada. Obrigado por ajudar a manter o WellMatch seguro.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      setError('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Motivo da denúncia</Text>

      {REASON_KEYS.map((key) => (
        <TouchableOpacity
          key={key}
          style={[styles.option, reason === key && styles.optionSelected]}
          onPress={() => { setReason(key); setError(null); }}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, reason === key && styles.radioSelected]}>
            {reason === key && <View style={styles.radioInner} />}
          </View>
          <Text style={[styles.optionText, reason === key && styles.optionTextSelected]}>
            {REASONS[key]}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Descrição (opcional)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Conte mais detalhes..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{description.length}/500</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label="Enviar denúncia"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        variant="primary"
        style={styles.submit}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: { ...typography.body, flex: 1 },
  optionTextSelected: { color: colors.primary },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  error: {
    ...typography.bodyMuted,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  submit: { marginTop: spacing.lg },
});
