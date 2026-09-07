import { situacaoLabel, situacaoTone } from '../constants';
import styles from './StatusPill.module.css';

export function StatusPill({ codigo }: { codigo: string | null | undefined }) {
  const tone = situacaoTone(codigo);
  return <span className={`${styles.pill} ${styles[tone]}`}>{situacaoLabel(codigo)}</span>;
}
