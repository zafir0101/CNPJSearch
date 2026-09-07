import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { EmpresaListItem } from '../types';
import styles from './SearchPanel.module.css';

interface SearchPanelProps {
  selectedCnpjBasico: string | null;
  onSelectEmpresa: (cnpjBasico: string) => void;
}

export function SearchPanel({ selectedCnpjBasico, onSelectEmpresa }: SearchPanelProps) {
  const [mainQuery, setMainQuery] = useState('');

  const [results, setResults] = useState<EmpresaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setMessage(null);
    setHasSearched(true);

    const digits = mainQuery.replace(/\D/g, '');
    const looksLikeCnpj = digits.length >= 8;

    try {
      if (looksLikeCnpj) {
        const cnpjBasico = digits.slice(0, 8);
        const empresa = await api.getEmpresaByCnpj(cnpjBasico);
        if (empresa) {
          setResults([{ cnpj_basico: empresa.cnpj_basico, razao_social: empresa.razao_social }]);
        } else {
          setResults([]);
          setMessage('Nenhuma empresa encontrada para esse CNPJ.');
        }
        return;
      }

      if (!mainQuery.trim()) {
        setResults([]);
        setMessage('Informe um CNPJ ou uma razão social para buscar.');
        return;
      }

      const empresas = await api.getEmpresasByRazaoSocial(mainQuery.trim());
      if (empresas && empresas.length > 0) {
        setResults(empresas.map((e) => ({ cnpj_basico: e.cnpj_basico, razao_social: e.razao_social })));
      } else {
        setResults([]);
        setMessage('Nenhuma empresa encontrada para essa razão social.');
      }
    } catch (err) {
      setResults([]);
      setMessage(err instanceof ApiError ? err.message : 'Ocorreu um erro ao buscar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.searchBlock}>
        <label className={styles.label} htmlFor="main-query">
          CNPJ ou razão social
        </label>
        <div className={styles.searchRow}>
          <input
            id="main-query"
            className={styles.mainInput}
            type="text"
            placeholder="Ex: 12345678 ou Empresa Exemplo"
            value={mainQuery}
            onChange={(e) => setMainQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button type="button" className={styles.searchButton} onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </div>

      <div className={styles.resultsBlock}>
        <div className={styles.resultsHeader}>
          <span>Resultados</span>
          {results.length > 0 && <span className={styles.resultsCount}>{results.length}</span>}
        </div>

        {message && <p className={styles.message}>{message}</p>}

        {!message && !hasSearched && <p className={styles.hint}>Busque por CNPJ ou razão social.</p>}

        <ul className={styles.resultsList}>
          {results.map((item, index) => (
            <li key={`${item.cnpj_basico}-${index}`}>
              <button
                type="button"
                className={`${styles.resultItem} ${item.cnpj_basico === selectedCnpjBasico ? styles.resultItemActive : ''}`}
                onClick={() => onSelectEmpresa(item.cnpj_basico)}
              >
                <span className={styles.resultName}>{item.razao_social}</span>
                <span className={`${styles.resultMeta} mono`}>{item.cnpj_basico}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
