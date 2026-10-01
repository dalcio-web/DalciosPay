import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  ArrowLeft,
  DollarSign,
  Users,
  Car,
  Plane,
  Bus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Copy,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Receipt,
  Search,
  Filter,
  CheckSquare,
  Square,
  PieChart as PieChartIcon,
  ShoppingBag,
  ShoppingCart,
  Hotel,
  Utensils,
  Fuel,
  Ticket,
  Luggage,
  Sparkles,
  ExternalLink,
  Send,
  MoreVertical,
  X,
  Palmtree,
  Sun,
  ShieldAlert,
  ArrowUpRight
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
import { 
  TripProject, 
  TripExpense, 
  TripExpenseCategory, 
  TripPaymentStatus, 
  TripPaymentMethod,
  TripStatus,
  TripItineraryDay,
  TripItineraryActivity,
  TripChecklistItem,
  MonthData,
  Expense
} from '../types';

interface TripsViewProps {
  trips: TripProject[];
  currentMonthId: string;
  currentMonthData: MonthData;
  allMonths: { [monthId: string]: MonthData };
  onSaveTrip: (trip: TripProject) => void;
  onDeleteTrip: (tripId: string) => void;
  onDuplicateTrip: (trip: TripProject) => void;
  onSyncExpenseToMonth: (targetMonthId: string, expense: Omit<Expense, 'id'>, tripExpenseId: string) => void;
  formatCurrency: (value: number) => string;
  getMonthLabel: (monthId: string) => string;
}

export const TRIP_CATEGORIES: {
  category: TripExpenseCategory;
  icon: any;
  color: string;
  bgLight: string;
  description: string;
}[] = [
  {
    category: 'Pedágios',
    icon: Car,
    color: '#F59E0B',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Tarifas e praças de pedágio em rodovias'
  },
  {
    category: 'Combustível',
    icon: Fuel,
    color: '#EF4444',
    bgLight: 'bg-red-50 text-red-700 border-red-200',
    description: 'Gasolina, Etanol, Diesel ou recarga elétrica'
  },
  {
    category: 'Transporte & Passagens',
    icon: Plane,
    color: '#0284C7',
    bgLight: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Passagens aéreas, ônibus, Uber, transfer, aluguel'
  },
  {
    category: 'Hospedagem',
    icon: Hotel,
    color: '#8B5CF6',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Hotel, pousada, Airbnb, resort, diárias'
  },
  {
    category: 'Mercado & Mantimentos',
    icon: ShoppingCart,
    color: '#10B981',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Compras de supermercado, mantimentos e lanches'
  },
  {
    category: 'Restaurantes & Alimentação',
    icon: Utensils,
    color: '#F97316',
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Restaurantes, bares, cafeterias e quiosques'
  },
  {
    category: 'Passeios & Atrações',
    icon: Ticket,
    color: '#6366F1',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Ingressos, passeios de barco, parques e guias'
  },
  {
    category: 'Custos no Local & Taxas',
    icon: Sun,
    color: '#14B8A6',
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Taxas ambientais (TPA), estacionamento, praia'
  },
  {
    category: 'Compras & Lembranças',
    icon: ShoppingBag,
    color: '#EC4899',
    bgLight: 'bg-pink-50 text-pink-700 border-pink-200',
    description: 'Souvenirs, artesanato, compras no destino'
  },
  {
    category: 'Seguro & Saúde',
    icon: ShieldAlert,
    color: '#06B6D4',
    bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Seguro viagem, farmácia e primeiros socorros'
  },
  {
    category: 'Outros Custos',
    icon: DollarSign,
    color: '#64748B',
    bgLight: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Despesas diversas e imprevistos na viagem'
  }
];

export const getTripCategoryConfig = (cat: TripExpenseCategory) => {
  return TRIP_CATEGORIES.find(c => c.category === cat) || TRIP_CATEGORIES[TRIP_CATEGORIES.length - 1];
};

