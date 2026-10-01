import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Split, 
  Wallet, 
  Building2, 
  CalendarDays, 
  Trash2, 
  Edit2, 
  Copy, 
  Search, 
  Filter, 
  X, 
  Check, 
  ArrowUpRight, 
  PieChart as PieChartIcon, 
  BarChart3, 
  DollarSign, 
  Percent, 
  Layers, 
  Sparkles,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Shield,
  Coins,
  LifeBuoy,
  Clock,
  Target,
  LayoutGrid,
  List,
  Landmark,
  Compass,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { InvestmentEntry, InvestmentType, MonthData } from '../types';

interface InvestmentsViewProps {
  currentMonthId: string;
  allMonths: { [monthId: string]: MonthData };
  currentMonthData: MonthData;
  onAddInvestment: (entry: Omit<InvestmentEntry, 'id'>) => void;
  onUpdateInvestment: (entry: InvestmentEntry) => void;
  onDeleteInvestment: (id: string) => void;
  onDuplicateInvestment: (entry: InvestmentEntry) => void;
  onOpenSplitModal: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  getMonthLabel: (monthId: string) => string;
}

const DEFAULT_INVESTMENT_TYPES: InvestmentType[] = [
  'Renda Fixa',
  'Ações',
  'FIIs',
  'Cripto',
  'Reserva de Emergência',
  'Previdência',
  'Fundos',
  'Outros'
];

const TYPE_COLORS: Record<string, string> = {
  'Renda Fixa': '#3B82F6', // Blue
  'Ações': '#8B5CF6', // Purple
  'FIIs': '#10B981', // Emerald
  'Cripto': '#F59E0B', // Amber
  'Reserva de Emergência': '#06B6D4', // Cyan
  'Previdência': '#EC4899', // Pink
  'Fundos': '#6366F1', // Indigo
  'Outros': '#64748B' // Slate
};

const DYNAMIC_PALETTE = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#06B6D4',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F43F5E',
  '#84CC16',
  '#D946EF',
  '#F97316',
  '#0284C7',
  '#64748B'
];

export const getCategoryColor = (category?: string): string => {
  if (!category || !category.trim()) return '#64748B';
  const trimmed = category.trim();
  if (TYPE_COLORS[trimmed]) return TYPE_COLORS[trimmed];
  
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
  return DYNAMIC_PALETTE[index];
};

export const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Renda Fixa':
      return Shield;
    case 'Ações':
      return TrendingUp;
    case 'FIIs':
      return Building2;
    case 'Cripto':
      return Coins;
    case 'Reserva de Emergência':
      return LifeBuoy;
    case 'Previdência':
      return Clock;
    case 'Fundos':
      return Layers;
    case 'Imóveis':
      return Landmark;
    default:
      return Target;
  }
};

