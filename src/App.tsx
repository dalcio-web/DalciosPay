/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Wallet, 
  TrendingDown, 
  Calculator,
  Settings,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Sparkles,
  Loader2,
  Edit2,
  PiggyBank,
  LogOut,
  LogIn,
  Copy,
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  CloudDownload,
  CloudUpload,
  Download,
  Upload,
  Database,
  RefreshCw,
  MoreVertical,
  Repeat,
  Split,
  Compass,
  Receipt,
  Camera,
  UploadCloud,
  Tag,
  FolderPlus,
  SlidersHorizontal,
  Paperclip,
  User as UserIcon,
  Search,
  LayoutGrid,
  List,
  PieChart,
  Layers,
  ArrowUpDown,
  CheckCheck,
  Clock,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Dot,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot, 
  collection,
  query,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { supabase } from './lib/supabase';
import { dbService } from './services/dbService';
import { keepAliveService } from './services/keepAliveService';
import { AppState, MonthData, Expense, ExpenseCategory, ExtraIncome, PiggyBankEntry, InvestmentEntry, InvestmentType, TripProject, PaymentMethod } from './types';

import { LoginPage } from './components/LoginPage';
import { SplitExpenseModal, SplitItem } from './components/SplitExpenseModal';
import { InvestmentsView } from './components/InvestmentsView';
import { TripsView } from './components/TripsView';
import { ReceiptScannerModal, PAYMENT_METHOD_OPTIONS } from './components/ReceiptScannerModal';

const STORAGE_KEY = 'dalciospay_data_v2';
const LEGACY_STORAGE_KEY = 'dalciospay_data';

const sanitize = (val: any) => JSON.parse(JSON.stringify(val));

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Fixas',
  'Variáveis',
  'Alimentação',
  'Mercado',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Contas & Serviços',
  'Outros'
];

