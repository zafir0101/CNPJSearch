export const UF_LIST: { codigo: string; nome: string }[] = [
  { codigo: 'AC', nome: 'Acre' },
  { codigo: 'AL', nome: 'Alagoas' },
  { codigo: 'AP', nome: 'Amapá' },
  { codigo: 'AM', nome: 'Amazonas' },
  { codigo: 'BA', nome: 'Bahia' },
  { codigo: 'CE', nome: 'Ceará' },
  { codigo: 'DF', nome: 'Distrito Federal' },
  { codigo: 'ES', nome: 'Espírito Santo' },
  { codigo: 'GO', nome: 'Goiás' },
  { codigo: 'MA', nome: 'Maranhão' },
  { codigo: 'MT', nome: 'Mato Grosso' },
  { codigo: 'MS', nome: 'Mato Grosso do Sul' },
  { codigo: 'MG', nome: 'Minas Gerais' },
  { codigo: 'PA', nome: 'Pará' },
  { codigo: 'PB', nome: 'Paraíba' },
  { codigo: 'PR', nome: 'Paraná' },
  { codigo: 'PE', nome: 'Pernambuco' },
  { codigo: 'PI', nome: 'Piauí' },
  { codigo: 'RJ', nome: 'Rio de Janeiro' },
  { codigo: 'RN', nome: 'Rio Grande do Norte' },
  { codigo: 'RS', nome: 'Rio Grande do Sul' },
  { codigo: 'RO', nome: 'Rondônia' },
  { codigo: 'RR', nome: 'Roraima' },
  { codigo: 'SC', nome: 'Santa Catarina' },
  { codigo: 'SP', nome: 'São Paulo' },
  { codigo: 'SE', nome: 'Sergipe' },
  { codigo: 'TO', nome: 'Tocantins' },
];

// Códigos de situação cadastral conforme leiaute de dados abertos do CNPJ (Receita Federal).
export const SITUACAO_CADASTRAL_LIST: { codigo: string; nome: string }[] = [
  { codigo: '01', nome: 'Nula' },
  { codigo: '02', nome: 'Ativa' },
  { codigo: '03', nome: 'Suspensa' },
  { codigo: '04', nome: 'Inapta' },
  { codigo: '08', nome: 'Baixada' },
];

export function situacaoLabel(codigo: string | null | undefined): string {
  const found = SITUACAO_CADASTRAL_LIST.find((s) => s.codigo === codigo);
  return found ? found.nome : (codigo ?? '—');
}

export function situacaoTone(codigo: string | null | undefined): 'ativa' | 'atencao' | 'inativa' | 'neutro' {
  switch (codigo) {
    case '02':
      return 'ativa';
    case '03':
    case '04':
      return 'atencao';
    case '08':
    case '01':
      return 'inativa';
    default:
      return 'neutro';
  }
}

export const PORTE_DA_EMPRESA_LIST: { codigo: string; nome: string }[] = [
  { codigo: '00', nome: 'Não informado'},
  { codigo: '01', nome: 'MICRO EMPRESA'},
  { codigo: '03', nome: 'EMPRESA DE PEQUENO PORTE'},
  { codigo: '05', nome: 'DEMAIS'},
];

export function porteLabel(codigo: string | null | undefined): string {
  const found = PORTE_DA_EMPRESA_LIST.find((p) => p.codigo === codigo);
  return found ? found.nome : (codigo ?? '—');
}

export const FAIXA_ETARIA_LIST: { codigo: string; nome: string }[] = [
  { codigo: '0', nome: 'Não informada / Não se aplica' },
  { codigo: '1', nome: '0 a 12 anos' },
  { codigo: '2', nome: '13 a 20 anos' },
  { codigo: '3', nome: '21 a 30 anos' },
  { codigo: '4', nome: '31 a 40 anos' },
  { codigo: '5', nome: '41 a 50 anos' },
  { codigo: '6', nome: '51 a 60 anos' },
  { codigo: '7', nome: '61 a 70 anos' },
  { codigo: '8', nome: '71 a 80 anos' },
  { codigo: '9', nome: 'Maiores de 80 anos' },
];

export function faixaEtariaLabel(codigo: string | null | undefined): string {
  const found = FAIXA_ETARIA_LIST.find((f) => f.codigo === codigo);
  return found ? found.nome : (codigo ?? '—');
}