const OBJECTIVE_PRESETS = [
  { label: 'Reserva de Emergência', icon: '🛡️' },
  { label: 'Aposentadoria / Futuro', icon: '🌴' },
  { label: 'Renda Passiva / Dividendos', icon: '💰' },
  { label: 'Casa Própria / Reforma', icon: '🏠' },
  { label: 'Viagem / Férias', icon: '✈️' },
  { label: 'Carro / Veículo', icon: '🚗' },
  { label: 'Educação / Filhos', icon: '🎓' },
  { label: 'Oportunidades', icon: '⚡' }
];

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  currentMonthId,
  allMonths,
  currentMonthData,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onDuplicateInvestment,
  onOpenSplitModal,
  onPrevMonth,
  onNextMonth,
  getMonthLabel
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'general' | 'by_category' | 'by_objective'>('general');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<InvestmentEntry | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    type: string;
    isCreatingNewCategory: boolean;
    newCategoryName: string;
    institution: string;
    objective: string;
    destination: string;
    date: string;
    notes: string;
  }>({
    description: '',
    amount: '',
    type: 'Renda Fixa',
    isCreatingNewCategory: false,
    newCategoryName: '',
    institution: '',
    objective: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const investments: InvestmentEntry[] = currentMonthData.investments || [];

  // All available categories combined (defaults + discovered in months + custom session)
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_INVESTMENT_TYPES);
    (Object.values(allMonths) as MonthData[]).forEach(month => {
      (month?.investments || []).forEach(inv => {
        if (inv.type && inv.type.trim()) {
          set.add(inv.type.trim());
        }
      });
    });
    customCategories.forEach(cat => {
      if (cat.trim()) set.add(cat.trim());
    });
    return Array.from(set);
  }, [allMonths, customCategories]);

  // Metrics
  const currentMonthTotal = useMemo(() => {
    return investments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [investments]);

  // Total income for savings rate
  const totalIncome = useMemo(() => {
    const salary = Number(currentMonthData.salary || 0);
    const extras = (currentMonthData.extraIncomes || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return salary + extras;
  }, [currentMonthData]);

  const savingsRate = totalIncome > 0 ? (currentMonthTotal / totalIncome) * 100 : 0;

  // Cumulative all-time invested
  const totalAllTimeInvested = useMemo(() => {
    return (Object.values(allMonths) as MonthData[]).reduce((totalAcc, month) => {
      const monthInv = (month?.investments || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      return totalAcc + monthInv;
    }, 0);
  }, [allMonths]);

  // Split-derived investments
  const splitDerivedInvestments = useMemo(() => {
    return investments.filter(inv => Boolean(inv.splitFromDescription || inv.splitFromId));
  }, [investments]);

  const splitDerivedTotal = useMemo(() => {
    return splitDerivedInvestments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [splitDerivedInvestments]);

  // Distribution by asset type for current month
  const distributionData = useMemo(() => {
    const grouped: Record<string, number> = {};
    investments.forEach(inv => {
      const t = inv.type || 'Outros';
      grouped[t] = (grouped[t] || 0) + (Number(inv.amount) || 0);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name)
    })).sort((a, b) => b.value - a.value);
  }, [investments]);

  // Historical evolution by month
  const historyData = useMemo(() => {
    const sortedMonthIds = Object.keys(allMonths).sort();
    const recentIds = sortedMonthIds.slice(-6);

    return recentIds.map(mId => {
      const monthObj = allMonths[mId];
      const sum = (monthObj?.investments || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const [year, monthNum] = mId.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const shortName = `${monthNames[parseInt(monthNum, 10) - 1]}/${year.slice(2)}`;
      return {
        monthId: mId,
        label: shortName,
        total: sum
      };
    });
  }, [allMonths]);

  // Filtered investments list
  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      const matchesType = selectedTypeFilter === 'all' || (inv.type || 'Outros') === selectedTypeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        inv.description.toLowerCase().includes(q) || 
        (inv.institution && inv.institution.toLowerCase().includes(q)) ||
        (inv.objective && inv.objective.toLowerCase().includes(q)) ||
        (inv.destination && inv.destination.toLowerCase().includes(q)) ||
        (inv.splitFromDescription && inv.splitFromDescription.toLowerCase().includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [investments, selectedTypeFilter, searchQuery]);

  // Grouped by Category / Type
  const investmentsByCategory = useMemo(() => {
    const groups: Record<string, InvestmentEntry[]> = {};
    filteredInvestments.forEach(inv => {
      const cat = inv.type || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(inv);
    });
    return Object.entries(groups).map(([category, items]) => {
      const total = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const percentage = currentMonthTotal > 0 ? (total / currentMonthTotal) * 100 : 0;
      return {
        category,
        total,
        percentage,
        items
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredInvestments, currentMonthTotal]);

  // Grouped by Objective ("Para o que serve")
  const investmentsByObjective = useMemo(() => {
    const groups: Record<string, InvestmentEntry[]> = {};
    filteredInvestments.forEach(inv => {
      const obj = inv.objective?.trim() || 'Geral / Sem Objetivo Definido';
      if (!groups[obj]) groups[obj] = [];
      groups[obj].push(inv);
    });
    return Object.entries(groups).map(([objective, items]) => {
      const total = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const percentage = currentMonthTotal > 0 ? (total / currentMonthTotal) * 100 : 0;
      return {
        objective,
        total,
        percentage,
        items
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredInvestments, currentMonthTotal]);

  const handleOpenAddModal = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'Renda Fixa',
      isCreatingNewCategory: false,
      newCategoryName: '',
      institution: '',
      objective: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingEntry(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (entry: InvestmentEntry) => {
    setEditingEntry(entry);
    setFormData({
      description: entry.description,
      amount: entry.amount.toString(),
      type: entry.type || 'Renda Fixa',
      isCreatingNewCategory: false,
      newCategoryName: '',
      institution: entry.institution || '',
      objective: entry.objective || '',
      destination: entry.destination || '',
      date: entry.date || new Date().toISOString().split('T')[0],
      notes: entry.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (!formData.description.trim() || isNaN(amountNum) || amountNum <= 0) return;

    let finalType = formData.type;
    if (formData.isCreatingNewCategory && formData.newCategoryName.trim()) {
      finalType = formData.newCategoryName.trim();
      setCustomCategories(prev => prev.includes(finalType) ? prev : [...prev, finalType]);
    }

    if (editingEntry) {
      onUpdateInvestment({
        ...editingEntry,
        description: formData.description.trim(),
        amount: amountNum,
        type: finalType,
        institution: formData.institution.trim() || undefined,
        objective: formData.objective.trim() || undefined,
        destination: formData.destination.trim() || undefined,
        date: formData.date,
        notes: formData.notes.trim() || undefined
      });
    } else {
      onAddInvestment({
        description: formData.description.trim(),
        amount: amountNum,
        type: finalType,
        institution: formData.institution.trim() || undefined,
        objective: formData.objective.trim() || undefined,
        destination: formData.destination.trim() || undefined,
        date: formData.date,
        notes: formData.notes.trim() || undefined
      });
    }

    setIsAddModalOpen(false);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-8 pb-20 relative">
      {openMenuId && (
        <div 
          className="fixed inset-0 z-30 bg-transparent" 
          onClick={() => setOpenMenuId(null)} 
        />
      )}

      {/* Month Navigation & Subheader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-purple-200">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-800">
                Carteira de Investimentos
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Aportes & Ativos
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Controle para o que serve cada aplicação e para onde seu dinheiro está indo.
            </p>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black uppercase tracking-wider px-3 text-slate-700">
              {getMonthLabel(currentMonthId)}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-purple-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Novo Aporte</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invested This Month */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Aportes do Mês</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {formatMoney(currentMonthTotal)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mt-1">
              <span>{investments.length} {investments.length === 1 ? 'aporte' : 'aportes'} realizados</span>
            </div>
          </div>
        </div>

        {/* Card 2: Savings Rate */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Taxa de Poupança</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-600">
              {savingsRate.toFixed(1)}%
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              Da renda líquida total do mês
            </div>
          </div>
        </div>

        {/* Card 3: Split-origin Investments */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vindos de Contas Divididas</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Split size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-blue-700">
              {formatMoney(splitDerivedTotal)}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-1">
              <span>{splitDerivedInvestments.length} {splitDerivedInvestments.length === 1 ? 'item' : 'itens'}</span>
              <button 
                type="button"
                onClick={onOpenSplitModal}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                + Dividir Conta
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: All-time Total */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white p-5 rounded-3xl shadow-lg shadow-purple-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-200">
            <span className="text-[10px] font-black uppercase tracking-wider">Patrimônio Aportado</span>
            <div className="p-2 bg-white/10 text-white rounded-xl backdrop-blur-xs">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight">
              {formatMoney(totalAllTimeInvested)}
            </div>
            <div className="text-[11px] font-medium text-purple-200 mt-1">
              Soma total em todos os meses registrados
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts: Asset Allocation & Monthly History */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Asset Allocation Pie/Donut */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-600" />
                <span>Alocação por Categoria ({getMonthLabel(currentMonthId)})</span>
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase">
                {distributionData.length} {distributionData.length === 1 ? 'classe' : 'classes'}
              </span>
            </div>

            <div className="h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [formatMoney(Number(value)), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</span>
                <span className="text-xs font-black font-mono text-slate-800">{formatMoney(currentMonthTotal)}</span>
              </div>
            </div>

            {/* Legend Chips */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {distributionData.map((item) => {
                const percent = currentMonthTotal > 0 ? (item.value / currentMonthTotal) * 100 : 0;
                const IconComponent = getCategoryIcon(item.name);
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs font-bold text-slate-700 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <IconComponent size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-slate-900">{formatMoney(item.value)}</span>
                      <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Evolution Bar Chart */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" />
                <span>Evolução dos Aportes (Últimos Meses)</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400">Histórico de disciplina</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94A3B8' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }} 
                    tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  />
                  <RechartsTooltip 
                    formatter={(val: any) => [formatMoney(Number(val)), 'Aportado']}
                    cursor={{ fill: 'rgba(243, 232, 255, 0.4)' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#8B5CF6" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search + Category Filter Tabs + View Mode Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ativo, corretora, objetivo (ex: reserva, viagem, aposentadoria)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-purple-600 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* View Mode Selector (Geral vs Por Categoria vs Por Objetivo) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('general')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'general'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visão Geral unificada"
            >
              <List size={14} />
              <span>Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_category')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'by_category'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Exibir agrupado por tipo de ativo"
            >
              <LayoutGrid size={14} />
              <span>Por Tipo / Categoria</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_objective')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'by_objective'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Exibir agrupado pelo objetivo de vida"
            >
              <Target size={14} />
              <span>Por Objetivo</span>
            </button>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({investments.length})
          </button>
          {allAvailableCategories.map(t => {
            const count = investments.filter(i => (i.type || 'Outros') === t).length;
            if (count === 0 && selectedTypeFilter !== t) return null;
            const catColor = getCategoryColor(t);
            const isSelected = selectedTypeFilter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                style={isSelected ? { backgroundColor: catColor } : {}}
              >
                <span>{t}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area Based on viewMode */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mx-auto">
            <TrendingUp size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              {searchQuery || selectedTypeFilter !== 'all' 
                ? 'Nenhum investimento encontrado com esses filtros' 
                : 'Nenhum investimento cadastrado neste mês'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {searchQuery || selectedTypeFilter !== 'all'
                ? 'Tente limpar a busca ou mudar o filtro por categoria.'
                : 'Faça um novo aporte ou divida o valor de uma conta já cadastrada para investir!'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-purple-100 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} strokeWidth={3} /> Cadastrar Aporte
            </button>
            <button
              type="button"
              onClick={onOpenSplitModal}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Split size={15} /> Dividir Conta Cadastrada
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW 1: GENERAL UNIFIED LIST */}
          {viewMode === 'general' && (
            <div className="bg-white rounded-3xl border border-brand-border shadow-xs relative">
              <div className="px-6 py-4 border-b border-brand-border bg-slate-50/70 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span>Aportes & Ativos do Mês (Visão Geral)</span>
                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    {filteredInvestments.length} {filteredInvestments.length === 1 ? 'item' : 'itens'}
                  </span>
                </h2>

                <div className="text-right font-mono text-xs font-black text-slate-800">
                  Total: {formatMoney(currentMonthTotal)}
                </div>
              </div>

              <div className="divide-y divide-slate-100 rounded-b-3xl">
                <AnimatePresence mode="popLayout">
                  {filteredInvestments.map((entry, index) => {
                    const isSplitOrigin = Boolean(entry.splitFromDescription || entry.splitFromId);
                    const color = getCategoryColor(entry.type || 'Outros');
                    const IconComponent = getCategoryIcon(entry.type);
                    const isLast = index === filteredInvestments.length - 1;

                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`group flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50/70 transition-colors relative ${isLast ? 'rounded-b-3xl' : ''} ${openMenuId === entry.id ? 'z-40' : 'z-10'}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: color }}
                          >
                            <IconComponent size={18} />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-slate-800 truncate">
                                {entry.description}
                              </span>

                              {/* Category Badge */}
                              {entry.type && (
                                <span 
                                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white flex items-center gap-1 shadow-2xs"
                                  style={{ backgroundColor: color }}
                                >
                                  <IconComponent size={10} />
                                  {entry.type}
                                </span>
                              )}

                              {/* Objective Badge ("Para o que serve") */}
                              {entry.objective && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1">
                                  <span>🎯</span>
                                  <span>{entry.objective}</span>
                                </span>
                              )}

                              {/* Destination / Asset Badge ("Para onde vai") */}
                              {entry.destination && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                                  <Building2 size={10} className="text-emerald-600" />
                                  <span>Para: {entry.destination}</span>
                                </span>
                              )}

                              {/* Provenance badge */}
                              {isSplitOrigin ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                  <Split size={10} />
                                  Divisão de: {entry.splitFromDescription || 'Conta'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                                  <Sparkles size={9} /> Direto
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-400">
                              {entry.institution && (
                                <span className="flex items-center gap-1 text-slate-600 font-bold">
                                  <Landmark size={12} className="text-slate-400" />
                                  {entry.institution}
                                </span>
                              )}
                              {entry.date && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={12} />
                                  {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {entry.notes && (
                                <span className="italic text-slate-400 truncate max-w-[220px]">
                                  "{entry.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-black font-mono text-purple-700">
                              {formatMoney(entry.amount)}
                            </div>
                          </div>

                          {/* Dropdown Options */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === entry.id ? null : entry.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMenuId === entry.id && (
                              <div className={`absolute right-0 ${isLast && filteredInvestments.length > 2 ? 'bottom-full mb-1' : 'top-full mt-1'} w-36 bg-white border border-brand-border rounded-xl shadow-2xl py-1 z-50 text-xs font-bold uppercase text-slate-700 animate-in fade-in zoom-in-95 duration-150`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDuplicateInvestment(entry);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Copy size={12} /> Duplicar Mês
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEditModal(entry);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Edit2 size={12} /> Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteInvestment(entry.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-red-50 hover:text-red-600 text-red-500 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} /> Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* VIEW 2: GROUPED BY CATEGORY / TYPE */}
          {viewMode === 'by_category' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Visão Segregada por Classe de Ativo ({investmentsByCategory.length} categorias)
                </span>
                <span className="text-xs font-mono font-bold text-purple-700">
                  Total: {formatMoney(currentMonthTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {investmentsByCategory.map((group) => {
                  const catColor = getCategoryColor(group.category);
                  const IconComponent = getCategoryIcon(group.category);

                  return (
                    <div 
                      key={group.category}
                      className="bg-white rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between overflow-hidden"
                    >
                      {/* Category Header */}
                      <div 
                        className="p-5 border-b border-slate-100 flex items-center justify-between"
                        style={{ borderTop: `4px solid ${catColor}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: catColor }}
                          >
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {group.category}
                              </h3>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {group.percentage.toFixed(1)}% do total investido neste mês
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black font-mono" style={{ color: catColor }}>
                            {formatMoney(group.total)}
                          </div>
                        </div>
                      </div>

                      {/* Items Inside Category */}
                      <div className="divide-y divide-slate-100 flex-1">
                        {group.items.map((item) => (
                          <div 
                            key={item.id}
                            className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate">
                                  {item.description}
                                </span>
                                {item.objective && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    🎯 {item.objective}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                {item.destination && (
                                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                                    <Building2 size={10} /> {item.destination}
                                  </span>
                                )}
                                {item.institution && (
                                  <span className="text-slate-500">
                                    ({item.institution})
                                  </span>
                                )}
                                {item.date && (
                                  <span>{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold text-slate-800">
                                {formatMoney(item.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                                title="Editar"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: GROUPED BY OBJECTIVE ("PARA O QUE SERVE") */}
          {viewMode === 'by_objective' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Target size={15} className="text-amber-600" />
                  <span>Visão por Objetivo de Vida ("Para o que serve")</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-700">
                  Total: {formatMoney(currentMonthTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {investmentsByObjective.map((group) => {
                  return (
                    <div 
                      key={group.objective}
                      className="bg-white rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between overflow-hidden"
                    >
                      {/* Objective Header */}
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-amber-700 bg-amber-100 border border-amber-200 shadow-xs">
                            <Target size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {group.objective}
                              </h3>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                                {group.items.length} {group.items.length === 1 ? 'aporte' : 'aportes'}
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                              {group.percentage.toFixed(1)}% do esforço de investimento do mês
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black font-mono text-amber-800">
                            {formatMoney(group.total)}
                          </div>
                        </div>
                      </div>

                      {/* Items for this Objective */}
                      <div className="divide-y divide-slate-100 flex-1">
                        {group.items.map((item) => {
                          const catColor = getCategoryColor(item.type);
                          return (
                            <div 
                              key={item.id}
                              className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-800 truncate">
                                    {item.description}
                                  </span>
                                  {item.type && (
                                    <span 
                                      className="text-[9px] font-black uppercase px-2 py-0.5 rounded text-white"
                                      style={{ backgroundColor: catColor }}
                                    >
                                      {item.type}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                  {item.destination && (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                      <Building2 size={10} /> Para onde vai: {item.destination}
                                    </span>
                                  )}
                                  {item.institution && (
                                    <span className="text-slate-500">
                                      ({item.institution})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-800">
                                  {formatMoney(item.amount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                                  title="Editar"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Add or Edit Investment */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-[26px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-brand-border max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase text-slate-800">
                      {editingEntry ? 'Editar Investimento' : 'Novo Aporte'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Defina o tipo, finalidade e para onde vai este aporte
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                {/* Nome do Investimento */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Nome / Título do Aporte *
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Aporte Mensal Tesouro, Compra FII MXRF11, CDB Inter..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-600"
                  />
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      Valor do Aporte *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-purple-800 outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      Data do Aporte
                    </label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Categoria / Tipo de Ativo COM OPÇÃO DE CRIAR NOVA CATEGORIA */}
                <div className="space-y-1.5 p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-purple-950 ml-1 flex items-center gap-1.5">
                      <Tag size={12} className="text-purple-600" />
                      <span>Categoria / Tipo de Ativo *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        isCreatingNewCategory: !prev.isCreatingNewCategory,
                        newCategoryName: ''
                      }))}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {formData.isCreatingNewCategory ? '← Escolher existente' : '+ Criar Nova Categoria'}
                    </button>
                  </div>

                  {formData.isCreatingNewCategory ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={formData.newCategoryName}
                          onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                          placeholder="Digite o nome da nova categoria (ex: Tesouro Direto, Ouro, Startups...)"
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl font-bold text-xs text-purple-950 outline-none focus:border-purple-600"
                        />
                        {formData.newCategoryName.trim() && (
                          <span 
                            className="text-[10px] font-black px-2.5 py-2 rounded-xl text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: getCategoryColor(formData.newCategoryName) }}
                          >
                            {formData.newCategoryName.trim()}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-purple-700 font-medium ml-1">
                        Esta categoria será criada automaticamente e disponibilizada nos seus filtros e relatórios.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
                      >
                        {allAvailableCategories.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-purple-200 text-xs font-bold text-slate-700">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: getCategoryColor(formData.type) }}
                        />
                        <span className="truncate">{formData.type}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🎯 Para o que serve? (Objetivo / Finalidade) */}
                <div className="space-y-1.5 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-amber-950 ml-1 flex items-center gap-1.5">
                      <span>🎯 Para o que serve? (Objetivo / Finalidade)</span>
                    </label>
                    <span className="text-[9px] font-bold text-amber-700">Meta de Vida</span>
                  </div>

                  <input
                    type="text"
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    placeholder="Ex: Reserva de Emergência, Aposentadoria, Liberdade Financeira, Viagem..."
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-600"
                  />

                  {/* Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {OBJECTIVE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, objective: preset.label }))}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          formData.objective === preset.label
                            ? 'bg-amber-200 text-amber-900 border-amber-300 font-black shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50/60'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🏦 Para onde vai? (Destino / Aplicação & Corretora) */}
                <div className="space-y-1.5 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <label className="text-[10px] font-black uppercase text-emerald-950 ml-1 flex items-center gap-1.5">
                    <Building2 size={12} className="text-emerald-600" />
                    <span>🏦 Para onde vai? (Destino & Instituição)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">
                        Ativo / Aplicação Destino
                      </label>
                      <input 
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        placeholder="Ex: Tesouro Selic 2029, CDB 110%, BTC..."
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-1">
                        Banco / Corretora
                      </label>
                      <input 
                        type="text"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        placeholder="Ex: XP, NuInvest, Inter, BTG, Binance..."
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Observações (Opcional)
                  </label>
                  <input 
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Dividendo reinvestido, reserva para oportunidade..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:border-purple-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check size={16} strokeWidth={3} />
                  {editingEntry ? 'Salvar Alterações' : 'Confirmar Aporte'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