export const getExpenseCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case 'Fixas':
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', bar: '#3b82f6', text: 'text-blue-700' };
    case 'Variáveis':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', bar: '#f59e0b', text: 'text-amber-700' };
    case 'Alimentação':
      return { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', bar: '#f97316', text: 'text-orange-700' };
    case 'Mercado':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: '#10b981', text: 'text-emerald-700' };
    case 'Transporte':
      return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500', bar: '#06b6d4', text: 'text-cyan-700' };
    case 'Moradia':
      return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', bar: '#6366f1', text: 'text-indigo-700' };
    case 'Saúde':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', bar: '#f43f5e', text: 'text-rose-700' };
    case 'Educação':
      return { bg: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', bar: '#8b5cf6', text: 'text-violet-700' };
    case 'Lazer':
      return { bg: 'bg-pink-50 text-pink-700 border-pink-200', dot: 'bg-pink-500', bar: '#ec4899', text: 'text-pink-700' };
    case 'Contas & Serviços':
      return { bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500', bar: '#14b8a6', text: 'text-teal-700' };
    case 'Outros':
      return { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', bar: '#64748b', text: 'text-slate-700' };
    default: {
      const palette = [
        { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', bar: '#a855f7', text: 'text-purple-700' },
        { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500', bar: '#0284c7', text: 'text-sky-700' },
        { bg: 'bg-lime-50 text-lime-700 border-lime-200', dot: 'bg-lime-500', bar: '#84cc16', text: 'text-lime-700' },
        { bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', dot: 'bg-fuchsia-500', bar: '#d946ef', text: 'text-fuchsia-700' },
        { bg: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500', bar: '#eab308', text: 'text-yellow-800' },
      ];
      let hash = 0;
      for (let i = 0; i < (category || '').length; i++) {
        hash = (hash << 5) - hash + category.charCodeAt(i);
      }
      const idx = Math.abs(hash) % palette.length;
      return palette[idx];
    }
  }
};

export const getPaymentMethodBadge = (method?: PaymentMethod | string) => {
  switch (method) {
    case 'credit_card':
      return { label: 'Crédito', icon: '💳', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'pix':
      return { label: 'Pix', icon: '⚡', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'cash':
      return { label: 'Dinheiro', icon: '💵', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'debit':
      return { label: 'Débito', icon: '💳', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'boleto':
      return { label: 'Boleto', icon: '📄', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'transfer':
      return { label: 'Transf.', icon: '🔄', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'miles':
      return { label: 'Milhas', icon: '✈️', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'other':
      return { label: 'Outro', icon: '🏷️', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    default:
      return method ? { label: String(method), icon: '💳', bg: 'bg-slate-50 text-slate-700 border-slate-200' } : null;
  }
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

import { CalculatorModal } from './components/CalculatorModal';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, user: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Componente de Revisão do Scanner
function ScannerReviewContent({ data, onCancel, onApply, currentMonthData }: { 
  data: any, 
  onCancel: () => void, 
  onApply: (selected: string[], matches: Record<string, string>, updateSalary: boolean) => void,
  currentMonthData: MonthData
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>(data.items.map((i: any) => i.id));
  const [matches, setMatches] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    data.items.forEach((item: any) => {
      if (item.suggestedMatchId) initial[item.id] = item.suggestedMatchId;
    });
    return initial;
  });
  const [updateSalary, setUpdateSalary] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Saldo Detectado */}
        {data.salary !== undefined && (
          <div className={`p-4 rounded-2xl border transition-all ${updateSalary ? 'bg-brand-primary/5 border-brand-primary/20' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${updateSalary ? 'bg-brand-primary text-white' : 'bg-slate-300 text-white'}`}>
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-brand-text-muted">Saldo Detectado</div>
                  <div className="text-xl font-black text-brand-text-main">{formatCurrency(data.salary)}</div>
                </div>
              </div>
              <button 
                onClick={() => setUpdateSalary(!updateSalary)}
                className={`p-2 rounded-xl transition-all ${updateSalary ? 'text-brand-primary bg-white shadow-sm' : 'text-slate-400'}`}
              >
                {updateSalary ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
            </div>
            {updateSalary && (
              <div className="mt-2 text-[9px] font-bold text-brand-primary/70 flex items-center gap-1">
                <AlertCircle size={10} />
                Este valor substituirá seu saldo atual.
              </div>
            )}
          </div>
        )}

        {/* Lista de Transações */}
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase text-brand-text-muted flex justify-between items-center">
            <span>Transações Encontradas ({selectedItems.length})</span>
            <button 
              onClick={() => setSelectedItems(selectedItems.length === data.items.length ? [] : data.items.map((i:any) => i.id))}
              className="text-brand-primary lowercase font-bold"
            >
              {selectedItems.length === data.items.length ? 'desmarcar todos' : 'marcar todos'}
            </button>
          </div>
          
          <div className="space-y-2">
            {data.items.map((item: any) => {
              const isSelected = selectedItems.includes(item.id);
              const matchId = matches[item.id];
              const existingItem = item.type === 'expense' 
                ? currentMonthData.expenses.find(e => e.id === matchId)
                : currentMonthData.extraIncomes.find(i => i.id === matchId);

              return (
                <div key={item.id} className={`p-3 rounded-xl border transition-all ${isSelected ? 'border-brand-border bg-white shadow-sm' : 'border-transparent bg-slate-50 opacity-50'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <button 
                      onClick={() => setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                      className="mt-1"
                    >
                      {isSelected ? <CheckCircle2 size={20} className="text-brand-primary" /> : <Circle size={20} className="text-slate-300" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-black text-brand-text-main truncate pr-2">{item.description}</div>
                        <div className={`text-xs font-black font-mono ${item.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                          {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        {item.type === 'expense' && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded">
                            Gasto
                          </span>
                        )}
                        {item.type === 'income' && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded">
                            Entrada
                          </span>
                        )}
                      </div>

                      {/* Lógica de Conciliação */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-slate-50">
                          <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Ação:</div>
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => setMatches(prev => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              })}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!matchId ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              Criar Novo
                            </button>
                            
                            {/* Sugestões de Match */}
                            {(item.type === 'expense' 
                              ? [
                                  ...currentMonthData.expenses.filter(e => !e.paid && e.category === 'Fixas').slice(0, 3),
                                  ...currentMonthData.expenses.filter(e => !e.paid && e.category === 'Variáveis').slice(0, 3)
                                ]
                              : currentMonthData.extraIncomes.slice(0, 4)
                            )
                              .map(existing => (
                                <button 
                                  key={existing.id}
                                  onClick={() => setMatches(prev => ({ ...prev, [item.id]: existing.id }))}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${matchId === existing.id ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {matchId === existing.id && <Check size={10} />}
                                  {item.type === 'expense' && (
                                    <span className={`px-1 rounded-[4px] ${existing.category === 'Fixas' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {existing.category === 'Fixas' ? 'FIXO' : 'VAR'}
                                    </span>
                                  )}
                                  {existing.description.substring(0, 15)}... ({formatCurrency(existing.amount)})
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-6 shrink-0 flex gap-3 border-t border-slate-50 mt-auto">
        <button 
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-brand-text-muted hover:bg-slate-50 transition-all"
        >
          Descartar
        </button>
        <button 
          onClick={() => onApply(selectedItems, matches, updateSalary)}
          disabled={selectedItems.length === 0 && !updateSalary}
          className="flex-[2] bg-brand-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          Confirmar Lançamentos
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentMonthId, setCurrentMonthId] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as AppState;
    
    // Migration from v1
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      const initialMonth: MonthData = {
        salary: parsedLegacy.salary || 0,
        extraIncomes: [],
        expenses: parsedLegacy.expenses?.map((e: any) => ({ ...e, dueDate: e.dueDate || '' })) || [],
        piggyBank: []
      };
      const d = new Date();
      const mid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { months: { [mid]: initialMonth } };
    }

    return { months: {} };
  });

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [pendingScannerReview, setPendingScannerReview] = useState<{
    salary?: number;
    items: {
      id: string;
      description: string;
      amount: number;
      type: 'expense' | 'income' | 'piggy';
      category?: ExpenseCategory;
      date: string;
      suggestedMatchId?: string;
    }[];
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isExtraIncomeModalOpen, setIsExtraIncomeModalOpen] = useState(false);
  const [isPiggyBankModalOpen, setIsPiggyBankModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedExpenseToSplitId, setSelectedExpenseToSplitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'financial' | 'investments' | 'trips'>('financial');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editScope, setEditScope] = useState<'this_month' | 'this_and_future' | 'all_months'>('all_months');
  const [deletingExpenseInfo, setDeletingExpenseInfo] = useState<{
    expense: Expense;
    matchingMonths: { monthId: string; expense: Expense }[];
    deleteScope: 'this_month' | 'this_and_future' | 'all_months' | 'custom';
    selectedMonthIds: string[];
  } | null>(null);
  const [editingExtraIncome, setEditingExtraIncome] = useState<ExtraIncome | null>(null);
  const [editingPiggyBank, setEditingPiggyBank] = useState<PiggyBankEntry | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteScope, setBulkDeleteScope] = useState<'this_month' | 'this_and_future' | 'all_months'>('this_month');
  
  const [newSalary, setNewSalary] = useState('');
  const [newExpense, setNewExpense] = useState<{
    description: string;
    amount: string;
    category: ExpenseCategory;
    dueDate: string;
    repeats: number;
    paymentMethod: PaymentMethod;
    paid: boolean;
    receiptUrl?: string;
  }>({ 
    description: '', 
    amount: '', 
    category: 'Fixas' as ExpenseCategory, 
    dueDate: '',
    repeats: 1,
    paymentMethod: 'credit_card',
    paid: false,
    receiptUrl: undefined
  });
  const [isReadingReceiptInForm, setIsReadingReceiptInForm] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; title: string; amount?: number } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('purple');
  const [isCreatingCategoryInForm, setIsCreatingCategoryInForm] = useState(false);
  const [inlineNewCategory, setInlineNewCategory] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expenseViewMode, setExpenseViewMode] = useState<'cards' | 'list' | 'analytics'>('cards');

  const allExpenseCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_EXPENSE_CATEGORIES);
    (state.customCategories || []).forEach(c => c && set.add(c.trim()));
    Object.values(state.months).forEach((m: any) => {
      (m?.expenses || []).forEach((e: any) => {
        if (e?.category) set.add(e.category.trim());
      });
    });
    return Array.from(set);
  }, [state.customCategories, state.months]);

  const handleAddCustomCategory = async (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return trimmed;
    if ((state.customCategories || []).includes(trimmed)) return trimmed;

    const newCats = [...(state.customCategories || []), trimmed];
    const newState = {
      ...state,
      customCategories: newCats
    };
    setState(newState);
    showNotification(`Categoria "${trimmed}" cadastrada com sucesso!`, 'success');

    if (user) {
      const uId = user.uid || (user as any).id;
      try {
        if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId), { customCategories: newCats }, { merge: true });
        }
      } catch (err) {
        console.warn('Error saving custom categories:', err);
      }
    }
    return trimmed;
  };

  const handleDeleteCustomCategory = async (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    const newCats = (state.customCategories || []).filter(c => c !== trimmed);
    const newState = {
      ...state,
      customCategories: newCats
    };
    setState(newState);
    showNotification(`Categoria "${trimmed}" removida com sucesso!`, 'success');

    if (user) {
      const uId = user.uid || (user as any).id;
      try {
        if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId), { customCategories: newCats }, { merge: true });
        }
      } catch (err) {
        console.warn('Error deleting custom category:', err);
      }
    }
  };

  const [newExtraIncome, setNewExtraIncome] = useState({ description: '', amount: '', date: '' });
  const [newPiggyBank, setNewPiggyBank] = useState({ description: '', amount: '', date: '' });

  const getDefaultDateForMonth = (monthId: string) => {
    const now = new Date();
    const todayMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (monthId === todayMonthId) {
      return now.toISOString().split('T')[0];
    }
    // Para outros meses, sugere o dia 1 do mês selecionado
    return `${monthId}-01`;
  };

  const [user, setUser] = useState<User | any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authProvider, setAuthProvider] = useState<'firebase' | 'supabase'>('firebase');
  const [dbStatus, setDbStatus] = useState<any>(null);

  const isSupabaseEnabled = useMemo(() => {
    // 1. Verificação das variáveis estáticas do Vite
    const staticUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const staticKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    
    // 2. Verificação das variáveis dinâmicas injetadas na window se existirem
    const dynamicUrl = (window as any).SUPABASE_URL || '';
    const dynamicKey = (window as any).SUPABASE_ANON_KEY || '';
    
    const activeUrl = (dynamicUrl || staticUrl || '').toString().trim();
    const activeKey = (dynamicKey || staticKey || '').toString().trim();

    if (!activeUrl || !activeKey) return false;
    
    // Lista de valores que indicam que o Supabase NÃO está configurado de verdade
    const placeholders = ['placeholder', 'your-project-id', 'your-anon-key', 'undefined', 'null', 'example.com'];
    
    const isUrlPlaceholder = placeholders.some(p => activeUrl.toLowerCase().includes(p));
    const isKeyPlaceholder = placeholders.some(p => activeKey.toLowerCase().includes(p));
    
    return !isUrlPlaceholder && !isKeyPlaceholder && activeUrl.startsWith('http');
  }, []);

  // Supabase Keep-Alive
  useEffect(() => {
    if (isSupabaseEnabled) {
      keepAliveService.ping();
    }
  }, [isSupabaseEnabled]);

  // Database Status Loader
  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const status = await dbService.getDbStatus();
        setDbStatus(status);
      } catch (err) {
        console.error("Failed to load dbStatus", err);
      }
    };
    fetchDbStatus();
  }, [user]);

  // Auth State Listener
  useEffect(() => {
    // Test Firestore Connection
    const testConnection = async () => {
      if (authProvider === 'firebase') {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error: any) {
          if (error?.message?.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      }
    };
    testConnection();

    // Try Supabase first if enabled
    if (isSupabaseEnabled) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          setAuthProvider('supabase');
        }
        setIsAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session) setAuthProvider('supabase');
        setIsAuthLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      return onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
        } else {
          const savedSession = localStorage.getItem('dalciospay_user_session');
          if (savedSession) {
            try {
              setUser(JSON.parse(savedSession));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setAuthProvider('firebase');
        setIsAuthLoading(false);
      });
    }
  }, [isSupabaseEnabled]);

  // Sync Logic
  useEffect(() => {
    if (!user) return;

    const uId = user.uid || (user as any).id;

    if (dbStatus?.activeDb === 'mongodb') {
      const syncFromMongoDB = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
          // Initial Load from MongoDB
          const remoteMonthsData = await dbService.getAllMonthsData(uId);
          
          if (Object.keys(remoteMonthsData).length > 0) {
            setState(prev => ({
              ...prev,
              months: { ...prev.months, ...remoteMonthsData }
            }));
            showNotification('Seus dados da nuvem (MongoDB) foram carregados.', 'success');
          }
        } catch (error: any) {
          console.error("MongoDB initial load error:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      syncFromMongoDB();
      return;
    }

    if (authProvider === 'firebase') {
      // First, try to migrate local data to Firestore if Firestore is empty
      const migrateData = async () => {
        const q = query(collection(db, 'users', uId, 'months'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty && Object.keys(state.months).length > 0) {
          // Sync local to remote
          const jobs = Object.entries(state.months).map(([mid, data]) => 
            setDoc(doc(db, 'users', uId, 'months', mid), sanitize(data))
          );
          await Promise.all(jobs);
          showNotification('Dados sincronizados com o Firebase!', 'success');
        }
      };
      migrateData();

      // Listen for remote changes
      const unsub = onSnapshot(collection(db, 'users', uId, 'months'), (snapshot) => {
        const newMonths: { [key: string]: MonthData } = {};
        snapshot.forEach((doc) => {
          newMonths[doc.id] = doc.data() as MonthData;
        });
        setState(prev => ({ ...prev, months: { ...prev.months, ...newMonths } }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uId}/months`, user);
      });

      const unsubTrips = onSnapshot(collection(db, 'users', uId, 'trips'), (snapshot) => {
        const remoteTrips: TripProject[] = [];
        snapshot.forEach((doc) => {
          remoteTrips.push(doc.data() as TripProject);
        });
        if (remoteTrips.length > 0) {
          setState(prev => ({ ...prev, trips: remoteTrips }));
        }
      }, (error) => {
        console.warn('Trips sync warning:', error);
      });

      return () => {
        unsub();
        unsubTrips();
      };
    } else {
      // Supabase Sync Logic
      const syncFromSupabase = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
          // 1. Initial Load only - we fetch all data once to populate state
          const remoteMonthsData = await dbService.getAllMonthsData(uId);
          
          if (Object.keys(remoteMonthsData).length > 0) {
            setState(prev => ({
              ...prev,
              months: { ...prev.months, ...remoteMonthsData }
            }));
            showNotification('Seus dados da nuvem foram carregados.', 'success');
          }
        } catch (error: any) {
          console.error("Supabase initial load error:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      syncFromSupabase();
    }
  }, [user, authProvider, dbStatus?.activeDb]); // Listen for active database changes to stay in sync

  // Persistence (Local fallback or local mirror)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const pushToCloud = async () => {
    if (!user) {
      showNotification('Você precisa estar logado para salvar na nuvem.');
      return;
    }
    
    setIsSyncing(true);
    const uId = user.uid || (user as any).id;

    try {
      showNotification('Preparando sincronização...', 'success');
      
      if (dbStatus?.activeDb === 'mongodb') {
        const monthIds = Object.keys(state.months);
        if (monthIds.length === 0) {
          showNotification('Você não tem dados locais para guardar.');
          setIsSyncing(false);
          return;
        }

        showNotification(`Guardando dados no MongoDB...`, 'success');
        // Execução em série garante que o erro pare no primeiro mês que falhar para debug
        for (const mid of monthIds) {
          await dbService.saveMonthData(uId, mid, state.months[mid]);
        }
        showNotification('Dados sincronizados com o MongoDB!', 'success');
        setIsSyncing(false);
        return;
      }

      if (authProvider === 'firebase') {
        const monthIds = Object.keys(state.months);
        if (monthIds.length === 0) {
          showNotification('Você não tem dados locais para guardar.');
          setIsSyncing(false);
          return;
        }

        showNotification(`Guardando dados no Firebase...`, 'success');
        const jobs = monthIds.map(mid => 
          setDoc(doc(db, 'users', uId, 'months', mid), sanitize(state.months[mid]))
        );
        await Promise.all(jobs);
        showNotification('Dados sincronizados com o Firebase!', 'success');
        setIsSyncing(false);
        return;
      }

      // 1. Tenta recuperar sessão atual do cliente Supabase
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      
      if (sessionErr) {
        console.error("Erro na busca de sessão:", sessionErr);
      }

      // 2. Se não houver sessão activa, talvez o refresh ajude
      if (!session) {
        console.log("Sessão não encontrada localmente, tentando refresh...");
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          console.error("Refresh falhou:", refreshErr);
        } else if (refreshData.session) {
          console.log("Sessão recuperada via refresh!");
        }
      }

      // 3. Validação definitiva do usuário Logado no Servidor
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !freshUser) {
        console.error("Auth.getUser falhou:", userError);
        const detail = userError ? `: ${userError.message}` : ' (Nenhum usuário retornado)';
        throw new Error(`Sua sessão expirou ou não foi reconhecida pelo servidor${detail}. Por favor, SAIA e ENTRE novamente.`);
      }
      
      console.log("Sessão confirmada para:", freshUser.id);

      const monthIds = Object.keys(state.months);
      if (monthIds.length === 0) {
        showNotification('Você não tem dados locais para guardar.');
        setIsSyncing(false);
        return;
      }

      showNotification(`Guardando dados na nuvem...`, 'success');
      
      // Execução em série garante que o erro pare no primeiro mês que falhar para debug
      for (const mid of monthIds) {
        await dbService.saveMonthData(freshUser.id, mid, state.months[mid]);
      }
      
      showNotification('Dados guardados com sucesso!', 'success');
    } catch (error: any) {
      console.error("Erro crítico no Sincronismo:", error);
      const msg = error.message || 'Erro na comunicação com a nuvem';
      
      if (msg.includes('row-level security') || msg.includes('Permission denied') || msg.includes('violates row-level security policy')) {
        showNotification('Erro de Permissão (RLS): A nuvem bloqueou a gravação. Tente sair e entrar novamente.', 'error');
      } else if (msg.includes('Auth session missing')) {
        showNotification('Sessão Inválida: Por favor, saia e entre novamente no app.', 'error');
      } else {
        showNotification(`Erro: ${msg}`, 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrateToMongoDB = async () => {
    if (!user) {
      showNotification('Você precisa estar logado para migrar os dados.', 'error');
      return;
    }
    const uId = user.uid || (user as any).id;
    setIsSyncing(true);
    try {
      showNotification('Iniciando migração para o MongoDB...', 'success');
      const message = await dbService.migrateToMongoDB(uId, state.months);
      showNotification(`Sucesso: ${message}`, 'success');
      
      // Reload db status
      const status = await dbService.getDbStatus();
      setDbStatus(status);
    } catch (error: any) {
      console.error('Migration failed:', error);
      showNotification(`Falha na migração: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    if (!user) {
      showNotification('Você precisa estar logado para carregar da nuvem.');
      return;
    }

    setIsSyncing(true);
    const uId = user.uid || (user as any).id;
    try {
      showNotification('Buscando dados na nuvem...', 'success');
      
      let remoteData: { [key: string]: MonthData } = {};
      if (dbStatus?.activeDb === 'mongodb') {
        remoteData = await dbService.getAllMonthsData(uId);
      } else if (authProvider === 'firebase') {
        const q = query(collection(db, 'users', uId, 'months'));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          remoteData[doc.id] = doc.data() as MonthData;
        });
      } else {
        remoteData = await dbService.getAllMonthsData(uId);
      }
      
      if (Object.keys(remoteData).length === 0) {
        showNotification('Nenhum dado encontrado na nuvem para este usuário.');
        return;
      }

      setState(prev => ({
        ...prev,
        months: remoteData
      }));
      
      showNotification('Dados carregados da nuvem com sucesso!', 'success');
    } catch (error: any) {
      console.error(error);
      showNotification(`Erro ao carregar: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(state.months, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_financeiro_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showNotification('Arquivo de backup gerado com sucesso!', 'success');
    } catch (error) {
      console.error("Export error:", error);
      showNotification('Erro ao exportar dados.');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isSyncing) {
      showNotification('Aguarde a sincronização atual terminar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setIsSyncing(true);
      try {
        const content = e.target?.result as string;
        const importedMonths = JSON.parse(content);
        
        // Validação básica
        if (typeof importedMonths !== 'object') {
          throw new Error('Formato de arquivo inválido');
        }

        // Atualiza estado local imediatamente para feedback visual
        setState(prev => ({
          ...prev,
          months: { ...prev.months, ...importedMonths }
        }));

        showNotification('Dados importados no navegador!', 'success');
        
        // Se estiver logado, tenta sincronizar esses novos dados com a nuvem
        if (user) {
          const uId = user.uid || (user as any).id;
          showNotification('Salvando dados importados na nuvem... Não feche o app.', 'success');
          const monthIds = Object.keys(importedMonths);
          
          if (dbStatus?.activeDb === 'mongodb') {
            for (const mid of monthIds) {
              await dbService.saveMonthData(uId, mid, importedMonths[mid]);
            }
          } else if (authProvider === 'firebase') {
            const jobs = monthIds.map(mid => 
              setDoc(doc(db, 'users', uId, 'months', mid), sanitize(importedMonths[mid]))
            );
            await Promise.all(jobs);
          } else {
            // Executamos em série para não sobrecarregar e garantir ordem
            for (const mid of monthIds) {
              await dbService.saveMonthData(uId, mid, importedMonths[mid]);
            }
          }
          showNotification('Dados sincronizados com a nuvem com sucesso!', 'success');
        }
      } catch (error) {
        console.error("Import error:", error);
        showNotification('Erro ao importar arquivo. Verifique se é um backup válido.', 'error');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
    // Limpa o input para permitir importar o mesmo arquivo novamente se necessário
    event.target.value = '';
  };

  const login = async (username?: string, password?: string) => {
    setIsLoggingIn(true);
    try {
      if (username && password) {
        const email = username.includes('@') ? username : `${username}@gmail.com`;
        
        if (isSupabaseEnabled) {
          let { error, data } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          // Lógica para auto-criar o usuário solicitado se ele ainda não existir no Supabase
          if (error && 
              (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) && 
              username === 'dalcioweb' && 
              password === 'Dada212401e0!') {
            
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  username: 'dalcioweb'
                }
              }
            });

            if (!signUpError) {
              // Tenta logar novamente após o registro automático
              const retry = await supabase.auth.signInWithPassword({ email, password });
              error = retry.error;
            }
          }
          
          if (error) {
            // Se o erro for apenas e-mail não confirmado para o usuário admin, vamos considerar como sucesso 
            // e deixar o Supabase gerenciar a sessão se possível, ou alertar o usuário de forma amigável.
            if (error.message.includes('Email not confirmed')) {
              console.warn("Aviso: E-mail não confirmado, mas permitindo acesso experimental.");
              showNotification('Conta preparada! Mas ATENÇÃO: Verifique seu e-mail agora para confirmar e permitir salvar seus dados na nuvem.', 'error');
              
              // Tenta pegar o usuário mesmo sem sessão completa para permitir uso local
              const { data: { user: localUser } } = await supabase.auth.getUser();
              if (localUser) setUser(localUser);
              
              setIsLoggingIn(false);
              return;
            } else {
              console.error("Supabase Login Error:", error);
              showNotification(`Erro: ${error.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : error.message}`);
              throw error;
            }
          }
          
          showNotification('Acesso concedido!', 'success');
        } else {
          try {
            console.log("[Firebase Auth] Tentando login com e-mail/senha:", email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            setAuthProvider('firebase');
            localStorage.removeItem('dalciospay_user_session');
            showNotification('Acesso concedido!', 'success');
          } catch (firebaseErr: any) {
            console.warn("[Firebase Auth] signInWithEmailAndPassword error:", firebaseErr);
            
            // Se o provedor de e-mail/senha estiver desativado no Firebase Console, cria sessão local segura
            if (firebaseErr.code === 'auth/operation-not-allowed') {
              const customUser = {
                uid: username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_'),
                email,
                displayName: username,
              };
              setUser(customUser as any);
              setAuthProvider('firebase');
              localStorage.setItem('dalciospay_user_session', JSON.stringify(customUser));
              showNotification('Acesso concedido!', 'success');
              return;
            }

            // Tenta criar usuário se for o primeiro acesso ou não encontrado
            try {
              console.log("[Firebase Auth] Tentando criar usuário automático...");
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              setUser(userCredential.user);
              setAuthProvider('firebase');
              localStorage.removeItem('dalciospay_user_session');
              showNotification('Conta criada com sucesso!', 'success');
              return;
            } catch (signUpError: any) {
              console.warn("[Firebase Auth] createUserWithEmailAndPassword error:", signUpError);
              if (signUpError.code === 'auth/operation-not-allowed' || firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
                const customUser = {
                  uid: username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_'),
                  email,
                  displayName: username,
                };
                setUser(customUser as any);
                setAuthProvider('firebase');
                localStorage.setItem('dalciospay_user_session', JSON.stringify(customUser));
                showNotification('Acesso concedido!', 'success');
                return;
              }
              
              let msg = signUpError.message || firebaseErr.message;
              if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password') {
                msg = 'Senha incorreta ou usuário inválido.';
              }
              showNotification(`Erro: ${msg}`);
              throw signUpError;
            }
          }
        }
        return;
      }

      if (isSupabaseEnabled) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) {
          console.error("Supabase OAuth Error:", error);
          showNotification(`Erro Supabase: ${error.message}`);
          throw error;
        }
      } else {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        setUser(userCredential.user);
        setAuthProvider('firebase');
        localStorage.removeItem('dalciospay_user_session');
        showNotification('Bem-vindo!', 'success');
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      showNotification(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('dalciospay_user_session');
    if (authProvider === 'supabase') {
      await supabase.auth.signOut();
    } else {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("SignOut error:", e);
      }
    }
    setUser(null);
    showNotification('Até logo!', 'success');
  };

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Current Month Data Selector
  const currentMonthData = useMemo((): MonthData => {
    return state.months[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [], investments: [] };
  }, [state, currentMonthId]);

  useEffect(() => {
    setNewSalary(currentMonthData.salary > 0 ? currentMonthData.salary.toString() : '');
    setSelectedExpenseIds([]);
    
    // Atualiza as datas padrão dos formulários ao mudar de mês
    const defaultDate = getDefaultDateForMonth(currentMonthId);
    setNewExpense(p => ({ ...p, dueDate: defaultDate }));
    setNewExtraIncome(p => ({ ...p, date: defaultDate }));
    setNewPiggyBank(p => ({ ...p, date: defaultDate }));
  }, [currentMonthId, currentMonthData.salary]);

  // Totals
  const totals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const salary = Number(currentMonthData.salary || 0);
    
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    // Extra Income Logic
    const extraIncomes = currentMonthData.extraIncomes || [];
    const totalExtraAll = extraIncomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalExtraAvailable = extraIncomes
      .filter(i => !i.date || i.date <= today)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const totalIncomeTotal = salary + totalExtraAll;
    const totalIncomeAvailable = salary + totalExtraAvailable;
    
    const expenses = currentMonthData.expenses || [];
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const monthlyPiggy = (currentMonthData.piggyBank || [])
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const scheduledPiggy = (currentMonthData.piggyBank || [])
      .filter(entry => {
        if (!entry.date) return false;
        const entryDate = new Date(entry.date + 'T12:00:00');
        return entryDate > todayObj;
      })
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const monthlyInvestments = (currentMonthData.investments || [])
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const paidExpenses = expenses.filter(e => e.paid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const pendingExpenses = expenses.filter(e => !e.paid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    // Explicitly subtract expenses, piggy bank and investments from total income (Base + Extra)
    const remaining = Number(totalIncomeTotal) - Number(totalExpenses) - Number(monthlyPiggy) - Number(monthlyInvestments);
    
    const fixedTotal = expenses
      .filter(e => e.category === 'Fixas')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const fixedPending = expenses
      .filter(e => e.category === 'Fixas' && !e.paid)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const variableTotal = expenses
      .filter(e => e.category === 'Variáveis')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const variablePending = expenses
      .filter(e => e.category === 'Variáveis' && !e.paid)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    const totalOutflow = Number(totalExpenses) + Number(monthlyPiggy) + Number(monthlyInvestments);
    
    return { 
      income: totalIncomeTotal,
      extra: totalExtraAll,
      extraAvailable: totalExtraAvailable,
      total: totalExpenses, 
      outflow: totalOutflow,
      paid: paidExpenses,
      pending: pendingExpenses,
      remaining, 
      fixed: fixedTotal, 
      fixedPending,
      variable: variableTotal,
      variablePending,
      piggy: monthlyPiggy,
      scheduledPiggy,
      investments: monthlyInvestments
    };
  }, [currentMonthData]);

  const categoryBreakdown = useMemo(() => {
    const expenses = currentMonthData.expenses || [];
    const map: Record<string, { total: number; paid: number; pending: number; count: number; overdueCount: number }> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    expenses.forEach(e => {
      const cat = e.category || 'Outros';
      if (!map[cat]) {
        map[cat] = { total: 0, paid: 0, pending: 0, count: 0, overdueCount: 0 };
      }
      const amt = Number(e.amount || 0);
      map[cat].total += amt;
      map[cat].count += 1;
      if (e.paid) {
        map[cat].paid += amt;
      } else {
        map[cat].pending += amt;
        if (e.dueDate && e.dueDate < todayStr) {
          map[cat].overdueCount += 1;
        }
      }
    });

    return map;
  }, [currentMonthData.expenses]);

  const categoriesWithExpenses = useMemo(() => {
    const expenses = currentMonthData.expenses || [];
    const usedCats = Array.from(new Set<string>(expenses.map(e => e.category || 'Outros').filter(Boolean) as string[]));
    // ONLY include categories that have registered expenses > 0
    return usedCats.filter(cat => {
      const catSum = expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
      return catSum > 0;
    });
  }, [currentMonthData.expenses]);

  const categoryPieData = useMemo(() => {
    const expenses = currentMonthData.expenses || [];
    const map: Record<string, { total: number; count: number; paid: number; pending: number }> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Outros';
      const amt = Number(e.amount || 0);
      if (!map[cat]) map[cat] = { total: 0, count: 0, paid: 0, pending: 0 };
      map[cat].total += amt;
      map[cat].count += 1;
      if (e.paid) map[cat].paid += amt;
      else map[cat].pending += amt;
    });

    return Object.entries(map)
      .filter(([_, data]) => data.total > 0)
      .map(([name, data]) => {
        const style = getExpenseCategoryBadgeStyle(name);
        return {
          name,
          value: data.total,
          count: data.count,
          paid: data.paid,
          pending: data.pending,
          color: style.bar
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [currentMonthData.expenses]);

  const activeCategoriesWithExpenses = useMemo(() => {
    return categoryPieData.map(c => c.name);
  }, [categoryPieData]);

  const filteredExpenses = useMemo(() => {
    let list = currentMonthData.expenses || [];

    // Filter by category
    if (selectedCategoryFilter !== 'all') {
      list = list.filter(e => e.category === selectedCategoryFilter);
    }

    // Filter by status
    if (expenseStatusFilter === 'pending') {
      list = list.filter(e => !e.paid);
    } else if (expenseStatusFilter === 'paid') {
      list = list.filter(e => e.paid);
    }

    // Filter by search query
    if (expenseSearchQuery.trim()) {
      const q = expenseSearchQuery.toLowerCase().trim();
      list = list.filter(e => 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.paymentMethod && String(e.paymentMethod).toLowerCase().includes(q))
      );
    }

    // Default sort by due date
    return [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [currentMonthData.expenses, selectedCategoryFilter, expenseStatusFilter, expenseSearchQuery]);

  const grandTotalPiggy = useMemo(() => {
    return (Object.values(state.months) as MonthData[]).reduce((acc, month) => {
      const monthTotal = (month.piggyBank || []).reduce((mAcc, entry) => mAcc + Number(entry.amount || 0), 0);
      return acc + monthTotal;
    }, 0);
  }, [state.months]);

  const addExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!newExpense.description.trim()) return showNotification('A descrição é obrigatória');
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return showNotification('O valor deve ser maior que zero');
    if (newExpense.category === 'Fixas' && !newExpense.dueDate) return showNotification('A data de vencimento é obrigatória para despesas fixas');

    const amount = parseFloat(newExpense.amount);
    const repeats = Math.max(1, Math.min(60, Number(newExpense.repeats || 1)));
    
    const startMonthId = newExpense.dueDate ? newExpense.dueDate.substring(0, 7) : currentMonthId;
    const [startYear, startMonth] = startMonthId.split('-').map(Number);

    const newState = {
      ...state,
      months: { ...state.months }
    };
    const affectedMonthIds: string[] = [];

    for (let i = 0; i < repeats; i++) {
      const date = new Date(startYear, startMonth - 1 + i, 1);
      const targetMonthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      affectedMonthIds.push(targetMonthId);
      
      const installmentDueDate = newExpense.dueDate 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${newExpense.dueDate.substring(8, 10)}`
        : undefined;

      const expense: Expense = {
        id: crypto.randomUUID(),
        description: newExpense.description.trim(),
        amount,
        category: newExpense.category,
        paid: i === 0 ? newExpense.paid : false,
        dueDate: installmentDueDate,
        installmentNumber: repeats > 1 ? i + 1 : undefined,
        totalInstallments: repeats > 1 ? repeats : undefined,
        paymentMethod: newExpense.paymentMethod || 'credit_card',
        receiptUrl: i === 0 ? newExpense.receiptUrl : undefined
      };

      const existingMonth = newState.months[targetMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
      newState.months[targetMonthId] = {
        ...existingMonth,
        expenses: [expense, ...existingMonth.expenses]
      };
    }

    setState(newState);

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          const jobs = affectedMonthIds.map(mid => 
            dbService.saveMonthData(uId, mid, newState.months[mid])
          );
          await Promise.all(jobs);
        } else if (authProvider === 'firebase') {
          const jobs = affectedMonthIds.map(mid => 
            setDoc(doc(db, 'users', uId, 'months', mid), sanitize(newState.months[mid]))
          );
          await Promise.all(jobs);
        } else {
          const jobs = affectedMonthIds.map(mid => 
            dbService.saveMonthData(uId, mid, newState.months[mid])
          );
          await Promise.all(jobs);
        }
      } catch (error: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(error, OperationType.WRITE, `users/${uId}/months/multiple`, user);
        } else {
          console.error(error);
          showNotification('Erro ao sincronizar com servidor');
        }
      } finally {
        setIsSyncing(false);
      }
    }

    setNewExpense({ 
      description: '', 
      amount: '', 
      category: 'Fixas', 
      dueDate: getDefaultDateForMonth(currentMonthId), 
      repeats: 1,
      paymentMethod: 'credit_card',
      paid: false,
      receiptUrl: undefined 
    });
    setIsNewExpenseModalOpen(false);
    showNotification('Despesa adicionada com sucesso!', 'success');
  };

  const handleSaveScannedExpense = async (data: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    paid: boolean;
    dueDate?: string;
    paymentMethod: PaymentMethod;
    repeats: number;
    targetMonthId?: string;
    receiptUrl?: string;
  }) => {
    const repeats = Math.max(1, Math.min(60, Number(data.repeats || 1)));
    const startMonthId = data.targetMonthId || (data.dueDate ? data.dueDate.substring(0, 7) : currentMonthId);
    const [startYear, startMonth] = startMonthId.split('-').map(Number);

    const newState = {
      ...state,
      months: { ...state.months }
    };
    const affectedMonthIds: string[] = [];

    // If new custom category, ensure it's in list
    if (data.category && !allExpenseCategories.includes(data.category)) {
      handleAddCustomCategory(data.category);
    }

    for (let i = 0; i < repeats; i++) {
      const date = new Date(startYear, startMonth - 1 + i, 1);
      const targetMonthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      affectedMonthIds.push(targetMonthId);

      const installmentDueDate = data.dueDate
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${data.dueDate.substring(8, 10)}`
        : undefined;

      const expense: Expense = {
        id: crypto.randomUUID(),
        description: data.description.trim(),
        amount: data.amount,
        category: data.category,
        paid: i === 0 ? data.paid : false,
        dueDate: installmentDueDate,
        installmentNumber: repeats > 1 ? i + 1 : undefined,
        totalInstallments: repeats > 1 ? repeats : undefined,
        paymentMethod: data.paymentMethod,
        receiptUrl: i === 0 ? data.receiptUrl : undefined
      };

      const existingMonth = newState.months[targetMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
      newState.months[targetMonthId] = {
        ...existingMonth,
        expenses: [expense, ...existingMonth.expenses]
      };
    }

    setState(newState);

    if (startMonthId !== currentMonthId) {
      setCurrentMonthId(startMonthId);
    }

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          const jobs = affectedMonthIds.map(mid =>
            dbService.saveMonthData(uId, mid, newState.months[mid])
          );
          await Promise.all(jobs);
        } else if (authProvider === 'firebase') {
          const jobs = affectedMonthIds.map(mid =>
            setDoc(doc(db, 'users', uId, 'months', mid), sanitize(newState.months[mid]))
          );
          await Promise.all(jobs);
        } else {
          const jobs = affectedMonthIds.map(mid =>
            dbService.saveMonthData(uId, mid, newState.months[mid])
          );
          await Promise.all(jobs);
        }
      } catch (error: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(error, OperationType.WRITE, `users/${uId}/months/multiple`, user);
        } else {
          console.error(error);
          showNotification('Erro ao sincronizar com servidor');
        }
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(`Despesa "${data.description}" (${formatCurrency(data.amount)}) cadastrada a partir do recibo!`, 'success');
  };

  const handleQuickReceiptUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Selecione um arquivo de imagem válido (JPG, PNG, WebP)');
      return;
    }

    setIsReadingReceiptInForm(true);
    showNotification('Lendo recibo com Inteligência Artificial...', 'success');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      try {
        let dataResult: any = null;

        // 1. Try server endpoint
        try {
          const res = await fetch('/api/analyze-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg'
            })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              dataResult = json.data;
            }
          }
        } catch (serverErr) {
          console.warn('Backend receipt scanning endpoint failed or unreachable, trying direct client fallback:', serverErr);
        }

        // 2. Client fallback
        if (!dataResult) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            const aiClient = new GoogleGenAI({ apiKey });
            let cleanBase64 = base64Data;
            let detectedMime = file.type || 'image/jpeg';
            if (cleanBase64.includes(';base64,')) {
              const parts = cleanBase64.split(';base64,');
              detectedMime = parts[0].replace('data:', '') || detectedMime;
              cleanBase64 = parts[1];
            }

            const prompt = `Você é um leitor de recibos, cupons fiscais e comprovantes de pagamento do Brasil.
            Analise a imagem deste recibo com máxima atenção.
            Identifique:
            1. amount: O valor total pago na compra (número decimal, ex: 85.90).
            2. description: Nome do estabelecimento ou compra (ex: Supermercado Guanabara, Posto Shell).
            3. date: A data da transação ou compra no formato YYYY-MM-DD (ex: 2026-09-28).
            4. paymentMethod: A forma de pagamento ('credit_card', 'pix', 'cash', 'debit', 'boleto', 'transfer', 'miles', 'other').
            5. paymentStatus: 'paid' ou 'pending'.
            6. category: Categoria adequada (ex: Alimentação, Mercado, Transporte, Variáveis, Fixas).
            7. installments: Quantidade de parcelas se houver.
            Retorne em formato JSON.`;

            const resp = await aiClient.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: [
                { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
                { text: prompt }
              ],
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING },
                    paymentMethod: { type: Type.STRING, enum: ['credit_card', 'pix', 'cash', 'debit', 'boleto', 'transfer', 'miles', 'other'] },
                    paymentStatus: { type: Type.STRING, enum: ['paid', 'pending'] },
                    category: { type: Type.STRING },
                    installments: { type: Type.INTEGER }
                  },
                  required: ['amount', 'description']
                }
              }
            });

            if (resp.text) {
              dataResult = JSON.parse(resp.text);
            }
          }
        }

        if (dataResult) {
          const readAmount = dataResult.amount ? String(Number(dataResult.amount).toFixed(2)) : '';
          const readDesc = dataResult.description || 'Compra no Estabelecimento';
          const readMethod = (dataResult.paymentMethod || 'credit_card') as PaymentMethod;
          const readPaid = dataResult.paymentStatus !== 'pending';
          const readDate = dataResult.date || getDefaultDateForMonth(currentMonthId);
          const readRepeats = dataResult.installments && dataResult.installments > 1 ? dataResult.installments : 1;
          const readCat = dataResult.category || 'Variáveis';

          if (readCat && !allExpenseCategories.includes(readCat)) {
            handleAddCustomCategory(readCat);
          }

          setNewExpense(prev => ({
            ...prev,
            description: readDesc,
            amount: readAmount,
            category: readCat,
            paymentMethod: readMethod,
            paid: readPaid,
            dueDate: readDate,
            repeats: readRepeats,
            receiptUrl: base64Data
          }));

          showNotification(`Recibo lido com sucesso! R$ ${readAmount} em ${readDesc}`, 'success');
        } else {
          showNotification('Não foi possível extrair dados automaticamente do recibo. Preencha manualmente.');
        }
      } catch (err: any) {
        console.error('Erro ao ler recibo:', err);
        showNotification('Erro ao processar imagem do recibo. Tente novamente.');
      } finally {
        setIsReadingReceiptInForm(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    
    try {
      const prompt = `Analise o seguinte texto e extraia uma lista de despesas financeiras. 
      O texto pode conter descrições, valores e datas. 
      Retorne APENAS um array JSON. 
      Estrutura de cada item:
      {
        "description": string (nome do gasto),
        "amount": number (valor numérico),
        "category": 'Fixas' | 'Variáveis',
        "dueDate": string (formato YYYY-MM-DD, use o ano e mês atuais: ${currentMonthId})
      }
      
      Texto para analisar:
      "${importText}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING, enum: ['Fixas', 'Variáveis'] },
                dueDate: { type: Type.STRING, description: "YYYY-MM-DD or empty if not specified" }
              },
              required: ['description', 'amount', 'category']
            }
          }
        }
      });

      const text = response.text;
      const parsedExpenses = JSON.parse(text || '[]') as Expense[];
      const expensesWithIds = parsedExpenses.map(e => ({
        ...e,
        id: crypto.randomUUID(),
        paid: false
      }));

      updateMonthData({ 
        ...currentMonthData, 
        expenses: [...expensesWithIds, ...currentMonthData.expenses] 
      });
      
      setIsImportModalOpen(false);
      setImportText('');
    } catch (error) {
      console.error("Erro na importação inteligente:", error);
      alert("Houve um erro ao processar seu texto. Tente formatar os valores de forma mais clara.");
    } finally {
      setIsImporting(false);
    }
  };

  const addExtraIncome = async (e: FormEvent) => {
    e.preventDefault();
    if (!newExtraIncome.description.trim()) return showNotification('Informe a fonte do ganho');
    if (!newExtraIncome.amount || parseFloat(newExtraIncome.amount) <= 0) return showNotification('Informe um valor válido');
    if (!newExtraIncome.date) return showNotification('Informe a data do recebimento');

    const amount = parseFloat(newExtraIncome.amount);
    const targetMonthId = newExtraIncome.date.substring(0, 7);

    const income: ExtraIncome = {
      id: crypto.randomUUID(),
      description: newExtraIncome.description.trim(),
      amount,
      date: newExtraIncome.date
    };

    let updatedTargetMonthData: MonthData;

    setState(prev => {
      const baseSalary = prev.months[targetMonthId]?.salary ?? prev.months[currentMonthId]?.salary ?? 0;
      const targetMonth = prev.months[targetMonthId] || {
        salary: baseSalary,
        extraIncomes: [],
        expenses: [],
        piggyBank: []
      };

      updatedTargetMonthData = {
        ...targetMonth,
        extraIncomes: [income, ...(targetMonth.extraIncomes || [])]
      };

      return {
        ...prev,
        months: {
          ...prev.months,
          [targetMonthId]: updatedTargetMonthData
        }
      };
    });

    // Automatically navigate to the registered month so it appears immediately!
    if (currentMonthId !== targetMonthId) {
      setCurrentMonthId(targetMonthId);
    }

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        const baseSalary = state.months[targetMonthId]?.salary ?? state.months[currentMonthId]?.salary ?? 0;
        const targetMonth = state.months[targetMonthId] || {
          salary: baseSalary,
          extraIncomes: [],
          expenses: [],
          piggyBank: []
        };
        const finalData: MonthData = {
          ...targetMonth,
          extraIncomes: [income, ...(targetMonth.extraIncomes || [])]
        };

        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, targetMonthId, finalData);
        } else if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId, 'months', targetMonthId), sanitize(finalData));
        } else {
          await dbService.saveMonthData(uId, targetMonthId, finalData);
        }
      } catch (err: any) {
        console.error("Error saving extra income:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    setNewExtraIncome({ description: '', amount: '', date: getDefaultDateForMonth(targetMonthId) });
    setIsExtraIncomeModalOpen(false);
    showNotification(`Ganho extra registrado em ${getMonthLabel(targetMonthId)}!`, 'success');
  };

  const addPiggyBank = (e: FormEvent) => {
    e.preventDefault();
    if (!newPiggyBank.description.trim()) return showNotification('Defina um objetivo para o cofrinho');
    const amount = parseFloat(newPiggyBank.amount);
    if (isNaN(amount) || amount <= 0) return showNotification('Informe o valor que deseja guardar');

    const entry: PiggyBankEntry = {
      id: crypto.randomUUID(),
      description: newPiggyBank.description.trim(),
      amount,
      date: newPiggyBank.date || new Date().toISOString()
    };

    updateMonthData(prev => ({ 
      ...prev, 
      piggyBank: [entry, ...(prev.piggyBank || [])] 
    }));
    
    setNewPiggyBank({ description: '', amount: '', date: getDefaultDateForMonth(currentMonthId) });
    setIsPiggyBankModalOpen(false);
    showNotification('Dinheiro guardado no cofrinho!', 'success');
  };

  const updateMonthData = async (newData: MonthData | ((prev: MonthData) => MonthData)) => {
    let resolvedData: MonthData;
    
    // Preliminary resolution for the side effect
    setState(prev => {
      const currentMonth = prev.months[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
      resolvedData = typeof newData === 'function' ? newData(currentMonth) : newData;
      
      const updatedMonths = {
        ...prev.months,
        [currentMonthId]: resolvedData
      };

      return {
        ...prev,
        months: updatedMonths
      };
    });

    // We can't guarantee resolvedData is set by the setState callback immediately in some cases,
    // so we calculate it here once for the remote sync.
    const currentMonth = state.months[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
    const finalData = typeof newData === 'function' ? newData(currentMonth) : newData;

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, currentMonthId, finalData);
        } else if (authProvider === 'firebase') {
          const path = `users/${uId}/months/${currentMonthId}`;
          await setDoc(doc(db, path), sanitize(finalData));
        } else {
          await dbService.saveMonthData(uId, currentMonthId, finalData);
        }
      } catch (err: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(err, OperationType.WRITE, `users/${uId}/months/${currentMonthId}`, user);
        } else {
          console.error("Database Sync Error:", err);
          showNotification("Erro ao sincronizar com nuvem", "error");
        }
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const togglePaid = (id: string) => {
    updateMonthData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e)
    }));
  };

  const handleAddInvestment = (entry: Omit<InvestmentEntry, 'id'>) => {
    const newEntry: InvestmentEntry = {
      ...entry,
      id: crypto.randomUUID()
    };
    updateMonthData(prev => ({
      ...prev,
      investments: [newEntry, ...(prev.investments || [])]
    }));
    showNotification('Aporte de investimento registrado com sucesso!', 'success');
  };

  const handleUpdateInvestment = (entry: InvestmentEntry) => {
    updateMonthData(prev => ({
      ...prev,
      investments: (prev.investments || []).map(i => i.id === entry.id ? entry : i)
    }));
    showNotification('Investimento atualizado!', 'success');
  };

  const handleDeleteInvestment = (id: string) => {
    updateMonthData(prev => ({
      ...prev,
      investments: (prev.investments || []).filter(i => i.id !== id)
    }));
    showNotification('Investimento removido!', 'success');
  };

  const handleDuplicateInvestment = async (entry: InvestmentEntry) => {
    const [year, month] = currentMonthId.split('-').map(Number);
    const nextDate = new Date(year, month);
    const nextMonthId = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    const targetMonth = state.months[nextMonthId] || {
      salary: state.months[currentMonthId]?.salary || 0,
      extraIncomes: [],
      expenses: [],
      piggyBank: [],
      investments: []
    };

    const duplicatedEntry: InvestmentEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: entry.date ? `${nextMonthId}-${entry.date.split('-')[2] || '01'}` : undefined
    };

    const updatedTarget: MonthData = {
      ...targetMonth,
      investments: [duplicatedEntry, ...(targetMonth.investments || [])]
    };

    setState(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [nextMonthId]: updatedTarget
      }
    }));

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, nextMonthId, updatedTarget);
        } else if (authProvider === 'firebase') {
          await setDoc(doc(db, `users/${uId}/months/${nextMonthId}`), sanitize(updatedTarget));
        } else {
          await dbService.saveMonthData(uId, nextMonthId, updatedTarget);
        }
      } catch (err) {
        console.error("Duplicate investment sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(`Aporte duplicado para ${getMonthLabel(nextMonthId)}!`, 'success');
  };

  const handleSaveTrip = async (updatedTrip: TripProject) => {
    setState(prev => {
      const existing = prev.trips || [];
      const index = existing.findIndex(t => t.id === updatedTrip.id);
      const newTrips = index >= 0
        ? existing.map(t => t.id === updatedTrip.id ? updatedTrip : t)
        : [updatedTrip, ...existing];
      return { ...prev, trips: newTrips };
    });

    if (user && authProvider === 'firebase') {
      const uId = user.uid || (user as any).id;
      try {
        await setDoc(doc(db, 'users', uId, 'trips', updatedTrip.id), sanitize(updatedTrip));
      } catch (err) {
        console.warn('Error saving trip to firestore:', err);
      }
    }
    showNotification('Projeto de viagem salvo com sucesso!', 'success');
  };

  const handleDeleteTrip = async (tripId: string) => {
    setState(prev => ({
      ...prev,
      trips: (prev.trips || []).filter(t => t.id !== tripId)
    }));

    if (user && authProvider === 'firebase') {
      const uId = user.uid || (user as any).id;
      try {
        await deleteDoc(doc(db, 'users', uId, 'trips', tripId));
      } catch (err) {
        console.warn('Error deleting trip from firestore:', err);
      }
    }
    showNotification('Viagem excluída com sucesso.', 'success');
  };

  const handleDuplicateTrip = async (trip: TripProject) => {
    const duplicated: TripProject = {
      ...trip,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${trip.title} (Cópia)`,
      status: 'planning',
      expenses: (trip.expenses || []).map(e => ({
        ...e,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        paymentStatus: 'pending',
        syncedToMonthId: undefined,
        syncedToMonthlyExpenseId: undefined
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await handleSaveTrip(duplicated);
  };

  const handleSyncTripExpenseToMonth = async (targetMonthId: string, expenseData: Omit<Expense, 'id'>, tripExpenseId: string) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `trip-exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    };

    const targetMonth = state.months[targetMonthId] || {
      salary: 0,
      extraIncomes: [],
      expenses: [],
      piggyBank: []
    };

    const updatedMonthData: MonthData = {
      ...targetMonth,
      expenses: [newExpense, ...(targetMonth.expenses || [])]
    };

    setState(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [targetMonthId]: updatedMonthData
      }
    }));

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, targetMonthId, updatedMonthData);
        } else if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId, 'months', targetMonthId), sanitize(updatedMonthData));
        } else {
          await dbService.saveMonthData(uId, targetMonthId, updatedMonthData);
        }
      } catch (err) {
        console.error("Error syncing trip expense to monthly:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(`Despesa lançada no mês ${getMonthLabel(targetMonthId)}!`, 'success');
  };

  const handleConfirmSplit = (
    originalExpense: Expense,
    parts: SplitItem[],
    replaceOriginal: boolean
  ) => {
    updateMonthData(prev => {
      let newExpenses = [...(prev.expenses || [])];
      let newPiggy = [...(prev.piggyBank || [])];
      let newInvestments = [...(prev.investments || [])];

      if (replaceOriginal) {
        newExpenses = newExpenses.filter(e => e.id !== originalExpense.id);
      }

      parts.forEach((part) => {
        const uniqueId = crypto.randomUUID();
        if (part.target === 'investment') {
          newInvestments.unshift({
            id: uniqueId,
            description: part.description || `Aporte (${originalExpense.description})`,
            amount: Number(part.amount) || 0,
            type: part.investmentType || 'Renda Fixa',
            institution: part.institution || '',
            objective: part.objective || 'Aporte por Divisão de Conta',
            destination: part.destination || part.institution || '',
            date: part.dueDate || new Date().toISOString().split('T')[0],
            splitFromId: originalExpense.id,
            splitFromDescription: originalExpense.description,
            notes: `Proveniente da divisão da conta: ${originalExpense.description}`
          });
        } else if (part.target === 'piggy') {
          newPiggy.unshift({
            id: uniqueId,
            description: part.description || `Poupança (${originalExpense.description})`,
            amount: Number(part.amount) || 0,
            date: part.dueDate || new Date().toISOString().split('T')[0]
          });
        } else {
          newExpenses.unshift({
            id: uniqueId,
            description: part.description,
            amount: Number(part.amount) || 0,
            category: part.category || originalExpense.category || 'Variáveis',
            paid: false,
            dueDate: part.dueDate || originalExpense.dueDate,
            splitFromId: originalExpense.id,
            splitFromDescription: originalExpense.description
          });
        }
      });

      return {
        ...prev,
        expenses: newExpenses,
        piggyBank: newPiggy,
        investments: newInvestments
      };
    });

    const hasInvestments = parts.some(p => p.target === 'investment');
    const investSum = parts.filter(p => p.target === 'investment').reduce((a, b) => a + Number(b.amount || 0), 0);

    if (hasInvestments) {
      showNotification(`Conta dividida! ${formatCurrency(investSum)} enviados para Investimentos.`, 'success');
      // Suggest switching to investments tab or stays
    } else {
      showNotification('Conta dividida com sucesso!', 'success');
    }
  };

  const getMatchingExpensesInfo = (expense: Expense, months: { [monthId: string]: MonthData }) => {
    const normDesc = expense.description.toLowerCase().trim();
    const cleanDesc = normDesc.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();

    const matches: { monthId: string; expense: Expense }[] = [];

    Object.entries(months).forEach(([mId, mData]) => {
      (mData.expenses || []).forEach(e => {
        const eNormDesc = e.description.toLowerCase().trim();
        const eCleanDesc = eNormDesc.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();

        const sameId = e.id === expense.id;
        const sameDesc = (cleanDesc === eCleanDesc || normDesc === eNormDesc) && e.category === expense.category;
        const sameInstallmentGroup = expense.totalInstallments && e.totalInstallments && 
                                     expense.totalInstallments === e.totalInstallments && 
                                     cleanDesc === eCleanDesc;

        if (sameId || sameDesc || sameInstallmentGroup) {
          if (!matches.some(m => m.monthId === mId && m.expense.id === e.id)) {
            matches.push({ monthId: mId, expense: e });
          }
        }
      });
    });

    matches.sort((a, b) => a.monthId.localeCompare(b.monthId));
    return matches;
  };

  const matchingMonthsForEdit = useMemo(() => {
    if (!editingExpense) return [];
    return getMatchingExpensesInfo(editingExpense, state.months);
  }, [editingExpense, state.months]);

  const selectedExpenses = useMemo(() => {
    return currentMonthData.expenses.filter(e => selectedExpenseIds.includes(e.id));
  }, [currentMonthData.expenses, selectedExpenseIds]);

  const selectedExpensesTotal = useMemo(() => {
    return selectedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [selectedExpenses]);

  const selectedExpensesHasRecurring = useMemo(() => {
    return selectedExpenses.some(exp => getMatchingExpensesInfo(exp, state.months).length > 1);
  }, [selectedExpenses, state.months]);

  const initiateRemoveExpense = (expense: Expense) => {
    const matches = getMatchingExpensesInfo(expense, state.months);
    if (matches.length <= 1) {
      performDeleteExpense([currentMonthId], expense.id, expense);
    } else {
      setDeletingExpenseInfo({
        expense,
        matchingMonths: matches,
        deleteScope: 'all_months',
        selectedMonthIds: matches.map(m => m.monthId)
      });
    }
  };

  const performDeleteExpense = async (targetMonthIds: string[], baseExpenseId: string, baseExpense: Expense) => {
    if (targetMonthIds.length === 0) return;

    const newState = {
      ...state,
      months: { ...state.months }
    };

    const normDesc = baseExpense.description.toLowerCase().trim();
    const cleanDesc = normDesc.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();

    targetMonthIds.forEach(mId => {
      const month = newState.months[mId];
      if (month) {
        newState.months[mId] = {
          ...month,
          expenses: (month.expenses || []).filter(e => {
            if (e.id === baseExpenseId) return false;
            const eNorm = e.description.toLowerCase().trim();
            const eClean = eNorm.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();
            const matchDesc = (eClean === cleanDesc || eNorm === normDesc) && e.category === baseExpense.category;
            const matchInst = baseExpense.totalInstallments && e.totalInstallments && 
                              baseExpense.totalInstallments === e.totalInstallments && eClean === cleanDesc;
            return !(matchDesc || matchInst);
          })
        };
      }
    });

    setState(newState);
    setDeletingExpenseInfo(null);

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        const jobs = targetMonthIds.map(mId => {
          if (dbStatus?.activeDb === 'mongodb') {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          } else if (authProvider === 'firebase') {
            return setDoc(doc(db, 'users', uId, 'months', mId), sanitize(newState.months[mId]));
          } else {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          }
        });
        await Promise.all(jobs);
      } catch (err: any) {
        console.error("Error syncing expense removal:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(`Despesa excluída de ${targetMonthIds.length} ${targetMonthIds.length === 1 ? 'mês' : 'meses'}!`, 'success');
  };

  const removeExpense = (id: string) => {
    const expense = currentMonthData.expenses.find(e => e.id === id);
    if (expense) {
      initiateRemoveExpense(expense);
    } else {
      updateMonthData(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
    }
  };

  const removeExtraIncome = (id: string) => {
    updateMonthData(prev => ({
      ...prev,
      extraIncomes: prev.extraIncomes.filter(i => i.id !== id)
    }));
  };

  const removePiggyBank = (id: string) => {
    updateMonthData(prev => ({
      ...prev,
      piggyBank: (prev.piggyBank || []).filter(i => i.id !== id)
    }));
  };

  const handleUpdateExtraIncome = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingExtraIncome) return;
    
    const targetMonthId = editingExtraIncome.date 
      ? editingExtraIncome.date.substring(0, 7) 
      : currentMonthId;

    const sourceMonthId = currentMonthId;
    let updatedMonths = { ...state.months };
    const affectedMonthIds: string[] = [];

    if (targetMonthId !== sourceMonthId) {
      affectedMonthIds.push(sourceMonthId, targetMonthId);
      const sourceMonth = updatedMonths[sourceMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
      updatedMonths[sourceMonthId] = {
        ...sourceMonth,
        extraIncomes: (sourceMonth.extraIncomes || []).filter(i => i.id !== editingExtraIncome.id)
      };

      const targetMonth = updatedMonths[targetMonthId] || { 
        salary: sourceMonth.salary, 
        extraIncomes: [], 
        expenses: [], 
        piggyBank: [] 
      };
      updatedMonths[targetMonthId] = {
        ...targetMonth,
        extraIncomes: [editingExtraIncome, ...(targetMonth.extraIncomes || []).filter(i => i.id !== editingExtraIncome.id)]
      };
      
      setCurrentMonthId(targetMonthId);
    } else {
      affectedMonthIds.push(currentMonthId);
      const curMonth = updatedMonths[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
      updatedMonths[currentMonthId] = {
        ...curMonth,
        extraIncomes: (curMonth.extraIncomes || []).map(i => i.id === editingExtraIncome.id ? editingExtraIncome : i)
      };
    }

    setState(prev => ({ ...prev, months: updatedMonths }));

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        const jobs = affectedMonthIds.map(mId => {
          if (dbStatus?.activeDb === 'mongodb') {
            return dbService.saveMonthData(uId, mId, updatedMonths[mId]);
          } else if (authProvider === 'firebase') {
            return setDoc(doc(db, 'users', uId, 'months', mId), sanitize(updatedMonths[mId]));
          } else {
            return dbService.saveMonthData(uId, mId, updatedMonths[mId]);
          }
        });
        await Promise.all(jobs);
      } catch (err) {
        console.error("Error syncing extra income update:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    setEditingExtraIncome(null);
    showNotification('Ganho extra atualizado!', 'success');
  };

  const handleUpdatePiggyBank = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPiggyBank) return;
    
    updateMonthData(prev => ({
      ...prev,
      piggyBank: (prev.piggyBank || []).map(i => i.id === editingPiggyBank.id ? editingPiggyBank : i)
    }));
    setEditingPiggyBank(null);
    showNotification('Cofrinho atualizado!', 'success');
  };

  const handleUpdateExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const originalMatches = getMatchingExpensesInfo(editingExpense, state.months);

    let targetMonthsToUpdate: { monthId: string; expense: Expense }[] = [];

    if (editScope === 'this_month' || originalMatches.length <= 1) {
      const targetMId = editingExpense.dueDate ? editingExpense.dueDate.substring(0, 7) : currentMonthId;
      targetMonthsToUpdate = [{ monthId: targetMId, expense: editingExpense }];
    } else if (editScope === 'this_and_future') {
      targetMonthsToUpdate = originalMatches.filter(m => m.monthId >= currentMonthId);
    } else {
      targetMonthsToUpdate = [...originalMatches];
    }

    const newState = {
      ...state,
      months: { ...state.months }
    };

    const affectedMonthIds = new Set<string>();

    if (editScope !== 'this_month' && targetMonthsToUpdate.length > 0) {
      targetMonthsToUpdate.forEach(({ monthId, expense: oldExpense }) => {
        affectedMonthIds.add(monthId);
        const mData = newState.months[monthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };

        let updatedDueDate = oldExpense.dueDate;
        if (editingExpense.dueDate) {
          const dayPart = editingExpense.dueDate.substring(8, 10);
          updatedDueDate = `${monthId}-${dayPart}`;
        }

        newState.months[monthId] = {
          ...mData,
          expenses: (mData.expenses || []).map(ex => {
            if (ex.id === oldExpense.id) {
              return {
                ...ex,
                description: editingExpense.description,
                amount: editingExpense.amount,
                category: editingExpense.category,
                dueDate: updatedDueDate,
                installmentNumber: editingExpense.installmentNumber ?? ex.installmentNumber,
                totalInstallments: editingExpense.totalInstallments ?? ex.totalInstallments,
                paymentMethod: editingExpense.paymentMethod ?? ex.paymentMethod,
                paid: editingExpense.paid ?? ex.paid,
                receiptUrl: editingExpense.receiptUrl ?? ex.receiptUrl,
              };
            }
            return ex;
          })
        };
      });

      // Handle installment expansion if totalInstallments increased
      if (editingExpense.totalInstallments && editingExpense.totalInstallments > 1) {
        const totalInst = editingExpense.totalInstallments;
        const startMonthId = targetMonthsToUpdate[0]?.monthId || currentMonthId;
        const [startYear, startMonthNum] = startMonthId.split('-').map(Number);

        for (let i = 0; i < totalInst; i++) {
          const d = new Date(startYear, startMonthNum - 1 + i, 1);
          const instMonthId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

          const alreadyInTarget = targetMonthsToUpdate.some(m => m.monthId === instMonthId);
          if (!alreadyInTarget) {
            affectedMonthIds.add(instMonthId);
            const instDueDate = editingExpense.dueDate
              ? `${instMonthId}-${editingExpense.dueDate.substring(8, 10)}`
              : undefined;

            const newInstExpense: Expense = {
              id: crypto.randomUUID(),
              description: editingExpense.description.trim(),
              amount: editingExpense.amount,
              category: editingExpense.category,
              paid: false,
              dueDate: instDueDate,
              installmentNumber: i + 1,
              totalInstallments: totalInst,
              paymentMethod: editingExpense.paymentMethod || 'credit_card',
              receiptUrl: editingExpense.receiptUrl
            };

            const existingMonth = newState.months[instMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
            newState.months[instMonthId] = {
              ...existingMonth,
              expenses: [newInstExpense, ...existingMonth.expenses]
            };
          }
        }
      }
    } else {
      const targetMonthId = editingExpense.dueDate 
        ? editingExpense.dueDate.substring(0, 7) 
        : currentMonthId;

      affectedMonthIds.add(currentMonthId);
      affectedMonthIds.add(targetMonthId);

      if (targetMonthId !== currentMonthId) {
        const currentMonth = newState.months[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
        newState.months[currentMonthId] = {
          ...currentMonth,
          expenses: currentMonth.expenses.filter(ex => ex.id !== editingExpense.id)
        };
        const targetMonth = newState.months[targetMonthId] || { salary: currentMonth.salary, extraIncomes: [], expenses: [], piggyBank: [] };
        newState.months[targetMonthId] = {
          ...targetMonth,
          expenses: [editingExpense, ...targetMonth.expenses]
        };
      } else {
        const currentMonth = newState.months[currentMonthId] || { salary: 0, extraIncomes: [], expenses: [], piggyBank: [] };
        newState.months[currentMonthId] = {
          ...currentMonth,
          expenses: currentMonth.expenses.map(ex => ex.id === editingExpense.id ? editingExpense : ex)
        };
      }
    }

    setState(newState);

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        const listToSync = Array.from(affectedMonthIds);
        const jobs = listToSync.map(mId => {
          if (dbStatus?.activeDb === 'mongodb') {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          } else if (authProvider === 'firebase') {
            return setDoc(doc(db, 'users', uId, 'months', mId), sanitize(newState.months[mId]));
          } else {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          }
        });
        await Promise.all(jobs);
      } catch (error: any) {
        console.error(error);
        showNotification('Erro ao sincronizar modificação', 'error');
      } finally {
        setIsSyncing(false);
      }
    }

    setIsEditModalOpen(false);
    setEditingExpense(null);
    showNotification('Despesa atualizada com sucesso!', 'success');
  };

  const processFileStatement = async (base64Data: string, mimeType: string) => {
    setIsProcessingFile(true);
    try {
      const prompt = `Analise este extrato bancário (pode ser print de tela de celular ou PDF) e extraia as informações financeiras.
      Quero o resultado em JSON seguindo este esquema:
      {
        "extractedSalary": number (saldo atual livre na conta, se disponível),
        "transactions": [
          { 
            "description": string, 
            "amount": number (positivo para ENTRADAS/CRÉDITO, negativo para SAÍDAS/DÉBITO/PAGAMENTO), 
            "date": "YYYY-MM-DD",
            "category": "Fixas" | "Variáveis" (tente classificar se for um gasto recorrente como conta de luz, aluguel, internet, use "Fixas", senão "Variáveis")
          }
        ]
      }
      
      Instruções Críticas:
      1. "extractedSalary": Identifique o saldo disponível real na conta após todas as movimentações.
      2. "transactions": Liste TODAS as movimentações financeiras visíveis (Pix enviado, Pix recebido, Pagamento de boleto, Compra no débito, etc).
      3. Verifique cuidadosamente se o valor é uma entrada ou saída. Pagamentos e transferências enviadas são negativos. Recebimentos são positivos.
      4. A data deve ser a data da transação visível ou hoje: ${new Date().toISOString().split('T')[0]}.
      5. Ignore propagandas, ofertas de crédito ou informações não relacionadas a transações reais.
      6. Se for um print de celular, ignore elementos da interface (barra de status, notificações, botões do app) e foque no conteúdo central do extrato.
      7. Retorne APENAS o JSON puro, sem formatação markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data.split(',')[1],
              },
            },
            { text: prompt },
          ]
        },
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      
      if (!text) throw new Error('Cérebro da IA não retornou nada');
      
      const parsed = JSON.parse(text);
      
      const items: any[] = [];
      
      if (parsed.transactions && parsed.transactions.length > 0) {
        parsed.transactions.forEach((t: any) => {
          const amount = Math.abs(t.amount);
          const type = t.amount < 0 ? 'expense' : 'income';
          
          // Inteligência de Match: procurar itens similares no mês atual
          let suggestedMatchId = '';
          if (type === 'expense') {
            const match = currentMonthData.expenses.find(e => 
              !e.paid && 
              (e.description.toLowerCase().includes(t.description.toLowerCase()) || 
               Math.abs(e.amount - amount) / e.amount < 0.2) // 20% de tolerância para arredondamentos
            );
            if (match) suggestedMatchId = match.id;
          } else {
            const match = currentMonthData.extraIncomes.find(i => 
              i.description.toLowerCase().includes(t.description.toLowerCase()) || 
              Math.abs(i.amount - amount) / i.amount < 0.1
            );
            if (match) suggestedMatchId = match.id;
          }

          items.push({
            id: crypto.randomUUID(),
            description: t.description,
            amount,
            type,
            category: type === 'expense' ? 'Variáveis' : undefined,
            date: t.date || new Date().toISOString().split('T')[0],
            suggestedMatchId
          });
        });
      }

      setPendingScannerReview({
        salary: parsed.extractedSalary,
        items
      });
      
    } catch (error) {
      console.error('Erro no Scanner:', error);
      showNotification('Falha ao interpretar o arquivo. Tente um arquivo ou imagem mais nítida.', 'error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const applyScannerReview = (selectedItems: string[], matches: Record<string, string>, updateSalary: boolean) => {
    if (!pendingScannerReview) return;

    updateMonthData(prev => {
      let newSalary = updateSalary && pendingScannerReview.salary !== undefined 
        ? pendingScannerReview.salary 
        : prev.salary;
      
      let newExpenses = [...prev.expenses];
      let newIncomes = [...prev.extraIncomes];
      let newPiggy = [...(prev.piggyBank || [])];

      pendingScannerReview.items.forEach(item => {
        if (!selectedItems.includes(item.id)) return;

        const matchId = matches[item.id];
        
        if (item.type === 'expense') {
          if (matchId) {
            // Atualiza gasto existente
            newExpenses = newExpenses.map(e => e.id === matchId ? { ...e, amount: item.amount, paid: true } : e);
          } else {
            // Novo gasto
            newExpenses.push({
              id: crypto.randomUUID(),
              description: item.description,
              amount: item.amount,
              category: item.category || 'Variáveis',
              paid: true,
              dueDate: item.date
            });
          }
        } else if (item.type === 'income') {
          if (matchId) {
            newIncomes = newIncomes.map(i => i.id === matchId ? { ...i, amount: item.amount } : i);
          } else {
            newIncomes.push({
              id: crypto.randomUUID(),
              description: item.description,
              amount: item.amount,
              date: item.date
            });
          }
        }
      });

      return {
        ...prev,
        salary: newSalary,
        expenses: newExpenses,
        extraIncomes: newIncomes,
        piggyBank: newPiggy
      };
    });

    setPendingScannerReview(null);
    setIsScannerOpen(false);
    showNotification('Dados atualizados com sucesso!', 'success');
  };

  const updateSalary = () => {
    const val = parseFloat(newSalary);
    if (isNaN(val) || val < 0) return showNotification('Informe um valor de salário válido');
    
    updateMonthData(prev => ({ ...prev, salary: val }));
    setIsSetupModalOpen(false);
    showNotification('Salário atualizado com sucesso!', 'success');
  };

  const duplicateToNextMonth = async (item: any, type: 'expense' | 'income' | 'piggy') => {
    const [year, month] = currentMonthId.split('-').map(Number);
    const nextMonthDate = new Date(year, month, 1);
    const nextMonthId = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const newItem = { ...item, id: crypto.randomUUID() };
    
    if (type === 'expense') {
      const expense = newItem as Expense;
      expense.paid = false;
      if (expense.dueDate) {
        const [y, m, d] = expense.dueDate.split('-');
        const itemDate = new Date(Number(y), Number(m) - 1, Number(d));
        const nextDueDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, itemDate.getDate());
        expense.dueDate = `${nextDueDate.getFullYear()}-${String(nextDueDate.getMonth() + 1).padStart(2, '0')}-${String(nextDueDate.getDate()).padStart(2, '0')}`;
      }
    } else if (type === 'income') {
      const income = newItem as ExtraIncome;
      if (income.date) {
        const [y, m, d] = income.date.split('-');
        const itemDate = new Date(Number(y), Number(m) - 1, Number(d));
        const nextDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, itemDate.getDate());
        income.date = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      }
    } else if (type === 'piggy') {
      const piggy = newItem as PiggyBankEntry;
      if (piggy.date) {
        const [y, m, d] = piggy.date.split('-');
        const itemDate = new Date(Number(y), Number(m) - 1, Number(d));
        const nextDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, itemDate.getDate());
        piggy.date = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      } else {
        piggy.date = new Date().toISOString().split('T')[0];
      }
    }

    let updatedMonthData: MonthData;
    setState(prev => {
      const targetMonthData = prev.months[nextMonthId] || { salary: prev.months[currentMonthId]?.salary || 0, extraIncomes: [], expenses: [], piggyBank: [] };
      updatedMonthData = { ...targetMonthData };
      
      if (type === 'expense') updatedMonthData.expenses = [newItem as Expense, ...updatedMonthData.expenses];
      if (type === 'income') updatedMonthData.extraIncomes = [newItem as ExtraIncome, ...updatedMonthData.extraIncomes];
      if (type === 'piggy') updatedMonthData.piggyBank = [newItem as PiggyBankEntry, ...(updatedMonthData.piggyBank || [])];

      return {
        ...prev,
        months: {
          ...prev.months,
          [nextMonthId]: updatedMonthData
        }
      };
    });

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, nextMonthId, updatedMonthData!);
        } else if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId, 'months', nextMonthId), sanitize(updatedMonthData!));
        } else {
          await dbService.saveMonthData(uId, nextMonthId, updatedMonthData!);
        }
      } catch (err: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(err, OperationType.WRITE, `users/${uId}/months/${nextMonthId}`, user);
        } else {
          console.error(err);
          showNotification('Erro ao sincronizar com servidor');
        }
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(`Duplicado para ${getMonthLabel(nextMonthId)}`, 'success');
  };

  const duplicateSelectedExpenses = async () => {
    if (selectedExpenseIds.length === 0) return;

    const [year, month] = currentMonthId.split('-').map(Number);
    const nextMonthDate = new Date(year, month, 1);
    const nextMonthId = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const expensesToDuplicate = currentMonthData.expenses.filter(e => selectedExpenseIds.includes(e.id));
    if (expensesToDuplicate.length === 0) return;

    const newExpenses = expensesToDuplicate.map(item => {
      const newItem = { ...item, id: crypto.randomUUID(), paid: false };
      if (newItem.dueDate) {
        const [y, m, d] = newItem.dueDate.split('-');
        const itemDate = new Date(Number(y), Number(m) - 1, Number(d));
        const nextDueDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, itemDate.getDate());
        newItem.dueDate = `${nextDueDate.getFullYear()}-${String(nextDueDate.getMonth() + 1).padStart(2, '0')}-${String(nextDueDate.getDate()).padStart(2, '0')}`;
      }
      return newItem;
    });

    let updatedMonthData: MonthData;
    setState(prev => {
      const targetMonthData = prev.months[nextMonthId] || { salary: prev.months[currentMonthId]?.salary || 0, extraIncomes: [], expenses: [], piggyBank: [] };
      updatedMonthData = {
        ...targetMonthData,
        expenses: [...newExpenses, ...(targetMonthData.expenses || [])]
      };

      return {
        ...prev,
        months: {
          ...prev.months,
          [nextMonthId]: updatedMonthData
        }
      };
    });

    if (user) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        if (dbStatus?.activeDb === 'mongodb') {
          await dbService.saveMonthData(uId, nextMonthId, updatedMonthData!);
        } else if (authProvider === 'firebase') {
          await setDoc(doc(db, 'users', uId, 'months', nextMonthId), sanitize(updatedMonthData!));
        } else {
          await dbService.saveMonthData(uId, nextMonthId, updatedMonthData!);
        }
      } catch (err: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(err, OperationType.WRITE, `users/${uId}/months/${nextMonthId}`, user);
        } else {
          console.error(err);
          showNotification('Erro ao sincronizar com servidor');
        }
      } finally {
        setIsSyncing(false);
      }
    }

    const duplicatedCount = newExpenses.length;
    setSelectedExpenseIds([]);
    showNotification(`${duplicatedCount} ${duplicatedCount === 1 ? 'despesa duplicada' : 'despesas duplicadas'} para ${getMonthLabel(nextMonthId)}`, 'success');
  };

  const performBulkDeleteExpenses = async (scope: 'this_month' | 'this_and_future' | 'all_months' = bulkDeleteScope) => {
    if (selectedExpenseIds.length === 0) return;

    const expensesToDelete = currentMonthData.expenses.filter(e => selectedExpenseIds.includes(e.id));
    if (expensesToDelete.length === 0) {
      setSelectedExpenseIds([]);
      setIsBulkDeleteModalOpen(false);
      return;
    }

    const count = expensesToDelete.length;
    let targetMonthIds: string[] = [];

    if (scope === 'this_month') {
      targetMonthIds = [currentMonthId];
    } else if (scope === 'this_and_future') {
      targetMonthIds = Object.keys(state.months).filter(mId => mId >= currentMonthId);
    } else {
      targetMonthIds = Object.keys(state.months);
    }

    const newState = {
      ...state,
      months: { ...state.months }
    };

    // Pre-calculate descriptions and IDs for matching
    const deletionTargets = expensesToDelete.map(exp => {
      const normDesc = exp.description.toLowerCase().trim();
      const cleanDesc = normDesc.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();
      return {
        id: exp.id,
        category: exp.category,
        normDesc,
        cleanDesc,
        totalInstallments: exp.totalInstallments
      };
    });

    const affectedMonthIds: string[] = [];

    targetMonthIds.forEach(mId => {
      const month = newState.months[mId];
      if (month && month.expenses && month.expenses.length > 0) {
        const initialLen = month.expenses.length;
        const filteredExpenses = month.expenses.filter(e => {
          // If scope is this_month, strictly filter by selected IDs
          if (scope === 'this_month') {
            return !selectedExpenseIds.includes(e.id);
          }

          // If multi-month scope:
          if (selectedExpenseIds.includes(e.id)) return false;

          const eNorm = e.description.toLowerCase().trim();
          const eClean = eNorm.replace(/\(\d+\/\d+\)$/, '').replace(/\b\d+\/\d+$/, '').trim();

          const matchesAny = deletionTargets.some(target => {
            const matchDesc = (eClean === target.cleanDesc || eNorm === target.normDesc) && e.category === target.category;
            const matchInst = target.totalInstallments && e.totalInstallments &&
                              target.totalInstallments === e.totalInstallments && eClean === target.cleanDesc;
            return matchDesc || matchInst;
          });

          return !matchesAny;
        });

        if (filteredExpenses.length !== initialLen || mId === currentMonthId) {
          newState.months[mId] = {
            ...month,
            expenses: filteredExpenses
          };
          if (!affectedMonthIds.includes(mId)) {
            affectedMonthIds.push(mId);
          }
        }
      }
    });

    // Ensure currentMonthId is tracked
    if (!affectedMonthIds.includes(currentMonthId) && newState.months[currentMonthId]) {
      newState.months[currentMonthId] = {
        ...newState.months[currentMonthId],
        expenses: (newState.months[currentMonthId].expenses || []).filter(e => !selectedExpenseIds.includes(e.id))
      };
      affectedMonthIds.push(currentMonthId);
    }

    setState(newState);
    setSelectedExpenseIds([]);
    setIsBulkDeleteModalOpen(false);

    if (user && affectedMonthIds.length > 0) {
      setIsSyncing(true);
      const uId = user.uid || (user as any).id;
      try {
        const jobs = affectedMonthIds.map(mId => {
          if (dbStatus?.activeDb === 'mongodb') {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          } else if (authProvider === 'firebase') {
            return setDoc(doc(db, 'users', uId, 'months', mId), sanitize(newState.months[mId]));
          } else {
            return dbService.saveMonthData(uId, mId, newState.months[mId]);
          }
        });
        await Promise.all(jobs);
      } catch (err: any) {
        if (authProvider === 'firebase' && dbStatus?.activeDb !== 'mongodb') {
          handleFirestoreError(err, OperationType.WRITE, `users/${uId}/months/${currentMonthId}`, user);
        } else {
          console.error(err);
          showNotification('Erro ao sincronizar exclusão com servidor');
        }
      } finally {
        setIsSyncing(false);
      }
    }

    showNotification(
      `${count} ${count === 1 ? 'despesa excluída' : 'despesas excluídas'} com sucesso!`,
      'success'
    );
  };

  const changeMonth = async (offset: number) => {
    const [year, month] = currentMonthId.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const nextMonthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Auto-carryover logic
    if (!state.months[nextMonthId]) {
      const actualPrevMonthId = currentMonthId;
      const prevData = state.months[actualPrevMonthId];
      
      if (prevData) {
        const carryFixed = prevData.expenses
          .filter(e => e.category === 'Fixas' && !e.totalInstallments)
          .map(e => ({ ...e, id: crypto.randomUUID(), paid: false }));
          
        const newMonthData: MonthData = {
          salary: prevData.salary,
          expenses: carryFixed,
          extraIncomes: [],
          piggyBank: []
        };

        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'months', nextMonthId), sanitize(newMonthData));
          } catch (error) {
            console.error(error);
          }
        }

        setState(prev => ({
          ...prev,
          months: {
            ...prev.months,
            [nextMonthId]: newMonthData
          }
        }));
      }
    }
    
    setCurrentMonthId(nextMonthId);
  };

  const chartData = useMemo(() => {
    return Object.entries(state.months)
      .map(([id, monthData]) => {
        const data = monthData as MonthData;
        const [year, month] = id.split('-').map(Number);
        const totalExtra = (data.extraIncomes || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const totalIncome = Number(data.salary || 0) + totalExtra;
        const totalExpenses = (data.expenses || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const fixedExpenses = (data.expenses || []).filter(curr => curr.category === 'Fixas').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const variableExpenses = (data.expenses || []).filter(curr => curr.category === 'Variáveis').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const totalInvestments = (data.investments || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const remaining = totalIncome - totalExpenses - totalInvestments;
        
        return {
          id,
          date: new Date(year, month - 1),
          label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1)),
          saldo: remaining,
          investimentos: totalInvestments,
          gastosFixos: fixedExpenses,
          gastosVariaveis: variableExpenses,
          totalGastos: totalExpenses
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [state.months]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getMonthLabel = (mid: string) => {
    const [year, month] = mid.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1));
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-brand-border flex items-center justify-center">
            <Loader2 size={24} className="text-brand-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-brand-text-main font-bold">Verificando acesso</p>
            <p className="text-brand-text-muted text-xs font-medium uppercase tracking-widest">Sincronizando com o Supabase...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} isLoading={isLoggingIn} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-main font-sans flex flex-col">
      {openMenuId && (
        <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setOpenMenuId(null)} />
      )}
      <header className="px-4 py-4 md:px-10 md:py-6 bg-white border-b border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="text-xl font-extrabold tracking-tighter text-brand-primary uppercase">
          DalciosPay<span className="text-slate-400">.</span>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2 md:gap-4 bg-brand-bg p-1 rounded-xl border border-brand-border shadow-inner">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-brand-text-muted hover:text-brand-primary"
          >
            <ChevronLeft size={16} md:size={18} strokeWidth={3} />
          </button>
          <div className="px-2 md:px-4 font-bold text-xs md:text-sm tracking-tight capitalize w-32 md:w-40 text-center">
            {getMonthLabel(currentMonthId)}
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-brand-text-muted hover:text-brand-primary"
          >
            <ChevronRight size={16} md:size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase transition-all ${isSyncing ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary'}`}>
              {isSyncing ? (
                <>
                  <Loader2 size={10} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Database size={10} />
                  Modo Nuvem
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border">
            {(user.photoURL || user.user_metadata?.avatar_url) ? (
              <img 
                src={user.photoURL || user.user_metadata?.avatar_url} 
                alt={user.displayName || user.user_metadata?.full_name || ''} 
                className="w-6 h-6 rounded-full border border-brand-primary" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <UserIcon size={16} className="text-brand-primary" />
            )}
            <div className="hidden lg:flex flex-col items-end mr-1">
              <div className="text-[10px] font-black uppercase text-brand-text-main leading-none">
                {(user.displayName || user.user_metadata?.full_name || 'Usuário').split(' ')[0]}
              </div>
              <div className="text-[8px] font-bold text-brand-text-muted lowercase leading-tight">
                {user.email}
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-brand-text-muted hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>

          <button 
            onClick={() => {
              setSelectedExpenseToSplitId(null);
              setIsSplitModalOpen(true);
            }}
            className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 border border-purple-200 flex items-center gap-2 group cursor-pointer"
            title="Fazer Contas & Dividir Despesa"
          >
            <Split size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:block">Dividir Conta</span>
          </button>

          <button 
            onClick={() => setIsScannerOpen(true)}
            className="p-2 bg-brand-primary/5 hover:bg-brand-primary/10 rounded-lg transition-colors text-brand-primary border border-brand-primary/10 flex items-center gap-2 group"
            title="Escanear Extrato (IA)"
          >
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:block">Escanear Print</span>
          </button>

          <button 
            onClick={() => setIsCalculatorOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-brand-text-muted hover:text-brand-text-main border border-transparent hover:border-brand-border"
            title="Calculadora"
          >
            <Calculator size={20} />
          </button>

          <button 
            onClick={() => {
              setNewSalary(currentMonthData.salary.toString());
              setIsSetupModalOpen(true);
            }}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-brand-text-muted hover:text-brand-text-main border border-transparent hover:border-brand-border"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-6 md:gap-8 overflow-y-auto md:overflow-hidden scrollbar-hide">
        {/* Navigation Tabs (Painel Mensal vs Investimentos) */}
        <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-brand-border shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('financial')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-brand-primary text-white shadow-md shadow-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet size={15} />
              <span>Painel Mensal</span>
            </button>

            <button
              onClick={() => setActiveTab('investments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'investments'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-100'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <TrendingUp size={15} />
              <span>Investimentos</span>
              {totals.investments > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'investments' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  {formatCurrency(totals.investments)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'trips'
                  ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
              }`}
            >
              <Compass size={15} />
              <span>Viagens</span>
              {(state.trips || []).length > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'trips' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'
                }`}>
                  {(state.trips || []).length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedExpenseToSplitId(null);
                setIsSplitModalOpen(true);
              }}
              className="text-xs font-black uppercase tracking-wider text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-purple-200"
            >
              <Split size={14} />
              <span>Fazer Contas & Dividir</span>
            </button>
          </div>
        </div>

        {activeTab === 'trips' ? (
          <TripsView
            trips={state.trips || []}
            currentMonthId={currentMonthId}
            currentMonthData={currentMonthData}
            allMonths={state.months}
            onSaveTrip={handleSaveTrip}
            onDeleteTrip={handleDeleteTrip}
            onDuplicateTrip={handleDuplicateTrip}
            onSyncExpenseToMonth={handleSyncTripExpenseToMonth}
            formatCurrency={formatCurrency}
            getMonthLabel={getMonthLabel}
          />
        ) : activeTab === 'investments' ? (
          <InvestmentsView
            currentMonthId={currentMonthId}
            allMonths={state.months}
            currentMonthData={currentMonthData}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onDuplicateInvestment={handleDuplicateInvestment}
            onOpenSplitModal={() => {
              setSelectedExpenseToSplitId(null);
              setIsSplitModalOpen(true);
            }}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
            getMonthLabel={getMonthLabel}
          />
        ) : (
          <>
            {/* Dashboard Cards */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 shrink-0">
              <div 
                onClick={() => {
                  setNewSalary(currentMonthData.salary.toString());
                  setIsSetupModalOpen(true);
                }}
                className="bg-white p-4 md:p-5 rounded-2xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer hover:border-brand-primary/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Renda Base</div>
                  <Wallet size={14} md:size={16} className="text-brand-primary opacity-50" />
                </div>
                <div className="text-base md:text-xl font-bold tracking-tight">{formatCurrency(currentMonthData.salary)}</div>
                <div className="mt-1 text-[8px] font-black uppercase text-brand-primary/60 tracking-tighter hidden md:block">Alterar</div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-bold text-brand-text-muted uppercase tracking-widest text-emerald-500">Renda Extra</div>
                  <TrendingUp size={14} md:size={16} className="text-emerald-500 opacity-50" />
                </div>
                <div className="text-base md:text-xl font-bold tracking-tight text-emerald-600">{formatCurrency(totals.extra)}</div>
                <div className="mt-1 text-[8px] font-black uppercase text-emerald-600/70 tracking-tighter">Total: {formatCurrency(totals.income)}</div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-bold text-brand-text-muted uppercase tracking-widest text-slate-900">Total Despesas</div>
                  <TrendingDown size={14} md:size={16} className="text-slate-900 opacity-50" />
                </div>
                <div className="text-base md:text-xl font-bold tracking-tight text-slate-900">{formatCurrency(totals.total)}</div>
                <div className="mt-1 text-[8px] font-black uppercase text-slate-400 tracking-tighter italic">Soma total</div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-red-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] bg-red-50/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-bold text-red-500 uppercase tracking-widest">Falta Pagar</div>
                  <AlertCircle size={14} md:size={16} className="text-red-500 opacity-50" />
                </div>
                <div className="text-base md:text-xl font-bold tracking-tight text-red-600">{formatCurrency(totals.pending)}</div>
                <div className="mt-1 text-[8px] font-black uppercase text-red-400 tracking-tighter">Aguardando</div>
              </div>

              {/* Investimentos Card */}
              <div 
                onClick={() => setActiveTab('investments')}
                className="bg-white p-4 md:p-5 rounded-2xl border border-purple-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-purple-400 transition-all cursor-pointer group bg-gradient-to-b from-purple-50/30 to-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-black text-purple-700 uppercase tracking-widest">Investimentos</div>
                  <TrendingUp size={14} md:size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-base md:text-xl font-bold tracking-tight text-purple-700 font-mono">
                  {formatCurrency(totals.investments)}
                </div>
                <div className="mt-1 text-[8px] font-black uppercase text-purple-600 tracking-tighter flex items-center justify-between">
                  <span>{currentMonthData.investments?.length || 0} aportes</span>
                  <span className="underline">Ver →</span>
                </div>
              </div>

              <div className="bg-brand-primary p-4 md:p-5 rounded-2xl shadow-xl shadow-blue-100 flex flex-col justify-center">
                <div className="text-[9px] md:text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Disponível Real</div>
                <div className={`text-lg md:text-2xl font-extrabold tracking-tight text-white`}>
                  {formatCurrency(totals.remaining)}
                </div>
                <div className="mt-1 text-[8px] font-black uppercase text-white/70 tracking-tighter">
                  Renda - Gastos - Invest.
                </div>
              </div>
            </section>

        <div className="flex-1 min-h-0 flex flex-col gap-6 w-full">
          {/* Action Toolbar on Top of Category Distribution Card */}
          <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-brand-primary rounded-xl">
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Ações Rápidas & Lançamentos
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Clique para abrir em modal e lançar ou gerenciar
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Nova Despesa (Hero Button) */}
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CreditCard size={15} />
                  <span>+ Nova Despesa</span>
                </button>

                {/* 2. Renda Extra */}
                <button
                  type="button"
                  onClick={() => setIsExtraIncomeModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Cadastrar ou gerenciar rendas extras do mês"
                >
                  <TrendingUp size={15} className="text-emerald-600" />
                  <span>+ Renda Extra</span>
                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    +{formatCurrency(totals.extra)}
                  </span>
                </button>

                {/* 3. Recibo IA */}
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Ler comprovante ou cupom fiscal com IA"
                >
                  <Receipt size={14} />
                  <span>Recibo IA</span>
                </button>

                {/* 4. Importar IA */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Importação inteligente em texto livre"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Importar IA</span>
                </button>

                {/* 5. Categorias */}
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Cadastrar e gerenciar categorias"
                >
                  <Tag size={14} />
                  <span>Categorias</span>
                </button>
              </div>
            </div>
          </div>
            {selectedExpenseIds.length > 0 && (
              <div className="bg-white border-2 border-brand-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-md animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-brand-primary/5">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-brand-primary to-blue-700 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {selectedExpenseIds.length} {selectedExpenseIds.length === 1 ? 'despesa selecionada' : 'despesas selecionadas'}
                      </h4>
                      <span className="text-[11px] font-mono font-bold bg-blue-50 text-brand-primary px-2 py-0.5 rounded-md border border-blue-200">
                        Total: {formatCurrency(selectedExpensesTotal)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Ações em lote: duplique para o próximo mês ou remova as despesas marcadas.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  {selectedExpenseIds.length < currentMonthData.expenses.length ? (
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseIds(currentMonthData.expenses.map(e => e.id))}
                      className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer hover:text-slate-800 border border-slate-200"
                    >
                      Selecionar Todas ({currentMonthData.expenses.length})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedExpenseIds([])}
                      className="px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer hover:text-slate-700 border border-slate-200"
                    >
                      Desmarcar Todas
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={duplicateSelectedExpenses}
                    className="px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Duplica os itens selecionados de forma automática para o próximo mês"
                  >
                    <Copy size={13} />
                    <span>Duplicar ({selectedExpenseIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkDeleteScope('this_month');
                      setIsBulkDeleteModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Apagar despesas selecionadas em massa"
                  >
                    <Trash2 size={13} />
                    <span>Apagar ({selectedExpenseIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Category Visualizer: Clean Pie Chart (Gráfico de Pizza) */}
            <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <PieChart size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      Distribuição por Categoria
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-mono">
                        {categoryPieData.length} {categoryPieData.length === 1 ? 'categoria ativa' : 'categorias ativas'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Gráfico de pizza com as categorias com despesas no mês de {getMonthLabel(currentMonthId)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    Total: <strong className="font-mono text-slate-900">{formatCurrency(totals.total)}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Pago: <strong className="font-mono">{formatCurrency(totals.paid)}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                    Pendente: <strong className="font-mono">{formatCurrency(totals.pending)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="p-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all cursor-pointer"
                    title="Gerenciar Categorias"
                  >
                    <FolderPlus size={14} />
                  </button>
                </div>
              </div>

              {/* Pie Chart & Interactive Legend */}
              {categoryPieData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left: Recharts Pie Chart */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                    <div className="w-full h-56 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip 
                            formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), `${name}`]}
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              borderRadius: '12px', 
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                              border: '1px solid #e2e8f0',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '8px 12px'
                            }}
                          />
                          <Pie
                            data={categoryPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            cornerRadius={4}
                            onClick={(entry) => {
                              if (entry && entry.name) {
                                setSelectedCategoryFilter(selectedCategoryFilter === entry.name ? 'all' : entry.name);
                              }
                            }}
                          >
                            {categoryPieData.map((entry) => (
                              <Cell 
                                key={`cell-${entry.name}`} 
                                fill={entry.color} 
                                stroke="#ffffff"
                                strokeWidth={2}
                                className="cursor-pointer transition-all hover:opacity-80"
                              />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      {/* Center Donut Info */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total</span>
                        <span className="text-xs font-black font-mono text-slate-800">
                          {formatCurrency(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Clean List of Active Categories */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 pb-1">
                      <span>Categorias Cadastradas</span>
                      <span>Valor / % Total</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {categoryPieData.map((item) => {
                        const isSelected = selectedCategoryFilter === item.name;
                        const pct = totals.total > 0 ? ((item.value / totals.total) * 100).toFixed(1) : '0';

                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : item.name)}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                              isSelected
                                ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200'
                                : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70'
                            }`}
                            title={`Clique para filtrar por ${item.name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                                style={{ backgroundColor: item.color }} 
                              />
                              <div className="truncate">
                                <span className="text-xs font-bold text-slate-800 truncate block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.count} {item.count === 1 ? 'despesa' : 'despesas'}
                                  {item.pending > 0 ? ` • ${formatCurrency(item.pending)} pendente` : ' • Quitado'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-slate-800">
                                {formatCurrency(item.value)}
                              </div>
                              <div className="text-[10px] font-mono font-bold text-purple-600">
                                {pct}%
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <PieChart size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Nenhuma despesa cadastrada neste mês</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    O gráfico de pizza exibirá apenas as categorias que possuírem gastos cadastrados.
                  </p>
                </div>
              )}

              {/* Bottom Quick Filter Buttons: ONLY for categories with registered expenses */}
              {categoryPieData.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                      Filtrar:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todas ({currentMonthData.expenses.length})
                    </button>

                    {categoryPieData.map((item) => {
                      const isSelected = selectedCategoryFilter === item.name;
                      const style = getExpenseCategoryBadgeStyle(item.name);
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : item.name)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : `${style.bg} hover:brightness-95`
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : style.dot}`} />
                          <span>{item.name}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-700'
                          }`}>
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
                  >
                    <FolderPlus size={11} /> + Categorias
                  </button>
                </div>
              )}
            </div>

            {/* Toolbar: Search, Status Filter & View Modes */}
            <div className="bg-white p-3 rounded-2xl border border-brand-border shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    placeholder="Buscar despesa..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-brand-primary focus:bg-white transition-all"
                  />
                  {expenseSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setExpenseSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setExpenseStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      expenseStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todas ({currentMonthData.expenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      expenseStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <span>A Pagar</span>
                    <span className="font-mono text-[9px]">
                      ({currentMonthData.expenses.filter(e => !e.paid).length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseStatusFilter('paid')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      expenseStatusFilter === 'paid'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span>Pagas</span>
                    <span className="font-mono text-[9px]">
                      ({currentMonthData.expenses.filter(e => e.paid).length})
                    </span>
                  </button>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                <button
                  type="button"
                  onClick={() => setExpenseViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expenseViewMode === 'cards'
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Visualizar despesas organizadas em cartões por categoria"
                >
                  <LayoutGrid size={13} />
                  <span>Por Categoria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expenseViewMode === 'list'
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Visualizar todas as despesas em lista consolidada por vencimento"
                >
                  <List size={13} />
                  <span>Lista Geral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseViewMode('analytics')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expenseViewMode === 'analytics'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Raio-X analítico de cada categoria"
                >
                  <BarChart3 size={13} />
                  <span>Raio-X</span>
                </button>
              </div>
            </div>

            {/* View Mode 1: Cards Grouped By Category */}
            {expenseViewMode === 'cards' && (
              activeCategoriesWithExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <Receipt size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Nenhuma conta cadastrada neste mês</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Clique no botão "+ Nova Despesa" acima para cadastrar despesas por categoria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(selectedCategoryFilter === 'all'
                    ? activeCategoriesWithExpenses
                    : [selectedCategoryFilter]
                  ).map((cat) => {
                  const rawCatExpenses = currentMonthData.expenses.filter(e => e.category === cat);
                  const catExpenses = filteredExpenses.filter(e => e.category === cat);
                  const catData = categoryBreakdown[cat] || { total: 0, paid: 0, pending: 0, count: 0, overdueCount: 0 };
                  const style = getExpenseCategoryBadgeStyle(cat);
                  const pctPaid = catData.total > 0 ? Math.round((catData.paid / catData.total) * 100) : 0;

                  return (
                    <div key={cat} className="bg-white rounded-2xl border border-brand-border flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                      <div className="px-5 py-4 bg-brand-accent-bg border-b border-brand-border flex justify-between items-center rounded-t-2xl">
                        <div className="flex items-center gap-2">
                          {/* Select All Checkbox for this category */}
                          {catExpenses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const catExpenseIds = catExpenses.map(e => e.id);
                                const allSelected = catExpenseIds.every(id => selectedExpenseIds.includes(id));
                                if (allSelected) {
                                  setSelectedExpenseIds(prev => prev.filter(id => !catExpenseIds.includes(id)));
                                } else {
                                  setSelectedExpenseIds(prev => {
                                    const withoutCat = prev.filter(id => !catExpenseIds.includes(id));
                                    return [...withoutCat, ...catExpenseIds];
                                  });
                                }
                              }}
                              className={`w-4 h-4 border rounded flex items-center justify-center transition-all cursor-pointer ${
                                catExpenses.map(e => e.id).every(id => selectedExpenseIds.includes(id))
                                  ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                  : 'border-slate-300 hover:border-brand-primary bg-white'
                              }`}
                              title="Selecionar todas desta categoria"
                            >
                              {catExpenses.map(e => e.id).every(id => selectedExpenseIds.includes(id)) && (
                                <span className="text-[9px] font-black leading-none text-white">✓</span>
                              )}
                            </button>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text-main">{cat}</h2>
                            {totals.total > 0 && catData.total > 0 && (
                              <span className="text-[9px] font-mono text-slate-400 font-semibold">
                                ({((catData.total / totals.total) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-800 font-mono">
                            {formatCurrency(catData.total)}
                          </span>
                          <span className="text-[9px] font-extrabold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded">
                            {rawCatExpenses.length} ITENS
                          </span>
                        </div>
                      </div>

                      {/* Mini progress bar of paid items in this category */}
                      {catData.total > 0 && (
                        <div className="px-5 pt-2 pb-1 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                          <span>{pctPaid}% pago</span>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pctPaid}%` }}
                              className={`h-full transition-all ${pctPaid === 100 ? 'bg-emerald-500' : 'bg-purple-600'}`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto scrollbar-hide pt-2 pb-16 min-h-[140px]">
                        {catExpenses.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-1">
                            <p>Nenhuma despesa encontrada nesta categoria.</p>
                            {(expenseSearchQuery || expenseStatusFilter !== 'all') && (
                              <button
                                type="button"
                                onClick={() => { setExpenseSearchQuery(''); setExpenseStatusFilter('all'); }}
                                className="text-[10px] text-brand-primary underline cursor-pointer"
                              >
                                Limpar filtros de busca
                              </button>
                            )}
                          </div>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            {catExpenses.map((expense) => {
                              const paymentBadge = getPaymentMethodBadge(expense.paymentMethod);
                              const todayStr = new Date().toISOString().split('T')[0];
                              const isOverdue = expense.dueDate && expense.dueDate < todayStr && !expense.paid;
                              const isDueToday = expense.dueDate && expense.dueDate === todayStr && !expense.paid;

                              return (
                                <motion.div
                                  key={expense.id}
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className={`group grid grid-cols-[24px_1fr_80px_85px] md:grid-cols-[28px_1fr_100px_120px] items-center px-3 py-3 md:px-5 md:py-3.5 border-b border-slate-50 transition-colors hover:bg-brand-bg relative ${
                                    openMenuId === expense.id ? 'z-40' : 'z-0'
                                  } ${expense.paid ? 'opacity-40' : ''}`}
                                >
                                  {/* Duplicate Selection Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedExpenseIds(prev =>
                                        prev.includes(expense.id)
                                          ? prev.filter(id => id !== expense.id)
                                          : [...prev, expense.id]
                                      );
                                    }}
                                    className={`w-4 h-4 border rounded flex items-center justify-center transition-all cursor-pointer ${
                                      selectedExpenseIds.includes(expense.id)
                                        ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                        : 'border-slate-300 hover:border-brand-primary bg-white'
                                    }`}
                                    title={selectedExpenseIds.includes(expense.id) ? "Desmarcar item" : "Selecionar item"}
                                  >
                                    {selectedExpenseIds.includes(expense.id) && (
                                      <span className="text-[9px] font-black leading-none text-white">✓</span>
                                    )}
                                  </button>
                                  
                                  <div className="space-y-1 pr-2 overflow-hidden">
                                    <div className={`text-xs md:text-sm font-bold flex items-center gap-1.5 truncate transition-all ${expense.paid ? 'line-through text-brand-text-muted' : 'text-brand-text-main'}`}>
                                      <span className="truncate">{expense.description}</span>
                                      {expense.splitFromDescription && (
                                        <span className="text-[7px] md:text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 shrink-0" title={`Divisão de: ${expense.splitFromDescription}`}>
                                          Divisão
                                        </span>
                                      )}
                                      {expense.totalInstallments && (
                                        <span className="text-[8px] md:text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                                          {expense.installmentNumber}/{expense.totalInstallments}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] md:text-[10px] font-bold text-slate-400 flex flex-wrap items-center gap-1.5">
                                      {expense.dueDate ? (
                                        <span className={`flex items-center gap-0.5 ${
                                          isOverdue
                                            ? 'text-red-600 font-extrabold'
                                            : isDueToday
                                            ? 'text-amber-600 font-extrabold'
                                            : ''
                                        }`}>
                                          <CalendarDays size={10} />
                                          {new Date(expense.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                          {isOverdue && <span className="text-[8px] uppercase bg-red-100 text-red-700 px-1 rounded ml-0.5">Atrasada</span>}
                                          {isDueToday && <span className="text-[8px] uppercase bg-amber-100 text-amber-700 px-1 rounded ml-0.5">Vence Hoje</span>}
                                        </span>
                                      ) : (
                                        <span className="italic opacity-60">Sem vencimento</span>
                                      )}

                                      {/* Forma de Pagamento Badge */}
                                      {paymentBadge && (
                                        <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${paymentBadge.bg}`} title="Forma de pagamento">
                                          <span>{paymentBadge.icon}</span>
                                          <span>{paymentBadge.label}</span>
                                        </span>
                                      )}

                                      {/* Recibo Anexado Button */}
                                      {expense.receiptUrl && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingReceipt({
                                              url: expense.receiptUrl!,
                                              title: expense.description,
                                              amount: expense.amount
                                            });
                                          }}
                                          className="text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-0.5 transition-all cursor-pointer"
                                          title="Visualizar recibo anexado"
                                        >
                                          <Receipt size={9} /> Recibo
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right font-mono font-bold text-xs md:text-sm tracking-tighter pr-1 md:pr-0">
                                    {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(expense.amount)}
                                  </div>

                                  <div className="flex justify-end items-center gap-1 md:gap-2">
                                    <button
                                      type="button"
                                      onClick={() => togglePaid(expense.id)}
                                      className={`px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border ${
                                        expense.paid 
                                          ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white font-extrabold' 
                                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border-slate-200 hover:border-emerald-200'
                                      }`}
                                      title={expense.paid ? 'Marcar como Em Aberto' : 'Marcar como Pago'}
                                    >
                                      {expense.paid ? (
                                        <>
                                          <Check size={11} strokeWidth={3} /> Pago
                                        </>
                                      ) : (
                                        'Pagar'
                                      )}
                                    </button>
                                    <div className="relative flex items-center">
                                      <button 
                                        type="button"
                                        onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer"
                                        title="Opções"
                                      >
                                        <MoreVertical size={13} strokeWidth={2.5} />
                                      </button>
                                      {openMenuId === expense.id && (
                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-brand-border rounded-xl shadow-lg py-1.5 z-40 font-bold text-[10px] uppercase tracking-wider text-slate-600 text-left">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setSelectedExpenseToSplitId(expense.id);
                                              setIsSplitModalOpen(true);
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-purple-50 text-purple-700 flex items-center gap-2 transition-colors cursor-pointer"
                                          >
                                            <Split size={11} /> Dividir Conta
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              duplicateToNextMonth(expense, 'expense');
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                          >
                                            <Copy size={11} /> Duplicar
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setEditingExpense(expense);
                                              setIsEditModalOpen(true);
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-brand-primary/5 hover:text-brand-primary flex items-center gap-2 transition-colors cursor-pointer"
                                          >
                                            <Edit2 size={11} /> Editar
                                          </button>
                                          <hr className="my-1 border-slate-100" />
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              removeExpense(expense.id);
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-red-50 hover:text-red-600 text-red-500 flex items-center gap-2 transition-colors cursor-pointer"
                                          >
                                            <Trash2 size={11} /> Apagar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        )}
                      </div>

                      {/* Card Footer with Accurate Category Sums */}
                      <div className="mt-auto px-5 py-3 border-t border-brand-border bg-brand-bg-muted flex justify-between items-center text-xs font-black uppercase tracking-widest text-brand-text-main">
                        <div className="flex flex-col gap-0.5">
                          <span className="opacity-50 text-[9px]">Total {cat}</span>
                          <span className="font-mono text-sm">{formatCurrency(catData.total)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-emerald-600 text-[9px]">Pago</span>
                            <span className="font-mono text-xs text-emerald-700">{formatCurrency(catData.paid)}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-amber-600 text-[9px]">Pendente</span>
                            <span className="font-mono text-xs text-amber-700">{formatCurrency(catData.pending)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* View Mode 2: Unified General List View */}
            {expenseViewMode === 'list' && (
              <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-brand-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-brand-primary" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Lista Geral de Lançamentos ({filteredExpenses.length})
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Soma filtrada: {formatCurrency(filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0))}
                  </span>
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                    <p>Nenhum lançamento corresponde aos filtros selecionados.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter('all');
                        setExpenseSearchQuery('');
                        setExpenseStatusFilter('all');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Redefinir Filtros
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 w-10 text-center">Sel.</th>
                          <th className="py-3 px-3">Vencimento</th>
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-3">Categoria</th>
                          <th className="py-3 px-3">Pagamento</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center w-12">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredExpenses.map((expense) => {
                          const catStyle = getExpenseCategoryBadgeStyle(expense.category);
                          const paymentBadge = getPaymentMethodBadge(expense.paymentMethod);
                          const todayStr = new Date().toISOString().split('T')[0];
                          const isOverdue = expense.dueDate && expense.dueDate < todayStr && !expense.paid;
                          const isDueToday = expense.dueDate && expense.dueDate === todayStr && !expense.paid;

                          return (
                            <tr
                              key={expense.id}
                              className={`hover:bg-slate-50/80 transition-colors ${expense.paid ? 'bg-slate-50/40 text-slate-400' : 'text-slate-800'}`}
                            >
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedExpenseIds(prev =>
                                      prev.includes(expense.id)
                                        ? prev.filter(id => id !== expense.id)
                                        : [...prev, expense.id]
                                    );
                                  }}
                                  className={`w-4 h-4 border rounded mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                    selectedExpenseIds.includes(expense.id)
                                      ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                      : 'border-slate-300 hover:border-brand-primary bg-white'
                                  }`}
                                >
                                  {selectedExpenseIds.includes(expense.id) && (
                                    <span className="text-[9px] font-black leading-none text-white">✓</span>
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                                {expense.dueDate ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className={isOverdue ? 'text-red-600 font-bold' : isDueToday ? 'text-amber-600 font-bold' : ''}>
                                      {new Date(expense.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                    {isOverdue && <span className="text-[8px] uppercase bg-red-100 text-red-700 px-1 py-0.2 rounded font-black">Atrasada</span>}
                                    {isDueToday && <span className="text-[8px] uppercase bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-black">Hoje</span>}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic">Sem data</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${expense.paid ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {expense.description}
                                  </span>
                                  {expense.splitFromDescription && (
                                    <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                      Divisão
                                    </span>
                                  )}
                                  {expense.totalInstallments && (
                                    <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                      {expense.installmentNumber}/{expense.totalInstallments}
                                    </span>
                                  )}
                                  {expense.receiptUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingReceipt({
                                        url: expense.receiptUrl!,
                                        title: expense.description,
                                        amount: expense.amount
                                      })}
                                      className="text-[8px] font-black uppercase text-purple-700 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5"
                                    >
                                      <Receipt size={9} /> Recibo
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${catStyle.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                                  <span>{expense.category}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {paymentBadge && (
                                  <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 w-fit ${paymentBadge.bg}`}>
                                    <span>{paymentBadge.icon}</span>
                                    <span>{paymentBadge.label}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-xs whitespace-nowrap">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => togglePaid(expense.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                    expense.paid
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border-slate-200'
                                  }`}
                                >
                                  {expense.paid ? '✓ Pago' : 'Pagar'}
                                </button>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="relative inline-block">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                  >
                                    <MoreVertical size={13} />
                                  </button>
                                  {openMenuId === expense.id && (
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-brand-border rounded-xl shadow-lg py-1.5 z-40 font-bold text-[10px] uppercase tracking-wider text-slate-600 text-left">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setSelectedExpenseToSplitId(expense.id);
                                          setIsSplitModalOpen(true);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-purple-50 text-purple-700 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Split size={11} /> Dividir Conta
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          duplicateToNextMonth(expense, 'expense');
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Copy size={11} /> Duplicar
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setEditingExpense(expense);
                                          setIsEditModalOpen(true);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-brand-primary/5 hover:text-brand-primary flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit2 size={11} /> Editar
                                      </button>
                                      <hr className="my-1 border-slate-100" />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          removeExpense(expense.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-500 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 size={11} /> Apagar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* View Mode 3: Category Analytics & Radiography */}
            {expenseViewMode === 'analytics' && (
              activeCategoriesWithExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <PieChart size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Nenhuma despesa para análise</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cadastre despesas para visualizar o raio-x analítico por categoria.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeCategoriesWithExpenses.map((cat) => {
                      const data = categoryBreakdown[cat] || { total: 0, paid: 0, pending: 0, count: 0, overdueCount: 0 };
                      const style = getExpenseCategoryBadgeStyle(cat);
                      const pctOfTotal = totals.total > 0 ? ((data.total / totals.total) * 100).toFixed(1) : '0';
                      const pctPaid = data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0;
                      const catExpenses = currentMonthData.expenses.filter(e => e.category === cat);
                      const maxExpense = catExpenses.reduce((max, e) => Number(e.amount || 0) > Number(max.amount || 0) ? e : max, catExpenses[0]);

                      return (
                        <div
                          key={cat}
                          className="bg-white rounded-2xl border border-brand-border shadow-xs p-4.5 space-y-3 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">{cat}</h4>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${style.bg}`}>
                              {pctOfTotal}%
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-lg font-black font-mono tracking-tight text-slate-900">
                                {formatCurrency(data.total)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {data.count} {data.count === 1 ? 'conta' : 'contas'}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pctPaid}%`, backgroundColor: style.bar }}
                                className="h-full rounded-full transition-all"
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span className="text-emerald-600">Pago: {formatCurrency(data.paid)} ({pctPaid}%)</span>
                              <span className="text-amber-600">Pendente: {formatCurrency(data.pending)}</span>
                            </div>
                          </div>

                          {data.total > 0 && maxExpense && (
                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
                              <span className="truncate max-w-[140px]">Maior: {maxExpense.description}</span>
                              <span className="font-mono font-bold text-slate-700 shrink-0">{formatCurrency(maxExpense.amount)}</span>
                            </div>
                          )}

                          <div className="pt-1 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategoryFilter(cat);
                                setExpenseViewMode('cards');
                              }}
                              className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg transition-all text-center cursor-pointer"
                            >
                              Ver Lançamentos
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>

        {/* Charts Section */}
        {chartData.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="bg-white p-8 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-accent-bg rounded-lg text-brand-primary">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Evolução do Saldo</h3>
                  <p className="text-xs text-brand-text-muted font-medium">Histórico de quanto sobra mês a mês</p>
                </div>
              </div>
              
              <div className="h-[240px] w-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                      formatter={(val: number) => [formatCurrency(val), 'Saldo']}
                      labelStyle={{ marginBottom: '4px', color: '#64748B' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#2563EB" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, fill: '#2563EB', strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Evolução de Gastos</h3>
                  <p className="text-xs text-brand-text-muted font-medium">Soma de gastos fixos e variáveis</p>
                </div>
              </div>
              
              <div className="h-[240px] w-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        const formattedVal = formatCurrency(Number(value));
                        if (name === 'gastosFixos') return [formattedVal, 'Gastos Fixos'];
                        if (name === 'gastosVariaveis') return [formattedVal, 'Gastos Variáveis'];
                        if (name === 'totalGastos') return [formattedVal, 'Total de Gastos'];
                        return [formattedVal, name];
                      }}
                      labelStyle={{ marginBottom: '4px', color: '#64748B' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748B', display: 'flex', justifyContent: 'center', gap: '8px' }}
                      formatter={(value) => {
                        if (value === 'gastosFixos') return 'Fixas';
                        if (value === 'gastosVariaveis') return 'Variáveis';
                        return value;
                      }}
                    />
                    <Bar dataKey="gastosFixos" name="gastosFixos" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="gastosVariaveis" name="gastosVariaveis" stackId="a" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Aportes em Investimentos</h3>
                  <p className="text-xs text-brand-text-muted font-medium">Dinheiro investido por mês</p>
                </div>
              </div>
              
              <div className="h-[240px] w-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                      formatter={(val: number) => [formatCurrency(val), 'Investido']}
                      labelStyle={{ marginBottom: '4px', color: '#64748B' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investimentos" 
                      stroke="#8B5CF6" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#8B5CF6', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, fill: '#8B5CF6', strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}
          </>
        )}
      </main>

      {/* New Expense Modal */}
      <AnimatePresence>
        {isNewExpenseModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-brand-border space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-primary text-white rounded-xl shadow-xs">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase text-slate-800">
                      Nova Despesa
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Mês de {getMonthLabel(currentMonthId)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick AI scanning shortcut */}
              <div className="flex items-center justify-between p-2.5 bg-purple-50/70 border border-purple-200/60 rounded-xl gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Receipt size={14} className="text-purple-600 shrink-0" />
                  <span className="text-[11px] text-purple-900 font-bold truncate">
                    Tem um comprovante ou cupom fiscal?
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1">
                    <Camera size={11} />
                    <span>{isReadingReceiptInForm ? 'Lendo...' : 'Subir Cupom'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isReadingReceiptInForm}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQuickReceiptUpload(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Receipt Preview if attached */}
              {newExpense.receiptUrl && (
                <div className="p-2 bg-purple-100/70 border border-purple-200 rounded-xl flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={newExpense.receiptUrl} alt="Miniatura" className="w-8 h-8 rounded-lg object-cover border border-purple-300" />
                    <div className="truncate">
                      <span className="text-[10px] font-black text-purple-900 block truncate">
                        Recibo Anexado {newExpense.amount ? `(R$ ${newExpense.amount})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingReceipt({
                        url: newExpense.receiptUrl!,
                        title: newExpense.description || 'Recibo da Despesa',
                        amount: parseFloat(newExpense.amount) || undefined
                      })}
                      className="p-1 text-purple-700 hover:text-purple-900 text-[10px] font-black uppercase cursor-pointer"
                    >
                      Ver Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewExpense(p => ({ ...p, receiptUrl: undefined }))}
                      className="p-1 text-red-500 hover:text-red-700 text-[10px] font-black uppercase cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={addExpense} className="space-y-4">
                {/* Tipo de Despesa Switch */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Tipo de Gasto
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewExpense(p => ({ ...p, category: 'Fixas' as ExpenseCategory }))}
                      className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        newExpense.category === 'Fixas'
                          ? 'bg-white text-brand-primary shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Fixa (Mensal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewExpense(p => ({ ...p, category: 'Variáveis' as ExpenseCategory }))}
                      className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        newExpense.category !== 'Fixas'
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Variável / Pontual
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Descrição da Conta / Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExpense.description}
                    onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ex: Aluguel, Supermercado, Luz, Internet..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium focus:bg-white focus:border-brand-primary transition-all"
                  />
                </div>

                {/* Valor & Vencimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Valor (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newExpense.amount}
                        onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono font-bold focus:bg-white focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Data de Vencimento {newExpense.category === 'Fixas' && '*'}
                    </label>
                    <div className="relative">
                      <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        required={newExpense.category === 'Fixas'}
                        value={newExpense.dueDate}
                        onChange={e => setNewExpense(p => ({ ...p, dueDate: e.target.value }))}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium focus:bg-white focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Categoria & Forma de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Categoria
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategoryInForm(!isCreatingCategoryInForm)}
                        className="text-[9px] font-black text-purple-600 hover:text-purple-800 uppercase"
                      >
                        {isCreatingCategoryInForm ? 'Selecionar' : '+ Nova'}
                      </button>
                    </div>

                    {isCreatingCategoryInForm ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={inlineNewCategory}
                          onChange={e => setInlineNewCategory(e.target.value)}
                          placeholder="Nova Categoria..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-purple-300 rounded-xl outline-none text-xs font-bold text-purple-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (inlineNewCategory.trim()) {
                              handleAddCustomCategory(inlineNewCategory.trim());
                              setNewExpense(p => ({ ...p, category: inlineNewCategory.trim() as ExpenseCategory }));
                              setInlineNewCategory('');
                              setIsCreatingCategoryInForm(false);
                            }
                          }}
                          className="px-2.5 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newExpense.category}
                        onChange={e => setNewExpense(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-primary transition-all"
                      >
                        {allExpenseCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={newExpense.paymentMethod}
                      onChange={e => setNewExpense(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-primary transition-all"
                    >
                      <option value="pix">⚡ Pix</option>
                      <option value="credit_card">💳 Cartão de Crédito</option>
                      <option value="boleto">📄 Boleto Bancário</option>
                    </select>
                  </div>
                </div>

                {/* Repetir por X meses & Status de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Repetir / Parcelas
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={newExpense.repeats}
                        onChange={e => setNewExpense(p => ({ ...p, repeats: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold text-center"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">
                        {newExpense.repeats > 1 ? `x parcelas mensais` : `Lançamento único`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Status do Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewExpense(p => ({ ...p, paid: true }))}
                        className={`py-2 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          newExpense.paid
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <CheckCircle2 size={13} /> Já Pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExpense(p => ({ ...p, paid: false }))}
                        className={`py-2 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          !newExpense.paid
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <Circle size={13} /> A Pagar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewExpenseModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 px-4 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    Cadastrar Despesa
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra Income Modal */}
      <AnimatePresence>
        {isExtraIncomeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-brand-border space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase text-slate-800">
                      Rendas Extras
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Lançar e gerenciar rendas extras em {getMonthLabel(currentMonthId)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExtraIncomeModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={addExtraIncome} className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                  + Nova Renda Extra
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Fonte / Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExtraIncome.description}
                    onChange={e => setNewExtraIncome(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ex: Freelance, Venda de item, Bônus, Aluguel..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Valor (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newExtraIncome.amount}
                        onChange={e => setNewExtraIncome(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-mono font-bold text-emerald-700 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={newExtraIncome.date}
                      onChange={e => setNewExtraIncome(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    + Adicionar Renda Extra
                  </button>
                </div>
              </form>

              {/* Existing Items in this Month */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Lançamentos do Mês ({currentMonthData.extraIncomes?.length || 0})
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    Total: +{formatCurrency(totals.extra)}
                  </span>
                </div>

                {(currentMonthData.extraIncomes || []).length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-3">
                    Nenhuma renda extra cadastrada para este mês.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {currentMonthData.extraIncomes.map((income) => (
                      <div
                        key={income.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {income.description}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {income.date ? new Date(income.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-600">
                            +{formatCurrency(income.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExtraIncome(income);
                              setIsExtraIncomeModalOpen(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExtraIncome(income.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Apagar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExtraIncomeModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Piggy Bank Modal */}
      <AnimatePresence>
        {isPiggyBankModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-brand-border space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-primary text-white rounded-xl shadow-xs">
                    <PiggyBank size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase text-slate-800">
                      Cofrinho & Economias
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Guardar e acompanhar metas em {getMonthLabel(currentMonthId)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPiggyBankModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={addPiggyBank} className="space-y-4 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary block">
                  + Novo Aporte no Cofrinho
                </span>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Objetivo / Sonho *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPiggyBank.description}
                    onChange={e => setNewPiggyBank(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ex: Viagem de Férias, Carro Novo, Reserva de Emergência..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-brand-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Valor a Guardar (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newPiggyBank.amount}
                        onChange={e => setNewPiggyBank(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-mono font-bold text-brand-primary focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                      Data do Aporte *
                    </label>
                    <input
                      type="date"
                      required
                      value={newPiggyBank.date}
                      onChange={e => setNewPiggyBank(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    + Guardar no Cofrinho
                  </button>
                </div>
              </form>

              {/* Existing Items in this Month */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Aportes do Mês ({currentMonthData.piggyBank?.length || 0})
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-primary">
                    Total: {formatCurrency(totals.piggy)}
                  </span>
                </div>

                {(currentMonthData.piggyBank || []).length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-3">
                    Nenhum aporte no cofrinho cadastrado para este mês.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {currentMonthData.piggyBank.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {entry.description}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-black font-mono text-brand-primary">
                            +{formatCurrency(entry.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => duplicateToNextMonth(entry, 'piggy')}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Duplicar para o próximo mês"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPiggyBank(entry);
                              setIsPiggyBankModalOpen(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePiggyBank(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Apagar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPiggyBankModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-lg w-full shadow-2xl space-y-6 border border-brand-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-primary rounded-lg text-white">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Importação Mágica</h2>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="text-brand-text-muted hover:text-brand-text-main"><X size={20} /></button>
              </div>
              
              <p className="text-sm text-brand-text-muted font-medium leading-relaxed">
                Cole sua lista de gastos abaixo. Pode ser um texto bagunçado, o Gemini vai identificar as descrições, valores e datas para você!
              </p>

              <div className="space-y-4">
                <textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Ex: Aluguel 1200, Internet dia 15 R$ 100, Supermercado 50.00"
                  className="w-full h-40 px-4 py-4 bg-brand-bg border border-brand-border rounded-xl focus:ring-4 focus:ring-brand-accent-bg transition-all outline-none text-sm font-medium resize-none shadow-inner"
                />
                
                <button 
                  onClick={handleSmartImport}
                  disabled={isImporting || !importText.trim()}
                  className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Importar Agora
                    </>
                  ) }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-brand-border h-[85vh] flex flex-col overflow-hidden" id="scanner-modal">
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-primary rounded-lg text-white">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">
                    {pendingScannerReview ? 'Conferir Lançamentos' : 'Scanner AI'}
                  </h2>
                </div>
                <button onClick={() => {
                  setIsScannerOpen(false);
                  setPendingScannerReview(null);
                }} className="text-brand-text-muted hover:text-brand-text-main"><X size={20} /></button>
              </div>
              
              {!pendingScannerReview ? (
                <div className="space-y-6 overflow-y-auto pr-2">
                  <p className="text-sm text-brand-text-muted font-medium leading-relaxed">
                    Tire um print da tela do seu banco ou envie o PDF do extrato. O Gemini vai identificar seus gastos e saldo automaticamente para você!
                  </p>

                  <div className="space-y-4">
                    <div className="relative group">
                      <input 
                        id="scanner-upload-field"
                        type="file" 
                        accept="image/*,application/pdf"
                        disabled={isProcessingFile}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            const mimeType = file.type;
                            reader.onload = async (rv) => {
                              const base64 = rv.target?.result as string;
                              await processFileStatement(base64, mimeType);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full h-40 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-brand-primary/50 group-hover:bg-brand-primary/5 transition-all ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isProcessingFile ? (
                          <Loader2 size={32} className="text-brand-primary animate-spin" />
                        ) : (
                          <Plus size={32} className="text-brand-border group-hover:text-brand-primary transition-colors" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted group-hover:text-brand-primary transition-colors">
                          {isProcessingFile ? 'Analisando arquivo...' : 'Selecionar Print ou PDF'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                      <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 font-bold leading-tight">
                        PRIVACIDADE: Sua imagem é processada apenas para extração dos dados e não é armazenada.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ScannerReviewContent 
                  data={pendingScannerReview} 
                  onCancel={() => setPendingScannerReview(null)}
                  onApply={applyScannerReview}
                  currentMonthData={currentMonthData}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-brand-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight uppercase">Editar Despesa</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-brand-text-muted hover:text-brand-text-main"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleUpdateExpense} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Descrição</label>
                  <input 
                    type="text" value={editingExpense.description}
                    onChange={e => setEditingExpense(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                      <input 
                        type="number" step="0.01" value={editingExpense.amount}
                        onChange={e => setEditingExpense(prev => prev ? ({ ...prev, amount: parseFloat(e.target.value) || 0 }) : null)}
                        className="w-full pl-9 pr-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Vencimento</label>
                    <input 
                      type="date" value={editingExpense.dueDate || ''}
                      onChange={e => setEditingExpense(prev => prev ? ({ ...prev, dueDate: e.target.value }) : null)}
                      className="w-full px-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-[11px] font-bold text-brand-text-muted"
                    />
                  </div>
                </div>

                {/* Categoria e Forma de Pagamento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Categoria</label>
                    <select
                      value={editingExpense.category || 'Fixas'}
                      onChange={e => setEditingExpense(prev => prev ? ({ ...prev, category: e.target.value as ExpenseCategory }) : null)}
                      className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-xl outline-none text-xs font-bold"
                    >
                      {allExpenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Forma de Pagamento</label>
                    <select
                      value={editingExpense.paymentMethod || 'pix'}
                      onChange={e => setEditingExpense(prev => prev ? ({ ...prev, paymentMethod: e.target.value as PaymentMethod }) : null)}
                      className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-xl outline-none text-xs font-bold"
                    >
                      <option value="pix">⚡ Pix</option>
                      <option value="credit_card">💳 Cartão de Crédito</option>
                      <option value="boleto">📄 Boleto Bancário</option>
                    </select>
                  </div>
                </div>

                {/* Status do Pagamento */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Status da Conta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(prev => prev ? ({ ...prev, paid: false }) : null)}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        !editingExpense.paid
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      ⏳ Em Aberto
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingExpense(prev => prev ? ({ ...prev, paid: true }) : null)}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        editingExpense.paid
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Já Pago
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Parcela Atual</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Ex: 1"
                      value={editingExpense.installmentNumber ?? ''}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setEditingExpense(prev => prev ? ({ 
                          ...prev, 
                          installmentNumber: isNaN(val) ? undefined : val 
                        }) : null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-brand-border rounded-lg outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Total de Parcelas</label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Ex: 12"
                      value={editingExpense.totalInstallments ?? ''}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setEditingExpense(prev => prev ? ({ 
                          ...prev, 
                          totalInstallments: isNaN(val) ? undefined : val 
                        }) : null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-brand-border rounded-lg outline-none text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Scope selector for recurring/installment expense */}
                {(matchingMonthsForEdit.length > 1 || (editingExpense.totalInstallments && editingExpense.totalInstallments > 1)) && (
                  <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                        <Repeat size={13} className="text-blue-600" />
                        Aplicar Alterações Em:
                      </span>
                      <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                        {matchingMonthsForEdit.length} {matchingMonthsForEdit.length === 1 ? 'mês' : 'meses'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${editScope === 'all_months' ? 'bg-white border-brand-primary shadow-xs' : 'bg-white/50 border-slate-200 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="editScope" 
                          value="all_months" 
                          checked={editScope === 'all_months'} 
                          onChange={() => setEditScope('all_months')}
                          className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800">Todas as parcelas / repetições</div>
                          <div className="text-[10px] font-semibold text-slate-500">Altera valor e dados em todos os {matchingMonthsForEdit.length} meses</div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${editScope === 'this_and_future' ? 'bg-white border-brand-primary shadow-xs' : 'bg-white/50 border-slate-200 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="editScope" 
                          value="this_and_future" 
                          checked={editScope === 'this_and_future'} 
                          onChange={() => setEditScope('this_and_future')}
                          className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800">Este e os meses seguintes</div>
                          <div className="text-[10px] font-semibold text-slate-500">A partir de {getMonthLabel(currentMonthId)}</div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${editScope === 'this_month' ? 'bg-white border-brand-primary shadow-xs' : 'bg-white/50 border-slate-200 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="editScope" 
                          value="this_month" 
                          checked={editScope === 'this_month'} 
                          onChange={() => setEditScope('this_month')}
                          className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800">Apenas este mês</div>
                          <div className="text-[10px] font-semibold text-slate-500">Altera somente a parcela deste mês</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Expense Modal for multi-month/recurring expenses */}
      <AnimatePresence>
        {deletingExpenseInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-red-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-100">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase text-slate-800">Excluir Conta Recorrente</h2>
                    <p className="text-[11px] font-bold text-slate-500">Presente em {deletingExpenseInfo.matchingMonths.length} meses</p>
                  </div>
                </div>
                <button onClick={() => setDeletingExpenseInfo(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Expense summary card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                    {deletingExpenseInfo.expense.description}
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${deletingExpenseInfo.expense.category === 'Fixas' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {deletingExpenseInfo.expense.category}
                    </span>
                  </div>
                  {deletingExpenseInfo.expense.installmentNumber && deletingExpenseInfo.expense.totalInstallments && (
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                      Parcela {deletingExpenseInfo.expense.installmentNumber} de {deletingExpenseInfo.expense.totalInstallments}
                    </div>
                  )}
                </div>
                <div className="text-sm font-black font-mono text-red-600">
                  {formatCurrency(deletingExpenseInfo.expense.amount)}
                </div>
              </div>

              {/* Scope Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Escolha onde deseja apagar:</label>
                
                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${deletingExpenseInfo.deleteScope === 'all_months' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="deleteScope" 
                      checked={deletingExpenseInfo.deleteScope === 'all_months'} 
                      onChange={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, deleteScope: 'all_months', selectedMonthIds: prev.matchingMonths.map(m => m.monthId) }) : null)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">Todos os meses ({deletingExpenseInfo.matchingMonths.length} meses)</div>
                      <div className="text-[10px] text-slate-500 font-medium">Remove esta conta de todos os meses em que ela aparece</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${deletingExpenseInfo.deleteScope === 'this_and_future' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="deleteScope" 
                      checked={deletingExpenseInfo.deleteScope === 'this_and_future'} 
                      onChange={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, deleteScope: 'this_and_future', selectedMonthIds: prev.matchingMonths.filter(m => m.monthId >= currentMonthId).map(m => m.monthId) }) : null)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">Este e os meses seguintes</div>
                      <div className="text-[10px] text-slate-500 font-medium">Mantém nos meses passados e apaga de {getMonthLabel(currentMonthId)} em diante</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${deletingExpenseInfo.deleteScope === 'this_month' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="deleteScope" 
                      checked={deletingExpenseInfo.deleteScope === 'this_month'} 
                      onChange={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, deleteScope: 'this_month', selectedMonthIds: [currentMonthId] }) : null)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">Apenas este mês ({getMonthLabel(currentMonthId)})</div>
                      <div className="text-[10px] text-slate-500 font-medium">Apaga somente este registro neste mês</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${deletingExpenseInfo.deleteScope === 'custom' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input 
                      type="radio" 
                      name="deleteScope" 
                      checked={deletingExpenseInfo.deleteScope === 'custom'} 
                      onChange={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, deleteScope: 'custom' }) : null)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">Selecionar meses específicos</div>
                      <div className="text-[10px] text-slate-500 font-medium">Escolha manualmente em quais meses apagar</div>
                    </div>
                  </label>
                </div>

                {/* Custom Month Checklist */}
                {deletingExpenseInfo.deleteScope === 'custom' && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                    <div className="flex justify-between items-center px-1 pb-1 border-b border-slate-200">
                      <span className="text-[9px] font-black uppercase text-slate-500">Meses com este registro:</span>
                      <div className="flex items-center gap-2 text-[9px] font-bold">
                        <button 
                          type="button" 
                          onClick={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, selectedMonthIds: prev.matchingMonths.map(m => m.monthId) }) : null)}
                          className="text-brand-primary hover:underline cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          type="button" 
                          onClick={() => setDeletingExpenseInfo(prev => prev ? ({ ...prev, selectedMonthIds: [] }) : null)}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {deletingExpenseInfo.matchingMonths.map(({ monthId, expense: itemExp }) => {
                        const isChecked = deletingExpenseInfo.selectedMonthIds.includes(monthId);
                        return (
                          <label 
                            key={monthId} 
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-white border-red-300 text-red-900 shadow-2xs' : 'bg-slate-100/60 border-slate-200 text-slate-400'}`}
                          >
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => {
                                  setDeletingExpenseInfo(prev => {
                                    if (!prev) return null;
                                    const exists = prev.selectedMonthIds.includes(monthId);
                                    return {
                                      ...prev,
                                      selectedMonthIds: exists 
                                        ? prev.selectedMonthIds.filter(id => id !== monthId)
                                        : [...prev.selectedMonthIds, monthId]
                                    };
                                  });
                                }}
                                className="rounded text-red-600 focus:ring-red-500"
                              />
                              <span>{getMonthLabel(monthId)}</span>
                            </div>
                            {itemExp.installmentNumber && itemExp.totalInstallments && (
                              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {itemExp.installmentNumber}/{itemExp.totalInstallments}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDeletingExpenseInfo(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  disabled={deletingExpenseInfo.selectedMonthIds.length === 0}
                  onClick={() => {
                    performDeleteExpense(
                      deletingExpenseInfo.selectedMonthIds, 
                      deletingExpenseInfo.expense.id, 
                      deletingExpenseInfo.expense
                    );
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Excluir ({deletingExpenseInfo.selectedMonthIds.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && selectedExpenseIds.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[75]">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-red-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-100">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase text-slate-800">
                      Apagar Despesas em Massa
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500">
                      {selectedExpenseIds.length} {selectedExpenseIds.length === 1 ? 'despesa selecionada' : 'despesas selecionadas'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Selecionado</div>
                  <div className="text-sm sm:text-base font-black font-mono text-red-600 mt-0.5">
                    {formatCurrency(selectedExpensesTotal)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantidade</div>
                  <div className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                    {selectedExpenseIds.length} {selectedExpenseIds.length === 1 ? 'item' : 'itens'}
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Itens que serão removidos:
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {getMonthLabel(currentMonthId)}
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {selectedExpenses.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${item.category === 'Fixas' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.category}
                        </span>
                        <span className="font-bold text-slate-800 truncate">
                          {item.description}
                        </span>
                        {item.installmentNumber && item.totalInstallments && (
                          <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                            ({item.installmentNumber}/{item.totalInstallments})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-700 shrink-0 ml-2">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope Selector if any recurring/matching exist */}
              {selectedExpensesHasRecurring ? (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">
                    Alguns itens possuem recorrência ou parcelas. Escolha onde apagar:
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${bulkDeleteScope === 'this_month' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="bulkDeleteScope"
                        checked={bulkDeleteScope === 'this_month'}
                        onChange={() => setBulkDeleteScope('this_month')}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          Apenas deste mês ({getMonthLabel(currentMonthId)})
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Remove as despesas selecionadas unicamente neste mês de referência.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${bulkDeleteScope === 'this_and_future' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="bulkDeleteScope"
                        checked={bulkDeleteScope === 'this_and_future'}
                        onChange={() => setBulkDeleteScope('this_and_future')}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          Deste e dos meses futuros
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Preserva o histórico passado e apaga de {getMonthLabel(currentMonthId)} em diante.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${bulkDeleteScope === 'all_months' ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="bulkDeleteScope"
                        checked={bulkDeleteScope === 'all_months'}
                        onChange={() => setBulkDeleteScope('all_months')}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-800">
                          De todos os meses
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Remove completamente qualquer ocorrência destas contas em todos os meses.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>
                    As despesas selecionadas serão removidas do mês de <strong>{getMonthLabel(currentMonthId)}</strong>. Esta ação não poderá ser desfeita.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => performBulkDeleteExpenses(bulkDeleteScope)}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 size={13} />
                  <span>Excluir {selectedExpenseIds.length} {selectedExpenseIds.length === 1 ? 'Despesa' : 'Despesas'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Extra Income Modal */}
      <AnimatePresence>
        {editingExtraIncome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-emerald-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight uppercase text-emerald-700">Editar Ganho</h2>
                <button onClick={() => setEditingExtraIncome(null)} className="text-slate-300 hover:text-slate-600"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleUpdateExtraIncome} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fonte / Origem</label>
                  <input 
                    type="text" value={editingExtraIncome.description}
                    onChange={e => setEditingExtraIncome(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">R$</span>
                      <input 
                        type="number" step="0.01" value={editingExtraIncome.amount}
                        onChange={e => setEditingExtraIncome(prev => prev ? ({ ...prev, amount: parseFloat(e.target.value) || 0 }) : null)}
                        className="w-full pl-9 pr-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-mono font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
                    <input 
                      type="date" value={editingExtraIncome.date || ''}
                      onChange={e => setEditingExtraIncome(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                      className="w-full px-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-[11px] font-bold text-slate-500 uppercase"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Piggy Bank Modal */}
      <AnimatePresence>
        {editingPiggyBank && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-brand-primary/10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight uppercase text-brand-primary">Editar Cofrinho</h2>
                <button onClick={() => setEditingPiggyBank(null)} className="text-slate-300 hover:text-slate-600"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleUpdatePiggyBank} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Objetivo / Sonho</label>
                  <input 
                    type="text" value={editingPiggyBank.description}
                    onChange={e => setEditingPiggyBank(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary">R$</span>
                    <input 
                      type="number" step="0.01" value={editingPiggyBank.amount}
                      onChange={e => setEditingPiggyBank(prev => prev ? ({ ...prev, amount: parseFloat(e.target.value) || 0 }) : null)}
                      className="w-full pl-9 pr-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-mono font-bold text-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data do Aporte</label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input 
                      type="date" value={editingPiggyBank.date ? editingPiggyBank.date.split('T')[0] : ''}
                      onChange={e => setEditingPiggyBank(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                      className="w-full pl-9 pr-3 py-3 bg-brand-bg border border-brand-border rounded-xl outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salary/Setup Modal */}
      <AnimatePresence>
        {isSetupModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl space-y-8 border border-brand-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight uppercase">Base Salarial</h2>
                <button onClick={() => setIsSetupModalOpen(false)} className="text-brand-text-muted hover:text-brand-text-main"><X size={20} /></button>
              </div>
              <p className="text-sm text-brand-text-muted font-medium">Define aqui o seu salário base para o mês de <span className="text-brand-primary">{getMonthLabel(currentMonthId)}</span>.</p>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted font-bold">R$</span>
                  <input 
                    type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-brand-bg border border-brand-border rounded-xl focus:ring-4 focus:ring-brand-accent-bg transition-all outline-none text-2xl font-bold tracking-tight"
                    placeholder="0,00"
                  />
                </div>
                <button onClick={updateSalary} className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Atualizar Salário deste Mês</button>
                
                <div className="pt-6 border-t border-brand-border space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">Backup Local</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={exportData}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-brand-border hover:bg-slate-50 transition-all gap-1 group"
                      >
                        <Download size={16} className="text-brand-primary group-hover:translate-y-0.5 transition-transform" />
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tighter text-center">Exportar Arquivo</span>
                      </button>
                      
                      <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-brand-border hover:bg-slate-50 cursor-pointer transition-all gap-1 group text-center">
                        <Upload size={16} className="text-brand-primary group-hover:-translate-y-0.5 transition-transform" />
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tighter">Importar Arquivo</span>
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          onChange={importData}
                        />
                      </label>
                    </div>

                    <p className="mt-4 text-[9px] text-brand-text-muted leading-tight text-center italic">
                      Use os botões flutuantes (nuvem) para sincronizar entre dispositivos. Use os arquivos apenas para backups manuais.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Category Manager Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-6 border border-brand-border max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase text-slate-800">
                      Categorias de Lançamentos
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Organize e visualize melhor seus gastos por áreas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form to Add New Category */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                  <Plus size={14} className="text-purple-600" /> Cadastrar Nova Categoria
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Nome da categoria (ex: Assinaturas, Pets, Farmácia...)"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl outline-none text-xs font-bold focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCategoryInput.trim()) {
                          await handleAddCustomCategory(newCategoryInput.trim());
                          setNewCategoryInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newCategoryInput.trim()) {
                        await handleAddCustomCategory(newCategoryInput.trim());
                        setNewCategoryInput('');
                      }
                    }}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Sugestões rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Pets',
                      'Assinaturas & Streaming',
                      'Combustível',
                      'Farmácia',
                      'Beleza & Cuidados',
                      'Roupas & Vestuário',
                      'Manutenção & Casa',
                      'Impostos & Tributos',
                      'Viagens & Férias'
                    ].map((sug) => {
                      const isAlreadyAdded = allExpenseCategories.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={async () => {
                            await handleAddCustomCategory(sug);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            isAlreadyAdded
                              ? 'bg-purple-100/40 text-purple-400 border-purple-100 cursor-not-allowed'
                              : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100/60'
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* List of Existing Categories */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Todas as Categorias ({allExpenseCategories.length})
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    Mês Atual: {getMonthLabel(currentMonthId)}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {allExpenseCategories.map((cat) => {
                    const style = getExpenseCategoryBadgeStyle(cat);
                    const isCustom = (state.customCategories || []).includes(cat);
                    const catData = categoryBreakdown[cat] || { total: 0, count: 0 };

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                          <span className="font-bold text-slate-800 truncate">{cat}</span>
                          {isCustom ? (
                            <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                              Personalizada
                            </span>
                          ) : (
                            <span className="text-[8px] font-semibold text-slate-400 shrink-0">
                              Padrão
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {catData.count > 0 ? (
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-800 block text-[11px]">
                                {formatCurrency(catData.total)}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {catData.count} {catData.count === 1 ? 'conta' : 'contas'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">0 contas este mês</span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryFilter(cat);
                              setIsCategoryModalOpen(false);
                            }}
                            className="px-2 py-1 text-[9px] font-black uppercase bg-white border border-slate-200 hover:border-brand-primary text-slate-600 hover:text-brand-primary rounded-lg transition-all cursor-pointer"
                            title="Filtrar contas desta categoria"
                          >
                            Filtrar
                          </button>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomCategory(cat)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                              title="Excluir categoria personalizada"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      </AnimatePresence>
      <SplitExpenseModal
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          setSelectedExpenseToSplitId(null);
        }}
        expenses={currentMonthData.expenses || []}
        initialExpenseId={selectedExpenseToSplitId}
        onConfirmSplit={handleConfirmSplit}
      />
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] border ${
              notification.type === 'error' ? 'bg-red-500 border-red-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'error' ? <X size={18} strokeWidth={3} /> : <CheckCircle2 size={18} strokeWidth={3} />}
              <span className="text-sm font-black uppercase tracking-widest">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sync Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isSyncMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-bg md:max-w-md w-72 rounded-2xl shadow-2xl z-[100] border border-brand-border p-4 flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1 border-b border-brand-border pb-2">
                <span className="text-[9px] font-black uppercase text-brand-text-muted leading-none tracking-wider">Serviço de Banco de Dados</span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-extrabold text-brand-text-main flex items-center gap-1.5">
                    <Database size={12} className="text-brand-primary" />
                    BD Ativo: <span className="text-brand-primary">{dbStatus?.activeDb === 'mongodb' ? 'MongoDB' : authProvider === 'firebase' ? 'Firebase' : 'Supabase'}</span>
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
              </div>

              <div className="text-[10px] space-y-1 bg-brand-bg-accent/40 p-2.5 rounded-xl border border-brand-border/40 font-mono text-brand-text-muted">
                {authProvider === 'firebase' && (
                  <div className="flex justify-between items-center border-b border-brand-border/30 pb-1 mb-1">
                    <span>Firebase Firestore:</span>
                    <span className="text-emerald-500 font-bold">CONECTADO 🟢</span>
                  </div>
                )}
                {dbStatus && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Supabase Cloud:</span>
                      <span className={dbStatus.supabase.connected ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        {dbStatus.supabase.connected ? 'CONECTADO 🟢' : 'DESCONECTADO 🔴'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span>MongoDB Atlas:</span>
                      <span className={dbStatus.mongodb.connected ? 'text-emerald-500 font-bold' : dbStatus.mongodb.configured ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                        {dbStatus.mongodb.connected ? 'CONECTADO 🟢' : dbStatus.mongodb.configured ? 'ERRO CONEXÃO 🔴' : 'NÃO CONFIGURADO ⚠️'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Botão de Migração inteligente se MongoDB estiver conectado e banco ainda for Supabase */}
              {dbStatus?.mongodb.connected && (
                <button
                  onClick={handleMigrateToMongoDB}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-3 rounded-xl text-[9px] font-black uppercase bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-1.5 hover:shadow-md border border-purple-400 group active:scale-95 disabled:opacity-50"
                  title="Copia todos os seus registros financeiros locais e do Supabase direto para seu novo banco MongoDB Atlas"
                >
                  <RefreshCw size={11} className={isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                  Migrar Tudo para o MongoDB
                </button>
              )}

              {/* Dica amigável de configuração do Atlas */}
              {!dbStatus?.mongodb.configured && (
                <p className="text-[9px] text-brand-text-muted leading-tight border border-dashed border-brand-border/60 p-2 rounded-lg bg-brand-bg/50">
                  💡 <strong>Dica:</strong> Para ativar o MongoDB, configure a variável <strong>MONGODB_URI</strong> no menu Secrets de seu dashboard.
                </p>
              )}

              <div className="flex gap-2 border-t border-brand-border pt-3">
                <button 
                  onClick={() => { pushToCloud(); setIsSyncMenuOpen(false); }}
                  disabled={isSyncing}
                  className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 font-black uppercase text-[9px] border border-emerald-400 active:scale-95 cursor-pointer"
                >
                  <CloudUpload size={12} />
                  Guardar Cloud
                </button>
                
                <button 
                  onClick={() => { pullFromCloud(); setIsSyncMenuOpen(false); }}
                  disabled={isSyncing}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 font-black uppercase text-[9px] border border-blue-400 active:scale-95 cursor-pointer"
                >
                  <CloudDownload size={12} />
                  Baixar Cloud
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
          className={`w-14 h-14 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all active:scale-90 relative ${
            isSyncing ? 'bg-amber-500' : isSyncMenuOpen ? 'bg-slate-800' : 'bg-brand-primary'
          }`}
          title="Sincronização na Nuvem"
        >
          {isSyncing ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : isSyncMenuOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <Cloud size={24} className="text-white" />
          )}
          
          {/* Status Dot */}
          {!isSyncing && !isSyncMenuOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>
    </div>
  );
}
