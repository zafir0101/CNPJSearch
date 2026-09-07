import type {
  Cnae,
  Empresa,
  Estabelecimento,
  EstabelecimentoFiltro,
  GraphData,
  Municipio,
  Natureza,
  PipelineStatus,
  Socio,
  StatsData,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface Envelope<T> {
  status: 'sucesso' | 'erro';
  dados: T | string;
}

/**
 * GET genérico para os endpoints da API.
 * - 404 é tratado como "sem resultados" (retorna null), pois é assim que
 *   todos os endpoints sinalizam "nada encontrado".
 * - Qualquer outro status não-OK vira ApiError com a mensagem do backend.
 */
async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está rodando.', 0);
  }

  let json: Envelope<T> | null = null;
  try {
    json = await res.json();
  } catch {
    // corpo vazio/inválido — segue com json = null
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    const message = json && typeof json.dados === 'string' ? json.dados : `Erro ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json ? (json.dados as T) : null;
}

function qs(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') usp.set(key, value);
  }
  const str = usp.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // GET /api/v1/empresas?cnpj_basico=... -> objeto único
  getEmpresaByCnpj: (cnpjBasico: string, signal?: AbortSignal) =>
    apiGet<Empresa>(`/api/v1/empresas${qs({ cnpj_basico: cnpjBasico })}`, signal),

  // GET /api/v1/empresas?razao_social=... -> lista
  getEmpresasByRazaoSocial: (razaoSocial: string, signal?: AbortSignal) =>
    apiGet<Empresa[]>(`/api/v1/empresas${qs({ razao_social: razaoSocial })}`, signal),

  // GET /api/v1/estabelecimentos/<cnpj_basico>?uf=&municipio=&situacao_cadastral=&cnaes=
  getEstabelecimentosPreview: (cnpjBasico: string, filtro: EstabelecimentoFiltro = {}, signal?: AbortSignal) =>
    apiGet<Estabelecimento[]>(
      `/api/v1/estabelecimentos/${encodeURIComponent(cnpjBasico)}${qs(filtro as Record<string, string | undefined>)}`,
      signal,
    ),

  getEstabelecimentoDetalhes: (cnpjBasico: string, cnpjOrdem: string, signal?: AbortSignal) =>
    apiGet<Estabelecimento>(
      `/api/v1/estabelecimento/${encodeURIComponent(cnpjBasico)}/${encodeURIComponent(cnpjOrdem)}`,
      signal,
    ),

  getSociosPreview: (cnpjBasico: string, signal?: AbortSignal) =>
    apiGet<Socio[]>(`/api/v1/socios/${encodeURIComponent(cnpjBasico)}`, signal),

  getSocioDetalhes: (cnpjBasico: string, cnpjCpfSocio: string, signal?: AbortSignal) =>
    apiGet<Socio>(
      `/api/v1/socio/${encodeURIComponent(cnpjBasico)}/${encodeURIComponent(cnpjCpfSocio)}`,
      signal,
    ),

  getCnaesAutocomplete: (descricao: string, signal?: AbortSignal) =>
    apiGet<Cnae[]>(`/api/v1/cnaes/${encodeURIComponent(descricao)}`, signal),

  getCnaeByCodigo: (codigo: string, signal?: AbortSignal) =>
    apiGet<Cnae>(`/api/v1/cnaes/codigo/${encodeURIComponent(codigo)}`, signal),

  getNaturezaByCodigo: (codigo: string, signal?: AbortSignal) =>
    apiGet<Natureza>(`/api/v1/naturezas/codigo/${encodeURIComponent(codigo)}`, signal),

  getMunicipiosAutocomplete: (descricao: string, uf?: string, signal?: AbortSignal) =>
    apiGet<Municipio[]>(`/api/v1/municipios/${encodeURIComponent(descricao)}${qs({ uf })}`, signal),

  getStatus: (signal?: AbortSignal) => apiGet<PipelineStatus>('/api/v1/status', signal),

  getGrafo: (cnpjBasico: string, signal?: AbortSignal) =>
    apiGet<GraphData>(`/api/v1/grafo/${encodeURIComponent(cnpjBasico)}`, signal),

  getStats: (signal?: AbortSignal) => 
      apiGet<StatsData>('/api/v1/estatisticas', signal),
};
