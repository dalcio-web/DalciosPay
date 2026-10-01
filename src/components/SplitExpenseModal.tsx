import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Split, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  Percent,
  HelpCircle,
  Building2,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, InvestmentType } from '../types';

export interface SplitItem {
  id: string;
  description: string;
  amount: number;
  target: 'expense' | 'investment' | 'piggy';
  category?: 'Fixas' | 'Variáveis';
  investmentType?: InvestmentType;
  institution?: string;
  objective?: string;
  destination?: string;
  dueDate?: string;
}

interface SplitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  initialExpenseId?: string | null;
  onConfirmSplit: (
    originalExpense: Expense,
    parts: SplitItem[],
    replaceOriginal: boolean
  ) => void;
}

const INVESTMENT_TYPES: InvestmentType[] = [
  'Renda Fixa',
  'Ações',
  'FIIs',
  'Cripto',
  'Reserva de Emergência',
  'Previdência',
  'Fundos',
  'Outros'
];

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  isOpen,
  onClose,
  expenses,
  initialExpenseId,
  onConfirmSplit
}) => {
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');
  const [replaceOriginal, setReplaceOriginal] = useState<boolean>(true);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);

  // Find currently selected expense
  const selectedExpense = useMemo(() => {
    return expenses.find(e => e.id === selectedExpenseId) || null;
  }, [expenses, selectedExpenseId]);

  // Set initial expense on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialExpenseId && expenses.some(e => e.id === initialExpenseId)) {
      setSelectedExpenseId(initialExpenseId);
    } else if (expenses.length > 0 && !selectedExpenseId) {
      setSelectedExpenseId(expenses[0].id);
    }
  }, [isOpen, initialExpenseId, expenses]);

  // Whenever selectedExpense changes, initialize 2 split items
  useEffect(() => {
    if (!selectedExpense) return;

    const half = Math.round((selectedExpense.amount / 2) * 100) / 100;
    const remainder = Math.round((selectedExpense.amount - half) * 100) / 100;

    setSplitItems([
      {
        id: 'split-1',
        description: `${selectedExpense.description} (Parte 1)`,
        amount: half,
        target: 'expense',
        category: selectedExpense.category,
        dueDate: selectedExpense.dueDate
      },
      {
        id: 'split-2',
        description: `Aporte - ${selectedExpense.description}`,
        amount: remainder,
        target: 'investment',
        investmentType: 'Renda Fixa',
        institution: 'Corretora / Banco',
        dueDate: selectedExpense.dueDate
      }
    ]);
  }, [selectedExpenseId]);

  const totalOriginal = selectedExpense ? selectedExpense.amount : 0;
  const totalAllocated = useMemo(() => {
    return Math.round(splitItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) * 100) / 100;
  }, [splitItems]);

  const remaining = Math.round((totalOriginal - totalAllocated) * 100) / 100;
  const isBalanced = Math.abs(remaining) < 0.01;

  // Presets
  const handleSplitEvenly = (count: number) => {
    if (!selectedExpense) return;
    const partAmount = Math.floor((totalOriginal / count) * 100) / 100;
    const lastPart = Math.round((totalOriginal - partAmount * (count - 1)) * 100) / 100;

    const newItems: SplitItem[] = Array.from({ length: count }, (_, idx) => {
      const isLast = idx === count - 1;
      const isSecond = idx === 1;
      return {
        id: `split-${Date.now()}-${idx}`,
        description: isSecond
          ? `Aporte Investimento (${selectedExpense.description})`
          : `${selectedExpense.description} (Parte ${idx + 1})`,
        amount: isLast ? lastPart : partAmount,
        target: isSecond ? 'investment' : 'expense',
        category: selectedExpense.category,
        investmentType: isSecond ? 'Renda Fixa' : undefined,
        institution: isSecond ? 'Banco / Corretora' : undefined,
        dueDate: selectedExpense.dueDate
      };
    });

    setSplitItems(newItems);
  };

  const handleAddItem = () => {
    if (!selectedExpense) return;
    const amountToPut = remaining > 0 ? remaining : 0;

    setSplitItems(prev => [
      ...prev,
      {
        id: `split-${Date.now()}`,
        description: `${selectedExpense.description} (Parte ${prev.length + 1})`,
        amount: amountToPut,
        target: 'expense',
        category: selectedExpense.category,
        dueDate: selectedExpense.dueDate
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (splitItems.length <= 2) return;
    setSplitItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<SplitItem>) => {
    setSplitItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleAutoBalanceLast = () => {
    if (splitItems.length === 0) return;
    const lastItem = splitItems[splitItems.length - 1];
    const otherSum = splitItems.slice(0, -1).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const needed = Math.max(0, Math.round((totalOriginal - otherSum) * 100) / 100);
    handleUpdateItem(lastItem.id, { amount: needed });
  };

  const handleConfirm = () => {
    if (!selectedExpense) return;
    if (splitItems.length < 2) return;
    if (!isBalanced) return;

    onConfirmSplit(selectedExpense, splitItems, replaceOriginal);
    onClose();
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[75] overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 15 }} 
        className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl border border-brand-border flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-brand-border flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary text-white rounded-2xl shadow-sm">
              <Split size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 uppercase flex items-center gap-2">
                Fazer Contas & Dividir
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Desmembre o valor de uma conta e direcione para outras despesas ou <span className="font-bold text-brand-primary">Investimentos</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Step 1: Select Expense */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider ml-1 flex items-center gap-1.5">
              <span>1. Selecione a Conta Cadastrada para Dividir</span>
            </label>
            
            {expenses.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                <span>Nenhuma conta cadastrada neste mês para dividir. Cadastre uma despesa primeiro!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <select 
                  value={selectedExpenseId}
                  onChange={(e) => setSelectedExpenseId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  {expenses.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.description} — {formatMoney(e.amount)} ({e.category})
                    </option>
                  ))}
                </select>

                {selectedExpense && (
                  <div className="px-4 py-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between sm:justify-start gap-3">
                    <span className="text-[10px] font-black uppercase text-blue-700">Valor Total:</span>
                    <span className="text-base font-black font-mono text-blue-900">
                      {formatMoney(selectedExpense.amount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedExpense && (
            <>
              {/* Allocation Bar & Real-time Math Feedback */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    Balanço da Divisão
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSplitEvenly(2)}
                      className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      50% / 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSplitEvenly(3)}
                      className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      Em 3 partes
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  {splitItems.map((item, idx) => {
                    const pct = totalOriginal > 0 ? (item.amount / totalOriginal) * 100 : 0;
                    const colors = [
                      'bg-blue-500', 
                      'bg-purple-600', 
                      'bg-emerald-500', 
                      'bg-amber-500', 
                      'bg-rose-500'
                    ];
                    const color = item.target === 'investment' 
                      ? 'bg-purple-600' 
                      : item.target === 'piggy' 
                      ? 'bg-emerald-500' 
                      : colors[idx % colors.length];
                    return (
                      <div 
                        key={item.id} 
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} 
                        className={`${color} transition-all duration-300 relative`}
                        title={`${item.description}: ${formatMoney(item.amount)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Original</span>
                    <span className="text-xs font-black font-mono text-slate-800">{formatMoney(totalOriginal)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Distribuído</span>
                    <span className="text-xs font-black font-mono text-brand-primary">{formatMoney(totalAllocated)}</span>
                  </div>
                  <div className={`p-2 rounded-xl border transition-all ${
                    isBalanced 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : remaining > 0 
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <span className="text-[9px] font-black uppercase block opacity-80">
                      {isBalanced ? 'Status' : remaining > 0 ? 'Falta Distribuir' : 'Excesso'}
                    </span>
                    <span className="text-xs font-black font-mono">
                      {isBalanced ? '✓ 100% Exato' : formatMoney(Math.abs(remaining))}
                    </span>
                  </div>
                </div>

                {!isBalanced && remaining > 0 && (
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                    <span>Ainda restam {formatMoney(remaining)} para completar o total da conta.</span>
                    <button
                      type="button"
                      onClick={handleAutoBalanceLast}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      Ajustar no Último
                    </button>
                  </div>
                )}
                {!isBalanced && remaining < 0 && (
                  <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    A soma das partes ultrapassou o valor da conta original em {formatMoney(Math.abs(remaining))}. Reduza algum valor abaixo.
                  </div>
                )}
              </div>

              {/* Step 2: Split Parts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider ml-1">
                    2. Partes Divididas ({splitItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-black text-brand-primary hover:text-blue-700 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar Outra Parte
                  </button>
                </div>

                <div className="space-y-3">
                  {splitItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        item.target === 'investment' 
                          ? 'bg-purple-50/50 border-purple-200 ring-1 ring-purple-200' 
                          : item.target === 'piggy' 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                            item.target === 'investment' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-black uppercase text-slate-700">
                            Parte #{index + 1}
                          </span>
                        </div>

                        {splitItems.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                            title="Remover esta parte"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Descrição desta parte</label>
                          <input 
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            placeholder="Ex: Mercado, Investimento Tesouro, etc."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-brand-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-slate-400">Valor desta parte</label>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {totalOriginal > 0 ? `${((item.amount / totalOriginal) * 100).toFixed(0)}% da conta` : ''}
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input 
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.amount || ''}
                              onChange={(e) => handleUpdateItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-brand-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Destination Picker */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <label className="text-[10px] font-black uppercase text-slate-400">Para onde vai esse dinheiro?</label>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { target: 'expense' })}
                            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                              item.target === 'expense'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black">
                              <Wallet size={13} /> Despesa
                            </div>
                            <span className={`text-[9px] leading-tight ${item.target === 'expense' ? 'text-blue-100' : 'text-slate-400'}`}>
                              Contas do mês
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { target: 'investment', investmentType: item.investmentType || 'Renda Fixa' })}
                            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                              item.target === 'investment'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black">
                              <TrendingUp size={13} /> Investimento
                            </div>
                            <span className={`text-[9px] leading-tight ${item.target === 'investment' ? 'text-purple-100 font-bold' : 'text-purple-600 font-bold'}`}>
                              ★ Visão de Aportes
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { target: 'piggy' })}
                            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                              item.target === 'piggy'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black">
                              <PiggyBank size={13} /> Cofrinho
                            </div>
                            <span className={`text-[9px] leading-tight ${item.target === 'piggy' ? 'text-emerald-100' : 'text-slate-400'}`}>
                              Reserva / Sonhos
                            </span>
                          </button>
                        </div>

                        {/* Extra fields if target is investment */}
                        {item.target === 'investment' && (
                          <div className="space-y-2 pt-2 bg-purple-100/60 p-3 rounded-xl border border-purple-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[9px] font-black uppercase text-purple-900 block mb-1">Tipo de Ativo</label>
                                <select 
                                  value={item.investmentType || 'Renda Fixa'}
                                  onChange={(e) => handleUpdateItem(item.id, { investmentType: e.target.value as InvestmentType })}
                                  className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                >
                                  {INVESTMENT_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-purple-900 block mb-1">Banco / Corretora</label>
                                <input 
                                  type="text"
                                  value={item.institution || ''}
                                  onChange={(e) => handleUpdateItem(item.id, { institution: e.target.value })}
                                  placeholder="Ex: XP, NuInvest, Inter, BTG..."
                                  className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[9px] font-black uppercase text-purple-900 block mb-1">
                                  🎯 Para o que serve? (Objetivo)
                                </label>
                                <input 
                                  type="text"
                                  value={item.objective || ''}
                                  onChange={(e) => handleUpdateItem(item.id, { objective: e.target.value })}
                                  placeholder="Ex: Reserva, Aposentadoria, Viagem..."
                                  className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-purple-900 block mb-1">
                                  🏦 Para onde vai? (Destino / Ativo)
                                </label>
                                <input 
                                  type="text"
                                  value={item.destination || ''}
                                  onChange={(e) => handleUpdateItem(item.id, { destination: e.target.value })}
                                  placeholder="Ex: Tesouro Selic, CDB 110%, MXRF11..."
                                  className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Extra fields if target is expense */}
                        {item.target === 'expense' && (
                          <div className="flex gap-2 pt-1">
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                              <span>Categoria da Despesa:</span>
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { category: 'Fixas' })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                  item.category === 'Fixas' 
                                    ? 'bg-slate-800 text-white' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Fixa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { category: 'Variáveis' })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                  item.category === 'Variáveis' 
                                    ? 'bg-slate-800 text-white' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Variável
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Replace original toggle */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={replaceOriginal}
                    onChange={(e) => setReplaceOriginal(e.target.checked)}
                    className="mt-1 rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      Substituir a conta original pelas novas divisões
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-relaxed block">
                      Recomendado: Remove a conta inteira de {formatMoney(totalOriginal)} e cadastra as partes divididas. Os totais ficam 100% equilibrados sem duplicar cobranças.
                    </span>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-brand-border bg-slate-50 flex items-center justify-between gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-white transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button 
            type="button"
            disabled={!selectedExpense || !isBalanced || splitItems.length < 2}
            onClick={handleConfirm}
            className="px-6 py-3 bg-brand-primary hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-brand-primary text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={3} />
            Confirmar Divisão da Conta
          </button>
        </div>
      </motion.div>
    </div>
  );
};
