import { request } from './core';

export interface CnpjConsultaResponse {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacaoCadastral: string;
  dataInicioAtividade: string | null;
  naturezaJuridica: string;
  isMei: boolean;
  porte: string | null;
  cnaePrincipal: { codigo: string; descricao: string } | null;
  cnaesSecundarios: Array<{ codigo: string; descricao: string }>;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  } | null;
  emailSugestao: string | null;
  telefoneSugestao: string | null;
}

export const cnpjApi = {
  consultar: async (cnpj: string): Promise<CnpjConsultaResponse> => {
    const sanitized = cnpj.replace(/\D/g, '');
    return request<CnpjConsultaResponse>(`/cnpj/${sanitized}`);
  },
};
