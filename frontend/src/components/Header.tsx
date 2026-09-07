import type { ReactNode } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  right?: ReactNode;
}

export function Header({ right }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brandBlock}>
        <span className={styles.brand}>CNPJSearch</span>
        <span className={styles.tagline}>Consulta de dados públicos do CNPJ</span>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  );
}
