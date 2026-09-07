import { useCallback, useState } from 'react';
import { api } from '../api/client';
import { SITUACAO_CADASTRAL_LIST, UF_LIST } from '../constants';
import type { Cnae, EstabelecimentoFiltro, Municipio } from '../types';
import { Autocomplete } from './Autocomplete';
import styles from './EstabelecimentoFilters.module.css';

interface EstabelecimentoFiltersProps {
  value: EstabelecimentoFiltro;
  onChange: (filtro: EstabelecimentoFiltro) => void;
}

export function EstabelecimentoFilters({ value, onChange }: EstabelecimentoFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [municipioText, setMunicipioText] = useState('');
  const [cnaeText, setCnaeText] = useState('');

  const fetchMunicipios = useCallback(
    (query: string) => api.getMunicipiosAutocomplete(query, value.uf || undefined),
    [value.uf],
  );
  const fetchCnaes = useCallback((query: string) => api.getCnaesAutocomplete(query), []);

  const hasActiveFilter = !!(value.uf || value.municipio || value.situacao_cadastral || value.cnaes);

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.toggle} onClick={() => setShowFilters((v) => !v)}>
        {showFilters ? 'Ocultar filtros' : 'Filtrar estabelecimentos'}
        {hasActiveFilter && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {showFilters && (
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="est-uf-select">
              UF
            </label>
            <select
              id="est-uf-select"
              className={styles.select}
              value={value.uf ?? ''}
              onChange={(e) => {
                setMunicipioText('');
                onChange({ ...value, uf: e.target.value || undefined, municipio: undefined });
              }}
            >
              <option value="">Todas</option>
              {UF_LIST.map((u) => (
                <option key={u.codigo} value={u.codigo}>
                  {u.codigo} — {u.nome}
                </option>
              ))}
            </select>
          </div>

          <Autocomplete<Municipio>
            label="Município"
            placeholder={value.uf ? `Município em ${value.uf}` : 'Digite o nome do município'}
            value={municipioText}
            onInputChange={(text) => {
              setMunicipioText(text);
              onChange({ ...value, municipio: undefined });
            }}
            onSelect={(m) => {
              setMunicipioText(m.descricao);
              onChange({ ...value, municipio: m.codigo });
            }}
            fetchOptions={fetchMunicipios}
            getKey={(m) => m.codigo}
            getLabel={(m) => m.descricao}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="est-situacao-select">
              Situação cadastral
            </label>
            <select
              id="est-situacao-select"
              className={styles.select}
              value={value.situacao_cadastral ?? ''}
              onChange={(e) => onChange({ ...value, situacao_cadastral: e.target.value || undefined })}
            >
              <option value="">Todas</option>
              {SITUACAO_CADASTRAL_LIST.map((s) => (
                <option key={s.codigo} value={s.codigo}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <Autocomplete<Cnae>
            label="CNAE principal"
            placeholder="Digite a atividade"
            value={cnaeText}
            onInputChange={(text) => {
              setCnaeText(text);
              onChange({ ...value, cnaes: undefined });
            }}
            onSelect={(c) => {
              setCnaeText(c.descricao);
              onChange({ ...value, cnaes: c.codigo });
            }}
            fetchOptions={fetchCnaes}
            getKey={(c) => c.codigo}
            getLabel={(c) => `${c.codigo} — ${c.descricao}`}
          />
        </div>
      )}
    </div>
  );
}
