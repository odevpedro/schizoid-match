import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge } from '../common/Badge';

const BADGE_LABELS: Record<string, string> = {
  morning: 'Perfil Matutino',
  early_bird: 'Acordado Cedo',
  night_owl: 'Noturno',
  consistent_sleep: 'Sono Consistente',
  high_activity: 'Alta Atividade',
  moderate_activity: 'Atividade Moderada',
  high_steps: 'Alta Contagem de Passos',
  great_recovery: 'Recuperacao Excelente',
  fitness: 'Objetivo: Fitness',
  better_sleep: 'Objetivo: Sono',
  stress_reduction: 'Objetivo: Estresse',
  mindfulness: 'Objetivo: Mindfulness',
  social_activity: 'Objetivo: Social',
};

interface WellnessBadgesProps {
  badges: string[];
  goals?: string[];
  maxDisplay?: number;
}

export const WellnessBadges: React.FC<WellnessBadgesProps> = ({
  badges, goals = [], maxDisplay = 4,
}) => {
  const all = [...badges, ...goals.map((g) => `goal_${g}`)].slice(0, maxDisplay);

  return (
    <View style={styles.container}>
      {all.map((badge, idx) => (
        <Badge
          key={`${badge}-${idx}`}
          label={BADGE_LABELS[badge] ?? badge}
          variant={idx % 2 === 0 ? 'primary' : 'secondary'}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
