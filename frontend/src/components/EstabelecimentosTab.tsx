import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Estabelecimento, EstabelecimentoFiltro } from '../types';
import { DefinitionList } from './DefinitionList';
import { StatusPill } from './StatusPill';
import { EstabelecimentoFilters } from './EstabelecimentoFilters';
import styles from './MasterDetailTab.module.css';

interface EstabelecimentosTabProps {
  cnpjBasico: string;
}

export function EstabelecimentosTab({ cnpjBasico }: EstabelecimentosTabProps) {
  const [filtro, setFiltro] = useState<EstabelecimentoFiltro>({});

  const [list, setList] = useState<Estabelecimento[] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<Estabelecimento | null>(null);
  const [selectedOrdem, setSelectedOrdem] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [cnaePrincipalDesc, setCnaePrincipalDesc] = useState<string | null>(null);
  const [cnaeSecundariasDesc, setCnaeSecundariasDesc] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
    setSelectedOrdem(null);
    setListMessage(null);
    setLoadingList(true);

    const controller = new AbortController();
    api
      .getEstabelecimentosPreview(cnpjBasico, filtro, controller.signal)
      .then((data) => {
        setList(data ?? []);
        if (!data || data.length === 0) setListMessage('Nenhum estabelecimento encontrado para esses filtros.');
      })
      .catch((err) => {
        if (err instanceof ApiError) setListMessage(err.message);
      })
      .finally(() => setLoadingList(false));

    return () => controller.abort();
  }, [cnpjBasico, filtro]);

  async function loadDetails(cnpjOrdem: string) {
    setSelectedOrdem(cnpjOrdem);
    setLoadingDetail(true);
    try {
      const data = await api.getEstabelecimentoDetalhes(cnpjBasico, cnpjOrdem);
      setSelected(data);
    } catch {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!selected) {
      setCnaePrincipalDesc(null);
      setCnaeSecundariasDesc(null);
      return;
    }
    let cancelled = false;

    api.getCnaeByCodigo(selected.cnae_fiscal_principal).then((c) => {
      if (cancelled) return;
      setCnaePrincipalDesc(c ? `${c.codigo} — ${c.descricao}` : selected.cnae_fiscal_principal);
    });

    const codigosSecundarios = selected.cnae_fiscal_secundaria
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (codigosSecundarios.length === 0) {
      setCnaeSecundariasDesc('');
    } else {
      Promise.all(codigosSecundarios.map((codigo) => api.getCnaeByCodigo(codigo))).then((results) => {
        if (cancelled) return;
        const labels = results.map((c, i) => (c ? `${c.codigo} — ${c.descricao}` : codigosSecundarios[i]));
        setCnaeSecundariasDesc(labels.join('; '));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <div>
      <EstabelecimentoFilters value={filtro} onChange={setFiltro} />

      <div className={styles.tabBody}>
        <div className={styles.listCol}>
          {loadingList && <p className={styles.hint}>Carregando…</p>}
          {listMessage && <p className={styles.hint}>{listMessage}</p>}
          <ul className={styles.list}>
            {list?.map((est) => (
              <li key={est.cnpj_ordem}>
                <button
                  type="button"
                  className={`${styles.listItem} ${est.cnpj_ordem === selectedOrdem ? styles.listItemActive : ''}`}
                  onClick={() => loadDetails(est.cnpj_ordem)}
                >
                  <span className={styles.listItemTitle}>
                    {est.nome_fantasia || (est.identificador_matriz_filial === '1' ? 'Matriz' : 'Filial')}
                  </span>
                  <span className={`${styles.listItemMeta} mono`}>nº {est.cnpj_ordem}</span>
                  <StatusPill codigo={est.situacao_cadastral} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.detailCol}>
          {loadingDetail && <p className={styles.hint}>Carregando detalhes…</p>}
          {!loadingDetail && !selected && <p className={styles.hint}>Selecione um estabelecimento à esquerda.</p>}
          {!loadingDetail && selected && (
            <>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>{selected.nome_fantasia || 'Sem nome fantasia'}</h3>
                <StatusPill codigo={selected.situacao_cadastral} />
              </div>
              <DefinitionList
                items={[
                  { label: 'Tipo', value: selected.identificador_matriz_filial === '1' ? 'Matriz' : 'Filial' },
                  {
                    label: 'CNPJ completo',
                    value: `${selected.cnpj_basico}${selected.cnpj_ordem}${selected.cnpj_dv}`,
                    mono: true,
                  },
                  { label: 'Data da situação cadastral', value: selected.data_situacao_cadastral },
                  { label: 'Motivo da situação', value: selected.motivo_situacao_cadastral },
                  { label: 'Início de atividade', value: selected.data_inicio_atividade },
                  { label: 'CNAE principal', value: cnaePrincipalDesc ?? selected.cnae_fiscal_principal },
                  { label: 'CNAEs secundários', value: cnaeSecundariasDesc ?? selected.cnae_fiscal_secundaria },
                  {
                    label: 'Endereço',
                    value: [selected.tipo_logradouro, selected.logradouro, selected.numero].filter(Boolean).join(' '),
                  },
                  { label: 'Complemento', value: selected.complemento },
                  { label: 'Bairro', value: selected.bairro },
                  { label: 'CEP', value: selected.cep, mono: true },
                  { label: 'Município (código)', value: selected.municipio, mono: true },
                  { label: 'UF', value: selected.uf },
                  { label: 'Telefone', value: selected.telefone_1 ? `(${selected.ddd_1}) ${selected.telefone_1}` : '' },
                  { label: 'E-mail', value: selected.correio_eletronico },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
