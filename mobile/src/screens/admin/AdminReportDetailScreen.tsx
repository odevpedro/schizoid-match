import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from '../../components/common/Button';
import { adminService, AdminReport } from '../../services/admin.service';

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Conteúdo inapropriado',
  harassment: 'Assédio',
  fake_profile: 'Perfil falso',
  underage: 'Menor de idade',
  spam: 'Spam',
  offline_behavior: 'Comportamento fora do app',
  other: 'Outro',
};

export const AdminReportDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { reportId } = route.params as { reportId: string };
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReport(reportId);
      setReport(data);
      setError(null);
    } catch {
      setError('Erro ao carregar denúncia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportId]);

  const handleResolve = (action: 'warn' | 'ban' | 'dismiss') => {
    const actionLabels: Record<string, string> = {
      warn: 'emitir uma advertência',
      ban: 'banir o usuário',
      dismiss: 'rejeitar a denúncia',
    };

    Alert.alert(
      'Confirmar ação',
      `Tem certeza que deseja ${actionLabels[action]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: action === 'dismiss' ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(action);
            try {
              await adminService.resolveReport(reportId, action);
              Alert.alert('Ação concluída', 'A denúncia foi processada.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Erro', 'Não foi possível processar a ação.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? 'Denúncia não encontrada'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPending = report.status === 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informações da denúncia</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Denunciante</Text>
          <Text style={styles.fieldValue}>{report.reporter?.name ?? report.reporterId}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{report.reporter?.email ?? '-'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Denunciado</Text>
          <Text style={styles.fieldValue}>{report.reported?.name ?? report.reportedId}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{report.reported?.email ?? '-'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Motivo</Text>
          <Text style={styles.fieldValue}>{REASON_LABELS[report.reason] ?? report.reason}</Text>
        </View>
        {report.description && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <Text style={styles.fieldValue}>{report.description}</Text>
          </View>
        )}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Text style={styles.fieldValue}>{report.status}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Data</Text>
          <Text style={styles.fieldValue}>{new Date(report.createdAt).toLocaleString('pt-BR')}</Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>

          <Button
            label="Advertir usuário"
            onPress={() => handleResolve('warn')}
            loading={actionLoading === 'warn'}
            disabled={actionLoading !== null}
            variant="secondary"
            style={styles.actionBtn}
          />

          <Button
            label="Banir usuário"
            onPress={() => handleResolve('ban')}
            loading={actionLoading === 'ban'}
            disabled={actionLoading !== null}
            variant="danger"
            style={styles.actionBtn}
          />

          <Button
            label="Rejeitar denúncia"
            onPress={() => handleResolve('dismiss')}
            loading={actionLoading === 'dismiss'}
            disabled={actionLoading !== null}
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingTop: 20, paddingBottom: spacing.xxl },
  centerContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
    marginBottom: spacing.md,
  },
  actionsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  fieldLabel: { ...typography.caption, flex: 1, textTransform: 'uppercase' },
  fieldValue: { ...typography.body, flex: 2, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  actionBtn: { marginBottom: spacing.sm },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
