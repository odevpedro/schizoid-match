export const ERROR_LABELS: Record<string, string> = {
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  NOT_FOUND: 'Não encontrado',
  VALIDATION: 'Dados inválidos',
  NETWORK: 'Erro de conexão. Verifique sua internet',
  DEFAULT: 'Algo deu errado. Tente novamente',
};

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.code && ERROR_LABELS[error.code]) return ERROR_LABELS[error.code];
  return ERROR_LABELS.DEFAULT;
}
