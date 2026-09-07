import styles from './DefinitionList.module.css';

export interface DefinitionItem {
  label: string;
  value: string;
  mono?: boolean;
}

export function DefinitionList({ items }: { items: DefinitionItem[] }) {
  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <div className={styles.row} key={item.label}>
          <dt className={styles.term}>{item.label}</dt>
          <dd className={`${styles.desc} ${item.mono ? 'mono' : ''}`}>{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