const TRIP_GRADIENTS = [
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-slate-700 to-slate-900'
];

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  currentMonthId,
  currentMonthData,
  allMonths,
  onSaveTrip,
  onDeleteTrip,
  onDuplicateTrip,
  onSyncExpenseToMonth,
  formatCurrency,
  getMonthLabel
}) => {
  // Navigation State
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripProject | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [expenseToSync, setExpenseToSync] = useState<TripExpense | null>(null);
  const [syncTargetMonth, setSyncTargetMonth] = useState<string>(currentMonthId);
  const [syncCategory, setSyncCategory] = useState<'Fixas' | 'Variáveis'>('Variáveis');

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedItineraryDayId, setSelectedItineraryDayId] = useState<string | null>(null);

  // Active tab within selected trip project
  const [projectTab, setProjectTab] = useState<'expenses' | 'analytics' | 'itinerary' | 'checklist'>('expenses');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<string>('all');

  // Currently open trip project
  const currentTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Overall statistics for all trips
  const overallStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalPending = 0;
    let totalPaid = 0;

    trips.forEach(t => {
      totalBudget += Number(t.budget) || 0;
      t.expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        totalSpent += amt;
        if (e.paymentStatus === 'paid') {
          totalPaid += amt;
        } else {
          totalPending += amt;
        }
      });
    });

    const activeCount = trips.filter(t => t.status === 'in_progress' || t.status === 'confirmed').length;

    return {
      tripsCount: trips.length,
      activeCount,
      totalBudget,
      totalSpent,
      totalPaid,
      totalPending
    };
  }, [trips]);

  // Trip Project Specific Calculations
  const projectMetrics = useMemo(() => {
    if (!currentTrip) return null;

    const expenses = currentTrip.expenses || [];
    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalPaid = expenses
      .filter(e => e.paymentStatus === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalPending = expenses
      .filter(e => e.paymentStatus === 'pending')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalEstimated = expenses
      .filter(e => e.paymentStatus === 'estimated')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const budget = Number(currentTrip.budget) || 0;
    const remainingBudget = budget - totalExpenses;
    const budgetUsagePercent = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    // Calculate days duration
    let daysCount = 1;
    if (currentTrip.startDate && currentTrip.endDate) {
      const start = new Date(currentTrip.startDate + 'T00:00:00');
      const end = new Date(currentTrip.endDate + 'T00:00:00');
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    const costPerDay = daysCount > 0 ? totalExpenses / daysCount : totalExpenses;
    const travelers = Math.max(1, currentTrip.travelersCount || 1);
    const costPerTraveler = totalExpenses / travelers;

    // Group by category for charts
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Outros Custos';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => {
      const cfg = getTripCategoryConfig(name as TripExpenseCategory);
      return {
        name,
        value,
        color: cfg.color
      };
    }).sort((a, b) => b.value - a.value);

    // Status breakdown chart data
    const statusChartData = [
      { name: 'Pago', value: totalPaid, color: '#10B981' },
      { name: 'Pendente', value: totalPending, color: '#F59E0B' },
      { name: 'Previsto', value: totalEstimated, color: '#6366F1' }
    ].filter(item => item.value > 0);

    return {
      totalExpenses,
      totalPaid,
      totalPending,
      totalEstimated,
      budget,
      remainingBudget,
      budgetUsagePercent,
      daysCount,
      costPerDay,
      travelers,
      costPerTraveler,
      categoryChartData,
      statusChartData
    };
  }, [currentTrip]);

  // Trip form state
  const [tripFormData, setTripFormData] = useState<{
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    status: TripStatus;
    travelersCount: number;
    travelersNames: string;
    transportType: 'car' | 'plane' | 'bus' | 'motorcycle' | 'rental_car' | 'other';
    coverGradient: string;
    notes: string;
  }>({
    title: '',
    destination: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    budget: '',
    status: 'planning',
    travelersCount: 2,
    travelersNames: '',
    transportType: 'car',
    coverGradient: TRIP_GRADIENTS[0],
    notes: ''
  });

  // Expense form state
  const [expenseFormData, setExpenseFormData] = useState<{
    description: string;
    amount: string;
    category: TripExpenseCategory;
    paymentStatus: TripPaymentStatus;
    paymentMethod: TripPaymentMethod;
    date: string;
    location: string;
    notes: string;
    tollBoothsCount: string;
    fuelType: 'Gasolina' | 'Etanol' | 'Diesel' | 'GNV' | 'Elétrico';
    isInstallment: boolean;
    installmentsCurrent: string;
    installmentsTotal: string;
    paidBy: string;
  }>({
    description: '',
    amount: '',
    category: 'Pedágios',
    paymentStatus: 'pending',
    paymentMethod: 'credit_card',
    date: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    tollBoothsCount: '',
    fuelType: 'Gasolina',
    isInstallment: false,
    installmentsCurrent: '1',
    installmentsTotal: '3',
    paidBy: ''
  });

  // Activity form state
  const [activityFormData, setActivityFormData] = useState<{
    title: string;
    time: string;
    location: string;
    description: string;
    estimatedCost: string;
  }>({
    title: '',
    time: '',
    location: '',
    description: '',
    estimatedCost: ''
  });

  // Checklist quick item state
  const [newChecklistTask, setNewChecklistTask] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<TripChecklistItem['category']>('Veículo & Estrada');

  // Open Create Trip Modal
  const handleOpenNewTripModal = () => {
    setEditingTrip(null);
    setTripFormData({
      title: '',
      destination: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      budget: '',
      status: 'planning',
      travelersCount: 2,
      travelersNames: '',
      transportType: 'car',
      coverGradient: TRIP_GRADIENTS[Math.floor(Math.random() * TRIP_GRADIENTS.length)],
      notes: ''
    });
    setIsTripModalOpen(true);
  };

  // Open Edit Trip Modal
  const handleOpenEditTripModal = (trip: TripProject) => {
    setEditingTrip(trip);
    setTripFormData({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget ? trip.budget.toString() : '',
      status: trip.status,
      travelersCount: trip.travelersCount || 1,
      travelersNames: trip.travelersNames || '',
      transportType: trip.transportType || 'car',
      coverGradient: trip.coverGradient || TRIP_GRADIENTS[0],
      notes: trip.notes || ''
    });
    setIsTripModalOpen(true);
  };

  // Save Trip Project
  const handleSaveTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripFormData.title.trim() || !tripFormData.destination.trim()) return;

    const budgetNum = parseFloat(tripFormData.budget) || 0;

    if (editingTrip) {
      const updated: TripProject = {
        ...editingTrip,
        title: tripFormData.title.trim(),
        destination: tripFormData.destination.trim(),
        startDate: tripFormData.startDate,
        endDate: tripFormData.endDate,
        budget: budgetNum,
        status: tripFormData.status,
        travelersCount: Number(tripFormData.travelersCount) || 1,
        travelersNames: tripFormData.travelersNames.trim() || undefined,
        transportType: tripFormData.transportType,
        coverGradient: tripFormData.coverGradient,
        notes: tripFormData.notes.trim() || undefined,
        updatedAt: new Date().toISOString()
      };
      onSaveTrip(updated);
    } else {
      // Create new trip with default checklist items
      const defaultChecklist: TripChecklistItem[] = [
        { id: `chk-${Date.now()}-1`, category: 'Documentos', task: 'Documentos (CNH, RG, Reservas impressas ou no celular)', completed: false },
        { id: `chk-${Date.now()}-2`, category: 'Veículo & Estrada', task: 'Calibrar pneus (inclusive estepe) e checar óleo e água', completed: false },
        { id: `chk-${Date.now()}-3`, category: 'Veículo & Estrada', task: 'Separar dinheiro trocado ou Tag ativa para pedágios', completed: false },
        { id: `chk-${Date.now()}-4`, category: 'Mala & Bagagem', task: 'Carregadores de celular, powerbank e cabos', completed: false },
        { id: `chk-${Date.now()}-5`, category: 'Mala & Bagagem', task: 'Kit primeiros socorros e remédios de uso contínuo', completed: false },
        { id: `chk-${Date.now()}-6`, category: 'Casa antes de sair', task: 'Desligar registro de gás, trancar janelas e portas', completed: false }
      ];

      // Auto-generate itinerary days
      const days: TripItineraryDay[] = [];
      const start = new Date(tripFormData.startDate + 'T00:00:00');
      const end = new Date(tripFormData.endDate + 'T00:00:00');
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const count = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          id: `day-${Date.now()}-${i}`,
          dayNumber: i + 1,
          date: dateStr,
          title: i === 0 ? 'Viagem de Ida & Chegada' : i === count - 1 ? 'Check-out & Viagem de Retorno' : `Dia ${i + 1} em ${tripFormData.destination.split(',')[0]}`,
          activities: []
        });
      }

      const newTrip: TripProject = {
        id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: tripFormData.title.trim(),
        destination: tripFormData.destination.trim(),
        startDate: tripFormData.startDate,
        endDate: tripFormData.endDate,
        budget: budgetNum,
        status: tripFormData.status,
        travelersCount: Number(tripFormData.travelersCount) || 1,
        travelersNames: tripFormData.travelersNames.trim() || undefined,
        transportType: tripFormData.transportType,
        coverGradient: tripFormData.coverGradient,
        notes: tripFormData.notes.trim() || undefined,
        expenses: [],
        itinerary: days,
        checklist: defaultChecklist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSaveTrip(newTrip);
      setSelectedTripId(newTrip.id);
    }

    setIsTripModalOpen(false);
  };

  // Open Add Expense Modal
  const handleOpenAddExpenseModal = (presetCategory?: TripExpenseCategory) => {
    if (!currentTrip) return;
    setEditingExpense(null);
    setExpenseFormData({
      description: '',
      amount: '',
      category: presetCategory || 'Pedágios',
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      date: currentTrip.startDate || new Date().toISOString().split('T')[0],
      location: '',
      notes: '',
      tollBoothsCount: '',
      fuelType: 'Gasolina',
      isInstallment: false,
      installmentsCurrent: '1',
      installmentsTotal: '3',
      paidBy: ''
    });
    setIsExpenseModalOpen(true);
  };

  // Open Edit Expense Modal
  const handleOpenEditExpenseModal = (expense: TripExpense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      paymentStatus: expense.paymentStatus,
      paymentMethod: expense.paymentMethod || 'credit_card',
      date: expense.date || new Date().toISOString().split('T')[0],
      location: expense.location || '',
      notes: expense.notes || '',
      tollBoothsCount: expense.tollBoothsCount ? expense.tollBoothsCount.toString() : '',
      fuelType: expense.fuelType || 'Gasolina',
      isInstallment: Boolean(expense.installments),
      installmentsCurrent: expense.installments ? expense.installments.current.toString() : '1',
      installmentsTotal: expense.installments ? expense.installments.total.toString() : '3',
      paidBy: expense.paidBy || ''
    });
    setIsExpenseModalOpen(true);
  };

  // Save Expense Submit
  const handleSaveExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip) return;

    const amountNum = parseFloat(expenseFormData.amount);
    if (!expenseFormData.description.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const tollCount = expenseFormData.category === 'Pedágios' && expenseFormData.tollBoothsCount 
      ? parseInt(expenseFormData.tollBoothsCount, 10) 
      : undefined;

    const installments = expenseFormData.isInstallment ? {
      current: parseInt(expenseFormData.installmentsCurrent, 10) || 1,
      total: parseInt(expenseFormData.installmentsTotal, 10) || 1
    } : undefined;

    let updatedExpenses: TripExpense[];

    if (editingExpense) {
      const updatedItem: TripExpense = {
        ...editingExpense,
        description: expenseFormData.description.trim(),
        amount: amountNum,
        category: expenseFormData.category,
        paymentStatus: expenseFormData.paymentStatus,
        paymentMethod: expenseFormData.paymentMethod,
        date: expenseFormData.date,
        location: expenseFormData.location.trim() || undefined,
        notes: expenseFormData.notes.trim() || undefined,
        tollBoothsCount: tollCount,
        fuelType: expenseFormData.category === 'Combustível' ? expenseFormData.fuelType : undefined,
        installments,
        paidBy: expenseFormData.paidBy.trim() || undefined
      };
      updatedExpenses = currentTrip.expenses.map(exp => exp.id === editingExpense.id ? updatedItem : exp);
    } else {
      const newItem: TripExpense = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        description: expenseFormData.description.trim(),
        amount: amountNum,
        category: expenseFormData.category,
        paymentStatus: expenseFormData.paymentStatus,
        paymentMethod: expenseFormData.paymentMethod,
        date: expenseFormData.date,
        location: expenseFormData.location.trim() || undefined,
        notes: expenseFormData.notes.trim() || undefined,
        tollBoothsCount: tollCount,
        fuelType: expenseFormData.category === 'Combustível' ? expenseFormData.fuelType : undefined,
        installments,
        paidBy: expenseFormData.paidBy.trim() || undefined
      };
      updatedExpenses = [newItem, ...(currentTrip.expenses || [])];
    }

    onSaveTrip({
      ...currentTrip,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString()
    });

    setIsExpenseModalOpen(false);
  };

  // Toggle Expense Payment Status (Quick button)
  const handleTogglePaymentStatus = (expenseId: string) => {
    if (!currentTrip) return;
    const updated = currentTrip.expenses.map(e => {
      if (e.id === expenseId) {
        const nextStatus: TripPaymentStatus = e.paymentStatus === 'paid' ? 'pending' : 'paid';
        return { ...e, paymentStatus: nextStatus };
      }
      return e;
    });

    onSaveTrip({
      ...currentTrip,
      expenses: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Delete Expense from Trip
  const handleDeleteExpense = (expenseId: string) => {
    if (!currentTrip) return;
    const updated = currentTrip.expenses.filter(e => e.id !== expenseId);
    onSaveTrip({
      ...currentTrip,
      expenses: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Open Sync to Monthly Expense Modal
  const handleOpenSyncModal = (expense: TripExpense) => {
    setExpenseToSync(expense);
    setSyncTargetMonth(currentMonthId);
    setSyncCategory('Variáveis');
    setIsSyncModalOpen(true);
  };

  // Execute Sync to Monthly Expense
  const handleConfirmSyncToMonth = () => {
    if (!currentTrip || !expenseToSync) return;

    onSyncExpenseToMonth(
      syncTargetMonth,
      {
        description: `[Viagem ${currentTrip.destination.split(',')[0]}] ${expenseToSync.description}`,
        amount: expenseToSync.amount,
        category: syncCategory,
        paid: expenseToSync.paymentStatus === 'paid',
        dueDate: expenseToSync.date || `${syncTargetMonth}-10`,
        installmentNumber: expenseToSync.installments?.current,
        totalInstallments: expenseToSync.installments?.total
      },
      expenseToSync.id
    );

    // Update the trip expense with the sync mark
    const updatedExpenses = currentTrip.expenses.map(e => {
      if (e.id === expenseToSync.id) {
        return {
          ...e,
          syncedToMonthId: syncTargetMonth,
          syncedToMonthlyExpenseId: 'synced'
        };
      }
      return e;
    });

    onSaveTrip({
      ...currentTrip,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString()
    });

    setIsSyncModalOpen(false);
    setExpenseToSync(null);
  };

  // Checklist Actions
  const handleToggleChecklistItem = (itemId: string) => {
    if (!currentTrip) return;
    const updated = (currentTrip.checklist || []).map(item => {
      if (item.id === itemId) return { ...item, completed: !item.completed };
      return item;
    });
    onSaveTrip({
      ...currentTrip,
      checklist: updated,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip || !newChecklistTask.trim()) return;

    const newItem: TripChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: newChecklistCategory,
      task: newChecklistTask.trim(),
      completed: false
    };

    onSaveTrip({
      ...currentTrip,
      checklist: [...(currentTrip.checklist || []), newItem],
      updatedAt: new Date().toISOString()
    });

    setNewChecklistTask('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!currentTrip) return;
    const updated = (currentTrip.checklist || []).filter(item => item.id !== itemId);
    onSaveTrip({
      ...currentTrip,
      checklist: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Itinerary Activity Actions
  const handleOpenAddActivityModal = (dayId: string) => {
    setSelectedItineraryDayId(dayId);
    setActivityFormData({
      title: '',
      time: '',
      location: '',
      description: '',
      estimatedCost: ''
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip || !selectedItineraryDayId || !activityFormData.title.trim()) return;

    const costNum = parseFloat(activityFormData.estimatedCost) || undefined;
    const newAct: TripItineraryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: activityFormData.title.trim(),
      time: activityFormData.time.trim() || undefined,
      location: activityFormData.location.trim() || undefined,
      description: activityFormData.description.trim() || undefined,
      estimatedCost: costNum,
      done: false
    };

    const updatedItinerary = (currentTrip.itinerary || []).map(day => {
      if (day.id === selectedItineraryDayId) {
        return {
          ...day,
          activities: [...(day.activities || []), newAct]
        };
      }
      return day;
    });

    onSaveTrip({
      ...currentTrip,
      itinerary: updatedItinerary,
      updatedAt: new Date().toISOString()
    });

    setIsActivityModalOpen(false);
  };

  const handleToggleActivity = (dayId: string, activityId: string) => {
    if (!currentTrip) return;
    const updated = (currentTrip.itinerary || []).map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          activities: (day.activities || []).map(a => a.id === activityId ? { ...a, done: !a.done } : a)
        };
      }
      return day;
    });
    onSaveTrip({
      ...currentTrip,
      itinerary: updated,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteActivity = (dayId: string, activityId: string) => {
    if (!currentTrip) return;
    const updated = (currentTrip.itinerary || []).map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          activities: (day.activities || []).filter(a => a.id !== activityId)
        };
      }
      return day;
    });
    onSaveTrip({
      ...currentTrip,
      itinerary: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Filtered trips in project list view
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) || 
        t.destination.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [trips, statusFilter, searchQuery]);

  // Filtered expenses in current trip
  const filteredExpenses = useMemo(() => {
    if (!currentTrip) return [];
    return (currentTrip.expenses || []).filter(e => {
      const matchesCat = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      const matchesStatus = expenseStatusFilter === 'all' || e.paymentStatus === expenseStatusFilter;
      return matchesCat && matchesStatus;
    });
  }, [currentTrip, expenseCategoryFilter, expenseStatusFilter]);

  // Status Badge Helper
  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'in_progress':
        return { label: 'Em Andamento', bg: 'bg-emerald-500 text-white', icon: Palmtree };
      case 'confirmed':
        return { label: 'Confirmada', bg: 'bg-sky-500 text-white', icon: CheckCircle2 };
      case 'planning':
        return { label: 'Planejamento', bg: 'bg-amber-500 text-white', icon: Clock };
      case 'completed':
        return { label: 'Concluída', bg: 'bg-slate-600 text-white', icon: CheckSquare };
      case 'cancelled':
        return { label: 'Cancelada', bg: 'bg-rose-500 text-white', icon: X };
      default:
        return { label: 'Planejamento', bg: 'bg-slate-500 text-white', icon: Clock };
    }
  };

  // Transport Icon Helper
  const getTransportIcon = (type: TripProject['transportType']) => {
    switch (type) {
      case 'plane': return Plane;
      case 'bus': return Bus;
      case 'car':
      case 'rental_car':
      default: return Car;
    }
  };

  // ==========================================
  // VIEW 1: SELECTED TRIP PROJECT WORKSPACE
  // ==========================================
  if (currentTrip && projectMetrics) {
    const TransportIcon = getTransportIcon(currentTrip.transportType);
    const statusCfg = getStatusBadge(currentTrip.status);

    return (
      <div className="space-y-6 pb-20">
        {/* Project Header Navigation Bar */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedTripId(null)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
              title="Voltar para a lista de viagens"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Viagens</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentTrip.title}
                </h1>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.bg}`}>
                  <statusCfg.icon size={11} />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-slate-700 font-black">
                  <MapPin size={13} className="text-purple-600" />
                  {currentTrip.destination}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(currentTrip.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(currentTrip.endDate + 'T12:00:00').toLocaleDateString('pt-BR')} ({projectMetrics.daysCount} dias)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {currentTrip.travelersCount} {currentTrip.travelersCount === 1 ? 'pessoa' : 'pessoas'}
                  {currentTrip.travelersNames && ` (${currentTrip.travelersNames})`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => handleOpenEditTripModal(currentTrip)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 size={14} />
              <span>Editar Projeto</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddExpenseModal()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Novo Custo</span>
            </button>
          </div>
        </div>

        {/* Project KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Gasto */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Custos</span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                {formatCurrency(projectMetrics.totalExpenses)}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1">
                <span>{currentTrip.expenses.length} despesas lançadas</span>
              </div>
            </div>
          </div>

          {/* Card 2: Orçamento & Saldo */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orçamento Previsto</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                projectMetrics.budgetUsagePercent > 100 
                  ? 'bg-rose-100 text-rose-700' 
                  : projectMetrics.budgetUsagePercent > 80 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {projectMetrics.budgetUsagePercent.toFixed(0)}%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                {projectMetrics.budget > 0 ? formatCurrency(projectMetrics.budget) : 'Não definido'}
              </div>
              <div className={`text-[11px] font-bold mt-1 ${projectMetrics.remainingBudget < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                {projectMetrics.budget > 0 
                  ? (projectMetrics.remainingBudget >= 0 
                      ? `Resta ${formatCurrency(projectMetrics.remainingBudget)}` 
                      : `Excedeu ${formatCurrency(Math.abs(projectMetrics.remainingBudget))}`)
                  : 'Defina um teto orçamentário'}
              </div>
            </div>
          </div>

          {/* Card 3: Já Pago vs Pendente */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Financeiro</span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600">
                {formatCurrency(projectMetrics.totalPaid)}
              </div>
              <div className="text-[11px] font-bold text-amber-600 mt-1">
                Pendente: {formatCurrency(projectMetrics.totalPending)}
              </div>
            </div>
          </div>

          {/* Card 4: Média por Dia e por Pessoa */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rateio & Médias</span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-purple-700">
                {formatCurrency(projectMetrics.costPerDay)}
                <span className="text-xs font-bold text-slate-400 font-sans ml-1">/dia</span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">
                {formatCurrency(projectMetrics.costPerTraveler)} por pessoa ({projectMetrics.travelers} viajantes)
              </div>
            </div>
          </div>
        </div>

        {/* Project Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setProjectTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              projectTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt size={15} />
            <span>Custos & Contas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${projectTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {currentTrip.expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProjectTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              projectTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon size={15} />
            <span>Gráficos & Rateio</span>
          </button>

          <button
            type="button"
            onClick={() => setProjectTab('itinerary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              projectTab === 'itinerary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin size={15} />
            <span>Roteiro Dia a Dia</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${projectTab === 'itinerary' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {currentTrip.itinerary?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProjectTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              projectTab === 'checklist'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare size={15} />
            <span>Checklist Pré-Viagem</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${projectTab === 'checklist' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {(currentTrip.checklist || []).filter(c => c.completed).length}/{(currentTrip.checklist || []).length}
            </span>
          </button>
        </div>

        {/* TAB 1: EXPENSES & BILLS */}
        {projectTab === 'expenses' && (
          <div className="space-y-4">
            {/* Quick Action Category Shortcuts */}
            <div className="bg-white p-4 rounded-3xl border border-brand-border shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                Lançamento Rápido por Categoria
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[
                  { cat: 'Pedágios' as TripExpenseCategory, icon: Car, label: '+ Pedágios' },
                  { cat: 'Combustível' as TripExpenseCategory, icon: Fuel, label: '+ Combustível' },
                  { cat: 'Mercado & Mantimentos' as TripExpenseCategory, icon: ShoppingCart, label: '+ Mercado' },
                  { cat: 'Restaurantes & Alimentação' as TripExpenseCategory, icon: Utensils, label: '+ Restaurante' },
                  { cat: 'Hospedagem' as TripExpenseCategory, icon: Hotel, label: '+ Hospedagem' },
                  { cat: 'Custos no Local & Taxas' as TripExpenseCategory, icon: Sun, label: '+ Custos Locais' }
                ].map(item => (
                  <button
                    key={item.cat}
                    type="button"
                    onClick={() => handleOpenAddExpenseModal(item.cat)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80 hover:border-purple-300 text-slate-700 transition-all flex items-center gap-2 cursor-pointer text-xs font-black"
                  >
                    <item.icon size={15} className="text-purple-600" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-border shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setExpenseCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                    expenseCategoryFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({currentTrip.expenses.length})
                </button>
                {TRIP_CATEGORIES.map(c => {
                  const count = currentTrip.expenses.filter(e => e.category === c.category).length;
                  if (count === 0 && expenseCategoryFilter !== c.category) return null;
                  return (
                    <button
                      key={c.category}
                      type="button"
                      onClick={() => setExpenseCategoryFilter(c.category)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        expenseCategoryFilter === c.category
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <c.icon size={12} />
                      <span>{c.category}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <select
                  value={expenseStatusFilter}
                  onChange={(e) => setExpenseStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">Status: Todos</option>
                  <option value="paid">Apenas Pagos</option>
                  <option value="pending">Apenas Pendentes</option>
                  <option value="estimated">Apenas Previstos</option>
                </select>
              </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-brand-border p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                  <Receipt size={32} />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                    Nenhum custo encontrado
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Comece cadastrando os custos de pedágios, combustível, hospedagem ou mercado planejados para sua viagem!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddExpenseModal()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-purple-100 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={15} strokeWidth={3} /> Cadastrar Primeiro Custo
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredExpenses.map((exp) => {
                      const catCfg = getTripCategoryConfig(exp.category);
                      const CatIcon = catCfg.icon;
                      const isPaid = exp.paymentStatus === 'paid';

                      return (
                        <motion.div
                          key={exp.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            {/* Toggle Paid Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentStatus(exp.id)}
                              className={`p-1.5 rounded-xl border transition-all mt-0.5 sm:mt-0 shrink-0 cursor-pointer ${
                                isPaid
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-white border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                              }`}
                              title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                            >
                              <CheckCircle2 size={16} strokeWidth={isPaid ? 3 : 2} />
                            </button>

                            {/* Category Icon */}
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: catCfg.color }}
                            >
                              <CatIcon size={18} />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-black text-slate-800 ${isPaid ? 'line-through text-slate-400' : ''}`}>
                                  {exp.description}
                                </span>

                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${catCfg.bgLight}`}>
                                  {exp.category}
                                </span>

                                {exp.tollBoothsCount && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                    🛣️ {exp.tollBoothsCount} {exp.tollBoothsCount === 1 ? 'praça' : 'praças'}
                                  </span>
                                )}

                                {exp.fuelType && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-200">
                                    ⛽ {exp.fuelType}
                                  </span>
                                )}

                                {exp.installments && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                    {exp.installments.current}/{exp.installments.total}x
                                  </span>
                                )}

                                {exp.syncedToMonthId && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                                    <Send size={9} /> No Painel Mensal ({getMonthLabel(exp.syncedToMonthId)})
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                                {exp.date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                                {exp.location && (
                                  <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                    <MapPin size={11} />
                                    {exp.location}
                                  </span>
                                )}
                                {exp.paidBy && (
                                  <span className="text-purple-600 font-bold">
                                    Pago por: {exp.paidBy}
                                  </span>
                                )}
                                {exp.notes && (
                                  <span className="italic truncate max-w-[200px]">
                                    "{exp.notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Amount and Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <div className={`text-base font-black font-mono ${isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {formatCurrency(exp.amount)}
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-wider block ${
                                isPaid ? 'text-emerald-600' : exp.paymentStatus === 'estimated' ? 'text-indigo-600' : 'text-amber-600'
                              }`}>
                                {isPaid ? 'Pago' : exp.paymentStatus === 'estimated' ? 'Estimado' : 'Pendente'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Sync button to push to monthly expenses */}
                              <button
                                type="button"
                                onClick={() => handleOpenSyncModal(exp)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  exp.syncedToMonthId 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-slate-50 text-slate-500 hover:text-purple-700 hover:bg-purple-50 border-slate-200'
                                }`}
                                title="Lançar como despesa no Painel Mensal"
                              >
                                <Send size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditExpenseModal(exp)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all cursor-pointer"
                                title="Editar Custo"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-all cursor-pointer"
                                title="Excluir Custo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS & BREAKDOWN */}
        {projectTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Pie Chart */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-brand-border shadow-xs space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-600" />
                <span>Alocação por Categoria de Custo</span>
              </h2>

              {projectMetrics.categoryChartData.length > 0 ? (
                <>
                  <div className="h-60 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectMetrics.categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {projectMetrics.categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Total']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
                      <span className="text-xs font-black font-mono text-slate-800">{formatCurrency(projectMetrics.totalExpenses)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {projectMetrics.categoryChartData.map(item => {
                      const pct = projectMetrics.totalExpenses > 0 ? (item.value / projectMetrics.totalExpenses) * 100 : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs font-bold text-slate-700 p-1.5 rounded-xl hover:bg-slate-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-900">{formatCurrency(item.value)}</span>
                            <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum custo lançado para gerar o gráfico.
                </div>
              )}
            </div>

            {/* Status Breakdown & Summary */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-brand-border shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-indigo-600" />
                  <span>Fluxo de Pagamentos da Viagem</span>
                </h2>

                <div className="space-y-4">
                  {/* Paid */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-emerald-900">Total Já Pago</span>
                        <p className="text-[11px] text-emerald-700">Custos liquidados antes ou no local</p>
                      </div>
                    </div>
                    <span className="text-base font-black font-mono text-emerald-700">
                      {formatCurrency(projectMetrics.totalPaid)}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-amber-900">Total a Pagar (Pendente)</span>
                        <p className="text-[11px] text-amber-700">Faturas futuras, cartões e reservas a acertar</p>
                      </div>
                    </div>
                    <span className="text-base font-black font-mono text-amber-700">
                      {formatCurrency(projectMetrics.totalPending)}
                    </span>
                  </div>

                  {/* Estimated */}
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-indigo-900">Total Previsto / Estimado</span>
                        <p className="text-[11px] text-indigo-700">Valores orçados para alimentação e compras</p>
                      </div>
                    </div>
                    <span className="text-base font-black font-mono text-indigo-700">
                      {formatCurrency(projectMetrics.totalEstimated)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips for Travel Financial Health */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-black text-slate-800 flex items-center gap-1.5 uppercase text-[10px]">
                  <Compass size={13} className="text-purple-600" />
                  Planejamento Inteligente
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Lançar contas antecipadas (como pedágios calculados e compras de mercado) evita surpresas nas faturas pós-viagem e mantém seu teto orçamentário sob total controle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ITINERARY (ROTEIRO DIA A DIA) */}
        {projectTab === 'itinerary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Programação Cronológica da Viagem
                </h2>
                <p className="text-xs text-slate-500">
                  Organize seus dias, passeios, paradas de estrada e custos estimados em cada momento.
                </p>
              </div>
            </div>

            {(!currentTrip.itinerary || currentTrip.itinerary.length === 0) ? (
              <div className="bg-white rounded-3xl border border-brand-border p-12 text-center text-slate-400 text-xs">
                Nenhum dia cadastrado no roteiro.
              </div>
            ) : (
              <div className="space-y-4">
                {currentTrip.itinerary.map(day => (
                  <div key={day.id} className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-brand-border flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                          D{day.dayNumber}
                        </span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            {day.title}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddActivityModal(day.id)}
                        className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} /> + Atividade
                      </button>
                    </div>

                    <div className="p-4 sm:p-6">
                      {(!day.activities || day.activities.length === 0) ? (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          Nenhuma atividade adicionada para este dia. Clique em "+ Atividade" para programar passeios, restaurantes ou rotas.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {day.activities.map(act => (
                            <div 
                              key={act.id} 
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                act.done ? 'bg-slate-50/60 border-slate-200 opacity-60' : 'bg-white border-slate-200/80 hover:border-purple-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActivity(day.id, act.id)}
                                  className="text-slate-400 hover:text-purple-600 cursor-pointer"
                                >
                                  {act.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Square size={18} />}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {act.time && (
                                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {act.time}
                                      </span>
                                    )}
                                    <span className={`text-xs font-black ${act.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                      {act.title}
                                    </span>
                                    {act.location && (
                                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                        <MapPin size={10} /> {act.location}
                                      </span>
                                    )}
                                  </div>
                                  {act.description && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {act.estimatedCost && (
                                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    {formatCurrency(act.estimatedCost)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActivity(day.id, act.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Remover Atividade"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CHECKLIST PRE-VIAGEM */}
        {projectTab === 'checklist' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Checklist & Preparativos da Viagem
                  </h2>
                  <p className="text-xs text-slate-500">
                    Não esqueça nenhum documento, revisão do veículo ou item essencial antes de pegar a estrada.
                  </p>
                </div>

                {/* Progress */}
                <div className="text-right">
                  <span className="text-xs font-black text-purple-700">
                    {(currentTrip.checklist || []).filter(c => c.completed).length} de {(currentTrip.checklist || []).length} concluídos
                  </span>
                </div>
              </div>

              {/* Add New Checklist Item Form */}
              <form onSubmit={handleAddChecklistItem} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                <select
                  value={newChecklistCategory}
                  onChange={(e) => setNewChecklistCategory(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none shrink-0"
                >
                  <option value="Veículo & Estrada">🚗 Veículo & Estrada</option>
                  <option value="Documentos">📄 Documentos & Reservas</option>
                  <option value="Mala & Bagagem">🧳 Mala & Bagagem</option>
                  <option value="Casa antes de sair">🏠 Casa antes de sair</option>
                  <option value="Geral">📌 Geral</option>
                </select>

                <input
                  type="text"
                  value={newChecklistTask}
                  onChange={(e) => setNewChecklistTask(e.target.value)}
                  placeholder="Novo item do checklist (ex: Comprar protetor solar, abastecer o carro)..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                />

                <button
                  type="submit"
                  disabled={!newChecklistTask.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </form>
            </div>

            {/* Checklist Items Grouped */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['Veículo & Estrada', 'Documentos', 'Mala & Bagagem', 'Casa antes de sair', 'Geral'] as const).map(groupName => {
                const items = (currentTrip.checklist || []).filter(c => c.category === groupName);
                if (items.length === 0) return null;

                return (
                  <div key={groupName} className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>{groupName}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {items.filter(i => i.completed).length}/{items.length}
                      </span>
                    </h3>

                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            item.completed ? 'bg-slate-50/70 border-slate-200 opacity-60' : 'bg-white border-slate-200/90 hover:border-purple-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer flex-1"
                          >
                            {item.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Square size={16} className="text-slate-400 shrink-0" />
                            )}
                            <span className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {item.task}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            title="Excluir item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL 1: ADD/EDIT EXPENSE */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-brand-border bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    {editingExpense ? 'Editar Custo da Viagem' : 'Novo Custo / Conta da Viagem'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveExpenseSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Description */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Descrição da Despesa *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    placeholder="Ex: Pedágios Ida e Volta, Supermercado Angeloni, Airbnb, Gasolina..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                  />
                </div>

                {/* Amount and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Categoria de Custo *
                    </label>
                    <select
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as TripExpenseCategory })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      {TRIP_CATEGORIES.map(c => (
                        <option key={c.category} value={c.category}>{c.category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Fields based on Category */}
                {expenseFormData.category === 'Pedágios' && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                      🛣️ Quantidade de Praças de Pedágio (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={expenseFormData.tollBoothsCount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, tollBoothsCount: e.target.value })}
                      placeholder="Ex: 4 praças"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                )}

                {expenseFormData.category === 'Combustível' && (
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                    <label className="text-[10px] font-black uppercase tracking-wider text-red-900 block mb-1">
                      ⛽ Tipo de Combustível
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Gasolina', 'Etanol', 'Diesel'] as const).map(fuel => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setExpenseFormData({ ...expenseFormData, fuelType: fuel })}
                          className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                            expenseFormData.fuelType === fuel
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-red-200'
                          }`}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Status & Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Status do Pagamento
                    </label>
                    <select
                      value={expenseFormData.paymentStatus}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentStatus: e.target.value as TripPaymentStatus })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="pending">Pendente (A Pagar)</option>
                      <option value="paid">Já Pago (Quitado)</option>
                      <option value="estimated">Previsto / Estimado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={expenseFormData.paymentMethod}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, paymentMethod: e.target.value as TripPaymentMethod })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="pix">Pix</option>
                      <option value="cash">Dinheiro em Espécie</option>
                      <option value="debit">Cartão de Débito</option>
                      <option value="transfer">Transferência / Boleto</option>
                      <option value="miles">Milhas / Pontos</option>
                    </select>
                  </div>
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Data do Custo / Vencimento
                    </label>
                    <input
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Local / Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={expenseFormData.location}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, location: e.target.value })}
                      placeholder="Ex: Posto Ipiranga, Restaurante X..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Installments Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseFormData.isInstallment}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, isInstallment: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span className="text-xs font-bold text-slate-700">Custo parcelado no cartão</span>
                  </label>

                  {expenseFormData.isInstallment && (
                    <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Parcela Atual</label>
                        <input
                          type="number"
                          min="1"
                          value={expenseFormData.installmentsCurrent}
                          onChange={(e) => setExpenseFormData({ ...expenseFormData, installmentsCurrent: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Total de Parcelas</label>
                        <input
                          type="number"
                          min="1"
                          value={expenseFormData.installmentsTotal}
                          onChange={(e) => setExpenseFormData({ ...expenseFormData, installmentsTotal: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Paid By (Split Traveler) */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Quem Pagou? (Opcional - Rateio)
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.paidBy}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, paidBy: e.target.value })}
                    placeholder="Ex: Eu, Fulano, Ciclano..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={2}
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    placeholder="Detalhes, comprovante, regras de cancelamento..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    {editingExpense ? 'Salvar Alterações' : 'Cadastrar Custo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SYNC EXPENSE TO MONTHLY PANEL */}
        {isSyncModalOpen && expenseToSync && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-brand-border bg-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Send size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-950">
                    Lançar no Painel Mensal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Isso irá criar uma conta a pagar no seu painel mensal de finanças, integrando a despesa desta viagem com o orçamento geral do mês escolhido.
                </p>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Despesa Selecionada:</span>
                  <div className="text-xs font-black text-slate-800">{expenseToSync.description}</div>
                  <div className="text-sm font-black font-mono text-purple-700">{formatCurrency(expenseToSync.amount)}</div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Mês de Destino no Painel:
                  </label>
                  <select
                    value={syncTargetMonth}
                    onChange={(e) => setSyncTargetMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {Object.keys(allMonths).sort().map(mId => (
                      <option key={mId} value={mId}>{getMonthLabel(mId)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Categoria no Painel Mensal:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Variáveis', 'Fixas'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSyncCategory(cat)}
                        className={`py-2 text-xs font-black rounded-xl transition-all ${
                          syncCategory === cat
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSyncToMonth}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD ACTIVITY TO ITINERARY */}
        {isActivityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-brand-border bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Nova Atividade no Roteiro
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveActivitySubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Título da Atividade *
                  </label>
                  <input
                    type="text"
                    required
                    value={activityFormData.title}
                    onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                    placeholder="Ex: Passeio de Barco na Ilha, Almoço no Restaurante X..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Horário (Opcional)
                    </label>
                    <input
                      type="text"
                      value={activityFormData.time}
                      onChange={(e) => setActivityFormData({ ...activityFormData, time: e.target.value })}
                      placeholder="Ex: 09:30, Tarde..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                      Custo Previsto (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={activityFormData.estimatedCost}
                      onChange={(e) => setActivityFormData({ ...activityFormData, estimatedCost: e.target.value })}
                      placeholder="0,00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Localização / Ponto de Encontro
                  </label>
                  <input
                    type="text"
                    value={activityFormData.location}
                    onChange={(e) => setActivityFormData({ ...activityFormData, location: e.target.value })}
                    placeholder="Ex: Praia de Jurerê, Centro Histórico..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Notas ou Dicas
                  </label>
                  <textarea
                    rows={2}
                    value={activityFormData.description}
                    onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                    placeholder="Ingressos comprados online, levar protetor solar..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-100"
                  >
                    Salvar no Roteiro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ALL TRIP PROJECTS LIST (HUB VIEW)
  // ==========================================
  return (
    <div className="space-y-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-brand-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100">
            <Compass size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-800">
                Módulo de Viagens
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                Gestão por Projeto
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Planejamento individual de cada viagem com pedágios, mercado, combustível, roteiro e contas geradas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenNewTripModal}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nova Viagem (Projeto)</span>
        </button>
      </div>

      {/* Global Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Projects */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Projetos de Viagem</span>
            <Palmtree size={18} className="text-sky-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {overallStats.tripsCount}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">
              {overallStats.activeCount} em planejamento ou andamento
            </div>
          </div>
        </div>

        {/* Total Budgeted */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Orçamento Comprometido</span>
            <DollarSign size={18} className="text-purple-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-purple-700">
              {formatCurrency(overallStats.totalBudget)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">
              Soma dos tetos estipulados
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Já Pago</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-600">
              {formatCurrency(overallStats.totalPaid)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">
              Custos liquidados e antecipados
            </div>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total a Pagar</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-amber-600">
              {formatCurrency(overallStats.totalPending)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">
              Contas pendentes de liquidação
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-brand-border shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por viagem, destino (ex: Floripa, Serra Gaúcha, Rio)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(['all', 'planning', 'confirmed', 'in_progress', 'completed'] as const).map(st => {
            const labels = {
              all: 'Todas',
              planning: 'Planejamento',
              confirmed: 'Confirmadas',
              in_progress: 'Em Andamento',
              completed: 'Concluídas'
            };
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto">
            <Compass size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nenhuma viagem encontrada com esses filtros' 
                : 'Nenhum projeto de viagem criado'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Crie seu primeiro projeto de viagem para orçar pedágios, combustível, hotel, supermercado e organizar seu roteiro!
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewTripModal}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={3} /> Criar Projeto de Viagem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const totalExp = (trip.expenses || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
            const totalPaid = (trip.expenses || []).filter(e => e.paymentStatus === 'paid').reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
            const budget = Number(trip.budget) || 0;
            const pct = budget > 0 ? (totalExp / budget) * 100 : 0;
            const statusCfg = getStatusBadge(trip.status);
            const TransportIcon = getTransportIcon(trip.transportType);

            // Duration
            let days = 1;
            if (trip.startDate && trip.endDate) {
              const s = new Date(trip.startDate + 'T00:00:00');
              const e = new Date(trip.endDate + 'T00:00:00');
              days = Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            }

            return (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-brand-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                onClick={() => setSelectedTripId(trip.id)}
              >
                <div>
                  {/* Card Cover Gradient Top */}
                  <div className={`h-24 bg-gradient-to-r ${trip.coverGradient || TRIP_GRADIENTS[0]} p-4 flex items-start justify-between text-white relative`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusCfg.bg} shadow-xs flex items-center gap-1`}>
                        <statusCfg.icon size={10} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2 py-1 rounded-xl text-[10px] font-black">
                      <TransportIcon size={12} />
                      <span>{days} {days === 1 ? 'dia' : 'dias'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-1">
                        <MapPin size={13} className="text-purple-600 shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <Calendar size={12} />
                      <span>
                        {new Date(trip.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} - {new Date(trip.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Progress Bar of Budget */}
                    {budget > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Orçamento ({pct.toFixed(0)}%)</span>
                          <span className="font-mono text-slate-800">{formatCurrency(totalExp)} / {formatCurrency(budget)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all rounded-full ${
                              pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {(trip.expenses || []).length} custos
                    </span>
                    <span>•</span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {formatCurrency(totalPaid)} pago
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-purple-700 font-black group-hover:translate-x-0.5 transition-transform">
                    <span>Abrir Projeto</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE / EDIT TRIP PROJECT */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-border bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-center">
                  <Compass size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  {editingTrip ? 'Editar Projeto de Viagem' : 'Novo Projeto de Viagem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTripModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTripSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Nome da Viagem / Projeto *
                </label>
                <input
                  type="text"
                  required
                  value={tripFormData.title}
                  onChange={(e) => setTripFormData({ ...tripFormData, title: e.target.value })}
                  placeholder="Ex: Férias em Floripa 2026, Serra Gaúcha, Eurotrip..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Destino(s) Principal *
                </label>
                <input
                  type="text"
                  required
                  value={tripFormData.destination}
                  onChange={(e) => setTripFormData({ ...tripFormData, destination: e.target.value })}
                  placeholder="Ex: Florianópolis - SC, Gramado - RS, Santiago..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Data de Partida *
                  </label>
                  <input
                    type="date"
                    required
                    value={tripFormData.startDate}
                    onChange={(e) => setTripFormData({ ...tripFormData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Data de Retorno *
                  </label>
                  <input
                    type="date"
                    required
                    value={tripFormData.endDate}
                    onChange={(e) => setTripFormData({ ...tripFormData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Budget & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Orçamento Estimado (Teto R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tripFormData.budget}
                    onChange={(e) => setTripFormData({ ...tripFormData, budget: e.target.value })}
                    placeholder="Ex: 5000,00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Status do Projeto
                  </label>
                  <select
                    value={tripFormData.status}
                    onChange={(e) => setTripFormData({ ...tripFormData, status: e.target.value as TripStatus })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="planning">Em Planejamento</option>
                    <option value="confirmed">Confirmada / Reservada</option>
                    <option value="in_progress">Em Andamento (Viajando)</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Travelers & Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Quantidade de Viajantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tripFormData.travelersCount}
                    onChange={(e) => setTripFormData({ ...tripFormData, travelersCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                    Meio de Transporte Principal
                  </label>
                  <select
                    value={tripFormData.transportType}
                    onChange={(e) => setTripFormData({ ...tripFormData, transportType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="car">🚗 Carro Próprio</option>
                    <option value="rental_car">🚘 Carro Alugado</option>
                    <option value="plane">✈️ Avião</option>
                    <option value="bus">🚌 Ônibus</option>
                    <option value="motorcycle">🏍️ Moto</option>
                    <option value="other">📌 Outro</option>
                  </select>
                </div>
              </div>

              {/* Travelers Names */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Nomes dos Viajantes (Opcional)
                </label>
                <input
                  type="text"
                  value={tripFormData.travelersNames}
                  onChange={(e) => setTripFormData({ ...tripFormData, travelersNames: e.target.value })}
                  placeholder="Ex: Eu & Namorada, Família (4 pessoas)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              {/* Cover Gradient Palette */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Cor / Estilo do Card
                </label>
                <div className="flex items-center gap-2">
                  {TRIP_GRADIENTS.map(grad => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setTripFormData({ ...tripFormData, coverGradient: grad })}
                      className={`w-9 h-7 rounded-lg bg-gradient-to-r ${grad} cursor-pointer transition-transform ${
                        tripFormData.coverGradient === grad ? 'ring-2 ring-purple-600 scale-105' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Notas / Objetivos da Viagem
                </label>
                <textarea
                  rows={2}
                  value={tripFormData.notes}
                  onChange={(e) => setTripFormData({ ...tripFormData, notes: e.target.value })}
                  placeholder="Anotações gerais, links de reservas, ideias de passeios..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTripModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-100"
                >
                  {editingTrip ? 'Salvar Viagem' : 'Criar Viagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
