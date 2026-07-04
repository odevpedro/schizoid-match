import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { storage } from '../../services/storage';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { api } from '../../services/api';
import { DEMO_TOKEN, mockChallenges, Challenge } from '../../services/mock-data';

const TYPE_ICONS: Record<string, string> = {
  steps: '👟',
  sleep_streak: '🌙',
  weekly_activity: '⚡',
  wellness_checkin: '🧘',
};

export const ChallengesScreen: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    storage.getItem('@wellmatch:token').then((token) => {
      if (token === DEMO_TOKEN) { setChallenges(mockChallenges); return; }
      return api.get('/challenges').then((data: any) => setChallenges(Array.isArray(data) ? data : []));
    }).catch(() => {});
  }, []);

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const daysLeft = item.endDate
      ? Math.max(0, Math.ceil((new Date(item.endDate).getTime() - Date.now()) / 86400000))
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.typeIcon}>{TYPE_ICONS[item.challengeType] ?? '🏆'}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
          </View>
        </View>
        {item.targetValue && (
          <Text style={styles.target}>Meta: {item.targetValue} {item.targetUnit}</Text>
        )}
        {daysLeft !== null && (
          <Text style={styles.daysLeft}>{daysLeft > 0 ? `${daysLeft} dias restantes` : 'Encerrado'}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desafios</Text>
      <Text style={styles.subtitle}>Atividades em dupla com seus matches</Text>

      {challenges.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>Nenhum desafio ainda</Text>
          <Text style={styles.emptyText}>
            Apos um match, voce pode criar desafios de bem-estar em dupla — passos, sono, atividades e muito mais.
          </Text>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, padding: spacing.screen, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.screen, marginBottom: spacing.lg },
  list: { paddingHorizontal: spacing.screen, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  typeIcon: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  target: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  daysLeft: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
