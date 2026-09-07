import type { PipelineStatus, PipelineStage } from '../types';
import styles from './ProvisioningScreen.module.css';

const STAGE_LABEL: Record<Exclude<PipelineStage, null>, string> = {
  idle: 'Aguardando início',
  listando_diretorio: 'Localizando o lote de dados mais recente',
  listando_arquivos: 'Listando os arquivos do lote',
  iniciando: 'Preparando o download',
  baixando: 'Baixando arquivos da Receita Federal',
  extraindo: 'Extraindo arquivos baixados',
  gravando: 'Gravando registros na base local',
  concluido: 'Finalizando',
  debug_db_injetado: 'Base pré-carregada em uso',
};

interface ProvisioningScreenProps {
  status: PipelineStatus | null;
  connectionError: boolean;
}

export function ProvisioningScreen({ status, connectionError }: ProvisioningScreenProps) {
  if (connectionError && !status) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Sem conexão</p>
          <h1 className={styles.title}>Não foi possível conectar ao servidor</h1>
          <p className={styles.body}>
            Verifique se a API Flask está rodando em <code className="mono">python app.py</code> e se o
            endereço configurado em <code className="mono">VITE_API_BASE_URL</code> está correto.
          </p>
        </div>
      </div>
    );
  }

  if (status?.status === 'erro') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Falha na coleta de dados</p>
          <h1 className={styles.title}>A base de dados não pôde ser preparada</h1>
          <p className={styles.body}>{status.error ?? 'Ocorreu um erro durante a ingestão dos dados.'}</p>
        </div>
      </div>
    );
  }

  const stage = status?.stage ?? null;
  const label = stage ? STAGE_LABEL[stage] : 'Conectando ao servidor';
  const hasProgress = !!status && status.files_total > 0;
  const percent = hasProgress ? Math.min(100, Math.round((status!.files_done / status!.files_total) * 100)) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Abastecendo a base de dados</p>
        <h1 className={styles.title}>{label}</h1>
        <p className={styles.body}>
          Isso acontece uma única vez: os arquivos públicos do CNPJ estão sendo baixados, extraídos e gravados
          localmente. A busca ficará disponível assim que a gravação terminar.
        </p>

        {status?.current_file && (
          <p className={styles.currentFile}>
            arquivo atual: <span className="mono">{status.current_file}</span>
          </p>
        )}

        {hasProgress && (
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={`${styles.progressLabel} mono`}>
              {status!.files_done}/{status!.files_total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
