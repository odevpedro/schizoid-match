import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common/Button';
import { MotionInfoPanel, MotionOnboardingScreen } from '../../components/onboarding/MotionOnboarding';
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
  const [error, setError] = useState<string | null>(null);

  const toggleSwitch = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveStep6({
        showPhotosAfterMatch: toggles.showPhotosAfterMatch,
        shareActivityLevel: toggles.shareActivityLevel,
        shareSleepRoutine: toggles.shareSleepRoutine,
      });
      navigation.navigate('OnboardingSource');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionOnboardingScreen
      step={6}
      title="Configurações de privacidade"
      subtitle="Controle o que deseja compartilhar no seu perfil público."
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Continuar" onPress={handleContinue} loading={loading} />
        </>
      }
    >
      <>
        <MotionInfoPanel>
          O WellMatch não mostra dados brutos de saúde para outras pessoas. Seu perfil público usa apenas categorias seguras, como rotina, disponibilidade, objetivos e preferências. Você pode alterar essas permissões depois.
        </MotionInfoPanel>

        <View style={styles.togglesCard}>
          {TOGGLES.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.toggleRow,
                index === TOGGLES.length - 1 && styles.toggleRowLast,
              ]}
            >
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Text style={styles.toggleHint}>
                  {toggles[item.key] ? 'Visível em categorias seguras' : 'Oculto do perfil público'}
                </Text>
              </View>
              <Switch
                value={toggles[item.key]}
                onValueChange={() => toggleSwitch(item.key)}
                trackColor={{ false: colors.border, true: colors.primaryDim }}
                thumbColor={toggles[item.key] ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
        </View>
      </>
    </MotionOnboardingScreen>
  );
};

const styles = StyleSheet.create({
  togglesCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleRowLast: { borderBottomWidth: 0 },
  toggleCopy: { flex: 1, marginRight: spacing.md },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
  toggleHint: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  error: { fontSize: 13, color: colors.error, marginBottom: spacing.md, textAlign: 'center' },
});