export const QUALIFICACAO_LIST: { codigo: string; nome: string }[] = [
  { codigo: '00', nome: 'Não informada' },
  { codigo: '05', nome: 'Administrador' },
  { codigo: '08', nome: 'Conselheiro de Administração' },
  { codigo: '09', nome: 'Curador' },
  { codigo: '10', nome: 'Diretor' },
  { codigo: '11', nome: 'Interventor' },
  { codigo: '12', nome: 'Inventariante' },
  { codigo: '13', nome: 'Liquidante' },
  { codigo: '14', nome: 'Mãe' },
  { codigo: '15', nome: 'Pai' },
  { codigo: '16', nome: 'Presidente' },
  { codigo: '17', nome: 'Procurador' },
  { codigo: '18', nome: 'Secretário' },
  { codigo: '19', nome: 'Síndico' },
  { codigo: '20', nome: 'Sociedade Consorciada' },
  { codigo: '21', nome: 'Sociedade Filiada' },
  { codigo: '22', nome: 'Sócio' },
  { codigo: '23', nome: 'Sócio Capitalista' },
  { codigo: '24', nome: 'Sócio Comanditado' },
  { codigo: '25', nome: 'Sócio Comanditário' },
  { codigo: '26', nome: 'Sócio de Indústria' },
  { codigo: '28', nome: 'Sócio-Gerente' },
  { codigo: '29', nome: 'Sócio ou Acionista Incapaz' },
  { codigo: '30', nome: 'Sócio ou Acionista Menor' },
  { codigo: '31', nome: 'Sócio Ostensivo' },
  { codigo: '32', nome: 'Sócio Participante' },
  { codigo: '33', nome: 'Sócio Representado' },
  { codigo: '37', nome: 'Sócio Pessoa Jurídica Domiciliado no Exterior' },
  { codigo: '38', nome: 'Sócio Pessoa Física Residente ou Domiciliado no Exterior' },
  { codigo: '47', nome: 'Sócio Pessoa Física Residente no Brasil' },
  { codigo: '48', nome: 'Sócio Pessoa Jurídica Domiciliado no Brasil' },
  { codigo: '49', nome: 'Sócio-Administrador' },
  { codigo: '52', nome: 'Sócio com Capital' },
  { codigo: '53', nome: 'Sócio sem Capital' },
  { codigo: '54', nome: 'Fundador' },
  { codigo: '55', nome: 'Sócio Comanditado Residente no Exterior' },
  { codigo: '56', nome: 'Sócio Comanditário Pessoa Física Residente no Exterior' },
  { codigo: '57', nome: 'Sócio Comanditário Pessoa Jurídica Domiciliado no Exterior' },
  { codigo: '58', nome: 'Sócio Comanditário Incapaz' },
  { codigo: '59', nome: 'Produtor Rural' },
  { codigo: '63', nome: 'Cotas em Tesouraria' },
  { codigo: '65', nome: 'Titular Pessoa Física Residente ou Domiciliado no Brasil' },
  { codigo: '66', nome: 'Titular Pessoa Física Residente ou Domiciliado no Exterior' },
  { codigo: '67', nome: 'Titular Pessoa Física Incapaz ou Menor' },
  { codigo: '68', nome: 'Titular Pessoa Física Menor' },
  { codigo: '70', nome: 'Administrador Residente ou Domiciliado no Exterior' },
  { codigo: '71', nome: 'Conselheiro de Administração Residente ou Domiciliado no Exterior' },
  { codigo: '72', nome: 'Diretor Residente ou Domiciliado no Exterior' },
  { codigo: '73', nome: 'Presidente Residente ou Domiciliado no Exterior' },
  { codigo: '74', nome: 'Sócio-Administrador Residente ou Domiciliado no Exterior' },
  { codigo: '75', nome: 'Fundador Residente ou Domiciliado no Exterior' },
  { codigo: '78', nome: 'Titular Pessoa Jurídica Domiciliada no Brasil' },
  { codigo: '79', nome: 'Titular Pessoa Jurídica Domiciliada no Exterior' },
];

export function qualificacaoLabel(codigo: string | null | undefined): string {
  const found = QUALIFICACAO_LIST.find((q) => q.codigo === codigo);
  return found ? found.nome : (codigo ?? '—');
}
