import React, { useState } from 'react';
import { X, Delete, Divide, Minus, Plus, X as Multiply, Equal, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleNumber = (num: string) => {
    if (isDone) {
      setDisplay(num);
      setEquation('');
      setIsDone(false);
      return;
    }
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setIsDone(false);
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsDone(false);
  };

  const handleEqual = () => {
    try {
      // Use Function constructor for a simple calculation (safer than eval for simple arithmetic)
      // Replace symbols for calc
      const calcStr = (equation + display).replace(/×/g, '*').replace(/÷/g, '/');
      const result = new Function(`return ${calcStr}`)();
      setDisplay(String(Number(result.toFixed(2))));
      setEquation('');
      setIsDone(true);
    } catch (e) {
      setDisplay('Erro');
    }
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const buttons = [
    { label: 'C', onClick: handleClear, color: 'bg-red-50 text-red-500', icon: <RotateCcw size={18} /> },
    { label: '÷', onClick: () => handleOperator('/'), color: 'bg-brand-bg text-brand-primary', icon: <Divide size={18} /> },
    { label: '×', onClick: () => handleOperator('*'), color: 'bg-brand-bg text-brand-primary', icon: <Multiply size={18} /> },
    { label: 'DEL', onClick: handleDelete, color: 'bg-brand-bg text-brand-text-muted', icon: <Delete size={18} /> },
    { label: '7', onClick: () => handleNumber('7') },
    { label: '8', onClick: () => handleNumber('8') },
    { label: '9', onClick: () => handleNumber('9') },
    { label: '-', onClick: () => handleOperator('-'), color: 'bg-brand-bg text-brand-primary', icon: <Minus size={18} /> },
    { label: '4', onClick: () => handleNumber('4') },
    { label: '5', onClick: () => handleNumber('5') },
    { label: '6', onClick: () => handleNumber('6') },
    { label: '+', onClick: () => handleOperator('+'), color: 'bg-brand-bg text-brand-primary', icon: <Plus size={18} /> },
    { label: '1', onClick: () => handleNumber('1') },
    { label: '2', onClick: () => handleNumber('2') },
    { label: '3', onClick: () => handleNumber('3') },
    { label: '=', onClick: handleEqual, color: 'bg-brand-primary text-white row-span-2', icon: <Equal size={20} /> },
    { label: '0', onClick: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', onClick: handleDecimal }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-brand-border"
      >
        <div className="p-4 flex justify-between items-center bg-brand-bg">
          <span className="text-xs font-black uppercase tracking-widest text-brand-text-muted">Calculadora</span>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-lg transition-colors text-brand-text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-brand-bg/50">
          <div className="text-right text-brand-text-muted text-sm h-6 overflow-hidden uppercase font-mono">
            {equation.replace(/\*/g, '×').replace(/\//g, '÷')}
          </div>
          <div className="text-right text-4xl font-black text-brand-text-main h-12 overflow-hidden items-center flex justify-end font-mono">
            {display}
          </div>
        </div>

        <div className="p-4 grid grid-cols-4 gap-2">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              className={`
                h-14 rounded-xl flex items-center justify-center font-black text-lg transition-all active:scale-95
                ${btn.className || ''}
                ${btn.color || 'bg-white hover:bg-brand-bg text-brand-text-main border border-brand-border'}
              `}
            >
              {btn.icon || btn.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
