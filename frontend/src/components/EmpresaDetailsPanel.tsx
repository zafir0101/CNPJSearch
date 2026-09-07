import { porteLabel } from '../constants';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Empresa } from '../types';
import { DefinitionList } from './DefinitionList';
import { EstabelecimentosTab } from './EstabelecimentosTab';
import { SociosTab } from './SociosTab';
import { GrafoSocios } from './GrafoSocios';
import styles from './EmpresaDetailsPanel.module.css';

interface EmpresaDetailsPanelProps {
  cnpjBasico: string;
}

type Tab = 'estabelecimentos' | 'socios' | 'grafo';

export function EmpresaDetailsPanel({ cnpjBasico }: EmpresaDetailsPanelProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('estabelecimentos');
  const [naturezaDesc, setNaturezaDesc] = useState<string | null>(null);

  useEffect(() => {
    setEmpresa(null);
    setMessage(null);
    setLoading(true);
    setTab('estabelecimentos');
    setNaturezaDesc(null);

    const controller = new AbortController();
    api
      .getEmpresaByCnpj(cnpjBasico, controller.signal)
      .then((data) => {
        setEmpresa(data);
        if (!data) setMessage('Não foi possível carregar os dados desta empresa.');
      })
      .catch((err) => {
        if (err instanceof ApiError) setMessage(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [cnpjBasico]);

  useEffect(() => {
    if (!empresa) return;
    let cancelled = false;
    api.getNaturezaByCodigo(empresa.natureza_juridica).then((n) => {
      if (cancelled) return;
      setNaturezaDesc(n ? `${n.codigo} — ${n.descricao}` : empresa.natureza_juridica);
    });
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  if (loading) {
    return (
      <div className={styles.panel}>
        <p className={styles.hint}>Carregando empresa…</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className={styles.panel}>
        <p className={styles.hint}>{message ?? 'Empresa não encontrada.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.summary}>
        <h2 className={styles.title}>{empresa.razao_social}</h2>
        <p className={`${styles.cnpj} mono`}>CNPJ básico {empresa.cnpj_basico}</p>
        <DefinitionList
          items={[
            { label: 'Natureza jurídica', value: naturezaDesc ?? empresa.natureza_juridica },
            { label: 'Qualificação do responsável', value: empresa.qualificacao_responsavel, mono: true },
            { label: 'Capital social', value: empresa.capital_social },
            { label: 'Porte da empresa', value: empresa.porte_empresa  + " — " + porteLabel(empresa.porte_empresa) },
            { label: 'Ente federativo responsável', value: empresa.ente_federativo_responsavel },
          ]}
        />
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${tab === 'estabelecimentos' ? styles.tabButtonActive : ''}`}
          onClick={() => setTab('estabelecimentos')}
        >
          Estabelecimentos
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${tab === 'socios' ? styles.tabButtonActive : ''}`}
          onClick={() => setTab('socios')}
        >
          Sócios
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${tab === 'grafo' ? styles.tabButtonActive : ''}`}
          onClick={() => setTab('grafo')}
        >
          Grafo Societário
        </button>
      </div>

      <div className={styles.tabContent}>
        {tab === 'estabelecimentos' && <EstabelecimentosTab key={`estab-${cnpjBasico}`} cnpjBasico={cnpjBasico} />}
        {tab === 'socios' && <SociosTab key={`socios-${cnpjBasico}`} cnpjBasico={cnpjBasico} />}
        {tab === 'grafo' && <GrafoSocios key={`grafo-${cnpjBasico}`} cnpjBasico={cnpjBasico} />}
      </div>
    </div>
  );
}
