import { FAIXA_ETARIA_LIST, faixaEtariaLabel, qualificacaoLabel } from '../constants';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Socio } from '../types';
import { DefinitionList } from './DefinitionList';
import styles from './MasterDetailTab.module.css';

export function SociosTab({ cnpjBasico }: { cnpjBasico: string }) {
  const [list, setList] = useState<Socio[] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<Socio | null>(null);
  const [selectedCpfCnpj, setSelectedCpfCnpj] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setList(null);
    setSelected(null);
    setSelectedCpfCnpj(null);
    setListMessage(null);
    setLoadingList(true);

    const controller = new AbortController();
    api
      .getSociosPreview(cnpjBasico, controller.signal)
      .then((data) => {
        setList(data ?? []);
        if (!data || data.length === 0) setListMessage('Nenhum sócio encontrado.');
      })
      .catch((err) => {
        if (err instanceof ApiError) setListMessage(err.message);
      })
      .finally(() => setLoadingList(false));

    return () => controller.abort();
  }, [cnpjBasico]);

  async function loadDetails(cnpjCpfSocio: string) {
    setSelectedCpfCnpj(cnpjCpfSocio);
    setLoadingDetail(true);
    try {
      const data = await api.getSocioDetalhes(cnpjBasico, cnpjCpfSocio);
      setSelected(data);
    } catch {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className={styles.tabBody}>
      <div className={styles.listCol}>
        {loadingList && <p className={styles.hint}>Carregando…</p>}
        {listMessage && <p className={styles.hint}>{listMessage}</p>}
        <ul className={styles.list}>
          {list?.map((socio, index) => (
            <li key={`${socio.cnpj_cpf_socio}-${index}`}>
              <button
                type="button"
                className={`${styles.listItem} ${socio.cnpj_cpf_socio === selectedCpfCnpj ? styles.listItemActive : ''}`}
                onClick={() => loadDetails(socio.cnpj_cpf_socio)}
              >
                <span className={styles.listItemTitle}>{socio.nome_socio_razao_social}</span>
                <span className={styles.listItemMeta}>{socio.qualificacao_socio}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.detailCol}>
        {loadingDetail && <p className={styles.hint}>Carregando detalhes…</p>}
        {!loadingDetail && !selected && <p className={styles.hint}>Selecione um sócio à esquerda.</p>}
        {!loadingDetail && selected && (
          <>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{selected.nome_socio_razao_social}</h3>
            </div>
            <DefinitionList
              items={[
                { label: 'CPF/CNPJ', value: selected.cnpj_cpf_socio, mono: true },
                { label: 'Qualificação', value: selected.qualificacao_socio + ' — ' + qualificacaoLabel(selected.qualificacao_socio) },
                { label: 'Data de entrada na sociedade', value: selected.data_entrada_sociedade},
                { label: 'Faixa etária', value: selected.faixa_etaria + ' — ' + faixaEtariaLabel(selected.faixa_etaria)},
                { label: 'País', value: selected.pais },
                { label: 'Representante legal', value: selected.representante_legal },
                { label: 'Nome do representante', value: selected.nome_do_representante },
                { label: 'Qualificação do representante', value: selected.qualificacao_representante_legal + ' — ' +
                qualificacaoLabel(selected.qualificacao_representante_legal)},
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}
