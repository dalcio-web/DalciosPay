/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExpenseCategory = 
  | 'Fixas' 
  | 'Variáveis' 
  | 'Alimentação'
  | 'Mercado'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Contas & Serviços'
  | 'Outros'
  | (string & {});

export type PaymentMethod = 
  | 'pix' 
  | 'credit_card' 
  | 'boleto'
  | (string & {});

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paid: boolean;
  dueDate?: string; // Optinal for variable expenses
  installmentNumber?: number; // e.g., 1
  totalInstallments?: number; // e.g., 5
  paymentMethod?: PaymentMethod | string;
  receiptUrl?: string;
  splitFromId?: string;
  splitFromDescription?: string;
}

export interface ExtraIncome {
  id: string;
  description: string;
  amount: number;
  date?: string;
}

export interface PiggyBankEntry {
  id: string;
  description: string;
  amount: number;
  date?: string;
}

export type InvestmentType = 
  | 'Renda Fixa'
  | 'Ações'
  | 'FIIs'
  | 'Cripto'
  | 'Reserva de Emergência'
  | 'Previdência'
  | 'Fundos'
  | 'Outros'
  | (string & {});

export interface InvestmentEntry {
  id: string;
  description: string;
  amount: number;
  date?: string;
  type?: InvestmentType;
  institution?: string; // Corretora / Banco (ex: XP, Nubank, Inter, BTG, etc.)
  objective?: string; // Para o que serve (ex: Reserva de Emergência, Aposentadoria, etc.)
  destination?: string; // Para onde vai (ex: CDB Liquidez Diária, Selic 2029, MXRF11, etc.)
  splitFromId?: string; // ID da conta que foi dividida
  splitFromDescription?: string; // Nome da conta original dividida
  notes?: string;
}

export interface MonthData {
  salary: number;
  extraIncomes: ExtraIncome[];
  expenses: Expense[];
  piggyBank: PiggyBankEntry[];
  investments?: InvestmentEntry[];
}

export type TripStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type TripExpenseCategory = 
  | 'Pedágios'
  | 'Combustível'
  | 'Transporte & Passagens'
  | 'Hospedagem'
  | 'Mercado & Mantimentos'
  | 'Restaurantes & Alimentação'
  | 'Passeios & Atrações'
  | 'Custos no Local & Taxas'
  | 'Compras & Lembranças'
  | 'Seguro & Saúde'
  | 'Outros Custos';

export type TripPaymentStatus = 'paid' | 'pending' | 'estimated';

export type TripPaymentMethod = 'credit_card' | 'pix' | 'cash' | 'debit' | 'transfer' | 'miles';

export interface TripExpense {
  id: string;
  description: string;
  amount: number;
  category: TripExpenseCategory;
  paymentStatus: TripPaymentStatus;
  paymentMethod?: TripPaymentMethod;
  date?: string; // Data da despesa ou vencimento
  location?: string; // Cidade / Estabelecimento
  notes?: string;
  tollBoothsCount?: number; // Para Pedágios (quantidade de praças)
  fuelType?: 'Gasolina' | 'Etanol' | 'Diesel' | 'GNV' | 'Elétrico';
  installments?: {
    current: number;
    total: number;
  };
  paidBy?: string; // Quem pagou (se dividido)
  syncedToMonthlyExpenseId?: string; // ID da despesa gerada no painel mensal
  syncedToMonthId?: string; // Qual mês no painel mensal (ex: 2026-10)
}

export interface TripItineraryActivity {
  id: string;
  time?: string;
  title: string;
  description?: string;
  location?: string;
  estimatedCost?: number;
  done?: boolean;
}

export interface TripItineraryDay {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  activities: TripItineraryActivity[];
}

export interface TripChecklistItem {
  id: string;
  category: 'Documentos' | 'Veículo & Estrada' | 'Mala & Bagagem' | 'Casa antes de sair' | 'Geral';
  task: string;
  completed: boolean;
}

export interface TripProject {
  id: string;
  title: string; // Nome da viagem (ex: Férias em Floripa)
  destination: string; // Destino (ex: Florianópolis - SC)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budget: number; // Orçamento estipulado
  status: TripStatus;
  travelersCount: number; // Quantas pessoas
  travelersNames?: string; // Nomes dos viajantes
  transportType: 'car' | 'plane' | 'bus' | 'motorcycle' | 'rental_car' | 'other';
  notes?: string;
  coverGradient?: string; // Cor ou gradiente
  expenses: TripExpense[];
  itinerary?: TripItineraryDay[];
  checklist?: TripChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  months: { [monthId: string]: MonthData };
  trips?: TripProject[];
  customCategories?: string[];
}
