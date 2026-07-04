import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { onboardingService } from '../../services/onboarding.service';

const INTENSITY_OPTIONS = [
  { id: 'low', title: 'Leve', description: 'Caminhadas tranquilas, alongamento' },
  { id: 'moderate', title: 'Moderada', description: 'Exercícios com ritmo constante' },
  { id: 'high', title: 'Intensa', description: 'Treinos pesados, alta performance' },
  { id: 'flexible', title: 'Flexível', description: 'Depende do dia e da atividade' },
];

export const OnboardingIntensityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onboardingService.saveStep5({ intensityPreference: selected });
      navigation.navigate('OnboardingPrivacy');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepIndicator}>Passo 5 de 7</Text>
      <Text style={styles.title}>Qual intensidade você prefere?</Text>
      <Text style={styles.subtitle}>Escolha o nível que mais combina com seu momento</Text>

      {INTENSITY_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.card, selected === opt.id && styles.cardSelected]}
          onPress={() => setSelected(opt.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardDesc}>{opt.description}</Text>
            </View>
            <View style={[styles.radio, selected === opt.id && styles.radioSelected]}>
              {selected === opt.id && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, (!selected || loading) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Continuar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 60, paddingBottom: 40 },
  stepIndicator: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 20 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1, marginRight: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.background },
});
