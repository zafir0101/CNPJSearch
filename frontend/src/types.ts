// Tipos espelhando as colunas retornadas pela API Flask (ver db.py no backend).

export interface Empresa {
  cnpj_basico: string;
  razao_social: string;
  natureza_juridica: string;
  qualificacao_responsavel: string;
  capital_social: string;
  porte_empresa: string;
  ente_federativo_responsavel: string;
}

// Formato retornado por GET /api/v1/empresas?cnpj_basico=... ou ?razao_social=...
// (o endpoint devolve um único objeto no caso de cnpj_basico, ou uma lista no caso de razao_social)

export interface Natureza {
  codigo: string;
  descricao: string;
}

// Filtro aplicado à lista de estabelecimentos de UMA empresa (uf/município/situação/cnae).
export interface EstabelecimentoFiltro {
  uf?: string;
  municipio?: string;
  situacao_cadastral?: string;
  cnaes?: string;
}

export interface Estabelecimento {
  cnpj_basico: string;
  cnpj_ordem: string;
  cnpj_dv: string;
  identificador_matriz_filial: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: string;
  nome_cidade_exterior: string;
  pais: string;
  data_inicio_atividade: string;
  cnae_fiscal_principal: string;
  cnae_fiscal_secundaria: string;
  tipo_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_1: string;
  telefone_1: string;
  ddd_2: string;
  telefone_2: string;
  ddd_fax: string;
  fax: string;
  correio_eletronico: string;
  situacao_especial: string;
  data_situacao_especial: string;
}

export interface Socio {
  cnpj_basico: string;
  identificador_socio: string;
  nome_socio_razao_social: string;
  cnpj_cpf_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
  pais: string;
  representante_legal: string;
  nome_do_representante: string;
  qualificacao_representante_legal: string;
  faixa_etaria: string;
}

export interface Cnae {
  codigo: string;
  descricao: string;
}

export interface Municipio {
  codigo: string;
  descricao: string;
}

export type PipelineStage =
  | 'idle'
  | 'listando_diretorio'
  | 'listando_arquivos'
  | 'iniciando'
  | 'baixando'
  | 'extraindo'
  | 'gravando'
  | 'concluido'
  | 'debug_db_injetado'
  | null;

export interface PipelineStatus {
  status: 'idle' | 'provisionando' | 'pronto' | 'erro';
  stage: PipelineStage;
  current_file: string | null;
  files_done: number;
  files_total: number;
  error: string | null;
}

export interface EmpresaListItem {
  cnpj_basico: string;
  razao_social: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'empresa' | 'socio';
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface StatUF {
  uf: string;
  quantidade: number;
}

export interface StatSituacao {
  situacao_cadastral: string;
  quantidade: number;
}

export interface StatsData {
  empresas_total: number;
  estabelecimentos_total: number;
  socios_total: number;
  estabelecimentos_por_uf: StatUF[];
  estabelecimentos_por_situacao: StatSituacao[];
}
