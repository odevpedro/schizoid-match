import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { onboardingService } from '../../services/onboarding.service';

const TOGGLES = [
  { key: 'showPhotosAfterMatch', label: 'Mostrar fotos após match' },
  { key: 'shareActivityLevel', label: 'Compartilhar nível de atividade' },
  { key: 'shareSleepRoutine', label: 'Compartilhar rotina de sono' },
];

export const OnboardingPrivacyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    showPhotosAfterMatch: true,
    shareActivityLevel: true,
    shareSleepRoutine: true,
  });
  const [loading, setLoading] = useState(false);

  const toggleSwitch = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await onboardingService.saveStep6({
        showPhotosAfterMatch: toggles.showPhotosAfterMatch,
        shareActivityLevel: toggles.shareActivityLevel,
        shareSleepRoutine: toggles.shareSleepRoutine,
      });
      navigation.navigate('OnboardingSource');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepIndicator}>Passo 6 de 7</Text>
      <Text style={styles.title}>Configurações de privacidade</Text>
      <Text style={styles.subtitle}>Controle o que deseja compartilhar no seu perfil público</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          O WellMatch não mostra dados brutos de saúde para outras pessoas. Seu perfil público usa apenas categorias seguras, como rotina, disponibilidade, objetivos e preferências. Você pode alterar essas permissões depois.
        </Text>
      </View>

      <View style={styles.togglesCard}>
        {TOGGLES.map((item) => (
          <View key={item.key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{item.label}</Text>
            <Switch
              value={toggles[item.key]}
              onValueChange={() => toggleSwitch(item.key)}
              trackColor={{ false: colors.border, true: colors.primaryDim }}
              thumbColor={toggles[item.key] ? colors.primary : colors.textMuted}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading}
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
  infoBox: {
    backgroundColor: colors.secondaryDim,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  infoBoxText: { fontSize: 13, color: colors.textSubtle, lineHeight: 20 },
  togglesCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { fontSize: 14, color: colors.text, flex: 1, marginRight: spacing.md },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.background },
});
