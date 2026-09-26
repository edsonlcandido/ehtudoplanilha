/**
 * Mock Data - Dados de exemplo para desenvolvimento
 * Baseado nos tipos de src/types/index.ts
 */

import type { SheetEntry, CategoryComplete, User } from '../types';

// ========== Usuário ==========
export const mockUser: User = {
  id: 'user_001',
  email: 'edson@exemplo.com',
  username: 'edson',
  name: 'Edson Silva',
  verified: true,
  avatar: '',
  created: '2024-01-01',
  updated: '2024-12-01',
};

// ========== Lançamentos ==========
export const mockEntries: SheetEntry[] = [
  {
    data: '2024-12-01',
    conta: 'Nubank',
    valor: -150.00,
    descricao: 'Supermercado Pão de Açúcar',
    categoria: 'Alimentação',
    orcamento: '12/2024',
    obs: '',
    rowIndex: 1,
  },
  {
    data: '2024-12-02',
    conta: 'Bradesco',
    valor: 3500.00,
    descricao: 'Salário',
    categoria: 'Receita',
    orcamento: '12/2024',
    obs: 'Pagamento CLT',
    rowIndex: 2,
  },
  {
    data: '2024-12-03',
    conta: 'Nubank',
    valor: -89.90,
    descricao: 'Posto Shell',
    categoria: 'Transporte',
    orcamento: '12/2024',
    obs: '',
    rowIndex: 3,
  },
  {
    data: '2024-12-05',
    conta: 'Nubank',
    valor: -45.00,
    descricao: 'Conta de Luz',
    categoria: 'Contas',
    orcamento: '12/2024',
    obs: 'Enel',
    rowIndex: 4,
  },
  {
    data: '2024-12-06',
    conta: 'Nubank',
    valor: -120.00,
    descricao: 'Internet',
    categoria: 'Contas',
    orcamento: '12/2024',
    obs: 'Vivo Fibra',
    rowIndex: 5,
  },
  {
    data: '2024-12-08',
    conta: 'Carteira',
    valor: -35.00,
    descricao: 'Almoço na empresa',
    categoria: 'Alimentação',
    orcamento: '12/2024',
    obs: '',
    rowIndex: 6,
  },
  {
    data: '2024-12-10',
    conta: 'Bradesco',
    valor: -800.00,
    descricao: 'Aluguel',
    categoria: 'Moradia',
    orcamento: '12/2024',
    obs: 'Casa própria',
    rowIndex: 7,
  },
  {
    data: '2024-12-12',
    conta: 'Nubank',
    valor: -250.00,
    descricao: 'Presente de Natal',
    categoria: 'Outros',
    orcamento: '12/2024',
    obs: 'Presente filha',
    rowIndex: 8,
  },
  {
    data: '2024-12-15',
    conta: 'Nubank',
    valor: 200.00,
    descricao: 'Freelance',
    categoria: 'Receita',
    orcamento: '12/2024',
    obs: 'Projeto extra',
    rowIndex: 9,
  },
  {
    data: '2024-12-18',
    conta: 'Nubank',
    valor: -67.50,
    descricao: 'Farmácia',
    categoria: 'Saúde',
    orcamento: '12/2024',
    obs: 'Remédios',
    rowIndex: 10,
  },
  {
    data: '2024-12-20',
    conta: 'Bradesco',
    valor: -150.00,
    descricao: 'Academia',
    categoria: 'Saúde',
    orcamento: '12/2024',
    obs: 'Plano anual',
    rowIndex: 11,
  },
  {
    data: '2024-12-22',
    conta: 'Carteira',
    valor: -55.00,
    descricao: 'Cinema',
    categoria: 'Lazer',
    orcamento: '12/2024',
    obs: 'Família',
    rowIndex: 12,
  },
];

// ========== Categorias ==========
export const mockCategories: CategoryComplete[] = [
  { categoria: 'Alimentação', tipo: 'expense', orcamento: 800 },
  { categoria: 'Transporte', tipo: 'expense', orcamento: 400 },
  { categoria: 'Contas', tipo: 'expense', orcamento: 600 },
  { categoria: 'Moradia', tipo: 'expense', orcamento: 1200 },
  { categoria: 'Saúde', tipo: 'expense', orcamento: 300 },
  { categoria: 'Lazer', tipo: 'expense', orcamento: 200 },
  { categoria: 'Outros', tipo: 'expense', orcamento: 150 },
  { categoria: 'Receita', tipo: 'income', orcamento: 5000 },
];

// ========== Resumo Financeiro ==========
export const mockFinancialSummary = {
  saldo: 2597.60,
  receitas: 3700.00,
  despesas: -1102.40,
  receitasPendente: 500.00,
  despesasPendente: 800.00,
};

// ========== Contas ==========
export const mockAccounts = [
  { nome: 'Nubank', tipo: 'Cartão de Crédito' },
  { nome: 'Bradesco', tipo: 'Conta Corrente' },
  { nome: 'Carteira', tipo: 'Dinheiro' },
];

// ========== Orçamentos ==========
export const mockOrcamentos = [
  { valor: '12/2024', label: 'Dezembro/2024' },
  { valor: '11/2024', label: 'Novembro/2024' },
  { valor: '10/2024', label: 'Outubro/2024' },
];

// ========== Estatísticas ==========
export const mockStats = {
  totalEntradas: 127,
  totalCategorias: 8,
  mesAtual: {
    receitas: 3700.00,
    despesas: 1102.40,
    saldo: 2597.60,
  },
  previsaoProximoMes: {
    receitas: 3500.00,
    despesas: 1200.00,
  },
};
