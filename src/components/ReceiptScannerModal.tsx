import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  CreditCard,
  DollarSign,
  Calendar,
  X,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

export interface ScannedExpenseData {
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  installments?: number;
  itemsSummary?: string;
  receiptImage?: string;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthId: string;
  onSaveExpense: (expense: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    paid: boolean;
    dueDate?: string;
    paymentMethod: PaymentMethod;
    repeats: number;
    targetMonthId?: string;
    receiptUrl?: string;
  }) => void;
  formatCurrency: (value: number) => string;
  availableCategories?: string[];
  onAddCategory?: (category: string) => void;
}

export const PAYMENT_METHOD_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: 'pix', label: 'Pix', icon: '⚡', color: 'border-teal-200 bg-teal-50 text-teal-700' },
  { id: 'credit_card', label: 'Cartão de Crédito', icon: '💳', color: 'border-purple-200 bg-purple-50 text-purple-700' },
  { id: 'boleto', label: 'Boleto Bancário', icon: '📄', color: 'border-amber-200 bg-amber-50 text-amber-700' }
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  currentMonthId,
  onSaveExpense,
  formatCurrency,
  availableCategories,
  onAddCategory
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Form State extracted from receipt
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    category: ExpenseCategory;
    paymentStatus: 'paid' | 'pending';
    paymentMethod: PaymentMethod;
    dueDate: string;
    repeats: number;
    itemsSummary: string;
  }>({
    description: '',
    amount: '',
    category: 'Variáveis',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    dueDate: new Date().toISOString().split('T')[0],
    repeats: 1,
    itemsSummary: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setImagePreview(null);
      setIsScanning(false);
      setScanError(null);
      setHasScanned(false);
      setFormData({
        description: '',
        amount: '',
        category: 'Variáveis',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        dueDate: new Date().toISOString().split('T')[0],
        repeats: 1,
        itemsSummary: ''
      });
    }
  }, [isOpen]);

  // Support paste from clipboard (e.g. screenshot or photo)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Process file upload
  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanError('Por favor, selecione uma imagem válida (JPEG, PNG, WEBP).');
      return;
    }

    setScanError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      setImagePreview(base64Url);
      startScanWithGemini(base64Url, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Perform Gemini AI Vision Scan
  const startScanWithGemini = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      let dataResult: any = null;

      // 1. Try server-side endpoint first
      try {
        const response = await fetch('/api/analyze-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: mimeType || 'image/jpeg'
          })
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            dataResult = json.data;
          }
        }
      } catch (serverErr) {
        console.warn('Backend receipt scanning endpoint failed or unreachable, trying direct client fallback:', serverErr);
      }

      // 2. Direct client fallback if backend was unavailable
      if (!dataResult) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Chave da API Gemini não encontrada. Verifique as configurações.');
        }

        const ai = new GoogleGenAI({ apiKey });

        let cleanBase64 = base64Data;
        let detectedMime = mimeType || 'image/jpeg';
        if (cleanBase64.includes(';base64,')) {
          const parts = cleanBase64.split(';base64,');
          detectedMime = parts[0].replace('data:', '') || detectedMime;
          cleanBase64 = parts[1];
        }

        const prompt = `Você é um leitor especialista em recibos de compras, cupons fiscais (NFC-e, SAT, ECF), notas fiscais e comprovantes de pagamento do Brasil e internacionais.
Analise a imagem deste recibo com máxima atenção.

Identifique e extraia:
1. amount: O valor total pago ou a pagar na compra (número float, ex: 85.90). Procure pelo 'Total', 'Valor Pago', 'Total a Pagar', 'Valor R$'.
2. description: Nome da loja, estabelecimento, supermercado, posto, restaurante ou fornecedor (ex: 'Supermercado Guanabara', 'Posto Shell', 'Drogaria Pacheco', 'Restaurante Sabor').
3. date: A data da transação ou compra no formato YYYY-MM-DD (ex: 2026-09-28). Se não encontrar o ano, use o ano corrente.
4. paymentMethod: A forma de pagamento indicada no comprovante: 'pix', 'credit_card' ou 'boleto'.
5. paymentStatus: 'paid' (se for comprovante de pagamento efetuado ou cupom fiscal emitido) ou 'pending' (se for fatura a vencer).
6. category: 'Variáveis' (para supermercado, alimentação, farmácia, transporte, combustível) ou 'Fixas' (para contas mensais).
7. installments: Quantidade de parcelas se for compra parcelada (ex: 1 se à vista, 2 se 2x, etc.).
8. itemsSummary: Um resumo sucinto dos itens comprados, se visíveis.

Retorne em formato JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER },
                description: { type: Type.STRING },
                date: { type: Type.STRING },
                paymentMethod: { 
                  type: Type.STRING, 
                  enum: ['pix', 'credit_card', 'boleto'] 
                },
                paymentStatus: {
                  type: Type.STRING,
                  enum: ['paid', 'pending']
                },
                category: { 
                  type: Type.STRING, 
                  enum: ['Fixas', 'Variáveis'] 
                },
                installments: { 
                  type: Type.INTEGER 
                },
                itemsSummary: { 
                  type: Type.STRING 
                }
              },
              required: ['amount', 'description', 'paymentMethod', 'category']
            }
          }
        });

        const text = response.text;
        if (text) {
          dataResult = JSON.parse(text);
        }
      }

      if (!dataResult) {
        throw new Error('Não foi possível identificar os dados no recibo.');
      }

      // Populate form
      setFormData({
        description: dataResult.description || 'Compra no Estabelecimento',
        amount: dataResult.amount ? String(dataResult.amount) : '',
        category: (dataResult.category === 'Fixas' ? 'Fixas' : 'Variáveis') as ExpenseCategory,
        paymentStatus: dataResult.paymentStatus === 'pending' ? 'pending' : 'paid',
        paymentMethod: (dataResult.paymentMethod || 'credit_card') as PaymentMethod,
        dueDate: dataResult.date || new Date().toISOString().split('T')[0],
        repeats: dataResult.installments && dataResult.installments > 1 ? dataResult.installments : 1,
        itemsSummary: dataResult.itemsSummary || ''
      });

      setHasScanned(true);
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Erro ao fazer a leitura do recibo. Você pode preencher manualmente.');
      // Still allow manual input
      setHasScanned(true);
    } finally {
      setIsScanning(false);
    }
  };

  // Submit and Save Expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (!formData.description.trim() || isNaN(amountNum) || amountNum <= 0) {
      setScanError('Preencha a descrição e um valor válido.');
      return;
    }

    // Determine target month from dueDate
    const targetMonthId = formData.dueDate ? formData.dueDate.substring(0, 7) : currentMonthId;

    onSaveExpense({
      description: formData.description.trim(),
      amount: amountNum,
      category: formData.category,
      paid: formData.paymentStatus === 'paid',
      dueDate: formData.dueDate || undefined,
      paymentMethod: formData.paymentMethod,
      repeats: Math.max(1, Math.min(60, Number(formData.repeats || 1))),
      targetMonthId,
      receiptUrl: imagePreview || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl border border-brand-border w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Sparkles size={18} className="text-purple-200" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">
                Leitor Inteligente de Recibos
              </h2>
              <p className="text-[10px] text-purple-200 font-medium">
                Faça upload do comprovante para leitura automática de valor e opções de pagamento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* UPLOAD / DROP AREA */}
          {!imagePreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 rounded-3xl p-8 text-center space-y-4 transition-all hover:bg-purple-50/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-md shadow-purple-100">
                <UploadCloud size={30} />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Envie a foto do recibo ou cupom fiscal
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
                  Arraste e solte o arquivo aqui, cole um print com <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Ctrl+V</kbd> ou clique para selecionar.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-purple-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText size={15} />
                  <span>Escolher Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={15} />
                  <span>Tirar Foto</span>
                </button>
              </div>

              <div className="text-[10px] font-bold text-slate-400 uppercase pt-2 flex items-center justify-center gap-2">
                <span>⚡ Suporta cupons NFC-e, notas fiscais, faturas de cartão e recibos Pix</span>
              </div>
            </div>
          ) : (
            /* PREVIEW & SCANNING STATE */
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-sm flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Recibo"
                  className="w-full h-full object-cover"
                />

                {/* Laser animation when scanning */}
                {isScanning && (
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee]"
                    animate={{ top: ['0%', '95%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isScanning ? (
                    <span className="text-xs font-black uppercase text-indigo-600 flex items-center gap-1.5">
                      <RefreshCw size={13} className="animate-spin" />
                      Lendo recibo com Inteligência Artificial...
                    </span>
                  ) : hasScanned ? (
                    <span className="text-xs font-black uppercase text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      Recibo analisado com sucesso!
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {isScanning
                    ? 'Extraindo valor total, data, estabelecimento e forma de pagamento do documento.'
                    : 'Confira e ajuste as opções de pagamento abaixo antes de confirmar o cadastro.'}
                </p>

                {formData.itemsSummary && (
                  <div className="text-[11px] font-bold text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-200/60 mt-1 inline-block">
                    🛒 Itens identificados: <span className="font-normal text-slate-700">{formData.itemsSummary}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setHasScanned(false);
                      setScanError(null);
                    }}
                    className="text-[10px] font-black uppercase text-purple-700 hover:text-purple-800 bg-purple-100/70 hover:bg-purple-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Escanear Outro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCAN ERROR BANNER */}
          {scanError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{scanError}</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Você pode preencher o valor e as opções de pagamento manualmente nos campos abaixo.
                </p>
              </div>
            </div>
          )}

          {/* EXPENSE DETAILS & PAYMENT OPTIONS FORM */}
          {(hasScanned || imagePreview) && (
            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Descrição */}
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Estabelecimento / Descrição da Despesa
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Supermercado Guanabara, Posto Ipiranga..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    required
                  />
                </div>

                {/* Valor Lido */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-purple-700 block flex items-center gap-1">
                    <Sparkles size={11} /> Valor Lido do Recibo (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2.5 bg-purple-50/50 border border-purple-300 rounded-2xl text-sm font-black font-mono text-purple-900 outline-none focus:border-purple-600 transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT OPTIONS SECTION (OPÇÕES DE PAGAMENTO) */}
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-purple-600" />
                    <span>Opções de Pagamento</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Igual ao fluxo financeiro do sistema
                  </span>
                </div>

                {/* 1. Forma de Pagamento (Método) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PAYMENT_METHOD_OPTIONS.map((opt) => {
                      const isSelected = formData.paymentMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: opt.id })}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm font-black'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 font-bold'
                          }`}
                        >
                          <span className="text-sm">{opt.icon}</span>
                          <span className="text-xs truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Status do Pagamento (Pago vs A Pagar) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Status do Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black ${
                          formData.paymentStatus === 'paid'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Já Pago</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentStatus: 'pending' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black ${
                          formData.paymentStatus === 'pending'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <Clock size={14} />
                        <span>A Pagar</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Parcelamento / Repetições */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Condição / Parcelas
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={formData.repeats > 1 ? 'installment' : 'single'}
                        onChange={(e) => {
                          if (e.target.value === 'single') {
                            setFormData({ ...formData, repeats: 1 });
                          } else if (formData.repeats === 1) {
                            setFormData({ ...formData, repeats: 2 });
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="single">À Vista (1x)</option>
                        <option value="installment">Parcelado / Repetir</option>
                      </select>

                      {formData.repeats > 1 && (
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">x</span>
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={formData.repeats}
                            onChange={(e) => setFormData({ ...formData, repeats: parseInt(e.target.value, 10) || 2 })}
                            className="w-full pl-6 pr-2 py-2 bg-white border border-purple-300 rounded-xl text-xs font-black text-purple-900 outline-none text-center"
                            title="Total de parcelas mensais"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Categoria e Vencimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Categoria no Orçamento
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                        className="text-[9px] font-black uppercase text-purple-600 hover:text-purple-800"
                      >
                        {isCreatingCategory ? 'Selecionar Existente' : '+ Nova Categoria'}
                      </button>
                    </div>

                    {isCreatingCategory ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Nome da categoria..."
                          className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              const cat = newCategoryName.trim();
                              if (onAddCategory) onAddCategory(cat);
                              setFormData({ ...formData, category: cat as ExpenseCategory });
                              setIsCreatingCategory(false);
                              setNewCategoryName('');
                            }
                          }}
                          className="px-3 py-2 bg-purple-600 text-white text-xs font-black rounded-xl"
                        >
                          Usar
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__create_new__') {
                            setIsCreatingCategory(true);
                          } else {
                            setFormData({ ...formData, category: e.target.value as ExpenseCategory });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        {(availableCategories && availableCategories.length > 0 
                          ? availableCategories 
                          : ['Fixas', 'Variáveis', 'Alimentação', 'Mercado', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros']
                        ).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__create_new__">+ Criar Nova Categoria...</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Data da Compra / Vencimento
                    </label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Check size={16} strokeWidth={3} />
                  <span>Confirmar e Cadastrar Despesa</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
