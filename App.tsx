/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, ChangeEvent } from 'react';
import BottomNav from './components/BottomNav';
import { ChevronRight, ChevronLeft, X, Ruler, ArrowUp, ArrowDown, Share2, Edit2, Download, Trash2, Copy, Map as MapIcon, TrendingUp, TrendingDown, Maximize2, Minimize2, Navigation, ArrowUpDown, Check, ChevronUp, ChevronDown, HelpCircle, Settings, Volume2, Mic, MoreHorizontal, MoreVertical, Minus, Plus, Layout, Activity, BarChart3, Cpu, Zap, Heart, Clock, Gauge, Thermometer, Battery, Bell, Languages, MapPin, User, Dumbbell, Globe, Info, History, Smartphone, Palette, Play, Pause, GripVertical, Hand, Target, Menu, CornerUpRight, CornerUpLeft, ArrowUpRight, ArrowUpLeft, Compass, MoveUp, Bike, Camera, Image, Wind, Sun, Cloud, CloudRain, Droplet } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SunCalc from 'suncalc';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Toggle = ({ enabled, setEnabled }: { enabled: boolean; setEnabled: (v: boolean) => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      setEnabled(!enabled);
    }}
    className={`w-12 h-6 rounded-full relative shrink-0 ${
      enabled ? 'bg-accent' : 'bg-gray-200 dark:bg-zinc-900'
    }`}
  >
    <motion.div
      animate={{ x: enabled ? 26 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
    />
  </button>
);

const ActionButton = ({ label, onClick, isColor = false, colorValue, secondaryColor }: { label: string; onClick?: () => void; isColor?: boolean; colorValue?: string; secondaryColor?: string }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`px-4 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-md text-[10px] font-black tracking-widest uppercase hover:bg-gray-50 dark:hover:bg-zinc-900 shrink-0 flex items-center justify-center min-w-[80px] ${
      isColor ? 'h-8' : ''
    }`}
    style={isColor ? { 
      background: `linear-gradient(115deg, ${colorValue} 50%, ${secondaryColor} 50%)`, 
      borderColor: colorValue 
    } : {}}
  >
    {!isColor && label}
  </button>
);

const RainLockIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    <path d="M9 15c.5 1.5 1.5 2.5 3 2.5" />
  </svg>
);

const ClimbProOverlay = ({ climb }: { climb: { name: string, dist: number, gain: number, grade: number } }) => (
  <motion.div 
    initial={{ x: -300 }}
    animate={{ x: 0 }}
    exit={{ x: -300 }}
    className="absolute left-0 top-1/2 -translate-y-1/2 z-[2000] w-48 bg-black/60 backdrop-blur-lg border-r border-y border-white/10 rounded-r-2xl p-4 text-white"
  >
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp size={16} className="text-red-500" />
      <span className="text-[10px] font-black uppercase tracking-widest">ПОДЪЕМ PRO</span>
    </div>
    <h3 className="text-sm font-black mb-1 truncate">{climb.name}</h3>
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[8px] font-bold opacity-60 uppercase">ОСТАЛОСЬ</span>
        <span className="text-xs font-black">{climb.dist} км</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-[8px] font-bold opacity-60 uppercase">НАБОР</span>
        <span className="text-xs font-black">{climb.gain} м</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-[8px] font-bold opacity-60 uppercase">ГРАДИЕНТ</span>
        <span className="text-xs font-black text-red-400">{climb.grade}%</span>
      </div>
    </div>
    <div className="mt-4 h-12 w-full bg-white/5 rounded-lg relative overflow-hidden">
       <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
         {[40, 60, 80, 70, 90, 100, 85, 95].map((h, i) => (
           <div key={i} className="flex-1 bg-red-500/40 border-t border-red-500" style={{ height: `${h}%` }} />
         ))}
       </div>
    </div>
  </motion.div>
);

const SettingItem: React.FC<{ 
  title: string; 
  subtitle?: React.ReactNode; 
  value?: string;
  icon?: React.ReactNode;
  action?: { 
    type: 'toggle' | 'button'; 
    enabled?: boolean; 
    setEnabled?: (v: boolean) => void;
    label?: string;
    onClick?: () => void;
    isColor?: boolean;
    colorValue?: string;
    secondaryColor?: string;
  }; 
  onClick?: () => void;
  onLongPress?: () => void;
}> = ({ 
  title, 
  subtitle, 
  value,
  icon,
  action, 
  onClick,
  onLongPress
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.();
    }, 600);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClick = () => {
    if (!isLongPress.current) {
      onClick?.();
    }
  };

  return (
    <div 
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-zinc-900 cursor-pointer active:bg-gray-50 dark:active:bg-zinc-900 select-none"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400">
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-gray-900 dark:text-white">{title}</span>
          {subtitle && <span className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[13px] font-bold text-accent mr-1">{value}</span>}
        {action ? (
          action.type === 'toggle' ? (
            <Toggle enabled={action.enabled!} setEnabled={action.setEnabled!} />
          ) : (
            <ActionButton 
              label={action.label!} 
              onClick={action.onClick} 
              isColor={action.isColor} 
              colorValue={action.colorValue} 
              secondaryColor={action.secondaryColor}
            />
          )
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="bg-gray-50 dark:bg-black px-4 py-2 mt-4 border-y border-gray-100 dark:border-zinc-900">
    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{title}</span>
  </div>
);

const THEME_COLORS = [
  { name: 'Красный', color: '#991b1b', secondary: '#7f1d1d' },
  { name: 'Синий', color: '#0077b6', secondary: '#023e8a' },
  { name: 'Зеленый', color: '#166534', secondary: '#14532d' },
  { name: 'Оранжевый', color: '#b45309', secondary: '#92400e' },
  { name: 'Фиолетовый', color: '#5b21b6', secondary: '#4c1d95' },
  { name: 'Розовый', color: '#E91E63', secondary: '#B80F60' },
  { name: 'Маджента', color: '#9C27B0', secondary: '#7A007A' },
  { name: 'Аква', color: '#00BCD4', secondary: '#008BA3' },
  { name: 'Золотой', color: '#FFC107', secondary: '#8C6512' },
  { name: 'Серый', color: '#9E9E9E', secondary: '#616161' },
];

const DATA_FIELD_COLORS = [
  { name: 'Красный', color: '#991b1b' },
  { name: 'Синий', color: '#0077b6' },
  { name: 'Зеленый', color: '#166534' },
  { name: 'Оранжевый', color: '#b45309' },
  { name: 'Фиолетовый', color: '#5b21b6' },
  { name: 'Розовый', color: '#E91E63' },
  { name: 'Маджента', color: '#9C27B0' },
  { name: 'Аква', color: '#00BCD4' },
  { name: 'Золотой', color: '#FFC107' },
  { name: 'Серый', color: '#9E9E9E' },
  { name: 'Черный', color: '#000000' },
  { name: 'Белый', color: '#FFFFFF' },
];

const THEME_BG_COLORS = [
  { name: 'Красный', color: '#FFCDD2' },
  { name: 'Розовый', color: '#F8BBD0' },
  { name: 'Маджента', color: '#E1BEE7' },
  { name: 'Фиолетовый', color: '#D1C4E9' },
  { name: 'Королевский синий', color: '#C5CAE9' },
  { name: 'Синий', color: '#BBDEFB' },
  { name: 'Аква', color: '#B2EBF2' },
  { name: 'Карибский', color: '#B2DFDB' },
  { name: 'Зеленый', color: '#C8E6C9' },
  { name: 'Лайм', color: '#F0F4C3' },
  { name: 'Золотой', color: '#FFECB3' },
  { name: 'Ржавый', color: '#FFCCBC' },
  { name: 'Оранжевый', color: '#FFE0B2' },
  { name: 'Серый', color: '#F5F5F5' },
];

const ThemeColorPicker: React.FC<{ onSelect: (color: { color: string, secondary: string }) => void; onCancel: () => void; selectedColor: string }> = ({ onSelect, onCancel, selectedColor }) => (
  <motion.div 
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
  >
    <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
      <button onClick={onCancel} className="p-2 -ml-2">
        <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
      </button>
      <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Выберите цвет темы</h1>
    </header>
    <div className="flex-1 overflow-y-auto">
      {THEME_COLORS.map((item) => (
        <button
          key={item.name}
          onClick={() => onSelect(item)}
          className="w-full h-16 flex items-center justify-between px-6 transition-opacity active:opacity-70 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(115deg, ${item.color} 50%, ${item.secondary} 50%)` 
          }}
        >
          <span className="text-white font-bold text-lg relative z-10">{item.name}</span>
          {selectedColor === item.color && (
            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-white/20 relative z-10">
              ВЫБРАНО
            </span>
          )}
        </button>
      ))}
    </div>
    <div className="h-20 shrink-0 bg-[#1a1a1a] flex items-center justify-center">
      <button 
        onClick={onCancel}
        className="text-white font-black uppercase tracking-[0.2em] text-sm"
      >
        ОТМЕНА
      </button>
    </div>
  </motion.div>
);

const MetricsBgColorPicker: React.FC<{ onSelect: (color: string) => void; onCancel: () => void; selectedColor: string }> = ({ onSelect, onCancel, selectedColor }) => (
  <motion.div 
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
  >
    <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
      <button onClick={onCancel} className="p-2 -ml-2">
        <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
      </button>
      <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Цвет подложки</h1>
    </header>
    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-px bg-gray-100 dark:bg-zinc-900">
      {Array.from(new Set([...THEME_COLORS.map(c => c.color), '#000000', '#FFFFFF', '#E91E63', '#FF00FF', '#00FF00', '#0000FF'])).map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className="h-24 flex items-center justify-center relative transition-opacity active:opacity-70"
          style={{ backgroundColor: color }}
        >
          {selectedColor === color && (
            <div className="bg-white/20 backdrop-blur-sm p-1 rounded-full border border-white/40">
              <Check className="w-6 h-6 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
    <div className="h-20 shrink-0 bg-[#1a1a1a] flex items-center justify-center">
      <button 
        onClick={onCancel}
        className="text-white font-black uppercase tracking-[0.2em] text-sm"
      >
        ОТМЕНА
      </button>
    </div>
  </motion.div>
);

const LevelSliderModal: React.FC<{ value: number; onChange: (v: number) => void; onClose: () => void }> = ({ value, onChange, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">Показатель затемнения</h3>
        <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-gray-400" /></button>
      </div>
      <div className="flex flex-col items-center gap-8">
        <span className="text-5xl font-black text-accent">{value}%</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="10" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between w-full text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="w-full mt-8 py-4 bg-accent text-white font-bold rounded-xl uppercase tracking-widest text-xs"
      >
        Готово
      </button>
    </motion.div>
  </div>
);

const TimeoutPickerModal: React.FC<{ value: string; onSelect: (v: string) => void; onClose: () => void }> = ({ value, onSelect, onClose }) => {
  const options = [
    '5 секунд', '10 секунд', '30 секунд', '1 минута', 
    '2 минуты', '5 минут', '10 минут', '30 минут'
  ];
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">Время затемнения</h3>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt);
                onClose();
              }}
              className={`w-full py-4 px-6 text-left text-sm font-medium border-b border-gray-50 dark:border-zinc-800/50 flex justify-between items-center ${
                value === opt ? 'text-accent bg-accent/5' : 'text-gray-700 dark:text-zinc-300'
              }`}
            >
              {opt}
              {value === opt && <div className="w-2 h-2 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const AutoDimMenu = ({ 
  onBack, 
  enabled, 
  setEnabled, 
  level, 
  setLevel, 
  timeout, 
  setTimeout 
}: { 
  onBack: () => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  level: number;
  setLevel: (v: number) => void;
  timeout: string;
  setTimeout: (v: string) => void;
}) => {
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Авто-затемнение</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <SettingItem 
          title="Авто-затемнение" 
          action={{ type: 'toggle', enabled, setEnabled }} 
        />
        <SettingItem 
          title="Показатель затемнения" 
          action={{ 
            type: 'button', 
            label: `${level}%`,
            onClick: () => setShowLevelModal(true)
          }} 
        />
        <SettingItem 
          title="Затемнение" 
          action={{ 
            type: 'button', 
            label: `Через ${timeout}`,
            onClick: () => setShowTimeoutModal(true)
          }} 
        />
      </div>

      <AnimatePresence>
        {showLevelModal && (
          <motion.div key="level-modal">
            <LevelSliderModal 
              value={level} 
              onChange={setLevel} 
              onClose={() => setShowLevelModal(false)} 
            />
          </motion.div>
        )}
        {showTimeoutModal && (
          <motion.div key="timeout-modal">
            <TimeoutPickerModal 
              value={timeout} 
              onSelect={setTimeout} 
              onClose={() => setShowTimeoutModal(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const METRIC_CATEGORIES = [
  {
    name: 'Каденс',
    metrics: [
      'График каденса', 'График каденса: Круг', 'Каденс: Текущий', 'Каденс: Средний',
      'Каденс: Средний за круг', 'Каденс: Максимальный', 'Каденс: Максимальный за круг',
      'Зона каденса: Текущая', 'Зона каденса: Средняя', 'Зона каденса: Средняя за круг',
      'Зона каденса: Максимальная', 'Зона каденса: Максимальная за круг',
      'Шаги: Всего', 'Шаги: Всего за круг'
    ]
  },
  {
    name: 'Калории',
    metrics: ['Калории: Всего', 'Калории: Всего за круг']
  },
  {
    name: 'Устройство и оборудование',
    metrics: [
      'Устройство: Уровень заряда батареи', 'Передача: Текущая', 'Давление в шинах: Текущее',
      'Давление в шинах: Среднее', 'Давление в шинах: Среднее за круг',
      'Давление в шинах: Максимальное', 'Давление в шинах: Максимальное за круг',
      'Давление в шинах: Минимальное', 'Давление в шинах: Минимальное за круг'
    ]
  },
  {
    name: 'Дистанция',
    metrics: ['Дистанция: Общая', 'Дистанция: Всего за круг']
  },
  {
    name: 'Набор высоты (Элевация)',
    metrics: [
      'График высоты маршрута', 'График высоты', 'График высоты: Круг', 'Подъем: Общий',
      'Подъем: Всего за круг', 'Спуск: Общий', 'Спуск: Всего за круг', 'Высота: Текущая',
      'Высота: Средняя', 'Высота: Средняя за круг', 'Высота: Максимальная',
      'Высота: Максимальная за круг', 'Высота: Минимальная', 'Высота: Минимальная за круг',
      'Высота: Общее изменение', 'Высота: Общее изменение за круг', 'Уклон: Текущий',
      'Уклон: Средний', 'Уклон: Средний за круг', 'Уклон: Максимальный',
      'Уклон: Максимальный за круг', 'Уклон: Минимальный', 'Уклон: Минимальный за круг',
      'VAM (Вертикальная скорость): Текущая', 'VAM: Средняя', 'VAM: Средняя за круг',
      'VAM: Максимальная', 'VAM: Максимальная за круг', 'VAM: Минимальная',
      'VAM: Минимальная за круг'
    ]
  },
  {
    name: 'Пульс (ЧСС)',
    metrics: [
      'График пульса', 'График пульса: Круг', 'Пульс: Текущий', 'Пульс: Средний',
      'Пульс: Средний за круг', 'Пульс: Максимальный', 'Пульс: Максимальный за круг',
      'Пульс: Минимальный', 'Пульс: Минимальный за круг', 'Пульс в процентах: Текущий',
      'Пульс в процентах: Средний', 'Пульс в процентах: Средний за круг',
      'Пульс в процентах: Максимальный', 'Пульс в процентах: Максимальный за круг',
      'Пульс в процентах: Минимальный', 'Пульс в процентах: Минимальный за круг',
      'Зона пульса: Текущая', 'Зона пульса: Средняя', 'Зона пульса: Средняя за круг',
      'Зона пульса: Максимальная', 'Зона пульса: Максимальная за круг',
      'Зона пульса: Минимальная', 'Зона пульса: Минимальная за круг'
    ]
  },
  {
    name: 'Круг',
    metrics: ['Номер круга']
  },
  {
    name: 'Карты и навигация',
    metrics: ['Карта', 'Карта и Навигация', 'Карта: Круг', 'Навигация: Пошаговые указания', 'Навигация: Дистанция до финиша', 'Навигация: Время прибытия (ETA)', 'Направление (Курс)']
  },
  {
    name: 'Мощность',
    metrics: [
      'График мощности', 'График мощности: Круг', 'Мощность: Текущая',
      'Мощность: Взвешенная мощность (Нормализованная)', 'Мощность: Взвешенная мощность за круг',
      'Мощность: Средняя за 3 секунды', 'Мощность: Средняя за 10 секунд',
      'Мощность: Средняя за 30 секунд', 'Мощность: Средняя', 'Мощность: Средняя за круг',
      'Мощность: Максимальная', 'Мощность: Максимальная за круг', 'Зона мощности: Текущая',
      'Зона мощности: Средняя', 'Зона мощности: Средняя за круг', 'Зона мощности: Максимальная',
      'Зона мощности: Максимальная за круг', 'Баланс мощности: Текущий', 'Баланс мощности: Средний',
      'Баланс мощности: Средний за круг', 'Эффективность педалирования: Текущая',
      'Эффективность педалирования: Средняя', 'Эффективность педалирования: Средняя за круг',
      'Плавность хода: Текущая', 'Плавность хода: Средняя', 'Плавность хода: Средняя за круг',
      'TSS (Оценка тренировочной нагрузки)', 'IF (Фактор интенсивности)', 'Мощность: КДж (Килоджоули)',
      'Удельная мощность (Вт/кг): Текущая', 'Удельная мощность (Вт/кг): Средняя',
      'Удельная мощность (Вт/кг): Средняя за круг', 'Удельная мощность (Вт/кг): Максимальная',
      'Удельная мощность (Вт/кг): Максимальная за круг'
    ]
  },
  {
    name: 'Скорость',
    metrics: [
      'График скорости', 'График скорости: Круг', 'Скорость: Текущая', 'Скорость: Средняя',
      'Скорость: Средняя за круг', 'Скорость: Максимальная', 'Скорость: Максимальная за круг',
      'Скорость: Минимальная', 'Скорость: Минимальная за круг'
    ]
  },
  {
    name: 'Время',
    metrics: [
      'Время: Всего', 'Время: В движении', 'Время: Остановка', 'Время: Текущий круг',
      'Время: Последний круг', 'Время: Среднее время круга', 'Время суток',
      'Время до заката/рассвета',
      'Время: Оставшееся (до цели)', 'Время: Расчетное время прибытия (ETA)',
      'Время: Расчетное время прибытия (ETA) на следующем круге'
    ]
  },
  {
    name: 'Погода',
    metrics: [
      'Погода: Температура', 'Погода: Ощущается как', 'Погода: Ветер', 'Погода: Направление ветра',
      'Погода: Влажность', 'Погода: Вероятность осадков', 'Погода: УФ-индекс', 'Погода: Видимость',
      'Погода: Точка росы', 'Погода: Облачность'
    ]
  },
  {
    name: 'Ветер',
    metrics: [
      'Ветер: Текущий (Скорость и направление)', 'Ветер: Направление (Текстовое описание)',
      'Ветер: Угол (Относительно движения)', 'Ветер: Компонент встречного ветра',
      'Ветер: Компонент бокового ветра'
    ]
  },
  {
    name: 'Разное',
    metrics: ['Заметки', 'Текст']
  }
];

const ZoneColorPickerModal = ({ 
  currentColor, 
  onSelect, 
  onClose 
}: { 
  currentColor: string; 
  onSelect: (color: string) => void; 
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Цвет зоны</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {THEME_COLORS.map((item) => (
            <button
              key={item.color}
              onClick={() => {
                onSelect(item.color);
                onClose();
              }}
              className={`w-full aspect-square rounded-xl transition-all ${currentColor === item.color ? 'ring-4 ring-accent ring-offset-4 dark:ring-offset-zinc-900 scale-90' : 'hover:scale-105'}`}
              style={{ backgroundColor: item.color }}
            />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest"
        >
          Закрыть
        </button>
      </motion.div>
    </div>
  );
};

let flyoverInterval: NodeJS.Timeout | null = null;

const MapAutoFollow = ({ center }: { center: L.LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      try {
        // Use animate: false for high-frequency updates to prevent piling up frames on mobile
        map.setView(center, map.getZoom(), { animate: false });
      } catch (e) {
        console.error("Map flyover error:", e);
      }
    }
  }, [center, map]);
  return null;
};

interface Segment {
  id: string;
  type: 'climb' | 'sprint';
  name: string;
  startDist: number;
  endDist: number;
  avgGrade?: number;
  totalGain?: number;
  maxSpeed?: number;
}

const detectRideSegments = (ride: Ride): Segment[] => {
  const segments: Segment[] = [];
  const { elevationData, speedData, distance } = ride;
  
  // Detect Climbs (Gradient > 3% for > 500m)
  if (elevationData.length > 5) {
    let climbStartIdx = -1;
    for (let i = 1; i < elevationData.length; i++) {
      const d1 = elevationData[i-1];
      const d2 = elevationData[i];
      const distDiff = d2.dist - d1.dist;
      if (distDiff <= 0) continue;
      
      const grade = ((d2.value - d1.value) / (distDiff * 1000)) * 100;
      
      if (grade > 3) {
        if (climbStartIdx === -1) climbStartIdx = i - 1;
      } else if (grade < 1 && climbStartIdx !== -1) {
        const climbDist = elevationData[i].dist - elevationData[climbStartIdx].dist;
        if (climbDist > 0.5) {
          const gain = elevationData[i].value - elevationData[climbStartIdx].value;
          const avgGrade = (gain / (climbDist * 1000)) * 100;
          segments.push({
            id: `climb-${climbStartIdx}`,
            type: 'climb',
            name: `Подъем ${avgGrade.toFixed(1)}%`,
            startDist: elevationData[climbStartIdx].dist,
            endDist: elevationData[i].dist,
            avgGrade,
            totalGain: gain
          });
        }
        climbStartIdx = -1;
      }
    }
  }

  // Detect Sprints (Speed > 45km/h for > 200m)
  if (speedData.length > 5) {
    let sprintStartIdx = -1;
    for (let i = 1; i < speedData.length; i++) {
      const s = speedData[i].value;
      if (s > 45) {
        if (sprintStartIdx === -1) sprintStartIdx = i - 1;
      } else if (s < 35 && sprintStartIdx !== -1) {
        const sprintDist = speedData[i].dist - speedData[sprintStartIdx].dist;
        if (sprintDist > 0.2) {
          const maxS = Math.max(...speedData.slice(sprintStartIdx, i + 1).map(d => d.value));
          segments.push({
            id: `sprint-${sprintStartIdx}`,
            type: 'sprint',
            name: 'Спринт-секция',
            startDist: speedData[sprintStartIdx].dist,
            endDist: speedData[i].dist,
            maxSpeed: maxS
          });
        }
        sprintStartIdx = -1;
      }
    }
  }

  return segments;
};

const FlyoverModal = ({ ride, onClose, isDarkMode }: { ride: Ride; onClose: () => void; isDarkMode: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [targetDuration, setTargetDuration] = useState(15);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const [warmUpProgress, setWarmUpProgress] = useState(0);
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const tilesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Ghost Rider State
  const [ghostRide, setGhostRide] = useState<Ride | null>(null);
  const [showGhostSelector, setShowGhostSelector] = useState(false);

  // Segment State
  const segments = useMemo(() => detectRideSegments(ride), [ride]);
  const [autoSlowing, setAutoSlowing] = useState(true);

  const currentDistValue = useMemo(() => {
    const totalPoints = ride.points.length;
    const progress = totalPoints > 1 ? currentIndex / (totalPoints - 1) : 1;
    return ride.distance * progress;
  }, [currentIndex, ride.points.length, ride.distance]);

  const currentSegment = useMemo(() => {
    return segments.find(s => currentDistValue >= s.startDist && currentDistValue <= s.endDist);
  }, [segments, currentDistValue]);

  const ghostCandidates = useMemo(() => {
    return MOCK_RIDES.filter(r => {
      if (r.id === ride.id) return false;
      // Check if start points are close (within ~1km)
      const p1 = ride.points[0];
      const p2 = r.points[0];
      if (!p1 || !p2) return false;
      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2-lat1) * Math.PI / 180;
        const dLon = (lon2-lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      return getDist(p1[0], p1[1], p2[0], p2[1]) < 2;
    });
  }, [ride]);

  const setTilesLoading = (loading: boolean) => {
    setIsTilesLoading(loading);
    if (loading) {
      if (tilesTimeoutRef.current) clearTimeout(tilesTimeoutRef.current);
      // Force loading to false after 5 seconds if map is stuck
      tilesTimeoutRef.current = setTimeout(() => {
        setIsTilesLoading(false);
      }, 5000);
    } else {
      if (tilesTimeoutRef.current) clearTimeout(tilesTimeoutRef.current);
      // Add a small grace period to allow the browser to paint the new tiles
      tilesTimeoutRef.current = setTimeout(() => {
        setIsTilesLoading(false);
      }, isRecording ? 500 : 100); 
    }
  };
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warmUpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TARGET_DURATION_MS = targetDuration * 1000;
  const baseInterval = Math.max(16, TARGET_DURATION_MS / (ride.points.length - 1 || 1));

  // Warm-up logic (caching tiles)
  const startWarmUp = () => {
    setIsWarmingUp(true);
    let index = 0;
    // Visually visit more points to trigger ALL related tiles
    const step = Math.max(1, Math.floor(ride.points.length / 40)); 
    
    warmUpTimerRef.current = setInterval(() => {
      // SMART WAIT for warm-up too
      if (isTilesLoading && index > 0) return;

      index += step;
      if (index >= ride.points.length - 1) {
        index = ride.points.length - 1;
        setWarmUpProgress(100);
        if (warmUpTimerRef.current) clearInterval(warmUpTimerRef.current);
        
        // Final long wait after reaching 100% to ensure background tile requests finish
        setTimeout(() => {
          setIsWarmingUp(false);
          setIsWarmedUp(true);
          setCurrentIndex(0);
        }, 3000); 
      } else {
        setWarmUpProgress((index / (ride.points.length - 1)) * 100);
        setCurrentIndex(index);
      }
    }, 400); // Significantly slower for high-res satellite tiles
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (isTilesLoading) return;

        let finished = false;
        setCurrentIndex(prev => {
          if (prev >= ride.points.length - 1) {
            finished = true;
            return prev;
          }
          return prev + 1;
        });

        if (finished) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          if (isRecording) {
            setIsRecording(false);
            setShowExportSuccess(true);
          }
        }
      }, (baseInterval / speed) * (autoSlowing && currentSegment ? 2 : 1));
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (warmUpTimerRef.current) clearInterval(warmUpTimerRef.current);
    };
  }, [isPlaying, speed, ride.points.length, baseInterval, isRecording, autoSlowing, currentSegment]);

  const currentPoint = ride.points[currentIndex] || ride.points[0];
  const animatedPoints = ride.points.slice(0, currentIndex + 1);
  
  // Ghost rider progress
  const ghostPoint = useMemo(() => {
    if (!ghostRide) return null;
    const totalPoints = ride.points.length;
    const progress = totalPoints > 1 ? currentIndex / (totalPoints - 1) : 1;
    const ghostIndex = Math.floor(progress * (ghostRide.points.length - 1));
    return ghostRide.points[ghostIndex];
  }, [ghostRide, currentIndex, ride.points.length]);

  // Percent through the ride
  const totalPoints = ride.points.length;
  const progress = totalPoints > 1 ? currentIndex / (totalPoints - 1) : 1;
  const currentDist = (ride.distance * progress).toFixed(2);
  
  // Interpolate sensor data
  const getInterpolatedValue = (data: { dist: number; value: number }[]) => {
    if (!data || data.length === 0) return 0;
    const targetDist = ride.distance * progress;
    const item = data.find(d => d.dist >= targetDist) || data[data.length - 1];
    return item.value;
  };

  const currentSpeed = getInterpolatedValue(ride.speedData);
  const currentHr = getInterpolatedValue(ride.hrData);
  const currentAlt = getInterpolatedValue(ride.elevationData);

  const handlePlayToggle = () => {
    if (!isPlaying && currentIndex >= ride.points.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const exportTCX = () => {
    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${new Date(ride.date).toISOString()}</Id>
      <Lap StartTime="${new Date(ride.date).toISOString()}">
        <TotalTimeSeconds>${ride.movingTime}</TotalTimeSeconds>
        <DistanceMeters>${ride.distance * 1000}</DistanceMeters>
        <Track>
          ${ride.points.map((p, i) => `
          <Trackpoint>
            <Time>${new Date(new Date(ride.date).getTime() + (i * 1000)).toISOString()}</Time>
            <Position>
              <LatitudeDegrees>${(p as L.LatLngTuple)[0]}</LatitudeDegrees>
              <LongitudeDegrees>${(p as L.LatLngTuple)[1]}</LongitudeDegrees>
            </Position>
            <DistanceMeters>${(ride.distance * 1000 * (i / ride.points.length)).toFixed(1)}</DistanceMeters>
            ${ride.hrData?.[0] ? `<HeartRateBpm><Value>${Math.round(ride.hrData[Math.min(ride.hrData.length-1, Math.floor(i * (ride.hrData.length / ride.points.length)))].value)}</Value></HeartRateBpm>` : ''}
          </Trackpoint>`).join('')}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    const blob = new Blob([tcx], { type: 'application/vnd.garmin.tcx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ride.name.replace(/\s+/g, '_')}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartExport = async () => {
    setCaptureError(null);
    setVideoUrl(null);
    
    const isSupported = navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function';
    
    if (!isSupported) {
      setCaptureError("Ваш браузер или текущий режим просмотра (iframe) ограничивают автоматическую запись экрана. Мы перейдем в 'Режим Кино' — вы сможете записать экран самостоятельно средствами вашей ОС, а затем скачать TCX файл.");
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsRecording(true);
      setShowExportSuccess(false);
      return;
    }

    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { 
          frameRate: { ideal: 30 },
          cursor: "never"
        },
        audio: false
      });

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser decide
      }

      const recorder = new MediaRecorder(stream, { mimeType: mimeType || undefined });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        stream.getTracks().forEach(track => track.stop());
        setShowExportSuccess(true);
        setIsRecording(false);
      };

      setCurrentIndex(0);
      setIsPlaying(true);
      setIsRecording(true);
      setShowExportSuccess(false);
      recorder.start();
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err.name === 'NotAllowedError') {
        setCaptureError("Запись отменена пользователем. Вы можете использовать ручную запись в системном 'Режиме Кино'.");
      } else {
        setCaptureError(`Ошибка запуска записи: ${err.message || 'Неизвестная ошибка'}. Переходим в ручной режим.`);
      }
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsRecording(true);
      setShowExportSuccess(false);
    }
  };

  useEffect(() => {
    if (isPlaying && currentIndex >= ride.points.length - 1) {
      if (isRecording) {
        setIsPlaying(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        } else {
          // If no auto-recorder was active (fallback mode), still show success/TCX
          setIsRecording(false);
          setShowExportSuccess(true);
        }
      }
    }
  }, [currentIndex, isPlaying, isRecording, ride.points.length]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[5000] bg-black flex flex-col font-sans overflow-hidden"
      translate="no"
    >
      {/* Warm-up Overlay */}
      {!isWarmedUp && !isWarmingUp && (
        <div className="absolute inset-0 z-[6000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,119,182,0.5)]">
            <Globe size={32} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest mb-2">ПОДГОТОВКА ОТЧЕТА</h2>
          <p className="text-sm text-gray-400 max-w-xs mb-8">
            Нам нужно загрузить фрагменты спутниковой карты по всему маршруту для плавного полета.
          </p>
          <button 
            onClick={startWarmUp}
            className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
          >
            КЭШИРОВАТЬ КАРТУ
          </button>
        </div>
      )}

      {isWarmingUp && (
        <div className="absolute inset-0 z-[6000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="relative w-32 h-32 mb-8">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
               <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={376.8} strokeDashoffset={376.8 - (376.8 * warmUpProgress / 100)} className="text-accent transition-all duration-300" strokeLinecap="round" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-2xl font-black italic">{Math.round(warmUpProgress)}%</span>
             </div>
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest mb-1">
            {warmUpProgress === 100 ? "ЗАВЕРШЕНИЕ" : "ЗАГРУЗКА ДАННЫХ"}
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">
            {isTilesLoading ? "Ожидание загрузки тайлов..." : "Оптимизация текстур спутника..."}
          </p>
        </div>
      )}

      {/* Capture Error Overlay */}
      <AnimatePresence>
        {captureError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-[7000] bg-zinc-900/95 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl border border-white/10"
          >
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4">РЕЖИМ КИНО</h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {captureError}
            </p>
            <button 
              onClick={() => {
                setCaptureError(null);
              }}
              className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              ПОНЯТНО
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-[6000] bg-white dark:bg-zinc-900 p-8 rounded-3xl text-center shadow-2xl border border-gray-100 dark:border-zinc-800"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">ЗАПИСЬ ЗАВЕРШЕНА!</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Ваш 3D-отчет успешно записан. Теперь вы можете сохранить видео или скачать TCX файл.
            </p>
            <div className="flex flex-col gap-3">
              {videoUrl && (
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = videoUrl;
                    a.download = `Flyover_${ride.name.replace(/\s+/g, '_')}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <Camera size={20} />
                  СОХРАНИТЬ ВИДЕО
                </button>
              )}
              <button 
                onClick={() => {
                  exportTCX();
                  setShowExportSuccess(false);
                }}
                className="w-full bg-accent text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} />
                СКАЧАТЬ TCX
              </button>
              <button 
                onClick={() => {
                  if (videoUrl) URL.revokeObjectURL(videoUrl);
                  setVideoUrl(null);
                  setShowExportSuccess(false);
                }}
                className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all text-xs"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-[5010] bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-6 pb-20 px-6 pointer-events-none">
        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto">
            <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">RECORDING</span>
            </div>
            {!videoUrl && (
              <button 
                onClick={() => {
                  setIsPlaying(false);
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.stop();
                  } else {
                    setIsRecording(false);
                    setShowExportSuccess(true);
                  }
                }}
                className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                ЗАВЕРШИТЬ ЗАПИСЬ
              </button>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-start">
           <div className="flex flex-col gap-1 pr-16">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,1)]" />
               <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em] drop-shadow-md">COROS VIDEO REPORT</h2>
             </div>
             <h1 className="text-xl md:text-2xl font-black text-white drop-shadow-lg uppercase tracking-widest break-words leading-tight">
               {ride.name}
             </h1>
             {ghostRide && (
               <div className="flex items-center gap-2 mt-1">
                 <div className="px-2 py-0.5 bg-indigo-500 rounded text-[8px] font-black text-white uppercase tracking-widest">VS GHOST</div>
                 <span className="text-[10px] font-bold text-white/60 truncate max-w-[150px]">{ghostRide.name}</span>
               </div>
             )}
           </div>
           <div className="absolute top-6 right-6 flex items-center gap-4">
             {ghostCandidates.length > 0 && !isRecording && (
               <button 
                 onClick={() => setShowGhostSelector(true)}
                 className="pointer-events-auto group flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl active:scale-95 transition-all hover:bg-white/20"
               >
                 <User size={18} className={ghostRide ? "text-indigo-400" : "text-white/60"} />
                 <div className="text-left">
                   <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">GHOST RIDER</div>
                   <div className="text-[10px] font-extrabold text-white uppercase tracking-tighter">
                     {ghostRide ? 'CONNECTED' : 'CHOOSE RIDE'}
                   </div>
                 </div>
               </button>
             )}
             <button 
               onClick={onClose}
               className="pointer-events-auto w-12 h-12 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl hover:bg-black/60"
             >
               <X size={24} />
             </button>
           </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-8">
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 mb-1 opacity-60">
               <MapPin size={10} className="text-white" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">ДИСТАНЦИЯ</span>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">{currentDistValue.toFixed(2)}</span>
               <span className="text-[10px] font-bold text-white/50">КМ</span>
             </div>
           </div>
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 mb-1 opacity-60">
               <Gauge size={10} className="text-white" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">СКОРОСТЬ</span>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">{currentSpeed.toFixed(0)}</span>
               <span className="text-[10px] font-bold text-white/50">КМ/Ч</span>
             </div>
           </div>
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 mb-1 opacity-60">
               <Heart size={10} className="text-white" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">ПУЛЬС</span>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-white tabular-nums drop-shadow-md">{currentHr.toFixed(0)}</span>
               <span className="text-[10px] font-bold text-white/50">УД</span>
             </div>
           </div>
        </div>
      </div>

      {/* Segment Pro (ClimbPro style) Overlay */}
      <AnimatePresence>
        {currentSegment && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-[5030] pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_80px_rgba(0,0,0,0.5)] min-w-[240px]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,119,182,0.4)]">
                   {currentSegment.type === 'climb' ? <TrendingUp size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-0.5">
                    {currentSegment.type === 'climb' ? 'CLIMB PRO' : 'SPRINT SECTION'}
                  </div>
                  <h3 className="text-xl font-black text-white italic truncate max-w-[180px]">{currentSegment.name}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
                <div>
                  <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">ОСТАЛОСЬ</div>
                  <div className="text-lg font-black text-white">{(currentSegment.endDist - currentDistValue).toFixed(1)} <span className="text-[10px] opacity-40">КМ</span></div>
                </div>
                {currentSegment.type === 'climb' && (
                   <div>
                     <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">УКЛОН</div>
                     <div className="text-lg font-black text-accent">{currentSegment.avgGrade?.toFixed(1)}%</div>
                   </div>
                )}
                {currentSegment.type === 'sprint' && (
                   <div>
                     <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">МАКС. СКОР.</div>
                     <div className="text-lg font-black text-white">{currentSegment.maxSpeed?.toFixed(0)} <span className="text-[10px] opacity-40">КМ/Ч</span></div>
                   </div>
                )}
              </div>

              {/* Segment mini-profile */}
              {currentSegment.type === 'climb' && (
                <div className="h-16 w-full flex items-end gap-[2px] bg-white/5 rounded-xl px-2 py-1 overflow-hidden relative">
                   {[30, 45, 60, 80, 70, 95, 100, 85, 90, 65].map((h, i) => (
                     <div key={i} className="flex-1 bg-accent/30 border-t-2 border-accent" style={{ height: `${h}%` }} />
                   ))}
                   <motion.div 
                     className="absolute bottom-0 left-0 w-[2px] h-full bg-white z-10 shadow-[0_0_10px_white]"
                     animate={{ left: `${((currentDistValue - currentSegment.startDist) / (currentSegment.endDist - currentSegment.startDist)) * 100}%` }}
                   />
                </div>
              )}
              {currentSegment.type === 'sprint' && (
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    animate={{ width: `${((currentDistValue - currentSegment.startDist) / (currentSegment.endDist - currentSegment.startDist)) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Content */}
      <div className="flex-1 w-full relative -mt-4">
        {ride.points && ride.points.length > 0 && (
          <MapContainer 
            center={ride.points[0]} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
            preferCanvas={true}
          >
            <TileLayer 
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
              maxZoom={18} // Capping at 18 for faster & more reliable tile delivery
              updateWhenZooming={false}
              updateWhenIdle={false}
              keepBuffer={30} // Even more aggressive buffer
              onLoading={() => setTilesLoading(true)}
              onLoad={() => setTilesLoading(false)}
            />
            {animatedPoints.length > 1 && (
              <Polyline positions={animatedPoints} color="#ffff00" weight={5} opacity={0.8} />
            )}
            {currentPoint && (
              <CircleMarker 
                center={currentPoint} 
                radius={10} 
                fillColor="#0077b6" 
                fillOpacity={1} 
                stroke={true} 
                color="white" 
                weight={3} 
              >
                <MapTooltip permanent direction="top" offset={[0, -10]} className="bg-accent text-white border-none font-black text-[10px] p-1 rounded">ВЫ</MapTooltip>
              </CircleMarker>
            )}
            {ghostPoint && (
              <CircleMarker 
                center={ghostPoint} 
                radius={8} 
                fillColor="#6366f1" 
                fillOpacity={0.7} 
                stroke={true} 
                color="white" 
                weight={2} 
                dashArray="5,5"
              >
                <MapTooltip permanent direction="bottom" offset={[0, 10]} className="bg-indigo-500 text-white border-none font-black text-[8px] p-1 rounded">ПРИЗРАК</MapTooltip>
              </CircleMarker>
            )}
            {currentPoint && <MapAutoFollow center={currentPoint} />}
          </MapContainer>
        )}
      </div>

      {/* Footer Controls */}
      <AnimatePresence>
        {!isRecording && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-0 right-0 z-[5010] px-4 pointer-events-none"
          >
            <div className="max-w-md mx-auto flex flex-col gap-3">
          {/* Progress Row */}
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 pointer-events-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">ПРОГРЕСС ПОЕЗДКИ</span>
                {isTilesLoading && isPlaying && (
                  <div className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-0.5 rounded-full animate-pulse border border-accent/30">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">MAP_BUFFERING</span>
                  </div>
                )}
              </div>
               <span className="text-[10px] font-bold text-accent whitespace-nowrap bg-accent/20 px-2 py-0.5 rounded">{(progress * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-accent"
                initial={false}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2 pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePlayToggle}
                className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              
              <button 
                onClick={() => setSpeed(s => s === 5 ? 1 : s + 2)}
                className="px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest active:bg-white/20"
              >
                {speed}X
              </button>

              <button 
                onClick={() => setAutoSlowing(!autoSlowing)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${autoSlowing ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/10 text-white/40'}`}
              >
                AUTO-FOCUS
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {[15, 30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setTargetDuration(d)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${targetDuration === d ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    {d}S
                  </button>
                ))}
              </div>

              <button 
                onClick={handleStartExport}
                className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-lg text-white"
                title="Экспорт видео"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>

    {/* Ghost Ride Selector Modal */}
    <AnimatePresence>
      {showGhostSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[6000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8"
        >
          <div className="w-full max-w-md bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Выберите призрака</h3>
              <button 
                onClick={() => setShowGhostSelector(false)} 
                className="p-2 text-white/40 hover:text-white transition-colors pointer-events-auto"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {ghostCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setGhostRide(c);
                    setShowGhostSelector(false);
                    setCurrentIndex(0); 
                  }}
                  className={`w-full p-6 text-left border-b border-white/5 hover:bg-white/5 transition-colors flex justify-between items-center pointer-events-auto ${ghostRide?.id === c.id ? 'bg-accent/10' : ''}`}
                >
                  <div>
                    <div className="text-sm font-black text-white mb-1">{c.name}</div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{c.date} • {c.distance} КМ</div>
                  </div>
                  {ghostRide?.id === c.id ? (
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>
                  ) : (
                    <ChevronRight className="text-white/10" size={20} />
                  )}
                </button>
              ))}
              {ghostCandidates.length === 0 && (
                <div className="p-12 text-center">
                  <History size={32} className="mx-auto text-white/10 mb-4" />
                  <p className="text-sm text-white/40 italic">Похожих маршрутов не найдено</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-black/40 flex gap-3">
              <button 
                onClick={() => {
                  setGhostRide(null);
                  setShowGhostSelector(false);
                }}
                className="flex-1 py-4 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white border border-white/5 pointer-events-auto"
              >
                СБРОСИТЬ
              </button>
              <button 
                 onClick={() => setShowGhostSelector(false)}
                 className="flex-1 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest pointer-events-auto"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};

const RideDetailsModal = ({ ride, onClose, isDarkMode }: { ride: Ride; onClose: () => void; isDarkMode: boolean }) => {
  const [activeChart, setActiveChart] = useState<'speed' | 'elevation' | 'hr' | 'power' | 'cadence'>('speed');
  const [overlayChart, setOverlayChart] = useState<'elevation' | 'hr' | 'cadence' | 'power' | null>(null);
  const [showFlyover, setShowFlyover] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const MetricItem = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-gray-900 dark:text-white">
          {typeof value === 'number' ? Math.round(value * 10) / 10 : value}
        </span>
        {unit && <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">{unit}</span>}
      </div>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-900 pb-2 mb-4">{title}</h3>
  );

  const CustomTooltip = ({ active, payload, label, units }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[120px] z-[4000]">
          <p className="text-[10px] font-black text-zinc-500 mb-1 tracking-widest uppercase">
            ДИСТАНЦИЯ: {label.toFixed(1)} КМ
          </p>
          {payload.map((p: any, index: number) => (
            <p key={index} className="text-[12px] font-black uppercase tracking-widest" style={{ color: p.color }}>
              {p.value.toFixed(1)} {units[index] || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getChartData = (type: string) => {
    switch (type) {
      case 'speed': return ride.speedData;
      case 'elevation': return ride.elevationData;
      case 'hr': return ride.hrData;
      case 'power': return ride.powerData;
      case 'cadence': return ride.cadenceData;
      default: return ride.speedData;
    }
  };

  const getChartColor = (type: string) => {
    switch (type) {
      case 'speed': return '#0077b6';
      case 'elevation': return '#166534';
      case 'hr': return '#991b1b';
      case 'power': return '#5b21b6';
      case 'cadence': return '#b45309';
      default: return '#0077b6';
    }
  };

  const getUnit = (type: string) => {
    switch (type) {
      case 'speed': return 'км/ч';
      case 'elevation': return 'м';
      case 'hr': return 'уд/мин';
      case 'power': return 'Вт';
      case 'cadence': return 'об/мин';
      default: return '';
    }
  };

  const overlayButtons = [
    { id: 'elevation', label: 'ВЫСОТА', color: '#166534' },
    { id: 'hr', label: 'ПУЛЬС', color: '#991b1b' },
    { id: 'cadence', label: 'КАДЕНС', color: '#b45309' },
    { id: 'power', label: 'МОЩНОСТЬ', color: '#5b21b6' },
  ] as const;

  const mergedData = useMemo(() => {
    let data;
    if (!overlayChart) {
      data = ride.speedData.map(d => ({ ...d, speed: d.value }));
    } else {
      const overlayData = getChartData(overlayChart);
      data = ride.speedData.map((d, i) => ({
        dist: d.dist,
        speed: d.value,
        overlay: overlayData[i]?.value ?? 0
      }));
    }
    return [...data].sort((a, b) => a.dist - b.dist);
  }, [ride.speedData, overlayChart, ride.elevationData, ride.hrData, ride.powerData, ride.cadenceData]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[3000] bg-white dark:bg-zinc-950 flex flex-col font-sans overflow-hidden"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">{ride.date}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white">{ride.time}</span>
            {ride.type === 'cycling' ? <Gauge size={14} className="text-accent" /> : <Activity size={14} className="text-accent" />}
          </div>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{ride.name}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFlyover(true)}
                className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
              >
                <Camera size={10} /> 3D ПОЛЕТ
              </button>
              <button className="text-[10px] font-bold uppercase tracking-widest text-accent">КРУГИ</button>
              <Share2 size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Map Placeholder or Actual Map */}
          <div className="h-48 rounded-xl overflow-hidden mb-6 border border-gray-100 dark:border-zinc-900 relative">
            {ride.points && ride.points.length > 0 && (
              <MapContainer center={ride.points[0]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} touchZoom={false} scrollWheelZoom={false} doubleClickZoom={false}>
                <TileLayer url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                <Polyline positions={ride.points} color="#0077b6" weight={3} />
              </MapContainer>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button className="bg-white/80 dark:bg-black/80 p-2 rounded-lg backdrop-blur-md shadow-sm"><Maximize2 size={16} className="text-gray-900 dark:text-white" /></button>
            </div>
          </div>

          {/* RIDE NOTES & PHOTOS */}
          {(ride.notes || (ride.photos && ride.photos.length > 0) || ride.perceivedExertion !== undefined) && (
            <div className="mb-8 space-y-6">
              <SectionHeader title="ЗАМЕТКИ И ФОТО" />
              
              {ride.notes && (
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-900">
                  <p className="text-sm text-gray-700 dark:text-zinc-300 italic leading-relaxed">
                    "{ride.notes}"
                  </p>
                </div>
              )}

              {ride.perceivedExertion !== undefined && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-900">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Оценка нагрузки</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900 dark:text-white">{ride.perceivedExertion}</span>
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        ride.perceivedExertion === 0 ? 'bg-gray-400' :
                        ride.perceivedExertion <= 2 ? 'bg-blue-400' :
                        ride.perceivedExertion <= 4 ? 'bg-cyan-500' :
                        ride.perceivedExertion <= 6 ? 'bg-green-500' :
                        ride.perceivedExertion <= 8 ? 'bg-yellow-500' :
                        'bg-red-600'
                      }`}
                    />
                  </div>
                </div>
              )}

              {ride.photos && ride.photos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {ride.photos.map((photo, i) => (
                    <div key={i} className="w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-900">
                      <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS & HEATMAP */}
          <div className="mb-8">
            <SectionHeader title="АНАЛИТИКА И ТЕПЛОВАЯ КАРТА" />
            <div className="h-64 rounded-xl overflow-hidden mb-4 border border-gray-100 dark:border-zinc-900 relative">
               {ride.points && ride.points.length > 0 && (
                 <MapContainer center={ride.points[0]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                   <TileLayer url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                   {ride.points.slice(0, -1).map((p, i) => (
                     <Polyline 
                       key={i}
                       positions={[p, ride.points[i+1]]} 
                       color={i % 5 === 0 ? '#ef4444' : i % 5 === 1 ? '#f59e0b' : i % 5 === 2 ? '#10b981' : i % 5 === 3 ? '#3b82f6' : '#8b5cf6'} 
                       weight={5} 
                     />
                   ))}
                 </MapContainer>
               )}
               <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
                 Тепловая карта интенсивности
               </div>
            </div>
          </div>

          {/* TIME & DISTANCE */}
          <div className="mb-8">
            <SectionHeader title="ВРЕМЯ И ДИСТАНЦИЯ" />
            <div className="grid grid-cols-3 gap-y-6">
              <MetricItem label="ДИСТАНЦИЯ" value={ride.distance} unit="КМ" />
              <MetricItem label="ВРЕМЯ В ДВИЖЕНИИ" value={formatTime(ride.movingTime)} />
              <MetricItem label="ОБЩЕЕ ВРЕМЯ" value={formatTime(ride.elapsedTime)} />
              <MetricItem label="ВРЕМЯ ПАУЗЫ" value={formatTime(ride.pausedTime)} />
              <MetricItem label="ВРЕМЯ НАЧАЛА" value={ride.startTime} />
              <MetricItem label="ВРЕМЯ ОКОНЧАНИЯ" value={ride.endTime} />
            </div>
          </div>

          {/* SPEED */}
          <div className="mb-8">
            <SectionHeader title="СКОРОСТЬ" />
            <div className="grid grid-cols-3 gap-y-6 mb-6">
              <MetricItem label="СРЕДНЯЯ" value={ride.avgSpeed} unit="КМ/Ч" />
              <MetricItem label="МАКСИМАЛЬНАЯ" value={ride.maxSpeed} unit="КМ/Ч" />
              <MetricItem label="СР. ТЕМП" value={ride.avgPace} unit="МИН/КМ" />
              <MetricItem label="МАКС. ТЕМП" value={ride.maxPace} unit="МИН/КМ" />
            </div>
            
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0077b6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0077b6" stopOpacity={0}/>
                    </linearGradient>
                    {overlayChart && (
                      <linearGradient id={`colorOverlay-${overlayChart}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getChartColor(overlayChart)} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={getChartColor(overlayChart)} stopOpacity={0}/>
                      </linearGradient>
                    )}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="dist" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    hide
                  />
                  <YAxis 
                    yAxisId="speed"
                    orientation="left"
                    fontSize={8}
                    stroke="#0077b6"
                    tickLine={true}
                    axisLine={false}
                    tickFormatter={(val) => val.toFixed(0)}
                    width={30}
                    tickCount={5}
                  />
                  {overlayChart && (
                    <YAxis 
                      yAxisId="overlay"
                      orientation="right"
                      fontSize={8}
                      stroke={getChartColor(overlayChart)}
                      tickLine={true}
                      axisLine={false}
                      tickFormatter={(val) => val.toFixed(0)}
                      width={30}
                      tickCount={5}
                    />
                  )}
                  <Tooltip 
                    content={<CustomTooltip units={['км/ч', overlayChart ? getUnit(overlayChart) : '']} />}
                    cursor={{ stroke: '#ffffff', strokeWidth: 1 }}
                  />
                  <Area 
                    yAxisId="speed"
                    type="monotone" 
                    dataKey="speed" 
                    name="СКОРОСТЬ"
                    stroke="#0077b6" 
                    fillOpacity={0.2} 
                    fill="url(#colorSpeed)" 
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#0077b6' }}
                  />
                  {overlayChart && (
                    <Area 
                      yAxisId="overlay"
                      type="monotone" 
                      dataKey="overlay" 
                      name={overlayButtons.find(b => b.id === overlayChart)?.label || 'ДАННЫЕ'}
                      stroke={getChartColor(overlayChart)} 
                      fillOpacity={0.15} 
                      fill={`url(#colorOverlay-${overlayChart})`} 
                      isAnimationActive={false}
                      activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: getChartColor(overlayChart) }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {overlayButtons.map(btn => (
                <button 
                  key={btn.id} 
                  onClick={() => setOverlayChart(overlayChart === btn.id ? null : btn.id)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                    overlayChart === btn.id 
                      ? 'text-white shadow-lg scale-105' 
                      : 'bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500'
                  }`}
                  style={{ backgroundColor: overlayChart === btn.id ? btn.color : undefined }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* ELEVATION */}
          <div className="mb-8">
            <SectionHeader title="ВЫСОТА" />
            <div className="grid grid-cols-3 gap-y-6 mb-6">
              <MetricItem label="ПОДЪЕМ" value={ride.ascent} unit="М" />
              <MetricItem label="СПУСК" value={ride.descent} unit="М" />
              <MetricItem label="ИЗМ. ВЫСОТЫ" value={ride.elevChange} unit="М" />
              <MetricItem label="СР. ВЫСОТА" value={ride.avgElevation} unit="М" />
              <MetricItem label="МАКС. ВЫСОТА" value={ride.maxElevation} unit="М" />
              <MetricItem label="МИН. ВЫСОТА" value={ride.minElevation} unit="М" />
              <MetricItem label="МАКС. УКЛОН" value={ride.maxGrade} unit="%" />
              <MetricItem label="МИН. УКЛОН" value={ride.minGrade} unit="%" />
              <MetricItem label="СР. УКЛОН" value={ride.avgGrade} unit="%" />
            </div>
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ride.elevationData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="dist" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    fontSize={8}
                    tickLine={true}
                    axisLine={false}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickFormatter={(val) => `${val.toFixed(1)}`}
                    minTickGap={30}
                  />
                  <YAxis 
                    fontSize={8}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickLine={true}
                    axisLine={false}
                    tickFormatter={(val) => val.toFixed(0)}
                    width={30}
                  />
                  <Tooltip 
                    content={<CustomTooltip units={['м']} />} 
                    cursor={{ stroke: '#ffffff', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="ВЫСОТА" 
                    stroke="#166534" 
                    fillOpacity={0.2} 
                    fill="url(#colorElev)" 
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#166534' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HEART RATE */}
          <div className="mb-8">
            <SectionHeader title="ПУЛЬС" />
            <div className="grid grid-cols-3 gap-y-6 mb-6">
              <MetricItem label="СРЕДНИЙ" value={ride.avgHr} unit="УД/МИН" />
              <MetricItem label="МАКСИМАЛЬНЫЙ" value={ride.maxHr} unit="УД/МИН" />
              <MetricItem label="МИНИМАЛЬНЫЙ" value={ride.minHr} unit="УД/МИН" />
              <MetricItem label="СРЕДНИЙ %" value={ride.avgHrPercent} unit="%" />
              <MetricItem label="МАКСИМАЛЬНЫЙ %" value={ride.maxHrPercent} unit="%" />
              <MetricItem label="МИНИМАЛЬНЫЙ %" value={ride.minHrPercent} unit="%" />
            </div>
            
            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">ЗОНЫ ПУЛЬСА</h4>
              <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                {ride.hrZones.map((z, i) => (
                  <div 
                    key={i} 
                    className="h-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ width: `${z.percent}%`, backgroundColor: z.color }}
                  >
                    {z.percent > 10 && `Z${z.zone}`}
                  </div>
                ))}
              </div>
              {ride.hrZones.map(z => (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="w-4 text-[10px] font-black text-gray-400">{z.zone}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.percent}%`, backgroundColor: z.color }} />
                  </div>
                  <span className="w-8 text-[10px] font-black text-gray-900 dark:text-white text-right">{z.percent}%</span>
                  <span className="w-12 text-[10px] font-bold text-gray-400 text-right">{z.time}</span>
                </div>
              ))}
            </div>

            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ride.hrData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991b1b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="dist" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    fontSize={8}
                    tickLine={true}
                    axisLine={false}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickFormatter={(val) => `${val.toFixed(1)}`}
                    minTickGap={30}
                  />
                  <YAxis 
                    fontSize={8}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickLine={true}
                    axisLine={false}
                    tickFormatter={(val) => val.toFixed(0)}
                    width={30}
                  />
                  <Tooltip 
                    content={<CustomTooltip units={['уд/мин']} />} 
                    cursor={{ stroke: '#ffffff', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="ПУЛЬС" 
                    stroke="#991b1b" 
                    fillOpacity={0.2} 
                    fill="url(#colorHr)" 
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#991b1b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* POWER */}
          <div className="mb-8">
            <SectionHeader title="МОЩНОСТЬ" />
            <div className="grid grid-cols-3 gap-y-6 mb-6">
              <MetricItem label="НОРМАЛИЗОВАННАЯ" value={ride.normalizedPower} unit="ВТ" />
              <MetricItem label="СРЕДНЯЯ" value={ride.avgPower} unit="ВТ" />
              <MetricItem label="МАКСИМАЛЬНАЯ" value={ride.maxPower} unit="ВТ" />
              <MetricItem label="СР. FTP %" value={ride.avgFtpPercent} unit="%" />
              <MetricItem label="МАКС. FTP %" value={ride.maxFtpPercent} unit="%" />
              <MetricItem label="БАЛАНС" value={ride.avgPedalBalance} unit="Л/П" />
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">ЗОНЫ МОЩНОСТИ</h4>
              {ride.powerZones.map(z => (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="w-4 text-[10px] font-black text-gray-400">{z.zone}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-zinc-900 rounded-sm overflow-hidden flex">
                    <div className="h-full" style={{ width: `${z.percent}%`, backgroundColor: z.color }} />
                  </div>
                  <span className="w-8 text-[10px] font-black text-gray-900 dark:text-white">{z.percent}%</span>
                  <span className="w-12 text-[10px] font-bold text-gray-400">{z.time}</span>
                </div>
              ))}
            </div>

            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ride.powerData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b21b6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5b21b6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="dist" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    fontSize={8}
                    tickLine={true}
                    axisLine={false}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickFormatter={(val) => `${val.toFixed(1)}`}
                    minTickGap={30}
                  />
                  <YAxis 
                    fontSize={8}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickLine={true}
                    axisLine={false}
                    tickFormatter={(val) => val.toFixed(0)}
                    width={30}
                  />
                  <Tooltip 
                    content={<CustomTooltip units={['Вт']} />} 
                    cursor={{ stroke: '#ffffff', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="МОЩНОСТЬ" 
                    stroke="#5b21b6" 
                    fillOpacity={0.2} 
                    fill="url(#colorPower)" 
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#5b21b6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CADENCE */}
          <div className="mb-8">
            <SectionHeader title="КАДЕНС" />
            <div className="grid grid-cols-3 gap-y-6 mb-6">
              <MetricItem label="СРЕДНИЙ" value={ride.avgCadence} unit="ОБ/МИН" />
              <MetricItem label="МАКСИМАЛЬНЫЙ" value={ride.maxCadence} unit="ОБ/МИН" />
            </div>
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ride.cadenceData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCadence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b45309" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#b45309" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                  <XAxis 
                    dataKey="dist" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    fontSize={8}
                    tickLine={true}
                    axisLine={false}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickFormatter={(val) => `${val.toFixed(1)}`}
                    minTickGap={30}
                  />
                  <YAxis 
                    fontSize={8}
                    stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
                    tickLine={true}
                    axisLine={false}
                    tickFormatter={(val) => val.toFixed(0)}
                    width={30}
                  />
                  <Tooltip 
                    content={<CustomTooltip units={['об/мин']} />} 
                    cursor={{ stroke: '#ffffff', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="КАДЕНС" 
                    stroke="#b45309" 
                    fillOpacity={0.2} 
                    fill="url(#colorCadence)" 
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#b45309' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MISC */}
          <div className="mb-12">
            <SectionHeader title="РАЗНОЕ" />
            <div className="grid grid-cols-3 gap-y-6">
              <MetricItem label="СР. ТЕМПЕРАТУРА" value={ride.avgTemp} unit="°C" />
              <MetricItem label="МИН. ТЕМПЕРАТУРА" value={ride.minTemp} unit="°C" />
              <MetricItem label="МАКС. ТЕМПЕРАТУРА" value={ride.maxTemp} unit="°C" />
              <MetricItem label="СР. ВЕТЕР" value={ride.avgWindSpeed} unit="КМ/Ч" />
              <MetricItem label="НАПРАВЛЕНИЕ" value={ride.windDirection} />
              <MetricItem label="КАЛОРИИ" value={ride.estCalories} unit="ККАЛ" />
            </div>
          </div>

          {/* LAP SPLITS */}
          <div className="mb-12">
            <SectionHeader title="ОТРЕЗКИ (КРУГИ)" />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-900">
                    <th className="py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">КРУГ</th>
                    <th className="py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">ВРЕМЯ</th>
                    <th className="py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">ДИСТ.</th>
                    <th className="py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">СР. СКОР.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-900">
                  {[1, 2, 3].map(lap => (
                    <tr key={lap}>
                      <td className="py-3 text-xs font-bold text-gray-900 dark:text-white">{lap}</td>
                      <td className="py-3 text-xs font-bold text-gray-900 dark:text-white">20:00</td>
                      <td className="py-3 text-xs font-bold text-gray-900 dark:text-white">3.31 км</td>
                      <td className="py-3 text-xs font-bold text-gray-900 dark:text-white">9.9 км/ч</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFlyover && (
          <FlyoverModal 
            ride={ride} 
            onClose={() => setShowFlyover(false)} 
            isDarkMode={isDarkMode} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MetricOptionsModal = ({ 
  onClose, 
  onSave,
  initialOptions,
  metricName
}: { 
  onClose: () => void; 
  onSave: (options: MetricOptions) => void;
  initialOptions?: MetricOptions | null;
  metricName?: string;
}) => {
  const [options, setOptions] = useState<MetricOptions>(initialOptions || {
    lineType: 'monotone',
    timeScale: 'all',
    fillOpacity: 0.3,
    strokeWidth: 2
  });

  // Initialize map layers if it's a map metric and they are missing
  useEffect(() => {
    if (metricName?.includes('Карта') && !options.mapLayers) {
      setOptions(prev => ({
        ...prev,
        mapLayers: DEFAULT_MAP_LAYERS,
        currentLayerIndex: 0,
        mapTheme: 'auto'
      }));
    }
  }, [metricName]);

  const isMapMetric = metricName?.includes('Карта');

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    if (!options.mapLayers) return;
    const newLayers = [...options.mapLayers];
    const isActive = newLayers[index].active;
    
    let targetIndex = -1;
    if (direction === 'up') {
      for (let i = index - 1; i >= 0; i--) {
        if (newLayers[i].active === isActive) {
          targetIndex = i;
          break;
        }
      }
    } else {
      for (let i = index + 1; i < newLayers.length; i++) {
        if (newLayers[i].active === isActive) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) return;
    
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;
    
    setOptions({ ...options, mapLayers: newLayers });
  };

  const toggleLayer = (index: number) => {
    if (!options.mapLayers) return;
    const newLayers = [...options.mapLayers];
    newLayers[index] = { ...newLayers[index], active: !newLayers[index].active };
    setOptions({ ...options, mapLayers: newLayers });
  };

  const ColorSection = ({ title, colors, type }: { title: string, colors: { name: string, color: string }[], type: 'textColor' | 'backgroundColor' }) => (
    <div className="space-y-4">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-6">{title}</h3>
      <div className="grid grid-cols-4 gap-2 px-6">
        {colors.map((c) => (
          <button
            key={c.name}
            onClick={() => setOptions({ ...options, [type]: c.color })}
            className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all ${
              options[type] === c.color ? 'border-accent scale-110 shadow-md' : 'border-transparent'
            }`}
          >
            <div 
              className="w-full h-full rounded-full border border-black/5 dark:border-white/10" 
              style={{ backgroundColor: c.color }}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const OptionPicker = ({ 
    title, 
    items, 
    currentValue, 
    onSelect 
  }: { 
    title: string, 
    items: { label: string, value: any }[], 
    currentValue: any, 
    onSelect: (v: any) => void 
  }) => (
    <div className="space-y-3 px-6">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">{title}</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.value)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              currentValue === opt.value 
                ? 'bg-accent text-white shadow-md' 
                : 'bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2080] bg-white dark:bg-zinc-950 flex flex-col font-sans"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onClose} className="text-gray-400 p-2">
          {isMapMetric ? <ChevronLeft size={24} /> : <span className="text-accent font-bold text-sm tracking-tight">Отмена</span>}
        </button>
        <h1 className="flex-1 text-center text-xs font-black text-gray-900 dark:text-white tracking-[0.2em] uppercase">
          {isMapMetric ? 'Варианты карт' : 'Опции поля данных'}
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {isMapMetric ? (
          <div className="flex-1 flex flex-col">
            {/* Map Theme Slider */}
            <div className="p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 text-center">ТЕМА КАРТЫ</h3>
              <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
                {[
                  { id: 'light', label: 'Светлая' },
                  { id: 'dark', label: 'Темная' },
                  { id: 'auto', label: 'Авто' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOptions({ ...options, mapTheme: t.id as any })}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      options.mapTheme === t.id 
                        ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-zinc-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest text-center leading-relaxed">
                Переместите карты ниже границы, чтобы скрыть их
              </p>
            </div>

            {/* Active Layers */}
            <div className="divide-y divide-gray-100 dark:divide-zinc-900 border-y border-gray-100 dark:border-zinc-900">
              {options.mapLayers?.filter(l => l.active).map((layer, idx) => {
                const originalIndex = options.mapLayers!.findIndex(l => l.id === layer.id);
                return (
                  <div key={layer.id} className="flex items-center h-16 px-6 bg-white dark:bg-black group">
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{layer.name}</span>
                      <ChevronRight size={18} className="text-gray-300 dark:text-zinc-800" />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <div className="flex flex-col">
                        <button onClick={() => moveLayer(originalIndex, 'up')} className="p-1 text-gray-400 hover:text-accent">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveLayer(originalIndex, 'down')} className="p-1 text-gray-400 hover:text-accent">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button onClick={() => toggleLayer(originalIndex)} className="p-2 text-gray-300 dark:text-zinc-800">
                        <GripVertical size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden Layers Separator */}
            <div className="h-12 bg-gray-50 dark:bg-zinc-950 flex items-center px-6 border-b border-gray-100 dark:border-zinc-900">
              <span className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Скрытые карты</span>
              <div className="ml-auto">
                <GripVertical size={20} className="text-gray-300 dark:text-zinc-800" />
              </div>
            </div>

            {/* Inactive Layers */}
            <div className="divide-y divide-gray-100 dark:divide-zinc-900">
              {options.mapLayers?.filter(l => !l.active).map((layer, idx) => {
                const originalIndex = options.mapLayers!.findIndex(l => l.id === layer.id);
                return (
                  <div key={layer.id} className="flex items-center h-16 px-6 bg-white dark:bg-black opacity-50">
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400 dark:text-zinc-500">{layer.name}</span>
                      <ChevronRight size={18} className="text-gray-200 dark:text-zinc-900" />
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <button onClick={() => toggleLayer(originalIndex)} className="p-2 text-gray-200 dark:text-zinc-900">
                        <Plus size={20} />
                      </button>
                      <div className="p-2 text-gray-200 dark:text-zinc-900">
                        <GripVertical size={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 space-y-4">
              <button 
                onClick={() => setOptions({
                  lineType: 'monotone',
                  timeScale: 'all',
                  fillOpacity: 0.3,
                  strokeWidth: 2
                })}
                className="w-full h-14 bg-gray-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-zinc-700 flex items-center justify-center">
                  <X className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">ПО УМОЛЧАНИЮ</span>
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-6 mb-2">ОСНОВНЫЕ</h3>
              <SettingItem 
                title="Окрашивать в цвета зон" 
                subtitle="График будет использовать цвета зон из настроек"
                action={{ 
                  type: 'toggle', 
                  enabled: options.enableZones || false, 
                  setEnabled: (v) => setOptions({ ...options, enableZones: v }) 
                }} 
              />
              <SettingItem 
                title="Линия среднего" 
                action={{ 
                  type: 'toggle', 
                  enabled: options.showAverage || false, 
                  setEnabled: (v) => setOptions({ ...options, showAverage: v }) 
                }} 
              />
              <SettingItem 
                title="Пиковые точки" 
                action={{ 
                  type: 'toggle', 
                  enabled: options.showPeakPoints || false, 
                  setEnabled: (v) => setOptions({ ...options, showPeakPoints: v }) 
                }} 
              />
              <SettingItem 
                title="Сетка" 
                action={{ 
                  type: 'toggle', 
                  enabled: options.showGrid || false, 
                  setEnabled: (v) => setOptions({ ...options, showGrid: v }) 
                }} 
              />
              <SettingItem 
                title="Значения на осях" 
                action={{ 
                  type: 'toggle', 
                  enabled: options.showAxisValues || false, 
                  setEnabled: (v) => setOptions({ ...options, showAxisValues: v }) 
                }} 
              />
            </div>

            <OptionPicker 
              title="СТИЛЬ ЛИНИИ" 
              items={[
                { label: 'Сглаженная', value: 'monotone' },
                { label: 'Ломаная', value: 'linear' },
                { label: 'Ступенчатая', value: 'step' }
              ]}
              currentValue={options.lineType}
              onSelect={(v) => setOptions({ ...options, lineType: v })}
            />

            <OptionPicker 
              title="ВРЕМЕННОЙ МАСШТАБ" 
              items={[
                { label: '30 сек', value: '30s' },
                { label: '2 мин', value: '2m' },
                { label: '5 мин', value: '5m' },
                { label: 'Все', value: 'all' }
              ]}
              currentValue={options.timeScale}
              onSelect={(v) => setOptions({ ...options, timeScale: v })}
            />

            <OptionPicker 
              title="ПРОЗРАЧНОСТЬ ЗАЛИВКИ" 
              items={[
                { label: '0%', value: 0 },
                { label: '10%', value: 0.1 },
                { label: '30%', value: 0.3 },
                { label: '50%', value: 0.5 },
                { label: '80%', value: 0.8 }
              ]}
              currentValue={options.fillOpacity}
              onSelect={(v) => setOptions({ ...options, fillOpacity: v })}
            />

            <OptionPicker 
              title="ТОЛЩИНА ЛИНИИ" 
              items={[
                { label: '1px', value: 1 },
                { label: '2px', value: 2 },
                { label: '3px', value: 3 },
                { label: '4px', value: 4 }
              ]}
              currentValue={options.strokeWidth}
              onSelect={(v) => setOptions({ ...options, strokeWidth: v })}
            />

            <ColorSection title="ЦВЕТА ТЕКСТА" colors={DATA_FIELD_COLORS} type="textColor" />
            
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-6">ЦВЕТА ФОНА</h3>
              <div className="px-6">
                <button 
                  onClick={() => setOptions({ ...options, backgroundColor: undefined })}
                  className={`w-full h-12 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                    !options.backgroundColor ? 'border-accent bg-accent/5' : 'border-gray-100 dark:border-zinc-900'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Без цвета</span>
                </button>
              </div>
              
              <ColorSection title="СТАНДАРТНЫЕ ЦВЕТА ФОНА" colors={DATA_FIELD_COLORS} type="backgroundColor" />
              <ColorSection title="ТЕМАТИЧЕСКИЕ ЦВЕТА ФОНА" colors={THEME_BG_COLORS} type="backgroundColor" />
            </div>
          </>
        )}
      </div>

      <div className="p-6 shrink-0 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900">
        <button 
          onClick={() => onSave(options)}
          className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-sm rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
        >
          Готово
        </button>
      </div>
    </motion.div>
  );
};

const MetricPickerModal = ({ 
  onClose, 
  onSelect,
  initialMetric,
  initialOptions
}: { 
  onClose: () => void; 
  onSelect: (metric: string, options?: MetricOptions) => void;
  initialMetric?: string;
  initialOptions?: MetricOptions | null;
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showOptionsFor, setShowOptionsFor] = useState<{ metric: string, options?: MetricOptions } | null>(null);
  const initialMetricRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMetric) {
      const category = METRIC_CATEGORIES.find(cat => cat.metrics.includes(initialMetric));
      if (category) {
        setExpandedCategory(category.name);
        // Wait for animation to finish before scrolling
        setTimeout(() => {
          initialMetricRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [initialMetric]);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2070] bg-white dark:bg-zinc-950 flex flex-col font-sans"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onClose} className="text-accent font-bold text-sm tracking-tight">Отмена</button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white tracking-tight uppercase">Выберите показатель</h1>
        <div className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col">
          {METRIC_CATEGORIES.map((category) => (
            <div key={category.name} className="border-b border-gray-100 dark:border-zinc-900">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-black active:bg-gray-50 dark:active:bg-zinc-900 transition-colors"
              >
                <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{category.name}</span>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === category.name ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expandedCategory === category.name && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-zinc-950"
                  >
                    {category.metrics.map((metric) => (
                      <div 
                        key={metric} 
                        ref={metric === initialMetric ? initialMetricRef : null}
                        className="flex items-center border-t border-gray-100 dark:border-zinc-900"
                      >
                        <button 
                          onClick={() => onSelect(metric)}
                          className={`flex-1 px-8 py-3.5 text-left text-xs font-medium transition-colors ${
                            metric === initialMetric 
                              ? 'text-accent font-black' 
                              : 'text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900'
                          }`}
                        >
                          {metric}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOptionsFor({ metric, options: metric === initialMetric ? (initialOptions || {}) : {} });
                          }}
                          className="px-6 py-3.5 text-accent font-bold text-[10px] uppercase tracking-widest active:opacity-50"
                        >
                          ОПЦИЯ
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showOptionsFor && (
          <MetricOptionsModal 
            metricName={showOptionsFor.metric}
            initialOptions={showOptionsFor.options}
            onClose={() => setShowOptionsFor(null)}
            onSave={(options) => {
              onSelect(showOptionsFor.metric, options);
              setShowOptionsFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RowSizePickerModal = ({ 
  onClose, 
  onAdd,
  onResize,
  remainingSpace,
  mode = 'add',
  currentSize = 0
}: { 
  onClose: () => void; 
  onAdd?: (size: number, position: 'above' | 'below') => void;
  onResize?: (size: number) => void;
  remainingSpace: number;
  mode?: 'add' | 'resize';
  currentSize?: number;
}) => {
  const [selectedSize, setSelectedSize] = useState(currentSize || 1);
  
  const sizes = [
    { label: '1/8', value: 1 },
    { label: '2/8', value: 2 },
    { label: '3/8', value: 3 },
    { label: '4/8', value: 4 },
    { label: '5/8', value: 5 },
    { label: '6/8', value: 6 },
    { label: '7/8', value: 7 },
    { label: '8/8', value: 8 },
  ];

  const canConfirm = mode === 'resize' 
    ? selectedSize <= (remainingSpace + currentSize)
    : selectedSize <= remainingSpace;

  return (
    <div className="fixed inset-0 z-[2070] bg-white dark:bg-zinc-950 flex flex-col font-sans">
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          {mode === 'add' ? 'Выберите размер строки' : 'Изменить размер строки'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-zinc-950">
        <div className="flex justify-center mb-8">
          <button className="bg-gray-400 dark:bg-zinc-600 text-white px-5 py-2.5 rounded-md flex items-center gap-3 text-xs font-bold shadow-sm">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="uppercase tracking-wider">Копировать показатели из текущей строки</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sizes.map((size) => {
            const isTooLarge = mode === 'resize' 
              ? size.value > (remainingSpace + currentSize)
              : size.value > remainingSpace;
            return (
              <button
                key={size.value}
                onClick={() => setSelectedSize(size.value)}
                className={`aspect-[4/3] border flex flex-col items-center justify-center p-4 relative transition-all duration-200 rounded-sm ${
                  selectedSize === size.value 
                    ? 'border-accent bg-accent text-white shadow-md' 
                    : isTooLarge
                      ? 'border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50 text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white'
                }`}
              >
                <span className="text-[11px] font-bold tracking-tight mb-3">{size.label}</span>
                <div className={`w-14 h-20 border flex flex-col justify-start p-0.5 ${selectedSize === size.value ? 'border-white' : 'border-gray-300 dark:border-zinc-700'}`}>
                  <div 
                    className={`w-full ${selectedSize === size.value ? 'bg-white' : 'bg-accent'} ${isTooLarge ? 'opacity-20' : ''}`} 
                    style={{ height: `${(size.value / 8) * 100}%` }} 
                  />
                </div>
                {isTooLarge && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[1px]">
                    <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">Нет места</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-20 shrink-0">
        <button 
          onClick={onClose}
          className="flex-1 bg-[#1a1a1a] text-white font-bold uppercase tracking-widest text-sm"
        >
          ОТМЕНА
        </button>
        {mode === 'add' ? (
          <>
            <button 
              disabled={!canConfirm}
              onClick={() => onAdd?.(selectedSize, 'above')}
              className={`flex-1 font-bold uppercase tracking-widest text-sm border-r border-white/10 transition-colors ${
                canConfirm ? 'bg-accent text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ДОБАВИТЬ ВЫШЕ
            </button>
            <button 
              disabled={!canConfirm}
              onClick={() => onAdd?.(selectedSize, 'below')}
              className={`flex-1 font-bold uppercase tracking-widest text-sm transition-colors ${
                canConfirm ? 'bg-accent text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              ДОБАВИТЬ НИЖЕ
            </button>
          </>
        ) : (
          <button 
            disabled={!canConfirm}
            onClick={() => onResize?.(selectedSize)}
            className={`flex-1 font-bold uppercase tracking-widest text-sm transition-colors ${
              canConfirm ? 'bg-accent text-white' : 'bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            СОХРАНИТЬ
          </button>
        )}
      </div>
    </div>
  );
};

const CustomLayoutEditor = ({ 
  screenName, 
  initialRows,
  onBack,
  onSave,
  isDarkMode
}: { 
  screenName: string; 
  initialRows: MetricRow[];
  onBack: () => void;
  onSave: (rows: MetricRow[]) => void;
  isDarkMode: boolean;
}) => {
  const [rows, setRows] = useState<MetricRow[]>(initialRows);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeMetricCell, setActiveMetricCell] = useState<{ rowIndex: number, cellIndex: number } | null>(null);

  const totalRows = rows.reduce((acc, row) => acc + row.size, 0);
  const remainingSpace = 8 - totalRows;

  const handleAddRow = (size: number, position: 'above' | 'below') => {
    if (activeRowIndex === null || totalRows + size > 8) return;
    
    const newRows = [...rows];
    const newRow = { id: Math.random().toString(36).substr(2, 9), size, columns: '1', metrics: [] };
    
    if (position === 'above') {
      newRows.splice(activeRowIndex, 0, newRow);
    } else {
      newRows.splice(activeRowIndex + 1, 0, newRow);
    }
    
    setRows(newRows);
    setActiveRowIndex(null);
  };

  const handleResizeRow = (newSize: number) => {
    if (activeRowIndex === null) return;
    const newRows = [...rows];
    newRows[activeRowIndex] = { ...newRows[activeRowIndex], size: newSize };
    setRows(newRows);
    setActiveRowIndex(null);
    setIsResizing(false);
  };

  const handleSelectMetric = (metric: string, options?: MetricOptions) => {
    if (!activeMetricCell) return;
    const { rowIndex, cellIndex } = activeMetricCell;
    const newRows = [...rows];
    const row = { ...newRows[rowIndex] };
    const metrics = [...(row.metrics || [])];
    const metricOptions = [...(row.metricOptions || [])];
    
    metrics[cellIndex] = metric;
    metricOptions[cellIndex] = options || null;
    
    row.metrics = metrics;
    row.metricOptions = metricOptions;
    newRows[rowIndex] = row;
    setRows(newRows);
    setActiveMetricCell(null);
  };

  const cycleColumns = (index: number) => {
    const cycle = ['1', '1-1', '1-2', '2-1', '1-1-1'];
    const current = rows[index].columns || '1';
    const nextIndex = (cycle.indexOf(current) + 1) % cycle.length;
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], columns: cycle[nextIndex] };
    setRows(newRows);
  };

  const renderRowContent = (row: MetricRow, rowIndex: number) => {
    const layout = row.columns || '1';
    const metrics = row.metrics || [];
    const metricOptions = row.metricOptions || [];
    
    if (layout === '1') {
      const options = metricOptions[0];
      return (
        <button 
          onClick={() => setActiveMetricCell({ rowIndex, cellIndex: 0 })}
          className="w-full h-full flex flex-col items-center justify-center p-2 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors"
          style={{ backgroundColor: options?.backgroundColor || 'transparent' }}
        >
          <p 
            className="text-[11px] font-bold uppercase tracking-widest text-center px-4"
            style={{ color: options?.textColor || (isDarkMode ? '#71717a' : '#9ca3af') }}
          >
            {metrics[0] || 'Выберите показатель'}
          </p>
        </button>
      );
    }

    const parts = layout.split('-');

    return (
      <div className="w-full h-full flex divide-x divide-gray-200 dark:divide-zinc-800">
        {parts.map((p, i) => {
          const options = metricOptions[i];
          return (
            <button 
              key={i} 
              onClick={() => setActiveMetricCell({ rowIndex, cellIndex: i })}
              className="flex items-center justify-center px-2 text-center hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors"
              style={{ 
                flex: parseInt(p),
                backgroundColor: options?.backgroundColor || 'transparent'
              }}
            >
              <p 
                className="text-[9px] font-bold uppercase tracking-tight leading-none"
                style={{ color: options?.textColor || (isDarkMode ? '#71717a' : '#9ca3af') }}
              >
                {metrics[i] || 'Выберите показатель'}
              </p>
            </button>
          );
        })}
      </div>
    );
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2065] bg-white dark:bg-black flex flex-col font-sans"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em]">{screenName}</h1>
      </header>

      <div className="flex-1 bg-gray-50 dark:bg-zinc-950 px-14 py-12 flex flex-col relative overflow-y-auto">
        <div className="flex-1 relative flex flex-col border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-black shadow-sm shrink-0 min-h-[500px]">
          {/* Background Grid - 8 vertical parts */}
          <div className="absolute inset-0 flex flex-col pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-1 border-b border-gray-100/50 dark:border-zinc-900/50 last:border-b-0" />
            ))}
          </div>

          {rows.map((row, index) => (
            <div 
              key={row.id}
              className="relative flex flex-col items-center justify-center border-b border-gray-200 dark:border-zinc-800 last:border-b-0 z-10"
              style={{ height: `${(row.size / 8) * 100}%` }}
            >
              {renderRowContent(row, index)}
              
              {/* External Controls - Left */}
              <div className="absolute -left-11 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                <button 
                  onClick={() => removeRow(index)}
                  className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  disabled={remainingSpace <= 0}
                  onClick={() => {
                    setActiveRowIndex(index);
                    setIsResizing(false);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform ${
                    remainingSpace > 0 ? 'bg-gray-400 dark:bg-zinc-800' : 'bg-gray-200 dark:bg-zinc-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* External Controls - Right */}
              <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                <button 
                  onClick={() => {
                    setActiveRowIndex(index);
                    setIsResizing(true);
                  }}
                  className="bg-accent text-white px-2 py-1 rounded-full flex items-center gap-1 text-[9px] font-black shadow-sm active:scale-95 transition-transform"
                >
                  <ArrowUpDown className="w-2.5 h-2.5" />
                  <span>{row.size}/8</span>
                </button>
                <button 
                  onClick={() => cycleColumns(index)}
                  className="bg-gray-200 dark:bg-zinc-800 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1 text-[9px] font-black shadow-sm active:scale-95 transition-transform"
                >
                  <Layout className="w-2.5 h-2.5" />
                  <span>{row.columns === '1-1-1' ? '3' : (row.columns?.includes('-') ? '2' : '1')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="py-8 text-center">
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${totalRows > 8 ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500'}`}>
            ИСПОЛЬЗОВАНО {totalRows} ИЗ 8 ДОСТУПНЫХ СТРОК ДАННЫХ
          </p>
          {totalRows > 8 && (
            <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">
              Общий размер превышает 8/8. Пожалуйста, удалите или измените размер строк.
            </p>
          )}
        </div>
      </div>

      <div className="flex h-20 shrink-0">
        <button 
          onClick={onBack}
          className="flex-1 bg-[#1a1a1a] text-white font-bold uppercase tracking-widest text-sm"
        >
          ОТМЕНА
        </button>
        <button 
          onClick={() => onSave(rows)}
          className="flex-1 bg-accent text-white font-bold uppercase tracking-widest text-sm"
        >
          СОХРАНИТЬ
        </button>
      </div>

      <AnimatePresence>
        {activeRowIndex !== null && (
          <RowSizePickerModal 
            onClose={() => {
              setActiveRowIndex(null);
              setIsResizing(false);
            }}
            onAdd={handleAddRow}
            onResize={handleResizeRow}
            remainingSpace={remainingSpace}
            mode={isResizing ? 'resize' : 'add'}
            currentSize={isResizing ? rows[activeRowIndex].size : 0}
          />
        )}
        {activeMetricCell !== null && (
          <MetricPickerModal 
            onClose={() => setActiveMetricCell(null)}
            onSelect={handleSelectMetric}
            initialMetric={rows[activeMetricCell.rowIndex].metrics?.[activeMetricCell.cellIndex]}
            initialOptions={rows[activeMetricCell.rowIndex].metricOptions?.[activeMetricCell.cellIndex]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SEPARATOR_ID = 'separator-boundary';

const OrientationMenu = ({ 
  title, 
  onBack,
  screens,
  onAddScreen,
  onUpdateScreen,
  onDeleteScreen,
  onRenameScreen,
  onDuplicateScreen,
  onReorderScreens,
  isDarkMode
}: { 
  title: string; 
  onBack: () => void;
  screens: Screen[];
  onAddScreen: (screen: Screen) => void;
  onUpdateScreen: (index: number, layout: MetricRow[]) => void;
  onDeleteScreen: (index: number) => void;
  onRenameScreen: (index: number, name: string) => void;
  onDuplicateScreen: (index: number) => void;
  onReorderScreens: (screens: Screen[]) => void;
  isDarkMode: boolean;
}) => {
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [editingScreenIndex, setEditingScreenIndex] = useState<number | null>(null);
  const [selectedScreenForAction, setSelectedScreenForAction] = useState<{ screen: Screen, index: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newName, setNewName] = useState('');

  const items = React.useMemo(() => {
    const active = screens.filter(s => !s.hidden);
    const hidden = screens.filter(s => s.hidden);
    return [
      ...active,
      { id: SEPARATOR_ID, name: 'Скрытые макеты', isSeparator: true } as any,
      ...hidden
    ];
  }, [screens]);

  const handleReorder = (newItems: any[]) => {
    const separatorIndex = newItems.findIndex(item => item.id === SEPARATOR_ID);
    const updatedScreens = newItems
      .filter(item => item.id !== SEPARATOR_ID)
      .map((item, index) => {
        const originalIndex = newItems.indexOf(item);
        return {
          ...item,
          hidden: originalIndex > separatorIndex
        };
      });
    onReorderScreens(updatedScreens);
  };

  const handleDelete = () => {
    if (selectedScreenForAction) {
      onDeleteScreen(selectedScreenForAction.index);
      setSelectedScreenForAction(null);
    }
  };

  const handleRename = () => {
    if (selectedScreenForAction && newName.trim()) {
      onRenameScreen(selectedScreenForAction.index, newName.trim());
      setIsRenaming(false);
      setSelectedScreenForAction(null);
    }
  };

  const handleDuplicate = () => {
    if (selectedScreenForAction) {
      onDuplicateScreen(selectedScreenForAction.index);
      setSelectedScreenForAction(null);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[55] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] ml-4">{title}</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center">
          Переместите макеты ниже границы, чтобы скрыть их
        </div>
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={handleReorder}
          className="divide-y divide-gray-100 dark:divide-zinc-900"
        >
          {items.map((item) => {
            if (item.isSeparator) {
              return (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="bg-zinc-100 dark:bg-zinc-900 py-2 px-4 flex items-center justify-between border-y border-gray-200 dark:border-zinc-800"
                >
                  <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                    {item.name}
                  </span>
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </Reorder.Item>
              );
            }

            const screenIndex = screens.findIndex(s => s.id === item.id);
            
            return (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className={`flex items-center bg-white dark:bg-black ${item.hidden ? 'opacity-50' : ''}`}
              >
                <div className="flex-1">
                  <SettingItem 
                    title={item.name} 
                    subtitle={item.hidden ? 'Скрыт' : undefined}
                    onClick={() => setEditingScreenIndex(screenIndex)}
                    onLongPress={() => {
                      setSelectedScreenForAction({ screen: item, index: screenIndex });
                      setNewName(item.name);
                    }}
                  />
                </div>
                <div className="p-4 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      <button 
        onClick={() => setShowAddScreen(true)}
        className="h-16 bg-accent text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
      >
        Добавить экран +
      </button>

      <AnimatePresence>
        {showAddScreen && (
          <motion.div key="add-screen-menu">
            <AddScreenMenu 
              onBack={() => setShowAddScreen(false)} 
              existingScreens={screens.map(s => s.name)}
              onSave={(screen) => {
                onAddScreen(screen);
                setShowAddScreen(false);
              }} 
            />
          </motion.div>
        )}
        {editingScreenIndex !== null && (
          <CustomLayoutEditor 
            screenName={screens[editingScreenIndex].name}
            initialRows={screens[editingScreenIndex].layout}
            onBack={() => setEditingScreenIndex(null)}
            onSave={(rows) => {
              onUpdateScreen(editingScreenIndex, rows);
              setEditingScreenIndex(null);
            }}
            isDarkMode={isDarkMode}
          />
        )}
        {selectedScreenForAction && !isRenaming && !showDeleteConfirm && (
          <RouteContextMenu 
            route={{ name: selectedScreenForAction.screen.name } as any}
            onClose={() => setSelectedScreenForAction(null)}
            onRename={() => setIsRenaming(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onDuplicate={handleDuplicate}
            showExport={false}
            showShare={false}
          />
        )}
        {showDeleteConfirm && selectedScreenForAction && (
          <DeleteConfirmModal 
            title={selectedScreenForAction.screen.name}
            onConfirm={() => {
              handleDelete();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
        {isRenaming && (
          <RenameModal 
            value={newName}
            onChange={setNewName}
            onSave={handleRename}
            onClose={() => setIsRenaming(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AddScreenMenu = ({ 
  onBack, 
  onSave,
  existingScreens
}: { 
  onBack: () => void;
  onSave: (screen: Screen) => void;
  existingScreens: string[];
}) => {
  const [screenName, setScreenName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('Нет');
  const [error, setError] = useState(false);

  const presets = [
    'Нет',
    'Велоспорт',
    'Карта',
    'Навигация',
    'Бег',
    'Подъемы'
  ];

  const handleSave = () => {
    if (!screenName.trim()) {
      setError(true);
      return;
    }
    
    let layout: MetricRow[] = [{ id: '1', size: 4 }, { id: '2', size: 4 }];
    if (selectedPreset === 'Карта' || selectedPreset === 'Навигация' || selectedPreset === 'Подъемы') {
      layout = [{ id: '1', size: 8 }];
    }
    
    onSave({ id: Date.now().toString(), name: screenName, layout });
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2060] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em]">Добавить экран</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white">Название экрана</label>
          <input 
            type="text" 
            value={screenName}
            placeholder="Экран"
            onChange={(e) => {
              setScreenName(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            className={`w-full h-14 px-4 bg-white dark:bg-black border text-sm font-medium focus:outline-none transition-colors ${
              error 
                ? 'border-accent ring-1 ring-accent' 
                : 'border-gray-100 dark:border-zinc-800 focus:border-accent'
            }`}
          />
          {error && <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Введите название экрана</p>}
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white">Шаблоны макетов экрана</label>
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setSelectedPreset(preset)}
                className="w-full py-3 flex items-center gap-4 group"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedPreset === preset ? 'border-accent bg-accent' : 'border-gray-200 dark:border-zinc-800'
                }`}>
                  {selectedPreset === preset && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  selectedPreset === preset ? 'text-black dark:text-white' : 'text-gray-500 dark:text-zinc-500'
                }`}>
                  {preset}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-16 shrink-0">
        <button 
          onClick={onBack}
          className="flex-1 bg-black dark:bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-xs"
        >
          Отмена
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs"
        >
          Сохранить
        </button>
      </div>
    </motion.div>
  );
};

const LayoutsMenu = ({ 
  onBack,
  portraitScreens,
  landscapeScreens,
  onAddPortraitScreen,
  onAddLandscapeScreen,
  onUpdatePortraitScreen,
  onUpdateLandscapeScreen,
  onDeletePortraitScreen,
  onDeleteLandscapeScreen,
  onRenamePortraitScreen,
  onRenameLandscapeScreen,
  onDuplicatePortraitScreen,
  onDuplicateLandscapeScreen,
  onReorderPortraitScreens,
  onReorderLandscapeScreens,
  isDarkMode
}: { 
  onBack: () => void;
  portraitScreens: Screen[];
  landscapeScreens: Screen[];
  onAddPortraitScreen: (screen: Screen) => void;
  onAddLandscapeScreen: (screen: Screen) => void;
  onUpdatePortraitScreen: (index: number, layout: MetricRow[]) => void;
  onUpdateLandscapeScreen: (index: number, layout: MetricRow[]) => void;
  onDeletePortraitScreen: (index: number) => void;
  onDeleteLandscapeScreen: (index: number) => void;
  onRenamePortraitScreen: (index: number, name: string) => void;
  onRenameLandscapeScreen: (index: number, name: string) => void;
  onDuplicatePortraitScreen: (index: number) => void;
  onDuplicateLandscapeScreen: (index: number) => void;
  onReorderPortraitScreens: (screens: Screen[]) => void;
  onReorderLandscapeScreens: (screens: Screen[]) => void;
  isDarkMode: boolean;
}) => {
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Макеты экрана</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <SectionHeader title="Экраны компьютера" />
        <div className="space-y-1">
          <SettingItem 
            title="Портретная ориентация" 
            subtitle="Вертикально" 
            onClick={() => setSelectedOrientation('Портретная ориентация')}
          />
          <SettingItem 
            title="Ландшафтная ориентация" 
            subtitle="Горизонтально" 
            onClick={() => setSelectedOrientation('Ландшафтная ориентация')}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedOrientation && (
          <OrientationMenu 
            title={selectedOrientation} 
            onBack={() => setSelectedOrientation(null)} 
            screens={selectedOrientation === 'Портретная ориентация' ? portraitScreens : landscapeScreens}
            onAddScreen={selectedOrientation === 'Портретная ориентация' ? onAddPortraitScreen : onAddLandscapeScreen}
            onUpdateScreen={selectedOrientation === 'Портретная ориентация' ? onUpdatePortraitScreen : onUpdateLandscapeScreen}
            onDeleteScreen={selectedOrientation === 'Портретная ориентация' ? onDeletePortraitScreen : onDeleteLandscapeScreen}
            onRenameScreen={selectedOrientation === 'Портретная ориентация' ? onRenamePortraitScreen : onRenameLandscapeScreen}
            onDuplicateScreen={selectedOrientation === 'Портретная ориентация' ? onDuplicatePortraitScreen : onDuplicateLandscapeScreen}
            onReorderScreens={selectedOrientation === 'Портретная ориентация' ? onReorderPortraitScreens : onReorderLandscapeScreens}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface SensorDevice {
  id: string;
  name: string;
  type: 'hr' | 'cadence' | 'power' | 'speed' | 'radar';
  status: 'connected' | 'disconnected' | 'scanning';
  battery?: number;
  value?: number;
  unit?: string;
  protocol: 'BLE' | 'ANT+';
}

interface Ride {
  id: string;
  name: string;
  date: string;
  time: string;
  type: 'cycling' | 'running';
  distance: number;
  movingTime: number;
  elapsedTime: number;
  pausedTime: number;
  startTime: string;
  endTime: string;
  avgSpeed: number;
  maxSpeed: number;
  avgPace: string;
  maxPace: string;
  ascent: number;
  descent: number;
  elevChange: number;
  avgElevation: number;
  maxElevation: number;
  minElevation: number;
  maxGrade: number;
  minGrade: number;
  avgGrade: number;
  avgVam: number;
  minVam: number;
  maxVam: number;
  avgHr: number;
  maxHr: number;
  minHr: number;
  avgHrPercent: number;
  maxHrPercent: number;
  minHrPercent: number;
  hrZones: { zone: number; percent: number; time: string; color: string }[];
  normalizedPower: number;
  avgPower: number;
  maxPower: number;
  avgFtpPercent: number;
  maxFtpPercent: number;
  avgPedalBalance: string;
  powerZones: { zone: number; percent: number; time: string; color: string }[];
  avgCadence: number;
  maxCadence: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  avgWindSpeed: number;
  minWindSpeed: number;
  maxWindSpeed: number;
  windDirection: string;
  estCalories: number;
  calories?: number;
  intensity?: number;
  trainingLoad?: number;
  recoveryTime?: number;
  aerobicEffect?: number;
  anaerobicEffect?: number;
  laps?: any[];
  notes?: string;
  perceivedExertion?: number;
  photos?: string[];
  points: [number, number][];
  speedData: { value: number; dist: number }[];
  elevationData: { value: number; dist: number }[];
  hrData: { value: number; dist: number }[];
  powerData: { value: number; dist: number }[];
  cadenceData: { value: number; dist: number }[];
}

const MOCK_RIDES: Ride[] = [
  {
    id: '1',
    name: 'Вечерняя поездка',
    date: 'Четверг, 21 сен, 2023',
    time: '14:22',
    type: 'cycling',
    distance: 9.94,
    movingTime: 3604, // 1:00:04
    elapsedTime: 3716, // 1:01:56
    pausedTime: 112, // 01:52
    startTime: '14:22',
    endTime: '15:24',
    avgSpeed: 9.9,
    maxSpeed: 42.0,
    avgPace: '06:02',
    maxPace: '01:25',
    ascent: 1341,
    descent: -1339,
    elevChange: 2,
    avgElevation: 1602,
    maxElevation: 1964,
    minElevation: 1241,
    maxGrade: 17.6,
    minGrade: -17.8,
    avgGrade: 4.0,
    avgVam: 0.8,
    minVam: -6231.9,
    maxVam: 1017,
    avgHr: 145,
    maxHr: 169,
    minHr: 84,
    avgHrPercent: 85.2,
    maxHrPercent: 99.4,
    minHrPercent: 49.4,
    hrZones: [
      { zone: 1, percent: 2, time: '00:58', color: '#9ca3af' },
      { zone: 2, percent: 17, time: '10:01', color: '#0077b6' },
      { zone: 3, percent: 29, time: '17:14', color: '#166534' },
      { zone: 4, percent: 52, time: '31:21', color: '#eab308' },
      { zone: 5, percent: 1, time: '00:28', color: '#991b1b' },
    ],
    normalizedPower: 188,
    avgPower: 151,
    maxPower: 407,
    avgFtpPercent: 53.9,
    maxFtpPercent: 145.4,
    avgPedalBalance: '50/50',
    powerZones: [
      { zone: 1, percent: 33, time: '20:06', color: '#9ca3af' },
      { zone: 2, percent: 23, time: '14:02', color: '#0077b6' },
      { zone: 3, percent: 20, time: '12:11', color: '#166534' },
      { zone: 4, percent: 15, time: '08:55', color: '#eab308' },
      { zone: 5, percent: 5, time: '02:54', color: '#b45309' },
      { zone: 6, percent: 2, time: '01:16', color: '#991b1b' },
      { zone: 7, percent: 1, time: '00:39', color: '#5b21b6' },
    ],
    avgCadence: 47,
    maxCadence: 96,
    avgTemp: 71.5,
    minTemp: 69.4,
    maxTemp: 73.0,
    avgWindSpeed: 3.2,
    minWindSpeed: 2.0,
    maxWindSpeed: 5.0,
    windDirection: 'В',
    estCalories: 541,
    points: [
      [51.505, -0.090], [51.508, -0.092], [51.512, -0.095], [51.516, -0.098],
      [51.520, -0.102], [51.524, -0.106], [51.528, -0.110], [51.532, -0.115],
      [51.535, -0.120], [51.538, -0.125], [51.540, -0.130]
    ],
    speedData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 10 + Math.random() * 30 })),
    elevationData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 1200 + Math.sin(i / 5) * 400 + Math.random() * 50 })),
    hrData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 100 + Math.random() * 60 })),
    powerData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 100 + Math.random() * 300 })),
    cadenceData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 60 + Math.random() * 40 })),
  },
  {
    id: '2',
    name: 'Утренняя тренировка',
    date: 'Среда, 20 сен, 2023',
    time: '08:15',
    type: 'cycling',
    distance: 25.4,
    movingTime: 3600,
    elapsedTime: 3800,
    pausedTime: 200,
    startTime: '08:15',
    endTime: '09:18',
    avgSpeed: 25.4,
    maxSpeed: 45.2,
    avgPace: '02:21',
    maxPace: '01:19',
    ascent: 450,
    descent: -450,
    elevChange: 0,
    avgElevation: 150,
    maxElevation: 210,
    minElevation: 90,
    maxGrade: 8.5,
    minGrade: -9.2,
    avgGrade: 1.2,
    avgVam: 0.5,
    minVam: -1200,
    maxVam: 1500,
    avgHr: 138,
    maxHr: 162,
    minHr: 75,
    avgHrPercent: 72.5,
    maxHrPercent: 85.3,
    minHrPercent: 39.5,
    hrZones: [
      { zone: 1, percent: 10, time: '06:00', color: '#9ca3af' },
      { zone: 2, percent: 40, time: '24:00', color: '#0077b6' },
      { zone: 3, percent: 35, time: '21:00', color: '#166534' },
      { zone: 4, percent: 10, time: '06:00', color: '#eab308' },
      { zone: 5, percent: 5, time: '03:00', color: '#991b1b' },
    ],
    normalizedPower: 210,
    avgPower: 185,
    maxPower: 520,
    avgFtpPercent: 92.5,
    maxFtpPercent: 260.0,
    avgPedalBalance: '49/51',
    powerZones: [
      { zone: 1, percent: 15, time: '09:00', color: '#9ca3af' },
      { zone: 2, percent: 30, time: '18:00', color: '#0077b6' },
      { zone: 3, percent: 25, time: '15:00', color: '#166534' },
      { zone: 4, percent: 20, time: '12:00', color: '#eab308' },
      { zone: 5, percent: 5, time: '03:00', color: '#b45309' },
      { zone: 6, percent: 3, time: '01:48', color: '#991b1b' },
      { zone: 7, percent: 2, time: '01:12', color: '#5b21b6' },
    ],
    avgCadence: 88,
    maxCadence: 112,
    avgTemp: 65.2,
    minTemp: 62.1,
    maxTemp: 68.4,
    avgWindSpeed: 5.4,
    minWindSpeed: 2.1,
    maxWindSpeed: 12.5,
    windDirection: 'СЗ',
    estCalories: 850,
    points: [
      [51.505, -0.090], [51.507, -0.093], [51.509, -0.096], [51.512, -0.099],
      [51.514, -0.103], [51.516, -0.106], [51.518, -0.110], [51.521, -0.114],
      [51.523, -0.118], [51.525, -0.122]
    ],
    speedData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.5, value: 20 + Math.random() * 20 })),
    elevationData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.5, value: 100 + Math.sin(i / 10) * 50 })),
    hrData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.5, value: 120 + Math.random() * 40 })),
    powerData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.5, value: 150 + Math.random() * 200 })),
    cadenceData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.5, value: 80 + Math.random() * 20 })),
  },
  {
    id: '3',
    name: 'Осенний забег',
    date: 'Понедельник, 02 окт, 2023',
    time: '10:00',
    type: 'running',
    distance: 10.2,
    movingTime: 3300,
    elapsedTime: 3400,
    pausedTime: 100,
    startTime: '10:00',
    endTime: '10:56',
    avgSpeed: 11.1,
    maxSpeed: 14.5,
    avgPace: '05:23',
    maxPace: '04:10',
    ascent: 85,
    descent: -85,
    elevChange: 0,
    avgElevation: 45,
    maxElevation: 60,
    minElevation: 30,
    maxGrade: 4.2,
    minGrade: -4.5,
    avgGrade: 0.5,
    avgVam: 0.2,
    minVam: -300,
    maxVam: 400,
    avgHr: 152,
    maxHr: 175,
    minHr: 80,
    avgHrPercent: 80.0,
    maxHrPercent: 92.1,
    minHrPercent: 42.1,
    hrZones: [
      { zone: 1, percent: 5, time: '02:45', color: '#9ca3af' },
      { zone: 2, percent: 15, time: '08:15', color: '#0077b6' },
      { zone: 3, percent: 40, time: '22:00', color: '#166534' },
      { zone: 4, percent: 30, time: '16:30', color: '#eab308' },
      { zone: 5, percent: 10, time: '05:30', color: '#991b1b' },
    ],
    normalizedPower: 0,
    avgPower: 0,
    maxPower: 0,
    avgFtpPercent: 0,
    maxFtpPercent: 0,
    avgPedalBalance: '-',
    powerZones: [],
    avgCadence: 172,
    maxCadence: 185,
    avgTemp: 58.5,
    minTemp: 57.0,
    maxTemp: 60.0,
    avgWindSpeed: 8.5,
    minWindSpeed: 5.0,
    maxWindSpeed: 15.0,
    windDirection: 'Ю',
    estCalories: 720,
    points: [
      [51.505, -0.090], [51.510, -0.095], [51.515, -0.100], [51.520, -0.105],
      [51.525, -0.110], [51.530, -0.115], [51.535, -0.120], [51.540, -0.125],
      [51.545, -0.130], [51.550, -0.135]
    ],
    speedData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 8 + Math.random() * 5 })),
    elevationData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 40 + Math.sin(i / 15) * 20 })),
    hrData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 130 + Math.random() * 40 })),
    powerData: [],
    cadenceData: Array.from({ length: 50 }, (_, i) => ({ dist: i * 0.2, value: 160 + Math.random() * 25 })),
  }
];

interface RoutePoint {
  lat: number;
  lon: number;
  ele: number;
  dist: number;
}

interface Route {
  id: string;
  name: string;
  distance: number;
  gain: number;
  loss: number;
  minEle: number;
  maxEle: number;
  points: RoutePoint[];
  rawContent?: string;
}

interface DataFormats {
  distance: 'KILOMETERS' | 'MILES';
  elevation: 'METERS' | 'FEET';
  weight: 'KILOGRAMS' | 'POUNDS';
  temperature: 'C' | 'F';
  date: 'DD/MM/YY' | 'MM/DD/YY' | 'YY/MM/DD';
  time: '24HR' | '12HR';
  pressure: 'PSI' | 'BAR';
}

const formatDistance = (km: number, unit: 'KILOMETERS' | 'MILES') => {
  const val = unit === 'MILES' ? km * 0.621371 : km;
  return `${val.toFixed(2)} ${unit === 'MILES' ? 'миль' : 'км'}`;
};

const formatElevation = (m: number, unit: 'METERS' | 'FEET') => {
  const val = unit === 'FEET' ? m * 3.28084 : m;
  return `${Math.round(val)} ${unit === 'FEET' ? 'фт' : 'м'}`;
};

const RoutesMenu = ({ 
  onBack, 
  routes, 
  setRoutes,
  formats,
  onStartNavigation
}: { 
  onBack: () => void;
  routes: Route[];
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
  formats: DataFormats;
  onStartNavigation: (route: Route) => void;
}) => {
  const [showAddRouteSheet, setShowAddRouteSheet] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ route: Route, index: number } | null>(null);
  const [viewingRoute, setViewingRoute] = useState<Route | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newName, setNewName] = useState('');

  const handleDelete = () => {
    if (selectedRoute) {
      const newRoutes = [...routes];
      newRoutes.splice(selectedRoute.index, 1);
      setRoutes(newRoutes);
      setSelectedRoute(null);
    }
  };

  const handleRename = () => {
    if (selectedRoute && newName.trim()) {
      const newRoutes = [...routes];
      newRoutes[selectedRoute.index] = { ...selectedRoute.route, name: newName.trim() };
      setRoutes(newRoutes);
      setIsRenaming(false);
      setSelectedRoute(null);
    }
  };

  const handleDuplicate = () => {
    if (selectedRoute) {
      const newRoutes = [...routes];
      const duplicatedRoute = { 
        ...selectedRoute.route, 
        id: `${selectedRoute.route.id}-copy-${Date.now()}`,
        name: `${selectedRoute.route.name} (Копия)` 
      };
      newRoutes.splice(selectedRoute.index + 1, 0, duplicatedRoute);
      setRoutes(newRoutes);
      setSelectedRoute(null);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] ml-4">Маршруты</h1>
        <div className="w-10" />
      </header>
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        {routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-wider">Нет маршрутов</h2>
                <div className="w-full h-px bg-gray-200 dark:bg-zinc-800 max-w-[200px] mx-auto" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-500">Вам следует добавить маршрут</p>
            </div>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={routes} 
            onReorder={setRoutes}
            className="w-full divide-y divide-gray-100 dark:divide-zinc-900"
          >
            {routes.map((route, index) => (
              <Reorder.Item 
                key={route.id} 
                value={route}
                className="flex items-center bg-white dark:bg-black"
              >
                <div className="flex-1">
                  <SettingItem 
                    title={route.name} 
                    onClick={() => setViewingRoute(route)}
                    onLongPress={() => {
                      setSelectedRoute({ route, index });
                      setNewName(route.name);
                    }}
                    subtitle={
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-gray-400" />
                          <span>{formatDistance(route.distance, formats.distance)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3 text-emerald-500" />
                          <span>{formatElevation(route.gain, formats.elevation)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3 text-rose-500" />
                          <span>{formatElevation(route.loss, formats.elevation)}</span>
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="p-4 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <button 
        onClick={() => setShowAddRouteSheet(true)}
        className="h-16 bg-accent text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
      >
        Добавить маршрут +
      </button>

      <AnimatePresence>
        {showAddRouteSheet && (
          <AddRouteActionSheet 
            onClose={() => setShowAddRouteSheet(false)} 
            onImport={(route) => {
              setRoutes([...routes, route]);
              setShowAddRouteSheet(false);
            }}
          />
        )}
        {selectedRoute && !isRenaming && !showDeleteConfirm && (
          <RouteContextMenu 
            route={selectedRoute.route}
            onClose={() => setSelectedRoute(null)}
            onRename={() => setIsRenaming(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onDuplicate={handleDuplicate}
          />
        )}
        {showDeleteConfirm && selectedRoute && (
          <DeleteConfirmModal 
            title={selectedRoute.route.name}
            onConfirm={() => {
              handleDelete();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
        {isRenaming && (
          <RenameModal 
            value={newName}
            onChange={setNewName}
            onSave={handleRename}
            onClose={() => setIsRenaming(false)}
          />
        )}
        {viewingRoute && (
          <RouteDetail 
            route={viewingRoute} 
            onBack={() => setViewingRoute(null)} 
            formats={formats}
            onStartNavigation={(route) => {
              onStartNavigation(route);
              setViewingRoute(null);
              onBack();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MapBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [points, map]);
  return null;
};

const RouteDetail = ({ 
  route, 
  onBack,
  formats,
  onStartNavigation
}: { 
  route: Route; 
  onBack: () => void;
  formats: DataFormats;
  onStartNavigation: (route: Route) => void;
}) => {
  const polyline = (route.points || []).map(p => [p?.lat || 0, p?.lon || 0] as [number, number]);
  
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0 bg-white dark:bg-black z-20">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6 truncate">{route.name}</h1>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Map Section - Takes available space */}
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={[route.points[0]?.lat || 0, route.points[0]?.lon || 0]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polyline positions={polyline} color="#0077b6" weight={5} />
            <MapBounds points={polyline} />
          </MapContainer>
        </div>

        {/* Info Panel - Fixed at bottom with max height */}
        <div className="bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 max-h-[60%] flex flex-col rounded-t-[32px] -mt-8">
          <div className="w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 mb-1 shrink-0" />
          
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Дистанция</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-black dark:text-white">
                    {formats.distance === 'MILES' ? (route.distance * 0.621371).toFixed(2) : route.distance.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{formats.distance === 'MILES' ? 'миль' : 'км'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Набор высоты</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-500">
                    {formats.elevation === 'FEET' ? Math.round(route.gain * 3.28084) : route.gain}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{formats.elevation === 'FEET' ? 'фт' : 'м'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-100 dark:border-zinc-900">
              <MetricSmall icon={<Minimize2 className="w-3 h-3" />} label="Мин" value={formatElevation(route.minEle, formats.elevation)} />
              <MetricSmall icon={<Maximize2 className="w-3 h-3" />} label="Макс" value={formatElevation(route.maxEle, formats.elevation)} />
              <MetricSmall icon={<ArrowUp className="w-3 h-3" />} label="Подъем" value={formatElevation(route.gain, formats.elevation)} />
              <MetricSmall icon={<ArrowDown className="w-3 h-3" />} label="Спуск" value={formatElevation(route.loss, formats.elevation)} />
            </div>

            {/* Elevation Profile */}
            <div className="space-y-4 pb-4">
              <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Профиль высот</span>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={route.points}>
                    <defs>
                      <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#166534" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="ele" 
                      stroke="#166534" 
                      fillOpacity={1} 
                      fill="url(#colorEle)" 
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <XAxis dataKey="dist" hide />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-2 rounded shadow-lg">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                {formats.distance === 'MILES' ? (payload[0].payload.dist * 0.621371).toFixed(2) : payload[0].payload.dist.toFixed(2)} {formats.distance === 'MILES' ? 'миль' : 'км'}
                              </p>
                              <p className="text-sm font-black text-[#166534]">
                                {formats.elevation === 'FEET' ? Math.round(payload[0].value as number * 3.28084) : payload[0].value} {formats.elevation === 'FEET' ? 'фт' : 'м'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 bg-white dark:bg-zinc-900 border-t border-gray-50 dark:border-zinc-800 shrink-0">
            <button 
              className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
              onClick={() => onStartNavigation(route)}
            >
              <Navigation className="w-5 h-5" />
              Начать навигацию
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MetricSmall = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="text-gray-400">{icon}</div>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
    <span className="text-xs font-black text-black dark:text-white">{value}</span>
  </div>
);

const DeleteConfirmModal = ({ onConfirm, onCancel, title }: { onConfirm: () => void, onCancel: () => void, title: string }) => (
  <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6"
    >
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">Удалить?</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Вы уверены, что хотите удалить "{title}"? Это действие нельзя отменить.</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold uppercase tracking-widest text-xs rounded-xl"
        >
          Отмена
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 h-12 bg-accent text-white font-bold uppercase tracking-widest text-xs rounded-xl"
        >
          Удалить
        </button>
      </div>
    </motion.div>
  </div>
);

const RideContextMenu: React.FC<{ 
  ride: Ride; 
  onClose: () => void; 
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
  setShowDeleteConfirm: (v: boolean) => void;
}> = ({ 
  ride, 
  onClose, 
  onRename, 
  onDelete,
  onShare,
  setShowDeleteConfirm
}) => {
  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full bg-white dark:bg-zinc-900 rounded-t-[32px] overflow-hidden flex flex-col"
      >
        <div className="p-6 space-y-4">
          <div className="px-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">{ride.name}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-1">
            <ContextMenuButton 
              icon={<Edit2 className="w-5 h-5" />} 
              label="Переименовать" 
              onClick={onRename} 
            />
            <ContextMenuButton 
              icon={<Share2 className="w-5 h-5" />} 
              label="Поделиться" 
              onClick={onShare} 
            />
            <ContextMenuButton 
              icon={<Trash2 className="w-5 h-5" />} 
              label="Удалить" 
              onClick={() => {
                setShowDeleteConfirm(true);
              }} 
              danger
            />
          </div>
          
          <button 
            onClick={onClose}
            className="w-full h-14 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white active:scale-[0.98] transition-all"
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RouteContextMenu: React.FC<{ 
  route: Route; 
  onClose: () => void; 
  onRename: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  showExport?: boolean;
  showShare?: boolean;
}> = ({ 
  route, 
  onClose, 
  onRename, 
  onDelete,
  onDuplicate,
  showExport = true,
  showShare = true
}) => {
  const handleExport = () => {
    const gpxContent = route.rawContent || `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="BikeComputer" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${route.name}</name>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <trkseg></trkseg>
  </trk>
</gpx>`;
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full bg-white dark:bg-zinc-900 rounded-t-[32px] overflow-hidden flex flex-col"
      >
        <div className="p-6 space-y-4">
          <div className="px-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">{route.name}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-1">
            <ContextMenuButton 
              icon={<Edit2 className="w-5 h-5" />} 
              label="Переименовать" 
              onClick={onRename} 
            />
            {onDuplicate && (
              <ContextMenuButton 
                icon={<Copy className="w-5 h-5" />} 
                label="Дублировать" 
                onClick={onDuplicate} 
              />
            )}
            {showShare && (
              <ContextMenuButton 
                icon={<Share2 className="w-5 h-5" />} 
                label="Поделиться" 
                onClick={() => {
                  alert('Функция "Поделиться" в разработке');
                  onClose();
                }} 
              />
            )}
            {showExport && (
              <ContextMenuButton 
                icon={<Download className="w-5 h-5" />} 
                label="Экспорт GPX" 
                onClick={handleExport} 
              />
            )}
            <ContextMenuButton 
              icon={<Trash2 className="w-5 h-5 text-rose-500" />} 
              label="Удалить" 
              onClick={onDelete}
              danger
            />
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-4 text-sm font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ContextMenuButton = ({ 
  icon, 
  label, 
  onClick, 
  danger = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  danger?: boolean;
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl active:bg-gray-50 dark:active:bg-zinc-800 transition-colors ${
      danger ? 'text-rose-500' : 'text-gray-900 dark:text-white'
    }`}
  >
    {icon}
    <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const RenameModal: React.FC<{ 
  value: string; 
  onChange: (v: string) => void; 
  onSave: () => void;
  onClose: () => void;
}> = ({ 
  value, 
  onChange, 
  onSave, 
  onClose 
}) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6"
    >
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">Переименовать маршрут</h3>
        <input 
          type="text" 
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 px-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:border-accent transition-colors select-text"
        />
      </div>
      <div className="flex gap-3 h-12">
        <button 
          onClick={onClose}
          className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
        >
          Отмена
        </button>
        <button 
          onClick={onSave}
          className="flex-1 bg-accent text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
        >
          Сохранить
        </button>
      </div>
    </motion.div>
  </div>
);

const DataFormatsMenu = ({ 
  formats, 
  setFormats, 
  onBack 
}: { 
  formats: DataFormats; 
  setFormats: (f: DataFormats) => void; 
  onBack: () => void;
}) => {
  const toggle = (key: keyof DataFormats) => {
    const newFormats = { ...formats };
    if (key === 'distance') newFormats.distance = formats.distance === 'KILOMETERS' ? 'MILES' : 'KILOMETERS';
    if (key === 'elevation') newFormats.elevation = formats.elevation === 'METERS' ? 'FEET' : 'METERS';
    if (key === 'weight') newFormats.weight = formats.weight === 'KILOGRAMS' ? 'POUNDS' : 'KILOGRAMS';
    if (key === 'temperature') newFormats.temperature = formats.temperature === 'C' ? 'F' : 'C';
    if (key === 'time') newFormats.time = formats.time === '24HR' ? '12HR' : '24HR';
    if (key === 'pressure') newFormats.pressure = formats.pressure === 'PSI' ? 'BAR' : 'PSI';
    if (key === 'date') {
      const options: DataFormats['date'][] = ['DD/MM/YY', 'MM/DD/YY', 'YY/MM/DD'];
      const idx = options.indexOf(formats.date);
      newFormats.date = options[(idx + 1) % options.length];
    }
    setFormats(newFormats);
  };

  const translations: Record<string, string> = {
    'KILOMETERS': 'КИЛОМЕТРЫ',
    'MILES': 'МИЛИ',
    'METERS': 'МЕТРЫ',
    'FEET': 'ФУТЫ',
    'KILOGRAMS': 'КИЛОГРАММЫ',
    'POUNDS': 'ФУНТЫ',
    'C': 'C',
    'F': 'F',
    '24HR': '24 ЧАСА',
    '12HR': '12 ЧАСОВ',
    'PSI': 'PSI',
    'BAR': 'BAR',
    'DD/MM/YY': 'ДД/ММ/ГГ',
    'MM/DD/YY': 'ММ/ДД/ГГ',
    'YY/MM/DD': 'ГГ/ММ/ДД'
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Формат данных</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100 dark:divide-zinc-900">
          <FormatItem label="Дистанция и скорость" value={translations[formats.distance]} onClick={() => toggle('distance')} />
          <FormatItem label="Высота" value={translations[formats.elevation]} onClick={() => toggle('elevation')} />
          <FormatItem label="Вес" value={translations[formats.weight]} onClick={() => toggle('weight')} />
          <FormatItem label="Температура" value={translations[formats.temperature]} onClick={() => toggle('temperature')} />
          <FormatItem label="Дата" value={translations[formats.date]} onClick={() => toggle('date')} />
          <FormatItem label="Время" value={translations[formats.time]} onClick={() => toggle('time')} />
          <FormatItem label="Давление" value={translations[formats.pressure]} onClick={() => toggle('pressure')} />
        </div>
      </div>
    </motion.div>
  );
};

const FormatItem = ({ label, value, onClick }: { label: string, value: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-6 active:bg-gray-50 dark:active:bg-zinc-900 transition-colors"
  >
    <span className="text-lg font-medium text-gray-900 dark:text-white">{label}</span>
    <span className="text-sm font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{value}</span>
  </button>
);

const WheelPicker = ({ 
  options, 
  value, 
  onChange, 
  label 
}: { 
  options: string[]; 
  value: string; 
  onChange: (val: string) => void;
  label: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40;
  const selectedIndex = options.indexOf(value);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      if (index >= 0 && index < options.length && options[index] !== value) {
        onChange(options[index]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</span>
      <div className="relative w-full h-[120px] overflow-hidden bg-gray-50 dark:bg-zinc-800 rounded-2xl">
        <div className="absolute inset-x-0 top-[40px] h-[40px] border-y border-accent/20 pointer-events-none z-10" />
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[40px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map((opt) => (
            <div 
              key={opt}
              className={`h-[40px] flex items-center justify-center snap-center transition-all duration-200 ${opt === value ? 'text-accent font-black text-lg' : 'text-gray-400 font-medium text-sm'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DatePickerModal = ({ 
  currentDate, 
  onSave, 
  onClose 
}: { 
  currentDate: string | null; 
  onSave: (date: string) => void; 
  onClose: () => void;
}) => {
  const [year, setYear] = useState(currentDate ? currentDate.split('-')[0] : '1990');
  const [month, setMonth] = useState(currentDate ? currentDate.split('-')[1] : '01');
  const [day, setDay] = useState(currentDate ? currentDate.split('-')[2] : '01');

  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Дата рождения</h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Прокрутите для выбора</p>
        </div>

        <div className="flex gap-3">
          <WheelPicker label="День" options={days} value={day} onChange={setDay} />
          <WheelPicker label="Месяц" options={months} value={month} onChange={setMonth} />
          <WheelPicker label="Год" options={years} value={year} onChange={setYear} />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
          >
            Отмена
          </button>
          <button 
            onClick={() => onSave(`${year}-${month}-${day}`)}
            className="flex-1 h-12 bg-accent text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const WeightPickerModal = ({ 
  currentWeight, 
  unit,
  onSave, 
  onClose 
}: { 
  currentWeight: number | null; 
  unit: 'KILOGRAMS' | 'POUNDS';
  onSave: (val: number) => void; 
  onClose: () => void;
}) => {
  const initialWeight = currentWeight || (unit === 'KILOGRAMS' ? 70 : 150);
  const [integer, setInteger] = useState(Math.floor(initialWeight).toString());
  const [decimal, setDecimal] = useState(Math.round((initialWeight % 1) * 10).toString());

  const integers = Array.from({ length: unit === 'KILOGRAMS' ? 200 : 450 }, (_, i) => (i + 1).toString());
  const decimals = Array.from({ length: 10 }, (_, i) => i.toString());

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ваш вес</h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Выберите значение ({unit === 'KILOGRAMS' ? 'кг' : 'фунты'})</p>
        </div>

        <div className="flex gap-3 items-center">
          <WheelPicker label="Целые" options={integers} value={integer} onChange={setInteger} />
          <div className="pt-6 text-2xl font-black text-accent">.</div>
          <WheelPicker label="Десятые" options={decimals} value={decimal} onChange={setDecimal} />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
          >
            Отмена
          </button>
          <button 
            onClick={() => onSave(parseFloat(`${integer}.${decimal}`))}
            className="flex-1 h-12 bg-accent text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MaxHeartRatePickerModal = ({ 
  currentMHR, 
  accentColor,
  onSave, 
  onClose 
}: { 
  currentMHR: number; 
  accentColor: string;
  onSave: (val: number) => void; 
  onClose: () => void;
}) => {
  const [mhr, setMhr] = useState(currentMHR.toString());
  const options = Array.from({ length: 121 }, (_, i) => (100 + i).toString());

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest">Макс. ЧСС</h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Укажите максимальный пульс (BPM)</p>
        </div>

        <div className="flex justify-center">
          <div className="w-32">
            <WheelPicker label="BPM" options={options} value={mhr} onChange={setMhr} />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
          >
            Отмена
          </button>
          <button 
            onClick={() => onSave(parseInt(mhr))}
            style={{ backgroundColor: accentColor }}
            className="flex-1 h-12 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const HeartRateZonesMenu = ({ 
  birthDate,
  settings,
  accentColor,
  onSave,
  onBack 
}: { 
  birthDate: string | null;
  settings: { maxHR: number | null, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] };
  accentColor: string;
  onSave: (s: { maxHR: number | null, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }) => void;
  onBack: () => void;
}) => {
  const calculateDefaultMHR = () => {
    if (!birthDate) return 190;
    const year = parseInt(birthDate.split('-')[0]);
    const age = new Date().getFullYear() - year;
    return 220 - age;
  };

  const [currentMaxHR, setCurrentMaxHR] = useState(settings.maxHR || calculateDefaultMHR());
  const [isManual, setIsManual] = useState(settings.isManual);
  const [zones, setZones] = useState(settings.zones);
  const [showPicker, setShowPicker] = useState(false);
  const [colorPickerZoneIdx, setColorPickerZoneIdx] = useState<number | null>(null);

  const handleReset = () => {
    setCurrentMaxHR(calculateDefaultMHR());
    setIsManual(false);
    setZones([
      { name: 'Разминка', color: '#9ca3af', range: [0, 0.6] },
      { name: 'Сжигание жира', color: '#0077b6', range: [0.6, 0.7] },
      { name: 'Аэробная', color: '#166534', range: [0.7, 0.8] },
      { name: 'Анаэробная', color: '#b45309', range: [0.8, 0.9] },
      { name: 'VO2 Max', color: '#991b1b', range: [0.9, 1.0] },
    ]);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Зоны пульса</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">МАКС ЧСС</h2>
            </div>
          </div>
          <button 
            onClick={() => setShowPicker(true)}
            className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-lg font-black text-gray-900 dark:text-white shadow-sm"
          >
            {currentMaxHR} BPM
          </button>
        </div>

        <div className="space-y-1 rounded-2xl overflow-hidden shadow-xl">
          {zones.map((zone, idx) => {
            const min = Math.round(currentMaxHR * zone.range[0]);
            const max = Math.round(currentMaxHR * zone.range[1]);
            return (
              <div 
                key={zone.name} 
                className="flex h-16 text-white font-bold cursor-pointer"
                style={{ backgroundColor: zone.color }}
                onClick={() => setColorPickerZoneIdx(idx)}
              >
                <div className="w-24 flex items-center justify-center border-r border-white/20 text-xs uppercase tracking-tighter opacity-80">
                  Зона {idx + 1}
                </div>
                <div className="flex-1 flex items-center px-4 text-sm uppercase tracking-wider">
                  {zone.name}
                </div>
                <div className="w-24 flex items-center justify-center border-l border-white/20 font-black">
                  {idx === 0 ? `< ${max}` : idx === 4 ? `> ${min}` : `${min} - ${max}`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button 
            onClick={handleReset}
            className="px-8 py-3 border-2 border-red-600 text-red-600 font-black uppercase tracking-widest text-xs rounded-lg hover:bg-red-50 transition-colors"
          >
            Сбросить настройки
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 h-20 shrink-0">
        <button 
          onClick={onBack}
          className="bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Отмена
        </button>
        <button 
          onClick={() => onSave({ maxHR: currentMaxHR, isManual: true, zones })}
          style={{ backgroundColor: accentColor }}
          className="text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Сохранить
        </button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div key="mhr-picker">
            <MaxHeartRatePickerModal 
              currentMHR={currentMaxHR}
              accentColor={accentColor}
              onSave={(val) => {
                setCurrentMaxHR(val);
                setIsManual(true);
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />
          </motion.div>
        )}
        {colorPickerZoneIdx !== null && (
          <ZoneColorPickerModal 
            currentColor={zones[colorPickerZoneIdx].color}
            onSelect={(color) => {
              const newZones = [...zones];
              newZones[colorPickerZoneIdx] = { ...newZones[colorPickerZoneIdx], color };
              setZones(newZones);
            }}
            onClose={() => setColorPickerZoneIdx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CadencePickerModal = ({ 
  currentThreshold, 
  accentColor,
  onSave, 
  onClose 
}: { 
  currentThreshold: number; 
  accentColor: string;
  onSave: (val: number) => void; 
  onClose: () => void;
}) => {
  const [cadence, setCadence] = useState(currentThreshold.toString());
  const options = Array.from({ length: 91 }, (_, i) => (60 + i).toString());

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest">Каденс</h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Укажите пороговый каденс (RPM)</p>
        </div>

        <div className="flex justify-center">
          <div className="w-32">
            <WheelPicker label="RPM" options={options} value={cadence} onChange={setCadence} />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
          >
            Отмена
          </button>
          <button 
            onClick={() => onSave(parseInt(cadence))}
            style={{ backgroundColor: accentColor }}
            className="flex-1 h-12 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CadenceZonesMenu = ({ 
  settings,
  accentColor,
  onSave,
  onBack 
}: { 
  settings: { threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] };
  accentColor: string;
  onSave: (s: { threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }) => void;
  onBack: () => void;
}) => {
  const [currentThreshold, setCurrentThreshold] = useState(settings.threshold);
  const [zones, setZones] = useState(settings.zones);
  const [showPicker, setShowPicker] = useState(false);
  const [colorPickerZoneIdx, setColorPickerZoneIdx] = useState<number | null>(null);

  const handleReset = () => {
    setCurrentThreshold(90);
    setZones([
      { name: 'Очень низкий', color: '#9ca3af', range: [0, 0.7] },
      { name: 'Низкий', color: '#0077b6', range: [0.7, 0.9] },
      { name: 'Умеренный', color: '#166534', range: [0.9, 1.05] },
      { name: 'Высокий', color: '#b45309', range: [1.05, 1.2] },
      { name: 'Очень высокий', color: '#991b1b', range: [1.2, 1.5] },
    ]);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Зоны каденса</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">ПОРОГОВЫЙ КАДЕНС</h2>
            </div>
          </div>
          <button 
            onClick={() => setShowPicker(true)}
            className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-lg font-black text-gray-900 dark:text-white shadow-sm"
          >
            {currentThreshold} RPM
          </button>
        </div>

        <div className="space-y-1 rounded-2xl overflow-hidden shadow-xl">
          {zones.map((zone, idx) => {
            const min = Math.round(currentThreshold * zone.range[0]);
            const max = Math.round(currentThreshold * zone.range[1]);
            return (
              <div 
                key={zone.name} 
                className="flex h-16 text-white font-bold cursor-pointer"
                style={{ backgroundColor: zone.color }}
                onClick={() => setColorPickerZoneIdx(idx)}
              >
                <div className="w-24 flex items-center justify-center border-r border-white/20 text-xs uppercase tracking-tighter opacity-80">
                  Зона {idx + 1}
                </div>
                <div className="flex-1 flex items-center px-4 text-sm uppercase tracking-wider">
                  {zone.name}
                </div>
                <div className="w-24 flex items-center justify-center border-l border-white/20 font-black">
                  {idx === 0 ? `< ${max}` : idx === 4 ? `> ${min}` : `${min} - ${max}`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button 
            onClick={handleReset}
            className="px-8 py-3 border-2 border-red-600 text-red-600 font-black uppercase tracking-widest text-xs rounded-lg hover:bg-red-50 transition-colors"
          >
            Сбросить настройки
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 h-20 shrink-0">
        <button 
          onClick={onBack}
          className="bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Отмена
        </button>
        <button 
          onClick={() => onSave({ threshold: currentThreshold, isManual: true, zones })}
          style={{ backgroundColor: accentColor }}
          className="text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Сохранить
        </button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div key="cadence-picker">
            <CadencePickerModal 
              currentThreshold={currentThreshold}
              accentColor={accentColor}
              onSave={(val) => {
                setCurrentThreshold(val);
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />
          </motion.div>
        )}
        {colorPickerZoneIdx !== null && (
          <ZoneColorPickerModal 
            currentColor={zones[colorPickerZoneIdx].color}
            onSelect={(color) => {
              const newZones = [...zones];
              newZones[colorPickerZoneIdx] = { ...newZones[colorPickerZoneIdx], color };
              setZones(newZones);
            }}
            onClose={() => setColorPickerZoneIdx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SpeedPickerModal = ({ 
  currentThreshold, 
  accentColor,
  onSave, 
  onClose 
}: { 
  currentThreshold: number; 
  accentColor: string;
  onSave: (val: number) => void; 
  onClose: () => void;
}) => {
  const [integer, setInteger] = useState(Math.floor(currentThreshold).toString());
  const [decimal, setDecimal] = useState(Math.round((currentThreshold % 1) * 10).toString());

  const integers = Array.from({ length: 41 }, (_, i) => (10 + i).toString());
  const decimals = Array.from({ length: 10 }, (_, i) => i.toString());

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl p-8 space-y-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest">Скорость</h2>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Укажите пороговую скорость (KPH)</p>
        </div>

        <div className="flex justify-center gap-4">
          <div className="w-24">
            <WheelPicker label="Целые" options={integers} value={integer} onChange={setInteger} />
          </div>
          <div className="w-24">
            <WheelPicker label="Десятые" options={decimals} value={decimal} onChange={setDecimal} />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold rounded-xl uppercase tracking-widest text-[10px]"
          >
            Отмена
          </button>
          <button 
            onClick={() => onSave(parseFloat(`${integer}.${decimal}`))}
            style={{ backgroundColor: accentColor }}
            className="flex-1 h-12 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SpeedZonesMenu = ({ 
  settings,
  accentColor,
  onSave,
  onBack 
}: { 
  settings: { threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] };
  accentColor: string;
  onSave: (s: { threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }) => void;
  onBack: () => void;
}) => {
  const [currentThreshold, setCurrentThreshold] = useState(settings.threshold);
  const [zones, setZones] = useState(settings.zones);
  const [showPicker, setShowPicker] = useState(false);
  const [colorPickerZoneIdx, setColorPickerZoneIdx] = useState<number | null>(null);

  const handleReset = () => {
    setCurrentThreshold(24);
    setZones([
      { name: 'Восстановление', color: '#9ca3af', range: [0, 0.6] },
      { name: 'Выносливость', color: '#0077b6', range: [0.6, 0.75] },
      { name: 'Равномерный', color: '#166534', range: [0.75, 0.9] },
      { name: 'Темп', color: '#b45309', range: [0.9, 1.05] },
      { name: 'Интервал', color: '#991b1b', range: [1.05, 1.3] },
    ]);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Зоны скорости</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">ПОРОГОВАЯ СКОРОСТЬ</h2>
            </div>
          </div>
          <button 
            onClick={() => setShowPicker(true)}
            className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-lg font-black text-gray-900 dark:text-white shadow-sm"
          >
            {currentThreshold} KPH
          </button>
        </div>

        <div className="space-y-1 rounded-2xl overflow-hidden shadow-xl">
          {zones.map((zone, idx) => {
            const min = (currentThreshold * zone.range[0]).toFixed(1);
            const max = (currentThreshold * zone.range[1]).toFixed(1);
            return (
              <div 
                key={zone.name} 
                className="flex h-16 text-white font-bold cursor-pointer"
                style={{ backgroundColor: zone.color }}
                onClick={() => setColorPickerZoneIdx(idx)}
              >
                <div className="w-24 flex items-center justify-center border-r border-white/20 text-xs uppercase tracking-tighter opacity-80">
                  Зона {idx + 1}
                </div>
                <div className="flex-1 flex items-center px-4 text-sm uppercase tracking-wider">
                  {zone.name}
                </div>
                <div className="w-24 flex items-center justify-center border-l border-white/20 font-black">
                  {idx === 0 ? `< ${max}` : idx === 4 ? `> ${min}` : `${min} - ${max}`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button 
            onClick={handleReset}
            className="px-8 py-3 border-2 border-red-600 text-red-600 font-black uppercase tracking-widest text-xs rounded-lg hover:bg-red-50 transition-colors"
          >
            Сбросить настройки
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 h-20 shrink-0">
        <button 
          onClick={onBack}
          className="bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Отмена
        </button>
        <button 
          onClick={() => onSave({ threshold: currentThreshold, isManual: true, zones })}
          style={{ backgroundColor: accentColor }}
          className="text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Сохранить
        </button>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div key="speed-picker">
            <SpeedPickerModal 
              currentThreshold={currentThreshold}
              accentColor={accentColor}
              onSave={(val) => {
                setCurrentThreshold(val);
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />
          </motion.div>
        )}
        {colorPickerZoneIdx !== null && (
          <ZoneColorPickerModal 
            currentColor={zones[colorPickerZoneIdx].color}
            onSelect={(color) => {
              const newZones = [...zones];
              newZones[colorPickerZoneIdx] = { ...newZones[colorPickerZoneIdx], color };
              setZones(newZones);
            }}
            onClose={() => setColorPickerZoneIdx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface PowerZone {
  id: number;
  name: string;
  minPercent: number;
  maxPercent: number | null;
  color: string;
}

const PowerPickerModal = ({ 
  currentFTP, 
  accentColor,
  onSave, 
  onClose 
}: { 
  currentFTP: number;
  accentColor: string;
  onSave: (val: number) => void;
  onClose: () => void;
}) => {
  const options = Array.from({ length: 951 }, (_, i) => (50 + i).toString());
  const [value, setValue] = useState(currentFTP.toString());

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full bg-white dark:bg-zinc-900 rounded-t-[32px] overflow-hidden flex flex-col"
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">FTP (ВАТТ)</h2>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Установите вашу функциональную пороговую мощность</p>
          </div>

          <div className="h-48 relative flex justify-center">
            <WheelPicker 
              options={options}
              value={value}
              onChange={setValue}
              label="МОЩНОСТЬ"
            />
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              <div className="h-16 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent" />
              <div className="h-16 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={onClose}
              className="py-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest"
            >
              Отмена
            </button>
            <button 
              onClick={() => onSave(parseInt(value))}
              style={{ backgroundColor: accentColor }}
              className="py-4 rounded-2xl text-sm font-black text-white uppercase tracking-widest shadow-lg shadow-accent"
            >
              Сохранить
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PowerZonesMenu = ({ 
  settings,
  accentColor,
  onSave,
  onBack 
}: { 
  settings: { ftp: number, zones: PowerZone[] };
  accentColor: string;
  onSave: (s: { ftp: number, zones: PowerZone[] }) => void;
  onBack: () => void;
}) => {
  const [ftp, setFtp] = useState(settings.ftp);
  const [zones, setZones] = useState<PowerZone[]>(settings.zones);
  const [showFtpPicker, setShowFtpPicker] = useState(false);
  const [colorPickerZoneIdx, setColorPickerZoneIdx] = useState<number | null>(null);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Зоны мощности</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">POWER</h2>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Functional Threshold Power</p>
          </div>
          <button 
            onClick={() => setShowFtpPicker(true)}
            className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-lg font-black text-gray-900 dark:text-white shadow-sm"
          >
            {ftp} W
          </button>
        </div>

        <div className="space-y-0">
          {zones.map((zone, idx) => (
            <React.Fragment key={zone.id}>
              <div 
                className="flex h-20 overflow-hidden rounded-xl shadow-sm border border-white/10 mb-1 cursor-pointer"
                style={{ backgroundColor: zone.color }}
                onClick={() => setColorPickerZoneIdx(idx)}
              >
                <div className="w-20 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-tighter border-r border-white/20">
                  Зона {idx + 1}
                </div>
                <div className="flex-1 flex items-center px-4">
                  <span className="font-bold text-sm text-white uppercase tracking-wider text-center w-full">
                    {zone.name}
                  </span>
                </div>
                <div className="w-24 flex items-center justify-center text-white font-black text-xs border-l border-white/20">
                  {zone.maxPercent === null ? `> ${Math.round(ftp * zone.minPercent / 100)}` : 
                   idx === 0 ? `< ${Math.round(ftp * zone.maxPercent / 100)}` :
                   `${Math.round(ftp * zone.minPercent / 100)} - ${Math.round(ftp * zone.maxPercent / 100)}`}
                </div>
              </div>
              
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 h-20 shrink-0">
        <button 
          onClick={onBack}
          className="bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Отмена
        </button>
        <button 
          onClick={() => onSave({ ftp, zones })}
          style={{ backgroundColor: accentColor }}
          className="text-white font-black uppercase tracking-[0.2em] text-sm"
        >
          Сохранить
        </button>
      </div>

      <AnimatePresence>
        {showFtpPicker && (
          <motion.div key="ftp-picker">
            <PowerPickerModal 
              currentFTP={ftp}
              accentColor={accentColor}
              onSave={(val) => {
                setFtp(val);
                setShowFtpPicker(false);
              }}
              onClose={() => setShowFtpPicker(false)}
            />
          </motion.div>
        )}
        {colorPickerZoneIdx !== null && (
          <ZoneColorPickerModal 
            currentColor={zones[colorPickerZoneIdx].color}
            onSelect={(color) => {
              const newZones = [...zones];
              newZones[colorPickerZoneIdx] = { ...newZones[colorPickerZoneIdx], color };
              setZones(newZones);
            }}
            onClose={() => setColorPickerZoneIdx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AddRouteActionSheet = ({ 
  onClose,
  onImport
}: { 
  onClose: () => void;
  onImport: (route: Route) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const parseGPX = (text: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const points = xmlDoc.getElementsByTagName("trkpt");
    
    let distance = 0;
    let gain = 0;
    let loss = 0;
    let minEle = Infinity;
    let maxEle = -Infinity;
    const routePoints: RoutePoint[] = [];
    let lastPoint: { lat: number, lon: number, ele: number } | null = null;

    for (let i = 0; i < points.length; i++) {
      const lat = parseFloat(points[i].getAttribute("lat") || "0");
      const lon = parseFloat(points[i].getAttribute("lon") || "0");
      const eleTag = points[i].getElementsByTagName("ele")[0];
      const ele = eleTag ? parseFloat(eleTag.textContent || "0") : 0;

      if (ele < minEle) minEle = ele;
      if (ele > maxEle) maxEle = ele;

      if (lastPoint) {
        distance += calculateDistance(lastPoint.lat, lastPoint.lon, lat, lon);
        const diff = ele - lastPoint.ele;
        if (diff > 0) gain += diff;
        else loss += Math.abs(diff);
      }
      
      routePoints.push({ lat, lon, ele, dist: distance });
      lastPoint = { lat, lon, ele };
    }

    return { 
      distance, 
      gain: Math.round(gain), 
      loss: Math.round(loss),
      minEle: minEle === Infinity ? 0 : Math.round(minEle),
      maxEle: maxEle === -Infinity ? 0 : Math.round(maxEle),
      points: routePoints
    };
  };

  const parseKML = (text: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const coordTags = xmlDoc.getElementsByTagName("coordinates");
    
    let distance = 0;
    let gain = 0;
    let loss = 0;
    let minEle = Infinity;
    let maxEle = -Infinity;
    const routePoints: RoutePoint[] = [];
    let lastPoint: { lat: number, lon: number, ele: number } | null = null;

    for (let i = 0; i < coordTags.length; i++) {
      const coordsStr = coordTags[i].textContent?.trim() || "";
      const coordPairs = coordsStr.split(/\s+/);
      
      coordPairs.forEach(pair => {
        const [lon, lat, ele] = pair.split(",").map(parseFloat);
        if (!isNaN(lat) && !isNaN(lon)) {
          const currentEle = ele || 0;
          
          if (currentEle < minEle) minEle = currentEle;
          if (currentEle > maxEle) maxEle = currentEle;

          if (lastPoint) {
            distance += calculateDistance(lastPoint.lat, lastPoint.lon, lat, lon);
            const diff = currentEle - lastPoint.ele;
            if (diff > 0) gain += diff;
            else loss += Math.abs(diff);
          }
          
          routePoints.push({ lat, lon, ele: currentEle, dist: distance });
          lastPoint = { lat, lon, ele: currentEle };
        }
      });
    }

    return { 
      distance, 
      gain: Math.round(gain), 
      loss: Math.round(loss),
      minEle: minEle === Infinity ? 0 : Math.round(minEle),
      maxEle: maxEle === -Infinity ? 0 : Math.round(maxEle),
      points: routePoints
    };
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'gpx' && extension !== 'kml') {
      setError("Пожалуйста, выберите файл .gpx или .kml");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const metrics = extension === 'gpx' ? parseGPX(text) : parseKML(text);
        
        // If no points found, use fallback or show error
        if (metrics.distance === 0 && metrics.gain === 0) {
          setError("Файл не содержит данных о маршруте");
          return;
        }

        onImport({
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          ...metrics,
          rawContent: text
        });
      } catch (err) {
        setError("Ошибка при чтении файла");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full bg-white dark:bg-zinc-900 rounded-t-[32px] overflow-hidden flex flex-col"
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept=".gpx,.kml"
          onChange={handleFileChange}
        />
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-400 dark:text-zinc-500">Добавить маршрут</h2>
            <p className="text-sm text-gray-400 dark:text-zinc-500 leading-relaxed">
              Вы хотите импортировать файл GPX или создать собственный маршрут с нуля?
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider text-center">{error}</p>
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left py-4 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800"
            >
              Импорт GPX
            </button>
            <button className="w-full text-left py-4 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800">
              Импорт из ai.gpx.studio
            </button>
            <button className="w-full text-left py-4 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800">
              Создать маршрут
            </button>
            <button 
              onClick={onClose}
              className="w-full text-left py-4 text-lg font-medium text-gray-900 dark:text-white"
            >
              Отмена
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VolumeSliderModal: React.FC<{ value: number; onChange: (v: number) => void; onClose: () => void }> = ({ value, onChange, onClose }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Громкость</h3>
        <span className="text-accent font-black">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent mb-8"
      />
      <button 
        onClick={onClose}
        className="w-full py-4 bg-accent text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-accent"
      >
        Готово
      </button>
    </motion.div>
  </div>
);

const VoiceIntervalPickerModal = ({ value, onSave, onClose }: { value: number; onSave: (v: number) => void; onClose: () => void }) => {
  const options = ['1', '2', '3', '5', '10', '15', '20', '30'];
  const [selected, setSelected] = useState(value.toString());

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full bg-white dark:bg-zinc-900 rounded-t-[32px] overflow-hidden flex flex-col"
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Интервал (мин)</h2>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Как часто озвучивать показатели</p>
          </div>

          <div className="h-48 relative flex justify-center">
            <WheelPicker 
              options={options}
              value={selected}
              onChange={setSelected}
              label="МИНУТЫ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={onClose}
              className="py-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest"
            >
              Отмена
            </button>
            <button 
              onClick={() => onSave(parseInt(selected))}
              className="py-4 bg-accent rounded-2xl text-sm font-black text-white uppercase tracking-widest shadow-lg shadow-accent"
            >
              Сохранить
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VoiceAnnouncementsMenu = ({ 
  settings, 
  setSettings, 
  onBack 
}: { 
  settings: any; 
  setSettings: (s: any) => void; 
  onBack: () => void;
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    basic: false,
    metrics: false
  });

  const toggleSection = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMetric = (metric: string) => {
    setSettings({
      ...settings,
      metrics: {
        ...settings.metrics,
        [metric]: !settings.metrics[metric]
      }
    });
  };

  const CollapsibleHeader = ({ title, sectionKey }: { title: string, sectionKey: string }) => (
    <div 
      onClick={() => toggleSection(sectionKey)}
      className="bg-gray-50 dark:bg-black px-4 py-3 mt-4 border-y border-gray-100 dark:border-zinc-900 flex items-center justify-between cursor-pointer"
    >
      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{title}</span>
      <motion.div
        animate={{ rotate: collapsed[sectionKey] ? -90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </motion.div>
    </div>
  );

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col"
    >
      <header className="h-14 flex items-center px-4 border-b border-gray-100 dark:border-zinc-900 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em] mr-6">Голосовые уведомления</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-12">
        <CollapsibleHeader title="Основные" sectionKey="basic" />
        <AnimatePresence>
          {!collapsed.basic && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                <SettingItem 
                  title="Включить уведомления" 
                  action={{ type: 'toggle', enabled: settings.enabled, setEnabled: (v) => setSettings({ ...settings, enabled: v }) }} 
                />
                <SettingItem 
                  title="Громкость" 
                  value={`${settings.volume}%`}
                  onClick={() => setShowVolumeSlider(true)}
                />
                <SettingItem 
                  title="Интервал уведомлений" 
                  value={`Каждые ${settings.interval} мин`}
                  onClick={() => setShowIntervalPicker(true)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CollapsibleHeader title="Озвучиваемые показатели" sectionKey="metrics" />
        <AnimatePresence>
          {!collapsed.metrics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                <SettingItem 
                  title="Дистанция" 
                  action={{ type: 'toggle', enabled: settings.metrics.distance, setEnabled: () => toggleMetric('distance') }} 
                />
                <SettingItem 
                  title="Время" 
                  action={{ type: 'toggle', enabled: settings.metrics.time, setEnabled: () => toggleMetric('time') }} 
                />
                <SettingItem 
                  title="Текущая скорость" 
                  action={{ type: 'toggle', enabled: settings.metrics.speed, setEnabled: () => toggleMetric('speed') }} 
                />
                <SettingItem 
                  title="Средняя скорость" 
                  action={{ type: 'toggle', enabled: settings.metrics.avgSpeed, setEnabled: () => toggleMetric('avgSpeed') }} 
                />
                <SettingItem 
                  title="Текущий пульс" 
                  action={{ type: 'toggle', enabled: settings.metrics.heartRate, setEnabled: () => toggleMetric('heartRate') }} 
                />
                <SettingItem 
                  title="Средний пульс" 
                  action={{ type: 'toggle', enabled: settings.metrics.avgHeartRate, setEnabled: () => toggleMetric('avgHeartRate') }} 
                />
                <SettingItem 
                  title="Текущая мощность" 
                  action={{ type: 'toggle', enabled: settings.metrics.power, setEnabled: () => toggleMetric('power') }} 
                />
                <SettingItem 
                  title="Средняя мощность" 
                  action={{ type: 'toggle', enabled: settings.metrics.avgPower, setEnabled: () => toggleMetric('avgPower') }} 
                />
                <SettingItem 
                  title="Каденс" 
                  action={{ type: 'toggle', enabled: settings.metrics.cadence, setEnabled: () => toggleMetric('cadence') }} 
                />
                <SettingItem 
                  title="Калории" 
                  action={{ type: 'toggle', enabled: settings.metrics.calories, setEnabled: () => toggleMetric('calories') }} 
                />
                <SettingItem 
                  title="Набор высоты" 
                  action={{ type: 'toggle', enabled: settings.metrics.elevation, setEnabled: () => toggleMetric('elevation') }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showVolumeSlider && (
          <VolumeSliderModal 
            value={settings.volume} 
            onChange={(v) => setSettings({ ...settings, volume: v })} 
            onClose={() => setShowVolumeSlider(false)} 
          />
        )}
        {showIntervalPicker && (
          <VoiceIntervalPickerModal 
            value={settings.interval}
            onSave={(v) => {
              setSettings({ ...settings, interval: v });
              setShowIntervalPicker(false);
            }}
            onClose={() => setShowIntervalPicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution?: string;
  active: boolean;
}

interface WeatherInfo {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  windSpeed: number;
  windDirection: number;
}

interface AppNotification {
  id: string;
  type: 'message' | 'call' | 'system';
  title: string;
  body: string;
  timestamp: number;
}

interface MetricOptions {
  textColor?: string;
  backgroundColor?: string;
  enableZones?: boolean;
  lineType?: 'monotone' | 'linear' | 'step';
  timeScale?: '30s' | '2m' | '5m' | 'all';
  showAverage?: boolean;
  showPeakPoints?: boolean;
  showGrid?: boolean;
  showAxisValues?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
  mapTheme?: 'light' | 'dark' | 'auto';
  mapLayers?: MapLayer[];
  currentLayerIndex?: number;
}

interface MetricRow {
  id: string;
  size: number;
  columns?: string; // '1', '1-1', '1-2', '2-1', '1-1-1'
  metrics?: string[]; // Array of metric names corresponding to columns
  metricOptions?: (MetricOptions | null)[];
}

interface Screen {
  id: string;
  name: string;
  layout: MetricRow[];
  hidden?: boolean;
}

const DEFAULT_MAP_LAYERS: MapLayer[] = [
  { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', active: true },
  { id: 'google_normal', name: 'Google Map', url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', active: true },
  { id: 'google_sat', name: 'Google Satellite', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', active: true },
  { id: 'google_hybrid', name: 'Google Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', active: true },
  { id: 'esri_sat', name: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', active: true },
  { id: 'carto_light', name: 'Carto Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', active: false },
  { id: 'carto_dark', name: 'Carto Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', active: false },
];

const MapCenterUpdater = React.memo(({ center }: { center: [number, number] }) => {
  const map = useMap();
  const lastCenter = useRef<[number, number]>(center);

  useEffect(() => {
    const latDiff = center[0] - lastCenter.current[0];
    const lngDiff = center[1] - lastCenter.current[1];
    const distSq = latDiff * latDiff + lngDiff * lngDiff;
    
    // Only update map center if moved more than ~5 meters (0.00005 degrees)
    if (distSq > 0.0000000025) {
      map.panTo(center, { animate: true, duration: 1.5 });
      lastCenter.current = center;
    }
  }, [center, map]);
  return null;
});

const MapInteractionHandler = ({ isPanning }: { isPanning: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (isPanning) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      // @ts-ignore - tap exists in some Leaflet versions
      if (map.tap) map.tap.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      // @ts-ignore
      if (map.tap) map.tap.disable();
    }
  }, [isPanning, map]);
  return null;
};

const MapInvalidator = React.memo(() => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
});

const MapManualCenterer = ({ center, trigger }: { center: [number, number], trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [trigger, center, map]);
  return null;
};

const MetricChart = React.memo(({ 
  data, 
  color, 
  isDarkMode,
  zones,
  options,
  markerIndex
}: { 
  data: { value: number }[]; 
  color: string; 
  isDarkMode: boolean; 
  zones?: { min: number; max: number | null; color: string }[];
  options?: MetricOptions | null;
  markerIndex?: number;
}) => {
  const chartId = React.useId().replace(/:/g, '');
  
  // Filter data based on timeScale
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!options?.timeScale || options.timeScale === 'all') return data;
    
    // Assuming data points are roughly every 1 second
    const seconds = options.timeScale === '30s' ? 30 : options.timeScale === '2m' ? 120 : 300;
    return data.slice(-seconds);
  }, [data, options?.timeScale]);

  const avgValue = React.useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((acc, d) => acc + d.value, 0) / filteredData.length;
  }, [filteredData]);

  const peakPoint = React.useMemo(() => {
    if (filteredData.length === 0) return null;
    return filteredData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  }, [filteredData]);

  // Calculate gradient stops if zones are provided
  const renderGradient = () => {
    const fillOpacity = options?.fillOpacity ?? 0.3;
    if (!zones || zones.length === 0 || !filteredData || filteredData.length === 0 || !options?.enableZones) {
      return (
        <linearGradient id={`colorMetric-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={fillOpacity}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      );
    }

    const values = filteredData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    return (
      <linearGradient id={`colorMetric-${chartId}`} x1="0" y1="0" x2="0" y2="1">
        {zones.map((zone, idx) => {
          const zoneMin = zone.min;
          const zoneMax = zone.max === null ? maxVal : zone.max;
          const stopTop = Math.max(0, Math.min(100, 100 - ((zoneMax - minVal) / range) * 100));
          const stopBottom = Math.max(0, Math.min(100, 100 - ((zoneMin - minVal) / range) * 100));
          
          return (
            <React.Fragment key={idx}>
              <stop offset={`${stopTop}%`} stopColor={zone.color} stopOpacity={fillOpacity} />
              <stop offset={`${stopBottom}%`} stopColor={zone.color} stopOpacity={fillOpacity} />
            </React.Fragment>
          );
        })}
      </linearGradient>
    );
  };

  return (
    <div className="w-full h-full min-h-0 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            {renderGradient()}
          </defs>
          {options?.showGrid && (
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
          )}
          {options?.showAxisValues && (
            <YAxis 
              hide={false} 
              domain={['dataMin', 'dataMax']} 
              fontSize={8} 
              stroke={isDarkMode ? '#52525b' : '#a1a1aa'}
              tickFormatter={(val) => Math.round(val).toString()}
              width={25}
            />
          )}
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">
                      {Math.round(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          {options?.showAverage && (
            <ReferenceLine y={avgValue} stroke="#71717a" strokeDasharray="3 3" />
          )}
          {markerIndex !== undefined && markerIndex >= 0 && markerIndex < filteredData.length && (
            <ReferenceDot 
              x={markerIndex} 
              y={filteredData[markerIndex].value} 
              r={5} 
              fill="#ef4444" 
              stroke="white" 
              strokeWidth={2}
              isAnimationActive={false}
            />
          )}
          {options?.showPeakPoints && peakPoint && (
            <ReferenceDot 
              x={filteredData.indexOf(peakPoint)} 
              y={peakPoint.value} 
              r={3} 
              fill={color} 
              stroke="white" 
              strokeWidth={1}
            />
          )}
          <Area 
            type={options?.lineType || 'monotone'} 
            dataKey="value" 
            stroke={zones && zones.length > 0 && options?.enableZones ? 'transparent' : color} 
            strokeWidth={options?.strokeWidth ?? 2}
            fillOpacity={1} 
            fill={`url(#colorMetric-${chartId})`} 
            isAnimationActive={false}
            baseValue="dataMin"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

const MetricCell = React.memo(({ 
  metricName, 
  value, 
  labelFontSize, 
  valueFontSize,
  isMap,
  userLocation,
  isGpsFixed,
  isDarkMode,
  accentColor,
  rowIndex,
  cellIndex,
  flexWeight,
  onPanningChange,
  options,
  activeRoute,
  navigationProgress,
  history,
  hrSettings,
  cadenceSettings,
  speedSettings,
  powerSettings,
  onUpdateOptions,
  setActiveRoute,
  setIsNavigating,
  groupRiders,
  roundedMetrics
}: { 
  metricName: string; 
  value?: string;
  labelFontSize?: string;
  valueFontSize?: string;
  isMap?: boolean;
  userLocation?: [number, number];
  isGpsFixed?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  rowIndex?: number;
  cellIndex?: number;
  flexWeight: number;
  onPanningChange?: (isPanning: boolean) => void;
  options?: MetricOptions | null;
  activeRoute?: Route | null;
  setActiveRoute?: (route: Route | null) => void;
  setIsNavigating?: (val: boolean) => void;
  navigationProgress?: number;
  history?: Record<string, { value: number }[]>;
  hrSettings?: any;
  cadenceSettings?: any;
  speedSettings?: any;
  powerSettings?: any;
  onUpdateOptions?: (options: MetricOptions) => void;
  groupRiders?: { id: string, name: string, pos: [number, number] }[];
  roundedMetrics?: boolean;
}) => {
  const [isPanning, setIsPanning] = useState(false);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const swipeRef = useRef<{ startY: number | null }>({ startY: null });
  const [targetDestination, setTargetDestination] = useState<[number, number] | null>(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (metricName === 'Карта и Навигация') {
          setTargetDestination([e.latlng.lat, e.latlng.lng]);
          setIsPanning(true);
        }
      },
    });
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMap || isPanning) return;
    swipeRef.current.startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMap || isPanning || swipeRef.current.startY === null) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = swipeRef.current.startY - endY;
    swipeRef.current.startY = null;

    if (Math.abs(diffY) > 50) {
      const layers = options?.mapLayers || DEFAULT_MAP_LAYERS;
      const activeLayers = layers.filter(l => l.active);
      if (activeLayers.length <= 1) return;

      let currentIndex = options?.currentLayerIndex || 0;
      if (diffY > 0) {
        currentIndex = (currentIndex + 1) % activeLayers.length;
      } else {
        currentIndex = (currentIndex - 1 + activeLayers.length) % activeLayers.length;
      }

      onUpdateOptions?.({
        ...(options || { mapLayers: DEFAULT_MAP_LAYERS, mapTheme: 'auto' }),
        currentLayerIndex: currentIndex
      });
    }
  };

  useEffect(() => {
    if (isMap && onPanningChange) {
      onPanningChange(isPanning);
    }
  }, [isPanning, isMap, onPanningChange]);

  const splitValue = useMemo(() => {
    if (!value) return { val: '', unit: '' };
    const parts = value.split(' ');
    if (parts.length > 1) {
      return { val: parts[0], unit: parts.slice(1).join(' ') };
    }
    return { val: value, unit: '' };
  }, [value]);

  const getZonesForMetric = (name: string) => {
    if (!options?.enableZones) return undefined;
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('пульса')) {
      const mhr = hrSettings?.maxHR || 190;
      return hrSettings?.zones?.map((z: any) => ({
        min: mhr * z.range[0],
        max: mhr * z.range[1],
        color: z.color
      }));
    }
    if (lowerName.includes('каденса')) {
      const threshold = cadenceSettings?.threshold || 90;
      return cadenceSettings?.zones?.map((z: any) => ({
        min: threshold * z.range[0],
        max: threshold * z.range[1],
        color: z.color
      }));
    }
    if (lowerName.includes('скорости')) {
      const threshold = speedSettings?.threshold || 24;
      return speedSettings?.zones?.map((z: any) => ({
        min: threshold * z.range[0],
        max: threshold * z.range[1],
        color: z.color
      }));
    }
    if (lowerName.includes('мощности')) {
      const ftp = powerSettings?.ftp || 200;
      return powerSettings?.zones?.map((z: any) => ({
        min: ftp * z.minPercent / 100,
        max: z.maxPercent === null ? null : ftp * z.maxPercent / 100,
        color: z.color
      }));
    }
    return undefined;
  };

  if (metricName && metricName.startsWith('График')) {
    const chartData = history?.[metricName] || [];
    const isRouteElevation = metricName === 'График высоты маршрута';
    
    let displayData = chartData;
    if (isRouteElevation && activeRoute?.points) {
      displayData = activeRoute.points.map(p => ({ value: p.ele }));
    }

    const zones = getZonesForMetric(metricName);

    const getChartColor = () => {
      const lowerName = metricName.toLowerCase();
      if (lowerName.includes('скорости')) return '#0077b6';
      if (lowerName.includes('высоты')) return '#166534';
      if (lowerName.includes('пульса')) return '#991b1b';
      if (lowerName.includes('мощности')) return '#5b21b6';
      if (lowerName.includes('каденса')) return '#b45309';
      return accentColor || '#0077b6';
    };

    return (
      <div 
        className="flex flex-col h-full w-full overflow-hidden relative"
        style={{ backgroundColor: options?.backgroundColor || 'transparent' }}
      >
        <div className="flex justify-between items-start z-10 px-2 pt-2">
          <div className="flex flex-col">
            <span 
              className={`${labelFontSize} font-black uppercase tracking-widest truncate`}
              style={{ color: options?.textColor || (isDarkMode ? '#71717a' : '#9ca3af') }}
            >
              {metricName}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 pt-8 pb-0 px-0">
          <MetricChart 
            data={displayData} 
            color={getChartColor()} 
            isDarkMode={isDarkMode || false} 
            zones={zones}
            options={options}
            markerIndex={isRouteElevation ? navigationProgress : undefined}
          />
        </div>
      </div>
    );
  }

  if (metricName === 'Направление (Курс)') {
    const getHeading = () => {
      let bearing = 0;
      if (activeRoute && activeRoute.points.length > 1) {
        const idx = Math.min(navigationProgress, activeRoute.points.length - 2);
        const p1 = activeRoute.points[idx];
        const p2 = activeRoute.points[idx + 1];
        
        const y = Math.sin(p2.lon - p1.lon) * Math.cos(p2.lat);
        const x = Math.cos(p1.lat) * Math.sin(p2.lat) - Math.sin(p1.lat) * Math.cos(p2.lat) * Math.cos(p2.lon - p1.lon);
        bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      }
      
      const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
      const index = Math.round(bearing / 45) % 8;
      return { degrees: Math.round(bearing), label: directions[index] };
    };

    const heading = getHeading();

    return (
      <div 
        className="flex flex-col items-center justify-center p-4 h-full w-full"
        style={{ 
          backgroundColor: options?.backgroundColor || 'transparent'
        }}
      >
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <Compass className="w-full h-full text-gray-200 dark:text-zinc-800" strokeWidth={1} />
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${heading.degrees}deg)` }}
            >
              <MoveUp className="w-8 h-8 text-accent" strokeWidth={3} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white dark:bg-zinc-900 rounded-full border-2 border-accent z-10" />
            </div>
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-3xl font-black text-black dark:text-white tracking-tighter">
              {heading.degrees}°
            </span>
            <span className="text-sm font-bold text-accent uppercase tracking-widest">
              {heading.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (metricName === 'Навигация: Пошаговые указания') {
    const getTurnInfo = () => {
      if (!activeRoute || activeRoute.points.length < 2) {
        return { icon: <Navigation className="w-12 h-12" />, text: 'Нет маршрута', dist: '' };
      }

      const currIdx = Math.floor(activeRoute.points.length * (navigationProgress / activeRoute.points.length)); // This is actually navigationProgress itself
      const actualIdx = Math.min(navigationProgress, activeRoute.points.length - 1);
      
      // Look ahead for the next "turn"
      let nextTurnIdx = -1;
      let lastBearing = -1;
      
      for (let i = actualIdx; i < Math.min(actualIdx + 50, activeRoute.points.length - 1); i++) {
        const p1 = activeRoute.points[i];
        const p2 = activeRoute.points[i+1];
        
        const y = Math.sin(p2.lon - p1.lon) * Math.cos(p2.lat);
        const x = Math.cos(p1.lat) * Math.sin(p2.lat) - Math.sin(p1.lat) * Math.cos(p2.lat) * Math.cos(p2.lon - p1.lon);
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        
        if (lastBearing !== -1) {
          const diff = Math.abs(bearing - lastBearing);
          const normalizedDiff = diff > 180 ? 360 - diff : diff;
          if (normalizedDiff > 25) {
            nextTurnIdx = i;
            break;
          }
        }
        lastBearing = bearing;
      }

      if (nextTurnIdx === -1) {
        return { icon: <ArrowUp className="w-12 h-12" />, text: 'Прямо', dist: 'Конец' };
      }

      const distToTurn = activeRoute.points[nextTurnIdx].dist - activeRoute.points[actualIdx].dist;
      
      // Determine turn direction
      const p1 = activeRoute.points[nextTurnIdx];
      const p2 = activeRoute.points[nextTurnIdx + 1];
      const p0 = activeRoute.points[Math.max(0, nextTurnIdx - 1)];
      
      const b1 = (Math.atan2(p1.lon - p0.lon, p1.lat - p0.lat) * 180 / Math.PI + 360) % 360;
      const b2 = (Math.atan2(p2.lon - p1.lon, p2.lat - p1.lat) * 180 / Math.PI + 360) % 360;
      
      let diff = b2 - b1;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      let icon = <ArrowUp className="w-12 h-12" />;
      let text = 'Прямо';
      
      if (diff > 60) {
        icon = <CornerUpRight className="w-12 h-12 text-accent" />;
        text = 'Направо';
      } else if (diff > 20) {
        icon = <ArrowUpRight className="w-12 h-12 text-accent" />;
        text = 'Правее';
      } else if (diff < -60) {
        icon = <CornerUpLeft className="w-12 h-12 text-accent" />;
        text = 'Налево';
      } else if (diff < -20) {
        icon = <ArrowUpLeft className="w-12 h-12 text-accent" />;
        text = 'Левее';
      }

      return { 
        icon, 
        text, 
        dist: distToTurn < 1 ? `${Math.round(distToTurn * 1000)} м` : `${distToTurn.toFixed(1)} км` 
      };
    };

    const turn = getTurnInfo();

    return (
      <div 
        className="flex flex-col items-center justify-center p-4 h-full w-full"
        style={{ 
          backgroundColor: options?.backgroundColor || 'transparent'
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl shadow-inner">
            {turn.icon}
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-black dark:text-white tracking-tighter">
              {turn.dist}
            </span>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
              {turn.text}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if ((isMap || metricName === 'Карта и Навигация') && userLocation) {
    const layers = options?.mapLayers || DEFAULT_MAP_LAYERS;
    const activeLayers = layers.filter(l => l.active);
    const currentIndex = options?.currentLayerIndex || 0;
    const currentLayer = activeLayers[currentIndex % activeLayers.length] || DEFAULT_MAP_LAYERS[0];
    
    const theme = options?.mapTheme || 'auto';
    const effectiveDarkMode = theme === 'auto' ? isDarkMode : theme === 'dark';
    
    const mapUrl = (currentLayer.id === 'osm' && effectiveDarkMode) 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : currentLayer.url;

    const handleGenerateRoute = () => {
      if (targetDestination && userLocation && setActiveRoute && setIsNavigating) {
        // Generate a simple route
        const points: RoutePoint[] = [];
        const steps = 20;
        const latStep = (targetDestination[0] - userLocation[0]) / steps;
        const lonStep = (targetDestination[1] - userLocation[1]) / steps;
        
        for (let i = 0; i <= steps; i++) {
          const lat = userLocation[0] + latStep * i;
          const lon = userLocation[1] + lonStep * i;
          points.push({
            lat,
            lon,
            ele: 100,
            dist: i * 0.1
          });
        }
        
        const newRoute: Route = {
          id: `dynamic-${Date.now()}`,
          name: `К выбранной точке`,
          distance: steps * 0.1,
          gain: 0,
          loss: 0,
          minEle: 100,
          maxEle: 100,
          points
        };
        
        setActiveRoute(newRoute);
        setIsNavigating(true);
        setTargetDestination(null);
      }
    };

    return (
      <div 
        className="flex-1 relative overflow-hidden h-full w-full"
        style={{ 
          flex: flexWeight,
          backgroundColor: options?.backgroundColor || (effectiveDarkMode ? '#18181b' : '#f3f4f6')
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <MapContainer 
          key={`map-${rowIndex}-${cellIndex}-${currentLayer.id}-${effectiveDarkMode}`}
          center={userLocation} 
          zoom={15} 
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            url={mapUrl}
            attribution=""
          />
          <MapClickHandler />
          <CircleMarker 
            center={userLocation} 
            radius={8} 
            pathOptions={{ fillColor: accentColor, fillOpacity: 1, color: 'white', weight: 2 }} 
          />
          {targetDestination && (
            <CircleMarker 
              center={targetDestination} 
              radius={10} 
              pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: 'white', weight: 3 }} 
            >
              <MapTooltip permanent direction="top" offset={[0, -10]}>
                <span className="text-[10px] font-black uppercase">ЦЕЛЬ</span>
              </MapTooltip>
            </CircleMarker>
          )}
          {activeRoute && activeRoute.points && activeRoute.points.length > 0 && (
            <>
              {/* Outer glow/border */}
              <Polyline 
                positions={activeRoute.points.map(p => [p?.lat || 0, p?.lon || 0] as [number, number])} 
                color={accentColor || '#0077b6'} 
                weight={10} 
                opacity={0.3}
              />
              {/* Inner solid line */}
              <Polyline 
                positions={activeRoute.points.map(p => [p?.lat || 0, p?.lon || 0] as [number, number])} 
                color={accentColor || '#0077b6'} 
                weight={5} 
                opacity={1}
              />
            </>
          )}
          {groupRiders?.map(rider => (
            <CircleMarker 
              key={rider.id}
              center={rider.pos} 
              radius={6} 
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 1, color: 'white', weight: 2 }} 
            >
              <MapTooltip direction="top" offset={[0, -10] as [number, number]} opacity={1} permanent>
                <span className="text-[10px] font-black uppercase tracking-widest">{rider.name}</span>
              </MapTooltip>
            </CircleMarker>
          ))}
          {!isPanning && <MapCenterUpdater center={userLocation} />}
          <MapManualCenterer center={userLocation} trigger={centerTrigger} />
          <MapInteractionHandler isPanning={isPanning} />
          <MapInvalidator />
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end">
          {/* Destination Action */}
          {targetDestination && (
            <motion.button 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleGenerateRoute}
              className="px-4 py-2 bg-green-600 text-white rounded-full flex items-center gap-2 shadow-xl border-2 border-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              <Navigation size={16} />
              МАРШРУТ СЮДА
            </motion.button>
          )}

          {/* GPS Indicator */}
          <div className={`${isGpsFixed ? 'bg-accent-secondary' : 'bg-zinc-800'} text-white px-1.5 py-0.5 rounded flex flex-col items-center min-w-[32px] shadow-md transition-colors`}>
            <span className="text-[8px] font-black leading-none mb-0.5">GPS</span>
            <div className="flex items-end gap-0.5 h-2">
              <div className={`w-1 h-1 ${isGpsFixed ? 'bg-white' : 'bg-white/20'}`} />
              <div className={`w-1 h-1.5 ${isGpsFixed ? 'bg-white' : 'bg-white/20'}`} />
              <div className={`w-1 h-2 ${isGpsFixed ? 'bg-white' : 'bg-white/20'}`} />
            </div>
          </div>

          {/* Hand Toggle */}
          <button 
            onClick={() => {
              setIsPanning(!isPanning);
              if (isPanning) setTargetDestination(null);
            }}
            className={`w-10 h-10 rounded flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              isPanning 
                ? 'bg-accent text-white' 
                : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-800'
            }`}
          >
            <Hand size={20} className={isPanning ? 'fill-white' : ''} />
          </button>

          {/* My Location Button */}
          {isPanning && (
            <button 
              onClick={() => {
                setCenterTrigger(prev => prev + 1);
                setTargetDestination(null);
              }}
              className="w-10 h-10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded flex items-center justify-center shadow-lg border border-gray-100 dark:border-zinc-800 active:scale-95 transition-all"
            >
              <Target size={20} />
            </button>
          )}

          {/* Header for specially named metrics */}
          {metricName === 'Карта и Навигация' && !isPanning && (
            <div className="absolute top-0 right-12 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 whitespace-nowrap">
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Кликните по карте для навигации</span>
            </div>
          )}

          {/* Quick Menu Button (as seen in image) */}
          <button 
            className="w-10 h-10 bg-accent text-white rounded flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center p-2 overflow-hidden h-full w-full"
      style={{ 
        flex: flexWeight,
        backgroundColor: options?.backgroundColor || 'transparent'
      }}
    >
      {metricName ? (
        <>
          <span 
            className={`${labelFontSize} font-black uppercase tracking-widest mb-1 text-center truncate w-full`}
            style={{ color: options?.textColor || (isDarkMode ? '#71717a' : '#9ca3af') }}
          >
            {metricName}
          </span>
          <div className="flex items-baseline gap-1 w-full justify-center items-center">
            <span 
              className={`${valueFontSize} font-black tracking-tighter leading-none`}
              style={{ color: options?.textColor || (isDarkMode ? '#ffffff' : '#000000') }}
            >
              {roundedMetrics ? splitValue.val : value}
            </span>
            {roundedMetrics && splitValue.unit && (
              <span 
                className="text-xs font-bold opacity-60 uppercase"
                style={{ color: options?.textColor || (isDarkMode ? '#71717a' : '#9ca3af') }}
              >
                {splitValue.unit}
              </span>
            )}
          </div>
        </>
      ) : (
        <span className="text-[10px] font-bold text-gray-300 dark:text-zinc-800 uppercase tracking-widest">
          НЕТ ДАННЫХ
        </span>
      )}
    </div>
  );
});

const ScreenView = React.memo(({ 
  screen, 
  userLocation, 
  isGpsFixed,
  isDarkMode, 
  accentColor, 
  getMetricValue,
  onPanningChange,
  activeRoute,
  setActiveRoute,
  setIsNavigating,
  navigationProgress,
  history,
  hrSettings,
  cadenceSettings,
  speedSettings,
  powerSettings,
  onMetricLongPress,
  onUpdateOptions,
  groupRiders,
  roundedMetrics
}: { 
  screen: Screen; 
  userLocation: [number, number];
  isGpsFixed: boolean;
  isDarkMode: boolean;
  accentColor: string;
  getMetricValue: (name: string) => string;
  onPanningChange?: (isPanning: boolean) => void;
  activeRoute?: Route | null;
  setActiveRoute?: (route: Route | null) => void;
  setIsNavigating?: (val: boolean) => void;
  navigationProgress?: number;
  history?: Record<string, { value: number }[]>;
  hrSettings?: any;
  cadenceSettings?: any;
  speedSettings?: any;
  powerSettings?: any;
  onMetricLongPress?: (rowIndex: number, cellIndex: number) => void;
  onUpdateOptions?: (rowIndex: number, cellIndex: number, options: MetricOptions) => void;
  groupRiders?: { id: string, name: string, pos: [number, number] }[];
  roundedMetrics?: boolean;
}) => {
  const totalSize = screen?.layout?.reduce((acc, r) => acc + r.size, 0) || 8;

  return (
    <div className={`h-full flex flex-col ${roundedMetrics ? 'bg-transparent p-1.5 gap-1.5' : 'bg-white dark:bg-black'} overflow-hidden`}>
      {screen?.layout?.map((row, rowIndex) => {
        const layout = row.columns || '1';
        const parts = layout.split('-');
        const metrics = row.metrics || [];
        const effectiveSize = (row.size / totalSize) * 8;

        const valueFontSize = 
          effectiveSize <= 1.5 ? 'text-3xl' : 
          effectiveSize <= 2.5 ? 'text-6xl' : 
          effectiveSize <= 3.5 ? 'text-8xl' : 
          effectiveSize <= 5.5 ? 'text-9xl' : 'text-[12rem]';
        
        const labelFontSize = effectiveSize >= 3 ? 'text-sm' : 'text-[10px]';

        return (
          <div 
            key={row.id} 
            className={`flex ${roundedMetrics ? 'gap-1.5' : 'border-b border-gray-100 dark:border-zinc-900 last:border-b-0 divide-x divide-gray-100 dark:divide-zinc-900'} min-h-0`}
            style={{ flex: row.size }}
          >
            {parts.map((p, cellIndex) => {
              const metricName = metrics[cellIndex];
              const isMap = metricName && metricName.includes('Карта');
              const options = row.metricOptions?.[cellIndex];
              
              return (
                <div 
                  key={`${row.id}-${cellIndex}`}
                  className={`flex-1 min-w-0 relative overflow-hidden active:bg-gray-100 dark:active:bg-black transition-colors ${roundedMetrics ? 'rounded-2xl bg-white dark:bg-black shadow-sm' : ''}`}
                  style={{ flex: parseInt(p) }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onMetricLongPress?.(rowIndex, cellIndex);
                  }}
                >
                  <MetricCell
                    metricName={metricName}
                    value={isMap ? undefined : getMetricValue(metricName)}
                    labelFontSize={labelFontSize}
                    valueFontSize={valueFontSize}
                    isMap={isMap}
                    userLocation={userLocation}
                    isGpsFixed={isGpsFixed}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    rowIndex={rowIndex}
                    cellIndex={cellIndex}
                    flexWeight={parseInt(p)}
                    onPanningChange={onPanningChange}
                    options={options}
                    activeRoute={activeRoute}
                    setActiveRoute={setActiveRoute}
                    setIsNavigating={setIsNavigating}
                    navigationProgress={navigationProgress}
                    history={history}
                    hrSettings={hrSettings}
                    cadenceSettings={cadenceSettings}
                    speedSettings={speedSettings}
                    powerSettings={powerSettings}
                    onUpdateOptions={(newOpts) => onUpdateOptions?.(rowIndex, cellIndex, newOpts)}
                    groupRiders={groupRiders}
                    roundedMetrics={roundedMetrics}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

const SensorsModal = ({ 
  onClose, 
  sensors, 
  setSensors, 
  isScanning, 
  setIsScanning 
}: { 
  onClose: () => void; 
  sensors: SensorDevice[]; 
  setSensors: React.Dispatch<React.SetStateAction<SensorDevice[]>>;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
}) => {
  const handleToggleSensor = (id: string) => {
    setSensors(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' } 
        : s
    ));
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Add a mock new sensor
      const newSensor: SensorDevice = {
        id: Math.random().toString(),
        name: 'Stages Power L',
        type: 'power',
        status: 'disconnected',
        battery: 100,
        protocol: 'BLE'
      };
      setSensors(prev => [...prev, newSensor]);
    }, 2000);
  };

  const getSensorIcon = (type: SensorDevice['type']) => {
    switch (type) {
      case 'hr': return <Heart size={18} className="text-red-500" />;
      case 'cadence': return <Activity size={18} className="text-orange-500" />;
      case 'power': return <Zap size={18} className="text-purple-500" />;
      case 'speed': return <Gauge size={18} className="text-blue-500" />;
      case 'radar': return <Navigation size={18} className="text-green-500" />;
      default: return <Cpu size={18} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col font-sans"
    >
      <header className="h-14 flex items-center px-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900 sticky top-0 z-50">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Датчики</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
        {/* Connected Sensors */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Подключенные устройства</h2>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">
              {sensors.filter(s => s.status === 'connected').length} АКТИВНО
            </span>
          </div>
          <div className="space-y-2">
            {sensors.map(sensor => (
              <div 
                key={sensor.id}
                className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  {getSensorIcon(sensor.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">{sensor.name}</h3>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 text-gray-500 rounded uppercase">
                      {sensor.protocol}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Battery size={10} className={sensor.battery && sensor.battery < 20 ? 'text-red-500' : 'text-gray-400'} />
                      <span className="text-[10px] font-bold text-gray-400">{sensor.battery}%</span>
                    </div>
                    {sensor.status === 'connected' && sensor.value !== undefined && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-accent">{sensor.value} {sensor.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleSensor(sensor.id)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    sensor.status === 'connected' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                      : 'bg-accent text-white shadow-lg'
                  }`}
                >
                  {sensor.status === 'connected' ? 'ОТКЛЮЧИТЬ' : 'ПОДКЛЮЧИТЬ'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Scanning Section */}
        <section className="pt-4">
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className={`w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
              isScanning 
                ? 'border-accent bg-accent/5' 
                : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:border-accent hover:text-accent'
            }`}
          >
            {isScanning ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={24} className="text-accent" />
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Поиск устройств...</span>
              </>
            ) : (
              <>
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Добавить новый датчик</span>
              </>
            )}
          </button>
        </section>

        {/* Info Section */}
        <section className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex gap-3">
            <Info size={18} className="text-blue-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">Поддержка протоколов</h4>
              <p className="text-[10px] text-blue-800 dark:text-blue-300/70 leading-relaxed">
                Ваше устройство поддерживает Bluetooth Low Energy (BLE) и ANT+. Убедитесь, что датчики включены и находятся в режиме сопряжения.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <button 
          onClick={onClose}
          className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] rounded-xl active:scale-95 transition-all"
        >
          Готово
        </button>
      </div>
    </motion.div>
  );
};

const RideSummaryModal = ({ 
  ride, 
  onSave, 
  onResume, 
  onDiscard 
}: { 
  ride: Ride; 
  onSave: (updatedRide: Ride) => void; 
  onResume: () => void; 
  onDiscard: () => void; 
}) => {
  const [name, setName] = useState(ride.name);
  const [notes, setNotes] = useState('');
  const [exertion, setExertion] = useState(5);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleAddPhoto = () => {
    // Mock photo adding
    const mockPhotos = [
      'https://picsum.photos/seed/ride1/400/300',
      'https://picsum.photos/seed/ride2/400/300',
      'https://picsum.photos/seed/ride3/400/300'
    ];
    const newPhoto = mockPhotos[photos.length % mockPhotos.length];
    setPhotos([...photos, newPhoto]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col font-sans overflow-y-auto"
    >
      <header className="h-14 flex items-center px-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900 sticky top-0 z-50">
        <div className="flex-1">
          <h1 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{ride.date}</h1>
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
            <Clock size={10} />
            <span>{ride.startTime}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowDiscardConfirm(true)}
          className="flex items-center gap-1 text-red-600 font-black uppercase tracking-tighter text-xs"
        >
          <Trash2 size={14} />
          <span>Удалить</span>
        </button>
      </header>

      <div className="flex-1 p-6 space-y-8 pb-32">
        {/* Summary Metrics */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Итоги</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Время в движении</span>
              <div className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                {Math.floor(ride.movingTime / 60).toString().padStart(2, '0')}:{(ride.movingTime % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Расстояние</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{ride.distance.toFixed(2)}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase">КМ</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Средний темп</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{ride.avgPace}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase">М/КМ</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Ср. ЧСС</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{ride.avgHr}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase">УД/МИН</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Ср. каденс</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{ride.avgCadence}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase">ОБ/МИН</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Заметки о поездке</h2>
          <div className="space-y-3">
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Назовите вашу поездку"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none focus:border-accent transition-colors"
            />
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Как прошла поездка? Добавьте детали."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </section>

        {/* Perceived Exertion */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ощущаемая нагрузка</h2>
          <div className="px-2">
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="1"
              value={exertion}
              onChange={(e) => setExertion(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between mt-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <div key={val} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-gray-900 dark:text-white">{val}</span>
                  <div 
                    className={`w-2 h-2 rounded-sm ${
                      val === 0 ? 'bg-gray-400' :
                      val <= 2 ? 'bg-blue-400' :
                      val <= 4 ? 'bg-cyan-500' :
                      val <= 6 ? 'bg-green-500' :
                      val <= 8 ? 'bg-yellow-500' :
                      'bg-red-600'
                    } ${exertion === val ? 'ring-2 ring-offset-2 ring-accent dark:ring-offset-black' : 'opacity-40'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photos Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Фотографии</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button 
              onClick={handleAddPhoto}
              className="w-24 h-24 shrink-0 bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-accent hover:border-accent transition-all"
            >
              <Camera size={24} />
              <span className="text-[8px] font-black uppercase tracking-widest">Добавить фото</span>
            </button>
            {photos.map((photo, i) => (
              <div key={i} className="w-24 h-24 shrink-0 relative rounded-xl overflow-hidden group">
                <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Sync Section */}
        <section className="pt-4 flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Синхронизация с:</span>
          <div className="flex gap-2">
            {['Strava', 'Intervals.icu', 'MyBikeTraffic'].map(service => (
              <div key={service} className="px-3 py-1 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest">
                {service}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 h-20 flex border-t border-gray-100 dark:border-zinc-900 z-[60]">
        <button 
          onClick={onResume}
          className="flex-1 bg-green-600 flex items-center justify-center text-white font-black uppercase tracking-[0.2em] text-sm active:brightness-90 transition-all"
        >
          Продолжить
        </button>
        <button 
          onClick={() => onSave({
            ...ride,
            name,
            notes,
            perceivedExertion: exertion,
            photos
          })}
          className="flex-1 bg-red-600 flex items-center justify-center text-white font-black uppercase tracking-[0.2em] text-sm active:brightness-90 transition-all"
        >
          Сохранить
        </button>
      </div>

      <AnimatePresence>
        {showDiscardConfirm && (
          <DeleteConfirmModal 
            title="эту поездку"
            onConfirm={onDiscard}
            onCancel={() => setShowDiscardConfirm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const [showVoiceAnnouncementsMenu, setShowVoiceAnnouncementsMenu] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(() => {
    const saved = localStorage.getItem('bike_computer_voice_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      volume: 80,
      interval: 5, // minutes
      metrics: {
        distance: true,
        speed: true,
        avgSpeed: false,
        heartRate: true,
        avgHeartRate: false,
        power: true,
        avgPower: false,
        cadence: true,
        calories: false,
        elevation: false,
        time: true
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('bike_computer_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const [activeTab, setActiveTab] = useState('computer');
  const [activeMetricCell, setActiveMetricCell] = useState<{ rowIndex: number, cellIndex: number } | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [keepScreenOn, setKeepScreenOn] = useState(true);
  const [autoPause, setAutoPause] = useState(() => {
    return localStorage.getItem('bike_computer_auto_pause') === 'true';
  });
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('bike_computer_dark_mode') === 'true';
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('bike_computer_accent_color') || '#0077b6';
  });
  const [roundedMetrics, setRoundedMetrics] = useState(() => {
    return localStorage.getItem('bike_computer_rounded_metrics') === 'true';
  });
  const [metricsBackgroundColor, setMetricsBackgroundColor] = useState(() => {
    return localStorage.getItem('bike_computer_metrics_bg_color') || '#0077b6';
  });
  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem('bike_computer_rides');
    return saved ? JSON.parse(saved) : MOCK_RIDES;
  });

  useEffect(() => {
    localStorage.setItem('bike_computer_auto_pause', autoPause.toString());
  }, [autoPause]);

  useEffect(() => {
    localStorage.setItem('bike_computer_rides', JSON.stringify(rides));
  }, [rides]);

  const [selectedRideForAction, setSelectedRideForAction] = useState<Ride | null>(null);
  const [isRenamingRide, setIsRenamingRide] = useState(false);
  const [rideNewName, setRideNewName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const generateTestRide = () => {
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newRide: Ride = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Тестовая поездка ${rides.length + 1}`,
      date: dateStr,
      time: timeStr,
      type: Math.random() > 0.5 ? 'cycling' : 'running',
      distance: 5 + Math.random() * 30,
      movingTime: 1800 + Math.random() * 7200,
      elapsedTime: 2000 + Math.random() * 8000,
      pausedTime: 200,
      startTime: timeStr,
      endTime: '12:00',
      avgSpeed: 15 + Math.random() * 15,
      maxSpeed: 30 + Math.random() * 20,
      avgPace: '05:30',
      maxPace: '04:10',
      ascent: Math.round(Math.random() * 500),
      descent: -Math.round(Math.random() * 500),
      elevChange: 0,
      avgElevation: 100,
      maxElevation: 200,
      minElevation: 50,
      maxGrade: 10,
      minGrade: -10,
      avgGrade: 2,
      avgVam: 0.5,
      minVam: -500,
      maxVam: 800,
      avgHr: 130 + Math.random() * 30,
      maxHr: 170 + Math.random() * 20,
      minHr: 60,
      avgHrPercent: 70,
      maxHrPercent: 90,
      minHrPercent: 40,
      hrZones: MOCK_RIDES[0].hrZones,
      normalizedPower: 180 + Math.random() * 100,
      avgPower: 150 + Math.random() * 80,
      maxPower: 500 + Math.random() * 400,
      avgFtpPercent: 80,
      maxFtpPercent: 200,
      avgPedalBalance: '50/50',
      notes: Math.random() > 0.5 ? 'Отличная поездка по парку! Погода была супер.' : undefined,
      perceivedExertion: Math.floor(Math.random() * 11),
      photos: Math.random() > 0.5 ? ['https://picsum.photos/seed/ride_test/400/300'] : [],
      powerZones: MOCK_RIDES[0].powerZones,
      avgCadence: 80 + Math.random() * 20,
      maxCadence: 110,
      avgTemp: 20,
      minTemp: 15,
      maxTemp: 25,
      avgWindSpeed: 5,
      minWindSpeed: 0,
      maxWindSpeed: 15,
      windDirection: 'N',
      estCalories: 400 + Math.random() * 800,
      points: (() => {
        const startLat = 55.7558 + (Math.random() - 0.5) * 0.05;
        const startLon = 37.6173 + (Math.random() - 0.5) * 0.05;
        const pts: [number, number][] = [[startLat, startLon]];
        let currentLat = startLat;
        let currentLon = startLon;
        for (let i = 0; i < 40; i++) {
          currentLat += (Math.random() - 0.5) * 0.004;
          currentLon += (Math.random() - 0.5) * 0.004;
          pts.push([currentLat, currentLon]);
        }
        return pts;
      })(),
      speedData: Array.from({ length: 30 }, (_, i) => ({ dist: i, value: 15 + Math.random() * 15 })),
      elevationData: Array.from({ length: 30 }, (_, i) => ({ dist: i, value: 100 + Math.random() * 50 })),
      hrData: Array.from({ length: 30 }, (_, i) => ({ dist: i, value: 120 + Math.random() * 40 })),
      powerData: Array.from({ length: 30 }, (_, i) => ({ dist: i, value: 100 + Math.random() * 300 })),
      cadenceData: Array.from({ length: 30 }, (_, i) => ({ dist: i, value: 70 + Math.random() * 30 })),
    };

    setRides(prev => [newRide, ...prev]);
  };

  const handleRenameRide = () => {
    if (selectedRideForAction && rideNewName.trim()) {
      setRides(prev => prev.map(r => 
        r.id === selectedRideForAction.id ? { ...r, name: rideNewName } : r
      ));
      if (selectedRide && selectedRide.id === selectedRideForAction.id) {
        setSelectedRide({ ...selectedRide, name: rideNewName });
      }
      setIsRenamingRide(false);
      setSelectedRideForAction(null);
    }
  };

  const handleDeleteRide = () => {
    if (selectedRideForAction) {
      setRides(prev => prev.filter(r => r.id !== selectedRideForAction.id));
      if (selectedRide && selectedRide.id === selectedRideForAction.id) {
        setSelectedRide(null);
      }
      setSelectedRideForAction(null);
    }
  };

  const handleShareRide = () => {
    if (selectedRideForAction) {
      if (navigator.share) {
        navigator.share({
          title: selectedRideForAction.name,
          text: `Моя поездка: ${selectedRideForAction.distance} км за ${Math.floor(selectedRideForAction.movingTime / 60)} мин`,
          url: window.location.href
        }).catch(console.error);
      }
      setSelectedRideForAction(null);
    }
  };

  const [secondaryColor, setSecondaryColor] = useState(() => {
    return localStorage.getItem('bike_computer_secondary_color') || '#B30000';
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMetricsBgColorPicker, setShowMetricsBgColorPicker] = useState(false);
  const [showAutoDimMenu, setShowAutoDimMenu] = useState(false);
  const [showLayoutsMenu, setShowLayoutsMenu] = useState(false);
  const [showRoutesMenu, setShowRoutesMenu] = useState(false);
  const [showDataFormatsMenu, setShowDataFormatsMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showRideSummary, setShowRideSummary] = useState(false);
  const [currentRideSummary, setCurrentRideSummary] = useState<Ride | null>(null);

  const [showSensorsMenu, setShowSensorsMenu] = useState(false);
  const [sensors, setSensors] = useState<SensorDevice[]>([
    { id: '1', name: 'Polar H10', type: 'hr', status: 'connected', battery: 85, value: 145, unit: 'BPM', protocol: 'BLE' },
    { id: '2', name: 'Garmin Speed', type: 'speed', status: 'connected', battery: 92, value: 32.4, unit: 'KM/H', protocol: 'ANT+' },
    { id: '3', name: 'Wahoo Cadence', type: 'cadence', status: 'disconnected', battery: 45, protocol: 'BLE' },
    { id: '4', name: 'Assioma Duo', type: 'power', status: 'connected', battery: 78, value: 245, unit: 'W', protocol: 'ANT+' },
    { id: '5', name: 'Varia RTL515', type: 'radar', status: 'connected', battery: 60, protocol: 'BLE' },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthYear: string) => {
    setCollapsedMonths(prev => ({ ...prev, [monthYear]: !prev[monthYear] }));
  };

  const getStatsForPeriod = (period: 'week' | 'month' | 'year' | 'all') => {
    const now = new Date();
    const filteredRides = rides.filter(ride => {
      // Parse ride date "Четверг, 21 сен, 2023" or "Fri 11/18/2022"
      let rideDate: Date;
      const dateParts = ride.date.split(', ');
      if (dateParts.length === 3) {
        const day = dateParts[1].split(' ')[0];
        const monthAbbr = dateParts[1].split(' ')[1].toLowerCase();
        const monthMap: { [key: string]: number } = {
          'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
          'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
        };
        const month = monthMap[monthAbbr] || 0;
        const year = parseInt(dateParts[2]);
        rideDate = new Date(year, month, parseInt(day));
      } else {
        const parts = ride.date.split(' ');
        const dateStr = parts.length > 1 ? parts[1] : parts[0];
        rideDate = new Date(dateStr);
      }

      if (isNaN(rideDate.getTime())) return false;

      if (period === 'all') return true;
      if (period === 'year') return rideDate.getFullYear() === now.getFullYear();
      if (period === 'month') return rideDate.getMonth() === now.getMonth() && rideDate.getFullYear() === now.getFullYear();
      if (period === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return rideDate >= startOfWeek;
      }
      return false;
    });

    return filteredRides.reduce((acc, ride) => ({
      dist: acc.dist + ride.distance,
      time: acc.time + ride.movingTime
    }), { dist: 0, time: 0 });
  };
  const [showHeartRateZonesMenu, setShowHeartRateZonesMenu] = useState(false);
  const [showCadenceZonesMenu, setShowCadenceZonesMenu] = useState(false);
  const [showSpeedZonesMenu, setShowSpeedZonesMenu] = useState(false);
  const [showPowerZonesMenu, setShowPowerZonesMenu] = useState(false);
  const [birthDate, setBirthDate] = useState<string | null>(() => {
    return localStorage.getItem('bike_computer_birthdate');
  });
  const [weight, setWeight] = useState<number | null>(() => {
    const saved = localStorage.getItem('bike_computer_weight');
    return saved ? parseFloat(saved) : null;
  });
  const [portraitScreens, setPortraitScreens] = useState<Screen[]>(() => {
    const saved = localStorage.getItem('bike_computer_portrait_screens');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any, i: number) => ({
        ...s,
        id: s.id || `p-${i}-${Date.now()}`
      }));
    }
    return [
      { id: 'p1', name: 'Велоспорт', layout: [
        { id: '1', size: 4, columns: '1-1', metrics: ['Скорость: Текущая', 'Пульс: Текущий'] }, 
        { id: '2', size: 4, columns: '1-1', metrics: ['Дистанция: Общая', 'Время: Всего'] }
      ] },
      { id: 'p2', name: 'Карта', layout: [{ id: '1', size: 8, columns: '1', metrics: ['Карта'] }] },
      { id: 'p3', name: 'Навигация', layout: [{ id: '1', size: 8, columns: '1', metrics: ['Навигация: Пошаговые указания'] }] },
      { id: 'p4', name: 'Бег', layout: [
        { id: '1', size: 4, columns: '1-1', metrics: ['Скорость: Текущая', 'Пульс: Текущий'] }, 
        { id: '2', size: 4, columns: '1-1', metrics: ['Дистанция: Общая', 'Время: Всего'] }
      ] },
      { id: 'p5', name: 'Подъемы', layout: [{ id: '1', size: 8, columns: '1', metrics: ['График высоты маршрута'] }] }
    ];
  });
  const [landscapeScreens, setLandscapeScreens] = useState<Screen[]>(() => {
    const saved = localStorage.getItem('bike_computer_landscape_screens');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any, i: number) => ({
        ...s,
        id: s.id || `l-${i}-${Date.now()}`
      }));
    }
    return [
      { id: 'l1', name: 'Велоспорт', layout: [
        { id: '1', size: 4, columns: '1-1', metrics: ['Скорость: Текущая', 'Пульс: Текущий'] }, 
        { id: '2', size: 4, columns: '1-1', metrics: ['Дистанция: Общая', 'Время: Всего'] }
      ] },
      { id: 'l2', name: 'Карта', layout: [{ id: '1', size: 8, columns: '1', metrics: ['Карта'] }] },
      { id: 'l3', name: 'Навигация', layout: [{ id: '1', size: 8, columns: '1', metrics: ['Навигация: Пошаговые указания'] }] },
      { id: 'l4', name: 'Бег', layout: [
        { id: '1', size: 4, columns: '1-1', metrics: ['Скорость: Текущая', 'Пульс: Текущий'] }, 
        { id: '2', size: 4, columns: '1-1', metrics: ['Дистанция: Общая', 'Время: Всего'] }
      ] },
      { id: 'l5', name: 'Подъемы', layout: [{ id: '1', size: 8, columns: '1', metrics: ['График высоты маршрута'] }] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('bike_computer_portrait_screens', JSON.stringify(portraitScreens));
  }, [portraitScreens]);

  useEffect(() => {
    localStorage.setItem('bike_computer_landscape_screens', JSON.stringify(landscapeScreens));
  }, [landscapeScreens]);
  const [autoDimEnabled, setAutoDimEnabled] = useState(false);
  const [autoDimLevel, setAutoDimLevel] = useState(50);
  const [autoDimTimeout, setAutoDimTimeout] = useState('30 секунд');

  // New Features State
  const [weather, setWeather] = useState<WeatherInfo>({
    temp: 24,
    condition: 'sunny',
    windSpeed: 8,
    windDirection: 120
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [di2Battery, setDi2Battery] = useState(92);
  const [gears, setGears] = useState({ front: 2, rear: 8 });
  const [lightStatus, setLightStatus] = useState<'off' | 'on' | 'auto'>('auto');
  const [isLiveTrackActive, setIsLiveTrackActive] = useState(false);
  const [groupRiders, setGroupRiders] = useState<{ id: string, name: string, pos: [number, number] }[]>([]);
  const [showClimbPro, setShowClimbPro] = useState(false);
  const [upcomingClimb, setUpcomingClimb] = useState<{ name: string, dist: number, gain: number, grade: number } | null>(null);

  const [hrSettings, setHrSettings] = useState<{ maxHR: number | null, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }>(() => {
    const saved = localStorage.getItem('bike_computer_hr_settings');
    if (saved) return JSON.parse(saved);
    return { 
      maxHR: null, 
      isManual: false,
      zones: [
        { name: 'Разминка', color: '#9ca3af', range: [0, 0.6] },
        { name: 'Сжигание жира', color: '#0077b6', range: [0.6, 0.7] },
        { name: 'Аэробная', color: '#166534', range: [0.7, 0.8] },
        { name: 'Анаэробная', color: '#b45309', range: [0.8, 0.9] },
        { name: 'VO2 Max', color: '#991b1b', range: [0.9, 1.0] },
      ]
    };
  });
  const [cadenceSettings, setCadenceSettings] = useState<{ threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }>(() => {
    const saved = localStorage.getItem('bike_computer_cadence_settings');
    if (saved) return JSON.parse(saved);
    return { 
      threshold: 90, 
      isManual: false,
      zones: [
        { name: 'Очень низкий', color: '#9ca3af', range: [0, 0.7] },
        { name: 'Низкий', color: '#0077b6', range: [0.7, 0.9] },
        { name: 'Умеренный', color: '#166534', range: [0.9, 1.05] },
        { name: 'Высокий', color: '#b45309', range: [1.05, 1.2] },
        { name: 'Очень высокий', color: '#991b1b', range: [1.2, 1.5] },
      ]
    };
  });
  const [speedSettings, setSpeedSettings] = useState<{ threshold: number, isManual: boolean, zones: { name: string, color: string, range: [number, number] }[] }>(() => {
    const saved = localStorage.getItem('bike_computer_speed_settings');
    if (saved) return JSON.parse(saved);
    return { 
      threshold: 24, 
      isManual: false,
      zones: [
        { name: 'Восстановление', color: '#9ca3af', range: [0, 0.6] },
        { name: 'Выносливость', color: '#0077b6', range: [0.6, 0.75] },
        { name: 'Равномерный', color: '#166534', range: [0.75, 0.9] },
        { name: 'Темп', color: '#b45309', range: [0.9, 1.05] },
        { name: 'Интервал', color: '#991b1b', range: [1.05, 1.3] },
      ]
    };
  });
  const [powerSettings, setPowerSettings] = useState<{ ftp: number, zones: PowerZone[] }>(() => {
    const saved = localStorage.getItem('bike_computer_power_settings');
    if (saved) return JSON.parse(saved);
    return {
      ftp: 200,
      zones: [
        { id: 1, name: 'Активное восстановление', minPercent: 0, maxPercent: 55, color: '#9ca3af' },
        { id: 2, name: 'Выносливость', minPercent: 55, maxPercent: 75, color: '#0077b6' },
        { id: 3, name: 'Темп', minPercent: 75, maxPercent: 90, color: '#166534' },
        { id: 4, name: 'Порог лактата', minPercent: 90, maxPercent: 105, color: '#eab308' },
        { id: 5, name: 'МПК', minPercent: 105, maxPercent: 120, color: '#b45309' },
        { id: 6, name: 'Анаэробная мощность', minPercent: 120, maxPercent: 150, color: '#991b1b' },
        { id: 7, name: 'Нейромышечная мощность', minPercent: 150, maxPercent: null, color: '#5b21b6' },
      ]
    };
  });
  const [dataFormats, setDataFormats] = useState<DataFormats>(() => {
    try {
      const saved = localStorage.getItem('bike_computer_formats');
      return saved ? JSON.parse(saved) : {
        distance: 'KILOMETERS',
        elevation: 'METERS',
        weight: 'KILOGRAMS',
        temperature: 'C',
        date: 'DD/MM/YY',
        time: '24HR',
        pressure: 'PSI'
      };
    } catch (e) {
      return {
        distance: 'KILOMETERS',
        elevation: 'METERS',
        weight: 'KILOGRAMS',
        temperature: 'C',
        date: 'DD/MM/YY',
        time: '24HR',
        pressure: 'PSI'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('bike_computer_formats', JSON.stringify(dataFormats));
  }, [dataFormats]);

  useEffect(() => {
    if (birthDate) {
      localStorage.setItem('bike_computer_birthdate', birthDate);
    }
  }, [birthDate]);

  useEffect(() => {
    if (weight !== null) {
      localStorage.setItem('bike_computer_weight', weight.toString());
    }
  }, [weight]);

  useEffect(() => {
    localStorage.setItem('bike_computer_hr_settings', JSON.stringify(hrSettings));
  }, [hrSettings]);

  useEffect(() => {
    localStorage.setItem('bike_computer_cadence_settings', JSON.stringify(cadenceSettings));
  }, [cadenceSettings]);

  useEffect(() => {
    localStorage.setItem('bike_computer_speed_settings', JSON.stringify(speedSettings));
  }, [speedSettings]);

  useEffect(() => {
    localStorage.setItem('bike_computer_power_settings', JSON.stringify(powerSettings));
  }, [powerSettings]);

  const [routes, setRoutes] = useState<Route[]>(() => {
    try {
      const saved = localStorage.getItem('bike_computer_routes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any, i: number) => ({
          ...r,
          id: r.id || `r-${i}-${Date.now()}`
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to load routes", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bike_computer_routes', JSON.stringify(routes));
  }, [routes]);

  // Apply dark mode and accent color
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-secondary-color', secondaryColor);
    
    localStorage.setItem('bike_computer_dark_mode', isDarkMode.toString());
    localStorage.setItem('bike_computer_accent_color', accentColor);
    localStorage.setItem('bike_computer_secondary_color', secondaryColor);
    localStorage.setItem('bike_computer_rounded_metrics', roundedMetrics.toString());
    localStorage.setItem('bike_computer_metrics_bg_color', metricsBackgroundColor);
  }, [isDarkMode, accentColor, secondaryColor, roundedMetrics, metricsBackgroundColor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadRideFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.toLowerCase().endsWith('.tcx')) {
          const parser = new DOMParser();
          const xml = parser.parseFromString(content, "text/xml");
          const trackpoints = xml.querySelectorAll('Trackpoint');
          
          if (trackpoints.length > 0) {
            const points: [number, number][] = [];
            const elevationData: { dist: number, value: number }[] = [];
            const hrData: { dist: number, value: number }[] = [];
            const cadenceData: { dist: number, value: number }[] = [];

            let totalDist = 0;
            let maxHr = 0;
            let sumHr = 0;
            let hrCount = 0;
            let maxEle = -Infinity;
            let minEle = Infinity;
            let ascent = 0;
            let lastEle: number | null = null;
            
            const firstTime = trackpoints[0].querySelector('Time')?.textContent;
            const lastTime = trackpoints[trackpoints.length - 1].querySelector('Time')?.textContent;
            const startTime = firstTime ? new Date(firstTime) : new Date();
            const endTime = lastTime ? new Date(lastTime) : new Date();
            const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;

            trackpoints.forEach((tp) => {
              const latStr = tp.querySelector('LatitudeDegrees')?.textContent;
              const lonStr = tp.querySelector('LongitudeDegrees')?.textContent;
              const eleStr = tp.querySelector('AltitudeMeters')?.textContent;
              const distStr = tp.querySelector('DistanceMeters')?.textContent;
              const hrStr = tp.querySelector('HeartRateBpm Value')?.textContent;
              const cadStr = tp.querySelector('Cadence')?.textContent;
              
              const lat = parseFloat(latStr || '0');
              const lon = parseFloat(lonStr || '0');
              const ele = parseFloat(eleStr || '0');
              const dist = parseFloat(distStr || '0') / 1000; 
              const hr = parseFloat(hrStr || '0'); 
              const cadence = parseFloat(cadStr || '0');
              
              if (lat !== 0 && lon !== 0) {
                points.push([lat, lon]);
              }

              if (dist > 0) totalDist = dist;

              elevationData.push({ dist, value: ele });
              if (ele > maxEle) maxEle = ele;
              if (ele < minEle) minEle = ele;
              if (lastEle !== null && ele > lastEle) ascent += (ele - lastEle);
              lastEle = ele;

              if (hr > 0) {
                hrData.push({ dist, value: hr });
                if (hr > maxHr) maxHr = hr;
                sumHr += hr;
                hrCount++;
              }
              if (cadence > 0) cadenceData.push({ dist, value: cadence });
            });

            const avgSpeed = elapsedTime > 0 ? (totalDist / (elapsedTime / 3600)) : 0;
            const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
            
            const uploadedRide: Ride = {
              id: Math.random().toString(36).substr(2, 9),
              name: file.name.replace('.tcx', ''),
              date: `${days[startTime.getDay()]}, ${startTime.getDate()} ${months[startTime.getMonth()]}, ${startTime.getFullYear()}`,
              time: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
              type: 'cycling',
              distance: totalDist,
              movingTime: elapsedTime,
              elapsedTime: elapsedTime,
              pausedTime: 0,
              startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
              endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
              avgSpeed,
              maxSpeed: avgSpeed * 1.3,
              avgPace: '00:00',
              maxPace: '00:00',
              ascent: Math.round(ascent),
              descent: -Math.round(ascent),
              elevChange: 0,
              avgElevation: Math.round((maxEle + minEle) / 2),
              maxElevation: Math.round(maxEle),
              minElevation: Math.round(minEle),
              maxGrade: 0,
              minGrade: 0,
              avgGrade: 0,
              avgVam: 0,
              minVam: 0,
              maxVam: 0,
              avgHr: hrCount > 0 ? Math.round(sumHr / hrCount) : 0,
              maxHr,
              minHr: 60,
              avgHrPercent: 0,
              maxHrPercent: 0,
              minHrPercent: 0,
              hrZones: [],
              normalizedPower: 0,
              avgPower: 0,
              maxPower: 0,
              avgFtpPercent: 0,
              maxFtpPercent: 0,
              avgPedalBalance: '-',
              powerZones: [],
              avgCadence: 0,
              maxCadence: 0,
              avgTemp: 20,
              minTemp: 20,
              maxTemp: 20,
              avgWindSpeed: 0,
              minWindSpeed: 0,
              maxWindSpeed: 0,
              windDirection: 'N',
              estCalories: 0,
              points,
              elevationData,
              hrData,
              speedData: [],
              cadenceData,
              powerData: []
            };
            setRides(prev => [uploadedRide, ...prev]);
          }
        } else {
          const rideData = JSON.parse(content);
          if (rideData && rideData.points && Array.isArray(rideData.points)) {
            const uploadedRide: Ride = {
              ...rideData,
              id: rideData.id || Math.random().toString(36).substr(2, 9),
              date: rideData.date || new Date().toLocaleDateString(),
              name: rideData.name || `Импортированная поездка ${rides.length + 1}`
            };
            setRides(prev => [uploadedRide, ...prev]);
          }
        }
      } catch (err) {
        console.error('Error parsing ride file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('bike_computer_dev_mode') === 'true';
  });

  const [isFakeGpsEnabled, setIsFakeGpsEnabled] = useState(() => {
    return localStorage.getItem('bike_computer_fake_gps') === 'true';
  });

  const [isSimulatingStop, setIsSimulatingStop] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRainLockActive, setIsRainLockActive] = useState(false);
  const [showRainIcon, setShowRainIcon] = useState(false);
  const [rainLockHoldProgress, setRainLockHoldProgress] = useState(0);
  const [rainLockCountdown, setRainLockCountdown] = useState<number | null>(null);
  const [isRainIconPressed, setIsRainIconPressed] = useState(false);
  const [unlockSliderX, setUnlockSliderX] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const rainLockTimer = useRef<any>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [pauseHoldProgress, setPauseHoldProgress] = useState(0);
  const [startHoldProgress, setStartHoldProgress] = useState(0);

  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem('bike_computer_dev_mode', isDeveloperMode.toString());
  }, [isDeveloperMode]);

  useEffect(() => {
    localStorage.setItem('bike_computer_fake_gps', isFakeGpsEnabled.toString());
  }, [isFakeGpsEnabled]);

  const [userLocation, setUserLocation] = useState<[number, number]>([55.7558, 37.6173]);

  useEffect(() => {
    // Simulate a notification after 10 seconds
    const timer = setTimeout(() => {
      const newNotif: AppNotification = {
        id: Date.now().toString(),
        type: 'message',
        title: 'Алексей',
        body: 'Где ты? Мы уже на вершине!',
        timestamp: Date.now()
      };
      setActiveNotification(newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setActiveNotification(null), 5000);
    }, 10000);

    // Simulate weather updates
    const weatherTimer = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() > 0.5 ? 0.1 : -0.1),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() > 0.5 ? 0.5 : -0.5))
      }));
    }, 30000);

    // Simulate other riders if live track is active
    if (isLiveTrackActive) {
      setGroupRiders([
        { id: 'r1', name: 'Иван', pos: [userLocation[0] + 0.001, userLocation[1] + 0.001] },
        { id: 'r2', name: 'Мария', pos: [userLocation[0] - 0.001, userLocation[1] + 0.002] }
      ]);
    } else {
      setGroupRiders([]);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(weatherTimer);
    };
  }, [isLiveTrackActive, userLocation]);

  useEffect(() => {
    if (isNavigating && activeRoute) {
      // Simulate climb detection after 15 seconds of navigation
      const timer = setTimeout(() => {
        setUpcomingClimb({
          name: 'Перевал Дятлова',
          dist: 2.4,
          gain: 185,
          grade: 8.5
        });
        setShowClimbPro(true);
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      setShowClimbPro(false);
      setUpcomingClimb(null);
    }
  }, [isNavigating, activeRoute]);
  const [isGpsFixed, setIsGpsFixed] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation || (isDeveloperMode && isNavigating)) {
      if (!navigator.geolocation) console.error('Geolocation is not supported');
      return;
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setIsGpsFixed(true);
        
        setUserLocation(prev => {
          const latDiff = newLat - prev[0];
          const lngDiff = newLng - prev[1];
          const distSq = latDiff * latDiff + lngDiff * lngDiff;
          
          // Only update state if moved more than ~2 meters (0.00002 degrees)
          if (distSq > 0.0000000004) {
            return [newLat, newLng];
          }
          return prev;
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGpsFixed(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const [sensorData, setSensorData] = useState({
    heartRate: 0,
    cadence: 0,
    speed: 0,
    power: 0,
    elevation: 0,
    distance: 0,
    calories: 0,
    time: 0,
    battery: 100,
    temperature: 22,
    slope: 0,
    vam: 0,
  });

  const [history, setHistory] = useState<Record<string, { value: number }[]>>({
    'График пульса': [],
    'График каденса': [],
    'График скорости': [],
    'График мощности': [],
    'График высоты': [],
  });

  useEffect(() => {
    let interval: any;
    if (isDeveloperMode) {
      interval = setInterval(() => {
        const simulatedActualSpeed = isSimulatingStop ? 0 : 25 + Math.random() * 10;

        if (autoPause && isRecording) {
          if (!isPaused && simulatedActualSpeed < 3) {
            setIsPaused(true);
            setIsAutoPaused(true);
            const newNotif: AppNotification = {
              id: Date.now().toString(),
              type: 'system',
              title: 'АВТОПАУЗА',
              body: 'Запись приостановлена',
              timestamp: Date.now()
            };
            setActiveNotification(newNotif);
            setNotifications(prev => [newNotif, ...prev]);
            setTimeout(() => setActiveNotification(null), 3000);
          } else if (isPaused && isAutoPaused && simulatedActualSpeed > 3) {
            setIsPaused(false);
            setIsAutoPaused(false);
            const newNotif: AppNotification = {
              id: Date.now().toString(),
              type: 'system',
              title: 'ЗАПИСЬ',
              body: 'Запись возобновлена',
              timestamp: Date.now()
            };
            setActiveNotification(newNotif);
            setNotifications(prev => [newNotif, ...prev]);
            setTimeout(() => setActiveNotification(null), 3000);
          }
        }

        setSensorData(prev => {
          const isSimulatingProgress = isFakeGpsEnabled && isRecording && !isPaused;
          
          const nextData = {
            heartRate: 120 + Math.floor(Math.random() * 40),
            cadence: 80 + Math.floor(Math.random() * 20),
            speed: isRecording && isPaused ? 0 : simulatedActualSpeed,
            power: 180 + Math.floor(Math.random() * 100),
            elevation: prev.elevation + (isSimulatingProgress ? (Math.random() > 0.5 ? 1 : -0.5) : 0),
            distance: prev.distance + (isSimulatingProgress ? 0.01 : 0),
            calories: prev.calories + (isSimulatingProgress ? 0.1 : 0),
            time: prev.time + (isSimulatingProgress ? 1 : 0),
            battery: Math.max(0, prev.battery - 0.01),
            temperature: 22 + Math.sin(Date.now() / 10000) * 2,
            slope: isSimulatingProgress ? Math.sin(Date.now() / 5000) * 5 : 0,
            vam: isSimulatingProgress ? 600 + Math.floor(Math.random() * 400) : 0,
          };

          if (isSimulatingProgress && isNavigating && activeRoute && activeRoute.points.length > 0) {
            setNavigationProgress(curr => {
              const nextIdx = (curr + 1) % activeRoute.points.length;
              const point = activeRoute.points[nextIdx];
              setUserLocation([point.lat, point.lon]);
              setIsGpsFixed(true);
              return nextIdx;
            });
          }

          setHistory(prev => {
            const update = (key: string, val: number) => {
              const curr = prev[key] || [];
              const next = [...curr, { value: val }].slice(-30);
              return next;
            };

            const newHistory = { ...prev };
            const metricsToUpdate = [
              { base: 'График пульса', val: nextData.heartRate },
              { base: 'График каденса', val: nextData.cadence },
              { base: 'График скорости', val: nextData.speed },
              { base: 'График мощности', val: nextData.power },
              { base: 'График высоты', val: nextData.elevation },
            ];

            metricsToUpdate.forEach(({ base, val }) => {
              newHistory[base] = update(base, val);
              newHistory[`${base}: Круг`] = update(`${base}: Круг`, val);
            });

            return newHistory;
          });

          return nextData;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDeveloperMode, isNavigating, activeRoute, isFakeGpsEnabled, isRecording, isPaused, autoPause, isAutoPaused, isSimulatingStop]);

  const getMetricValue = React.useCallback((metricName: string) => {
    if (!isDeveloperMode && !isRecording) return '0.0';
    
    switch (metricName) {
      case 'Пульс: Текущий': return sensorData.heartRate.toString();
      case 'Пульс: Средний': return (sensorData.heartRate - 5).toString();
      case 'Пульс: Максимальный': return (sensorData.heartRate + 15).toString();
      case 'Каденс: Текущий': return sensorData.cadence.toString();
      case 'Каденс: Средний': return (sensorData.cadence - 2).toString();
      case 'Каденс: Максимальный': return (sensorData.cadence + 10).toString();
      case 'Скорость: Текущая': return sensorData.speed.toFixed(1);
      case 'Скорость: Средняя': return (sensorData.speed - 1.5).toFixed(1);
      case 'Скорость: Максимальная': return (sensorData.speed + 12.4).toFixed(1);
      case 'Мощность: Текущая': return sensorData.power.toString();
      case 'Мощность: Средняя': return (sensorData.power - 15).toString();
      case 'Мощность: Максимальная': return (sensorData.power + 240).toString();
      case 'Высота: Текущая': return Math.round(sensorData.elevation).toString();
      case 'Подъем: Общий': return Math.max(0, Math.round(sensorData.elevation)).toString();
      case 'Спуск: Общий': return '12';
      case 'Дистанция: Общая': return sensorData.distance.toFixed(2);
      case 'Навигация: Дистанция до финиша': {
        if (!activeRoute) return '0.0';
        const totalDist = activeRoute.distance;
        const coveredDist = activeRoute.points[navigationProgress]?.dist || 0;
        return Math.max(0, totalDist - coveredDist).toFixed(2);
      }
      case 'Навигация: Время прибытия (ETA)': {
        if (!activeRoute) return '--:--';
        const distLeft = activeRoute.distance - (activeRoute.points[navigationProgress]?.dist || 0);
        const speed = sensorData.speed > 5 ? sensorData.speed : 20; 
        const timeHours = distLeft / speed;
        const eta = new Date(Date.now() + timeHours * 3600000);
        return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      case 'Калории: Всего': return Math.floor(sensorData.calories).toString();
      case 'Время: Всего': {
        const mins = Math.floor(sensorData.time / 60);
        const secs = sensorData.time % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      case 'Время суток': {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      case 'Время до заката/рассвета': {
        const now = new Date();
        const times = SunCalc.getTimes(now, userLocation[0], userLocation[1]);
        
        let targetTime: Date;
        let prefix = '';
        
        if (now < times.sunrise) {
          targetTime = times.sunrise;
          prefix = '↑'; // Sunrise
        } else if (now < times.sunset) {
          targetTime = times.sunset;
          prefix = '↓'; // Sunset
        } else {
          // After sunset, look for tomorrow's sunrise
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowTimes = SunCalc.getTimes(tomorrow, userLocation[0], userLocation[1]);
          targetTime = tomorrowTimes.sunrise;
          prefix = '↑';
        }
        
        const diffMs = targetTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        if (hours > 0) {
          return `${prefix}${hours}ч ${mins}м`;
        }
        return `${prefix}${mins}м`;
      }
      case 'Погода: Температура': return sensorData.temperature.toFixed(1);
      case 'Уклон: Текущий': return sensorData.slope.toFixed(1) + '%';
      case 'VAM (Вертикальная скорость): Текущая': return sensorData.vam.toString();
      case 'Устройство: Уровень заряда батареи': return Math.round(sensorData.battery) + '%';
      case 'Зона пульса: Текущая': return Math.floor(sensorData.heartRate / 40).toString();
      case 'Зона мощности: Текущая': return Math.floor(sensorData.power / 60).toString();
      case 'Передача: Текущая': return '2-8';
      case 'Давление в шинах: Текущее': return '2.4';
      case 'Номер круга': return '1';
      default: return '0.0';
    }
  }, [sensorData, userLocation, isDeveloperMode, isRecording]);


  const activePortraitScreens = React.useMemo(() => portraitScreens.filter(s => !s.hidden), [portraitScreens]);

  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [isMapPanning, setIsMapPanning] = useState(false);
  const [showScreenOverlay, setShowScreenOverlay] = useState(false);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentScreenIndex >= activePortraitScreens.length && activePortraitScreens.length > 0) {
      setCurrentScreenIndex(0);
    }
  }, [activePortraitScreens.length, currentScreenIndex]);

  useEffect(() => {
    setShowScreenOverlay(true);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      setShowScreenOverlay(false);
    }, 2000);
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [currentScreenIndex]);

  const handleNextScreen = () => {
    if (activePortraitScreens.length === 0) return;
    setCurrentScreenIndex((prev) => (prev + 1) % activePortraitScreens.length);
  };

  const handlePrevScreen = () => {
    if (activePortraitScreens.length === 0) return;
    setCurrentScreenIndex((prev) => (prev - 1 + activePortraitScreens.length) % activePortraitScreens.length);
  };

  const handleSelectMetricFromScreen = (metric: string, options?: MetricOptions) => {
    if (!activeMetricCell) return;
    const { rowIndex, cellIndex } = activeMetricCell;
    
    const updatedScreens = [...portraitScreens];
    const currentScreen = activePortraitScreens[currentScreenIndex];
    const screenIndex = portraitScreens.findIndex(s => s.id === currentScreen.id);
    if (screenIndex === -1) return;
    
    const screen = { ...updatedScreens[screenIndex] };
    const layout = [...screen.layout];
    const row = { ...layout[rowIndex] };
    const metrics = [...(row.metrics || [])];
    const metricOptions = [...(row.metricOptions || [])];
    
    metrics[cellIndex] = metric;
    metricOptions[cellIndex] = options || null;
    
    row.metrics = metrics;
    row.metricOptions = metricOptions;
    layout[rowIndex] = row;
    screen.layout = layout;
    updatedScreens[screenIndex] = screen;
    
    setPortraitScreens(updatedScreens);
    setActiveMetricCell(null);
  };

  const formatRideDate = (dateStr: string) => {
    // Input: "Четверг, 21 сен, 2023" -> "Чт 21/09/2023"
    const parts = dateStr.split(', ');
    if (parts.length === 3) {
      const dayOfWeekMap: { [key: string]: string } = {
        'Понедельник': 'Пн', 'Вторник': 'Вт', 'Среда': 'Ср', 'Четверг': 'Чт',
        'Пятница': 'Пт', 'Суббота': 'Сб', 'Воскресенье': 'Вс'
      };
      const dayOfWeek = dayOfWeekMap[parts[0]] || parts[0].substring(0, 2);
      
      const dayMonth = parts[1].split(' ');
      const day = dayMonth[0].padStart(2, '0');
      const monthAbbr = dayMonth[1].toLowerCase();
      const monthMap: { [key: string]: string } = {
        'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04', 'май': '05', 'июн': '06',
        'июл': '07', 'авг': '08', 'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12'
      };
      const month = monthMap[monthAbbr] || '01';
      const year = parts[2];
      return `${dayOfWeek} ${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const groupedRides = useMemo(() => {
    const groups: { [key: string]: Ride[] } = {};
    const monthMap: { [key: string]: string } = {
      'янв': 'ЯНВАРЬ', 'фев': 'ФЕВРАЛЬ', 'мар': 'МАРТ', 'апр': 'АПРЕЛЬ',
      'май': 'МАЙ', 'июн': 'ИЮНЬ', 'июл': 'ИЮЛЬ', 'авг': 'АВГУСТ',
      'сен': 'СЕНТЯБРЬ', 'окт': 'ОКТЯБРЬ', 'ноя': 'НОЯБРЬ', 'дек': 'ДЕКАБРЬ'
    };

    rides.forEach(ride => {
      let monthYear = '';
      const dateParts = ride.date.split(', ');
      
      if (dateParts.length === 3) {
        // "Четверг, 21 сен, 2023"
        const monthAbbr = dateParts[1].split(' ')[1].toLowerCase();
        const monthName = monthMap[monthAbbr] || monthAbbr.toUpperCase();
        const yearPart = dateParts[2];
        monthYear = `${monthName} ${yearPart}`;
      } else {
        // Try parsing as standard date "Fri 11/18/2022"
        const parts = ride.date.split(' ');
        const dateStr = parts.length > 1 ? parts[1] : parts[0];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
          const year = date.getFullYear();
          monthYear = `${month} ${year}`;
        } else {
          monthYear = "ПРОЧЕЕ";
        }
      }
      
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(ride);
    });
    return groups;
  }, [rides]);

  const getMonthlyTotals = (monthRides: Ride[]) => {
    const totals = {
      cycling: { dist: 0, time: 0 },
      running: { dist: 0, time: 0 }
    };
    monthRides.forEach(r => {
      if (r.type === 'cycling') {
        totals.cycling.dist += r.distance;
        totals.cycling.time += r.movingTime;
      } else {
        totals.running.dist += r.distance;
        totals.running.time += r.movingTime;
      }
    });
    return totals;
  };

  const pauseHoldTimer = useRef<any>(null);
  const startHoldTimer = useRef<any>(null);

  const startStartHold = () => {
    if (startHoldTimer.current) clearInterval(startHoldTimer.current);
    let progress = 0;
    startHoldTimer.current = setInterval(() => {
      progress += 4;
      setStartHoldProgress(Math.min(100, progress));
      if (progress >= 100) {
        clearInterval(startHoldTimer.current);
        handleStartRecording();
        setStartHoldProgress(0);
      }
    }, 50);
  };

  const endStartHold = () => {
    if (startHoldTimer.current) {
      clearInterval(startHoldTimer.current);
      setStartHoldProgress(0);
    }
  };

  const startRainLockHold = () => {
    if (rainLockTimer.current) clearInterval(rainLockTimer.current);
    let progress = 0;
    setRainLockCountdown(3);
    rainLockTimer.current = setInterval(() => {
      progress += 1.67; // ~3 seconds total (50ms * 60 steps)
      setRainLockHoldProgress(Math.min(100, progress));
      
      const remaining = Math.ceil(3 - (progress / 100) * 3);
      setRainLockCountdown(remaining > 0 ? remaining : null);

      if (progress >= 100) {
        clearInterval(rainLockTimer.current);
        setIsRainLockActive(true);
        setRainLockHoldProgress(0);
        setRainLockCountdown(null);
        
        // Notification
        const newNotif: AppNotification = {
          id: Date.now().toString(),
          type: 'system',
          title: 'RAIN LOCK',
          body: 'Экран заблокирован',
          timestamp: Date.now()
        };
        setActiveNotification(newNotif);
        setNotifications(prev => [newNotif, ...prev]);
        setTimeout(() => setActiveNotification(null), 3000);
      }
    }, 50);
  };

  const endRainLockHold = () => {
    if (rainLockTimer.current) {
      clearInterval(rainLockTimer.current);
      setRainLockHoldProgress(0);
      setRainLockCountdown(null);
    }
  };

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsRainLockActive(false);
      setIsUnlocking(false);
      setUnlockSliderX(0);
      
      const newNotif: AppNotification = {
        id: Date.now().toString(),
        type: 'system',
        title: 'UNLOCKED',
        body: 'Экран разблокирован',
        timestamp: Date.now()
      };
      setActiveNotification(newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      setTimeout(() => setActiveNotification(null), 3000);
    }, 1000);
  };

  const startPauseHold = () => {
    if (pauseHoldTimer.current) clearInterval(pauseHoldTimer.current);
    let progress = 0;
    pauseHoldTimer.current = setInterval(() => {
      progress += 4;
      setPauseHoldProgress(Math.min(100, progress));
      if (progress >= 100) {
        clearInterval(pauseHoldTimer.current);
        setIsPaused(true);
        setIsAutoPaused(false);
        setPauseHoldProgress(0);
      }
    }, 50);
  };
  const endPauseHold = () => {
    if (pauseHoldTimer.current) {
      clearInterval(pauseHoldTimer.current);
      setPauseHoldProgress(0);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSensorData({
      heartRate: 0,
      cadence: 0,
      speed: 0,
      power: 0,
      elevation: 0,
      distance: 0,
      calories: 0,
      time: 0,
      battery: 100,
      temperature: 22,
      slope: 0,
      vam: 0,
    });
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
    setIsAutoPaused(false);
  };

  const handleFinishRecording = () => {
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newRide: Ride = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Поездка ${rides.length + 1}`,
      date: dateStr,
      time: timeStr,
      type: 'cycling',
      distance: sensorData.distance,
      movingTime: sensorData.time,
      elapsedTime: sensorData.time + 300, // mock
      pausedTime: 300, // mock
      startTime: timeStr,
      endTime: timeStr,
      avgSpeed: sensorData.distance / (sensorData.time / 3600) || 0,
      maxSpeed: sensorData.speed + 10,
      avgPace: '00:00',
      maxPace: '00:00',
      ascent: Math.round(sensorData.elevation),
      descent: 0,
      elevChange: 0,
      avgElevation: 100,
      maxElevation: 200,
      minElevation: 50,
      maxGrade: 10,
      minGrade: -10,
      avgGrade: 2,
      avgVam: 0.5,
      minVam: -500,
      maxVam: 800,
      avgHr: 140,
      maxHr: 180,
      minHr: 60,
      avgHrPercent: 75,
      maxHrPercent: 95,
      minHrPercent: 40,
      hrZones: [
        { zone: 1, percent: 10, time: '05:00', color: '#9ca3af' },
        { zone: 2, percent: 30, time: '15:00', color: '#3b82f6' },
        { zone: 3, percent: 40, time: '20:00', color: '#10b981' },
        { zone: 4, percent: 15, time: '07:30', color: '#f59e0b' },
        { zone: 5, percent: 5, time: '02:30', color: '#ef4444' }
      ],
      normalizedPower: 215,
      avgPower: 200,
      maxPower: 450,
      avgFtpPercent: 80,
      maxFtpPercent: 150,
      avgPedalBalance: '50/50',
      powerZones: [
        { zone: 1, percent: 10, time: '05:00', color: '#9ca3af' },
        { zone: 2, percent: 30, time: '15:00', color: '#3b82f6' },
        { zone: 3, percent: 40, time: '20:00', color: '#10b981' },
        { zone: 4, percent: 15, time: '07:30', color: '#f59e0b' },
        { zone: 5, percent: 5, time: '02:30', color: '#ef4444' }
      ],
      avgCadence: 85,
      maxCadence: 110,
      avgTemp: 22,
      minTemp: 20,
      maxTemp: 25,
      avgWindSpeed: 5,
      minWindSpeed: 2,
      maxWindSpeed: 10,
      windDirection: 'СВ',
      estCalories: Math.floor(sensorData.calories),
      calories: Math.floor(sensorData.calories),
      intensity: 75,
      trainingLoad: 45,
      recoveryTime: 12,
      aerobicEffect: 3.5,
      anaerobicEffect: 1.2,
      points: [],
      speedData: [],
      elevationData: [],
      hrData: [],
      powerData: [],
      cadenceData: [],
      laps: []
    };

    setCurrentRideSummary(newRide);
    setShowRideSummary(true);
  };

  const handleSaveRideSummary = (updatedRide: Ride) => {
    setRides([updatedRide, ...rides]);
    setIsRecording(false);
    setIsPaused(false);
    setIsAutoPaused(false);
    setShowRideSummary(false);
    setCurrentRideSummary(null);
    setActiveTab('history');
  };

  const handleLap = () => {
    // Reset lap metrics
    console.log('Lap triggered');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        const weekStats = getStatsForPeriod('week');
        const monthStats = getStatsForPeriod('month');
        const yearStats = getStatsForPeriod('year');
        const allStats = getStatsForPeriod('all');

        return (
          <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-black overflow-y-auto font-sans">
            <header className="h-14 flex items-center px-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900 sticky top-0 z-50">
              <div className="w-10" />
              <h1 className="flex-1 text-center text-xl font-bold text-gray-900 dark:text-white tracking-tight">История</h1>
              <div className="w-10 flex justify-end">
                <button className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full shadow-lg active:scale-95 transition-transform">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>
            </header>

            {/* Summary Header */}
            <div className="grid grid-cols-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900">
              {[
                { label: 'Неделя', stats: weekStats },
                { label: 'Месяц', stats: monthStats },
                { label: 'Год', stats: yearStats },
                { label: 'Всего', stats: allStats }
              ].map((item, idx) => (
                <div key={item.label} className={`p-3 flex flex-col gap-1 ${idx < 3 ? 'border-r border-gray-50 dark:border-zinc-900' : ''}`}>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</span>
                  <div className="mt-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter block">Ч:МИН</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                      {formatDuration(item.stats.time)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter block">КМ</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                      {item.stats.dist.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Page Indicators (Visual only) */}
            <div className="flex justify-center gap-1 py-2 bg-white dark:bg-zinc-950">
              <div className="w-4 h-1 rounded-full bg-gray-200 dark:bg-zinc-800" />
              <div className="w-4 h-1 rounded-full bg-black dark:bg-white" />
              <div className="w-4 h-1 rounded-full bg-gray-200 dark:bg-zinc-800" />
            </div>

            <div className="pb-24">
              {Object.entries(groupedRides).map(([monthYear, ridesInMonth]) => {
                const monthRides = ridesInMonth as Ride[];
                const totals = getMonthlyTotals(monthRides);
                const isCollapsed = collapsedMonths[monthYear];

                return (
                  <div key={monthYear} className="mt-4">
                    <button 
                      onClick={() => toggleMonth(monthYear)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-white dark:bg-zinc-950 border-y border-gray-100 dark:border-zinc-900 active:bg-gray-50 dark:active:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                          {monthYear}
                        </h3>
                        {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 dark:text-white">{totals.cycling.dist.toFixed(2)}</span>
                            <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">{formatDuration(totals.cycling.time)}</span>
                          </div>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">КМ Ч:МИН</span>
                        </div>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="bg-white dark:bg-zinc-950 divide-y divide-gray-50 dark:divide-zinc-900">
                        {monthRides.map((ride) => (
                          <motion.button
                            key={ride.id}
                            onClick={() => setSelectedRide(ride)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setSelectedRideForAction(ride);
                              setRideNewName(ride.name);
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 flex gap-4 text-left relative"
                          >
                            {/* Map Thumbnail */}
                            <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-hidden relative shrink-0 border border-gray-100 dark:border-zinc-800 shadow-sm">
                              <div className="absolute inset-0 pointer-events-none">
                                {ride.points && ride.points.length > 0 && (
                                  <MapContainer 
                                    center={ride.points[0]} 
                                    zoom={13} 
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    dragging={false}
                                    touchZoom={false}
                                    scrollWheelZoom={false}
                                    doubleClickZoom={false}
                                    boxZoom={false}
                                    keyboard={false}
                                    attributionControl={false}
                                  >
                                    <TileLayer url={isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                                    <Polyline positions={ride.points} color="#0077b6" weight={3} />
                                    <MapBounds points={ride.points} />
                                  </MapContainer>
                                )}
                              </div>
                              <div className="absolute top-1 left-1 bg-accent p-0.5 rounded-sm shadow-sm z-[1000]">
                                {ride.type === 'cycling' ? <Bike size={10} className="text-white" /> : <Activity size={10} className="text-white" />}
                              </div>
                            </div>

                            {/* Ride Info */}
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                    {formatRideDate(ride.date)}
                                  </h4>
                                  <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                                    {ride.name}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end shrink-0 ml-2">
                                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{ride.startTime}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-4 mt-auto">
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">ВРЕМЯ</span>
                                  <span className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">
                                    {formatDuration(ride.movingTime)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">ДИСТАНЦИЯ</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">{ride.distance.toFixed(1)}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">КМ</span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{ride.type === 'cycling' ? 'СКОРОСТЬ' : 'ТЕМП'}</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">{ride.type === 'cycling' ? ride.avgSpeed.toFixed(1) : ride.avgPace}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{ride.type === 'cycling' ? 'КМ/Ч' : 'МИН/КМ'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">НАБОР</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">{ride.ascent}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">М</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'computer':
        if (activePortraitScreens.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-500 bg-white dark:bg-black p-8 text-center">
              <h2 className="text-lg font-bold mb-2 uppercase tracking-[0.2em]">Нет активных экранов</h2>
              <p className="text-xs">Все экраны скрыты. Пожалуйста, включите хотя бы один экран в настройках макетов.</p>
              <button 
                onClick={() => setShowLayoutsMenu(true)}
                className="mt-4 px-6 py-2 bg-accent text-white text-xs font-bold rounded-full uppercase tracking-widest"
              >
                Настроить макеты
              </button>
            </div>
          );
        }
        return (
          <div 
            className="h-full flex flex-col relative overflow-hidden"
            style={{ backgroundColor: roundedMetrics ? metricsBackgroundColor : undefined }}
          >
            {/* Main Screen Area with Swipe */}
            <div className="flex-1 relative">
              {/* Weather Overlay */}
              {/* Removed overlays as requested */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreenIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                  drag={isMapPanning ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) handleNextScreen();
                    else if (info.offset.x > 50) handlePrevScreen();
                  }}
                >
                  <ScreenView 
                    screen={activePortraitScreens[currentScreenIndex]} 
                    userLocation={userLocation}
                    isGpsFixed={isGpsFixed}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    roundedMetrics={roundedMetrics}
                    getMetricValue={getMetricValue}
                    onPanningChange={setIsMapPanning}
                    activeRoute={activeRoute}
                    setActiveRoute={setActiveRoute}
                    setIsNavigating={setIsNavigating}
                    navigationProgress={navigationProgress}
                    history={history}
                    hrSettings={hrSettings}
                    cadenceSettings={cadenceSettings}
                    speedSettings={speedSettings}
                    powerSettings={powerSettings}
                    onMetricLongPress={(rowIndex, cellIndex) => setActiveMetricCell({ rowIndex, cellIndex })}
                    onUpdateOptions={(rowIndex, cellIndex, options) => {
                      const targetScreen = activePortraitScreens[currentScreenIndex];
                      if (!targetScreen) return;
                      
                      setPortraitScreens(prev => {
                        return prev.map(s => {
                          if (s.id === targetScreen.id) {
                            const updatedLayout = [...s.layout];
                            const row = { ...updatedLayout[rowIndex] };
                            const newOptions = [...(row.metricOptions || [])];
                            newOptions[cellIndex] = options;
                            row.metricOptions = newOptions;
                            updatedLayout[rowIndex] = row;
                            return { ...s, layout: updatedLayout };
                          }
                          return s;
                        });
                      });
                    }}
                    groupRiders={groupRiders}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {activeMetricCell !== null && (
                  <MetricPickerModal 
                    onClose={() => setActiveMetricCell(null)}
                    onSelect={handleSelectMetricFromScreen}
                    initialMetric={activePortraitScreens[currentScreenIndex].layout[activeMetricCell.rowIndex].metrics?.[activeMetricCell.cellIndex]}
                    initialOptions={activePortraitScreens[currentScreenIndex].layout[activeMetricCell.rowIndex].metricOptions?.[activeMetricCell.cellIndex]}
                  />
                )}
              </AnimatePresence>

              {/* Temporary Screen Overlay */}
              <AnimatePresence>
                {showScreenOverlay && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-[90%]"
                  >
                    <div className="bg-accent text-white rounded-lg shadow-2xl overflow-hidden flex items-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePrevScreen(); }}
                        className="p-4 hover:bg-black/10 active:bg-black/20 transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex-1 py-3 text-center">
                        <div className="text-sm font-black uppercase tracking-widest">
                          {activePortraitScreens[currentScreenIndex].name || 'ЭКРАН ПОЕЗДКИ'}
                        </div>
                        <div className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                          Экран {currentScreenIndex + 1} из {activePortraitScreens.length}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleNextScreen(); }}
                        className="p-4 hover:bg-black/10 active:bg-black/20 transition-colors"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Screen Indicator */}
            <div className="h-1 flex gap-1 px-8 py-3 bg-white dark:bg-black">
              {activePortraitScreens.map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    i === currentScreenIndex ? 'bg-accent scale-y-125' : 'bg-gray-100 dark:bg-zinc-900'
                  }`}
                />
              ))}
            </div>

            {/* Bottom Control Menu or Recording Controls */}
            {isRecording ? (
              <div className="flex bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 h-20 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isRainLockActive ? (
                    <motion.div 
                      key="rain-lock"
                      initial={{ y: 80 }}
                      animate={{ y: 0 }}
                      exit={{ y: 80 }}
                      className="absolute inset-0 bg-accent flex items-center px-4 z-50"
                    >
                      <div 
                        ref={sliderContainerRef}
                        className="relative w-full h-14 bg-black/20 rounded-full flex items-center p-1"
                      >
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: sliderContainerRef.current ? sliderContainerRef.current.offsetWidth - 56 : 280 }}
                          dragElastic={0.1}
                          dragMomentum={false}
                          onDrag={(e, info) => {
                            const containerWidth = sliderContainerRef.current?.offsetWidth || 300;
                            const threshold = containerWidth - 100;
                            if (info.offset.x > threshold && !isUnlocking) {
                              handleUnlock();
                            }
                          }}
                          onDragEnd={() => {
                            if (!isUnlocking) setUnlockSliderX(0);
                          }}
                          animate={{ x: isUnlocking ? (sliderContainerRef.current?.offsetWidth || 300) - 56 : 0 }}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-10 cursor-grab active:cursor-grabbing"
                        >
                          {isUnlocking ? (
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full" 
                            />
                          ) : (
                            <RainLockIcon size={24} className="text-accent" />
                          )}
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white font-black uppercase tracking-widest text-[10px]">
                            {isUnlocking ? 'РАЗБЛОКИРОВКА...' : 'СЛАЙД ДЛЯ РАЗБЛОКИРОВКИ'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : isPaused ? (
                    <motion.div 
                      key="paused-controls"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full h-full"
                    >
                      <button 
                        onClick={handleResumeRecording}
                        className="flex-1 bg-green-600 flex items-center justify-center text-white active:brightness-90 transition-all font-black uppercase tracking-widest"
                      >
                        ПРОДОЛЖИТЬ
                      </button>
                      <button 
                        onClick={handleFinishRecording}
                        className="flex-1 bg-accent flex items-center justify-center text-white active:brightness-90 transition-all font-black uppercase tracking-widest"
                      >
                        СТОП
                      </button>
                      <button 
                        className="w-20 bg-zinc-800 flex items-center justify-center text-white active:brightness-90 transition-all"
                      >
                        <Settings size={24} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="recording-controls"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full h-full"
                    >
                      <button 
                        onClick={handleLap}
                        className="flex-1 bg-zinc-800 flex items-center justify-center text-white active:brightness-90 transition-all font-black uppercase tracking-widest"
                      >
                        КРУГ
                      </button>
                      <div className="flex-[2] relative">
                        <button 
                          onPointerDown={startPauseHold}
                          onPointerUp={endPauseHold}
                          onPointerLeave={endPauseHold}
                          onClick={() => setShowRainIcon(!showRainIcon)}
                          className={`w-full h-full flex flex-col items-center justify-center active:brightness-90 transition-all relative overflow-hidden ${
                            rainLockCountdown !== null 
                              ? 'bg-[#76C4E9] text-[#003B5C]' 
                              : 'bg-accent text-white'
                          }`}
                        >
                          {pauseHoldProgress > 0 && (
                            <>
                              <div 
                                className="absolute top-0 left-0 w-full bg-white/20 transition-all duration-100" 
                                style={{ height: `${pauseHoldProgress / 2}%` }}
                              />
                              <div 
                                className="absolute bottom-0 left-0 w-full bg-white/20 transition-all duration-100" 
                                style={{ height: `${pauseHoldProgress / 2}%` }}
                              />
                            </>
                          )}
                          {rainLockHoldProgress > 0 && (
                            <>
                              <div 
                                className="absolute top-0 left-0 w-full bg-[#003B5C]/20 transition-all duration-100" 
                                style={{ height: `${rainLockHoldProgress / 2}%` }}
                              />
                              <div 
                                className="absolute bottom-0 left-0 w-full bg-[#003B5C]/20 transition-all duration-100" 
                                style={{ height: `${rainLockHoldProgress / 2}%` }}
                              />
                            </>
                          )}
                          <div className={`w-full flex items-center justify-center transition-all duration-300 ${rainLockCountdown !== null ? 'pr-14' : ''}`}>
                            <span className="text-xl font-black tracking-tighter uppercase block truncate px-2">
                              {rainLockCountdown !== null ? `БЛОКИРОВКА ${rainLockCountdown}` : 'ПАУЗА'}
                            </span>
                          </div>
                        </button>
                        
                        {/* Rain Icon Button */}
                        <AnimatePresence>
                          {showRainIcon && (
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onPointerDown={(e) => { e.stopPropagation(); startRainLockHold(); }}
                              onPointerUp={(e) => { e.stopPropagation(); endRainLockHold(); }}
                              onPointerLeave={(e) => { e.stopPropagation(); endRainLockHold(); }}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all z-20 shadow-xl border-2 ${
                                rainLockCountdown !== null 
                                  ? 'bg-white text-[#003B5C] border-white scale-110' 
                                  : 'bg-white/10 text-white border-white/20 backdrop-blur-md'
                              }`}
                            >
                              <div className="relative">
                                <RainLockIcon size={24} className={rainLockCountdown !== null ? 'text-accent' : 'text-white'} />
                                {rainLockCountdown !== null && (
                                  <motion.div 
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="absolute inset-0 bg-white/20 rounded-full -z-10 blur-md"
                                  />
                                )}
                              </div>
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 h-20">
                <button 
                  onPointerDown={startStartHold}
                  onPointerUp={endStartHold}
                  onPointerLeave={endStartHold}
                  className="flex-[2] bg-accent flex flex-col items-center justify-center text-white active:brightness-90 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] relative overflow-hidden"
                >
                  {startHoldProgress > 0 && (
                    <>
                      <div 
                        className="absolute top-0 left-0 w-full bg-white/20 transition-all duration-100" 
                        style={{ height: `${startHoldProgress / 2}%` }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-full bg-white/20 transition-all duration-100" 
                        style={{ height: `${startHoldProgress / 2}%` }}
                      />
                    </>
                  )}
                  <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black tracking-tighter leading-none">СТАРТ</span>
                  </div>
                  {!isGpsFixed && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/40 px-2 py-0.5 rounded flex items-center gap-1 border border-white/10">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">НЕТ GPS</span>
                    </div>
                  )}
                </button>
                
                <div 
                  onClick={() => setShowSensorsMenu(true)}
                  className="flex-1 flex flex-col items-center justify-center border-l border-white/10 bg-accent-secondary hover:brightness-110 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                    <Cpu size={18} className="text-white" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-white">Датчики</span>
                </div>

                <div 
                  onClick={() => setShowRoutesMenu(true)}
                  className="flex-1 flex flex-col items-center justify-center border-l border-white/10 bg-accent-secondary hover:brightness-110 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                    <MapIcon size={18} className="text-white" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-white">Маршрут</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center border-l border-white/10 bg-accent-secondary hover:brightness-110 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                    <Zap size={18} className="text-white" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-white">Тренировка</span>
                </div>
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="p-8 h-full bg-white dark:bg-black overflow-y-auto">
            <div className="pb-24">
              <SectionHeader title="Активность" />
              <div className="space-y-1">
                <SettingItem 
                  title="Голосовые уведомления" 
                  subtitle="Настройка голосовых уведомлений" 
                  onClick={() => setShowVoiceAnnouncementsMenu(true)}
                />
                <SettingItem 
                  title="Авто-затемнение" 
                  subtitle="Автоматическое затемнение экрана для экономии заряда" 
                  icon={<Smartphone size={18} />}
                  onClick={() => setShowAutoDimMenu(true)}
                />
                <SettingItem 
                  title="Не выключать экран при записи" 
                  icon={<Smartphone size={18} />}
                  action={{ type: 'toggle', enabled: keepScreenOn, setEnabled: setKeepScreenOn }} 
                />
                <SettingItem title="Авто-пауза" 
                  icon={<Activity size={18} />}
                  action={{ type: 'toggle', enabled: autoPause, setEnabled: setAutoPause }} 
                />
                <SettingItem 
                  title="LiveTrack" 
                  subtitle="Позвольте друзьям следить за вашей поездкой в реальном времени" 
                  icon={<Share2 size={18} />}
                  action={{ type: 'toggle', enabled: isLiveTrackActive, setEnabled: setIsLiveTrackActive }} 
                />
              </div>

              <SectionHeader title="Оборудование" />
              <div className="space-y-1">
                <SettingItem 
                  title="Велосипедный свет" 
                  subtitle={`Режим: ${lightStatus === 'auto' ? 'Авто' : lightStatus === 'on' ? 'Вкл' : 'Выкл'}`}
                  icon={<Sun size={18} />}
                  onClick={() => {
                    const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
                    const next = modes[(modes.indexOf(lightStatus) + 1) % modes.length];
                    setLightStatus(next);
                  }}
                />
                <SettingItem 
                  title="Трансмиссия Di2" 
                  subtitle={`Заряд: ${di2Battery}%`}
                  icon={<Battery size={18} />}
                  value={`${gears.front}x${gears.rear}`}
                />
              </div>

              <SectionHeader title="Параметры поездки" />
              <div className="space-y-1">
                <SettingItem 
                  title="Макеты экрана" 
                  subtitle="Настройка отображения данных во время тренировки" 
                  icon={<Layout size={18} />}
                  onClick={() => setShowLayoutsMenu(true)}
                />
                <SettingItem 
                  title="Маршруты и Навигация" 
                  icon={<Navigation size={18} />}
                  onClick={() => setShowRoutesMenu(true)}
                />
                <SettingItem title="Планы тренировок и упражнения" icon={<Dumbbell size={18} />} />
                <SettingItem title="Офлайн-карты" icon={<Globe size={18} />} />
              </div>

              <SectionHeader title="Отображение" />
              <div className="space-y-1">
                <SettingItem 
                  title="Стиль темы" 
                  icon={<Palette size={18} />}
                  action={{ 
                    type: 'button', 
                    label: isDarkMode ? 'ТЁМНАЯ' : 'СВЕТЛАЯ',
                    onClick: () => setIsDarkMode(!isDarkMode)
                  }} 
                />
                <SettingItem 
                  title="Цвет темы" 
                  icon={<Palette size={18} />}
                  action={{ 
                    type: 'button', 
                    isColor: true, 
                    colorValue: accentColor,
                    secondaryColor: secondaryColor,
                    onClick: () => setShowColorPicker(true)
                  }} 
                />
                <SettingItem 
                  title="Скругленные углы" 
                  subtitle="Отображать метрики в виде карточек с отступами"
                  icon={<Layout size={18} />}
                  action={{ 
                    type: 'toggle', 
                    enabled: roundedMetrics,
                    setEnabled: setRoundedMetrics
                  }} 
                />
                {roundedMetrics && (
                  <SettingItem 
                    title="Фоновый цвет" 
                    subtitle="Цвет подложки под метриками"
                    icon={<Palette size={18} />}
                    action={{ 
                      type: 'button', 
                      isColor: true, 
                      colorValue: metricsBackgroundColor,
                      onClick: () => setShowMetricsBgColorPicker(true)
                    }} 
                  />
                )}
                <SettingItem 
                  title="Язык" 
                  icon={<Languages size={18} />}
                  action={{ type: 'button', label: 'Русский' }} 
                />
                <SettingItem 
                  title="Формат данных" 
                  subtitle="Дистанция, высота, дата, время, и т. д" 
                  icon={<Ruler size={18} />}
                  onClick={() => setShowDataFormatsMenu(true)}
                />
                <SettingItem 
                  title="Сбросить настройки экранов" 
                  subtitle="Вернуть стандартные макеты и метрики" 
                  icon={<History size={18} />}
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите сбросить настройки экранов к значениям по умолчанию?')) {
                      localStorage.removeItem('bike_computer_portrait_screens');
                      localStorage.removeItem('bike_computer_landscape_screens');
                      window.location.reload();
                    }
                  }}
                />
                <SettingItem title="Настройки карты" icon={<MapPin size={18} />} />
              </div>

              <SectionHeader title="Датчики и оборудование" />
              <div className="space-y-1">
                <SettingItem 
                  title="Bluetooth-датчики" 
                  subtitle="Пульс, скорость, каденс, мощность" 
                  icon={<Cpu size={18} />} 
                  onClick={() => setShowSensorsMenu(true)}
                />
              </div>

              <SectionHeader title="Профиль" />
              <div className="space-y-1">
                <SettingItem 
                  title="Дата рождения" 
                  subtitle="Для расчета зон пульса" 
                  icon={<Clock size={18} />}
                  value={birthDate || "НЕ УСТАНОВЛЕНО"}
                  onClick={() => setShowDatePicker(true)}
                />
                <SettingItem 
                  title="Вес" 
                  subtitle="Для расчета сожженных калорий" 
                  icon={<Activity size={18} />}
                  value={weight !== null ? `${weight} ${dataFormats.weight === 'KILOGRAMS' ? 'кг' : 'фунтов'}` : "НЕ УСТАНОВЛЕНО"}
                  onClick={() => setShowWeightPicker(true)}
                />
                <SettingItem 
                  title="Зоны пульса" 
                  icon={<Heart size={18} />}
                  value={`${hrSettings.maxHR || (birthDate ? 220 - (new Date().getFullYear() - parseInt(birthDate.split('-')[0])) : 190)} BPM`}
                  onClick={() => setShowHeartRateZonesMenu(true)}
                />
                <SettingItem 
                  title="Зоны мощности" 
                  icon={<Zap size={18} />}
                  value={`${powerSettings.ftp} W`}
                  onClick={() => setShowPowerZonesMenu(true)}
                />
                <SettingItem 
                  title="Зоны каденса" 
                  icon={<Activity size={18} />}
                  value={`${cadenceSettings.threshold} RPM`}
                  onClick={() => setShowCadenceZonesMenu(true)}
                />
                <SettingItem 
                  title="Зоны скорости" 
                  icon={<Gauge size={18} />}
                  value={`${speedSettings.threshold} KPH`}
                  onClick={() => setShowSpeedZonesMenu(true)}
                />
              </div>

              <SectionHeader title="Приложения и сервисы" />
              <div className="space-y-1">
                <SettingItem 
                  title="Strava" 
                  subtitle="Загружайте активности и используйте Strava Live Segments" 
                  icon={<Globe size={18} />}
                />
                <SettingItem 
                  title="ai.gpx.studio" 
                  subtitle="Облачная синхрониная маршрутов" 
                  icon={<Globe size={18} />}
                />
              </div>

              <SectionHeader title="Помощь" />
              <div className="space-y-1">
                <SettingItem title="Поддержка и FAQ" icon={<HelpCircle size={18} />} />
              </div>

              <SectionHeader title="Разработка" />
              <div className="space-y-1">
                <SettingItem 
                  title="Для разработчиков" 
                  subtitle="Имитация датчиков для тестирования метрик" 
                  icon={<Smartphone size={18} />}
                  action={{ type: 'toggle', enabled: isDeveloperMode, setEnabled: setIsDeveloperMode }} 
                />
                {isDeveloperMode && (
                  <>
                    <SettingItem 
                      title="Fake GPS" 
                      subtitle="Симуляция движения при записи" 
                      icon={<Navigation size={18} />}
                      action={{ type: 'toggle', enabled: isFakeGpsEnabled, setEnabled: setIsFakeGpsEnabled }} 
                    />
                    <SettingItem 
                      title="Имитировать остановку" 
                      subtitle="Сбросить скорость до 0 для проверки автопаузы" 
                      icon={<Activity size={18} />}
                      action={{ type: 'toggle', enabled: isSimulatingStop, setEnabled: setIsSimulatingStop }} 
                    />
                    <SettingItem 
                      title="Создать тестовую поездку" 
                      subtitle="Добавить случайную активность в историю"
                      icon={<Plus size={18} className="text-accent" />}
                      onClick={generateTestRide}
                    />
                    <SettingItem 
                      title="Загрузить поездку" 
                      subtitle="Импорт JSON или TCX файла в историю"
                      icon={<Download size={18} className="text-accent" />}
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".json,.tcx"
                      onChange={handleUploadRideFile}
                    />
                  </>
                )}
                {isNavigating && (
                  <SettingItem 
                    title="Остановить навигацию" 
                    subtitle={`Активный маршрут: ${activeRoute?.name}`}
                    icon={<Navigation size={18} className="text-rose-500" />}
                    onClick={() => {
                      setIsNavigating(false);
                      setActiveRoute(null);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen bg-white dark:bg-black font-sans text-black dark:text-white flex flex-col select-none ${isDarkMode ? 'dark' : ''}`}>
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showColorPicker && (
          <motion.div key="color-picker">
            <ThemeColorPicker 
              selectedColor={accentColor}
              onSelect={(item) => {
                setAccentColor(item.color);
                setSecondaryColor(item.secondary);
                setShowColorPicker(false);
              }}
              onCancel={() => setShowColorPicker(false)}
            />
          </motion.div>
        )}
        {showMetricsBgColorPicker && (
          <motion.div key="metrics-bg-color-picker">
            <MetricsBgColorPicker 
              selectedColor={metricsBackgroundColor}
              onSelect={(color) => {
                setMetricsBackgroundColor(color);
                setShowMetricsBgColorPicker(false);
              }}
              onCancel={() => setShowMetricsBgColorPicker(false)}
            />
          </motion.div>
        )}
        {showAutoDimMenu && (
          <motion.div key="auto-dim-menu">
            <AutoDimMenu 
              enabled={autoDimEnabled}
              setEnabled={setAutoDimEnabled}
              level={autoDimLevel}
              setLevel={setAutoDimLevel}
              timeout={autoDimTimeout}
              setTimeout={setAutoDimTimeout}
              onBack={() => setShowAutoDimMenu(false)}
            />
          </motion.div>
        )}
        {showVoiceAnnouncementsMenu && (
          <motion.div key="voice-announcements-menu">
            <VoiceAnnouncementsMenu 
              settings={voiceSettings}
              setSettings={setVoiceSettings}
              onBack={() => setShowVoiceAnnouncementsMenu(false)}
            />
          </motion.div>
        )}
        {showLayoutsMenu && (
          <motion.div key="layouts-menu">
            <LayoutsMenu 
              onBack={() => setShowLayoutsMenu(false)} 
              portraitScreens={portraitScreens}
              landscapeScreens={landscapeScreens}
              onAddPortraitScreen={(screen) => setPortraitScreens([...portraitScreens, screen])}
              onAddLandscapeScreen={(screen) => setLandscapeScreens([...landscapeScreens, screen])}
              onUpdatePortraitScreen={(index, layout) => {
                const newScreens = [...portraitScreens];
                newScreens[index].layout = layout;
                setPortraitScreens(newScreens);
              }}
              onUpdateLandscapeScreen={(index, layout) => {
                const newScreens = [...landscapeScreens];
                newScreens[index].layout = layout;
                setLandscapeScreens(newScreens);
              }}
              onDeletePortraitScreen={(index) => {
                const newScreens = [...portraitScreens];
                newScreens.splice(index, 1);
                setPortraitScreens(newScreens);
              }}
              onDeleteLandscapeScreen={(index) => {
                const newScreens = [...landscapeScreens];
                newScreens.splice(index, 1);
                setLandscapeScreens(newScreens);
              }}
              onRenamePortraitScreen={(index, name) => {
                const newScreens = [...portraitScreens];
                newScreens[index].name = name;
                setPortraitScreens(newScreens);
              }}
              onRenameLandscapeScreen={(index, name) => {
                const newScreens = [...landscapeScreens];
                newScreens[index].name = name;
                setLandscapeScreens(newScreens);
              }}
              onDuplicatePortraitScreen={(index) => {
                const newScreens = [...portraitScreens];
                const duplicated = { 
                  ...newScreens[index], 
                  id: `${newScreens[index].id}-copy-${Date.now()}`,
                  name: `${newScreens[index].name} (Копия)` 
                };
                newScreens.splice(index + 1, 0, duplicated);
                setPortraitScreens(newScreens);
              }}
              onDuplicateLandscapeScreen={(index) => {
                const newScreens = [...landscapeScreens];
                const duplicated = { 
                  ...newScreens[index], 
                  id: `${newScreens[index].id}-copy-${Date.now()}`,
                  name: `${newScreens[index].name} (Копия)` 
                };
                newScreens.splice(index + 1, 0, duplicated);
                setLandscapeScreens(newScreens);
              }}
              onReorderPortraitScreens={setPortraitScreens}
              onReorderLandscapeScreens={setLandscapeScreens}
              isDarkMode={isDarkMode}
            />
          </motion.div>
        )}
        {showRoutesMenu && (
          <motion.div key="routes-menu">
            <RoutesMenu 
              onBack={() => setShowRoutesMenu(false)} 
              routes={routes}
              setRoutes={setRoutes}
              formats={dataFormats}
              onStartNavigation={(route) => {
                setActiveRoute(route);
                setIsNavigating(true);
                setNavigationProgress(0);
                setShowRoutesMenu(false);
                if (isDeveloperMode && route.points.length > 0) {
                  setUserLocation([route.points[0].lat, route.points[0].lon]);
                }
              }}
            />
          </motion.div>
        )}
        {showDataFormatsMenu && (
          <motion.div key="data-formats-menu">
            <DataFormatsMenu 
              formats={dataFormats}
              setFormats={setDataFormats}
              onBack={() => setShowDataFormatsMenu(false)}
            />
          </motion.div>
        )}
        {showHeartRateZonesMenu && (
          <motion.div key="hr-zones-menu">
            <HeartRateZonesMenu 
              birthDate={birthDate}
              settings={hrSettings}
              accentColor={accentColor}
              onSave={(newSettings) => {
                setHrSettings(newSettings);
                setShowHeartRateZonesMenu(false);
              }}
              onBack={() => setShowHeartRateZonesMenu(false)}
            />
          </motion.div>
        )}

        {showCadenceZonesMenu && (
          <motion.div key="cadence-zones-menu">
            <CadenceZonesMenu 
              settings={cadenceSettings}
              accentColor={accentColor}
              onSave={(s) => {
                setCadenceSettings(s);
                setShowCadenceZonesMenu(false);
              }}
              onBack={() => setShowCadenceZonesMenu(false)}
            />
          </motion.div>
        )}

        {showSpeedZonesMenu && (
          <motion.div key="speed-zones-menu">
            <SpeedZonesMenu 
              settings={speedSettings}
              accentColor={accentColor}
              onSave={(s) => {
                setSpeedSettings(s);
                setShowSpeedZonesMenu(false);
              }}
              onBack={() => setShowSpeedZonesMenu(false)}
            />
          </motion.div>
        )}

        {showPowerZonesMenu && (
          <motion.div key="power-zones-menu">
            <PowerZonesMenu 
              settings={powerSettings}
              accentColor={accentColor}
              onSave={(s) => {
                setPowerSettings(s);
                setShowPowerZonesMenu(false);
              }}
              onBack={() => setShowPowerZonesMenu(false)}
            />
          </motion.div>
        )}
        {showDatePicker && (
          <motion.div key="date-picker">
            <DatePickerModal 
              currentDate={birthDate}
              onSave={(date) => {
                setBirthDate(date);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </motion.div>
        )}
        {showWeightPicker && (
          <motion.div key="weight-picker">
            <WeightPickerModal 
              currentWeight={weight}
              unit={dataFormats.weight}
              onSave={(val) => {
                setWeight(val);
                setShowWeightPicker(false);
              }}
              onClose={() => setShowWeightPicker(false)}
            />
          </motion.div>
        )}
        {selectedRideForAction && !isRenamingRide && !showDeleteConfirm && (
          <RideContextMenu 
            ride={selectedRideForAction}
            onClose={() => setSelectedRideForAction(null)}
            onRename={() => setIsRenamingRide(true)}
            onDelete={handleDeleteRide}
            onShare={handleShareRide}
            setShowDeleteConfirm={setShowDeleteConfirm}
          />
        )}
        {showDeleteConfirm && selectedRideForAction && (
          <DeleteConfirmModal 
            title={selectedRideForAction.name}
            onConfirm={() => {
              handleDeleteRide();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
        {isRenamingRide && (
          <RenameModal 
            value={rideNewName}
            onChange={setRideNewName}
            onSave={handleRenameRide}
            onClose={() => setIsRenamingRide(false)}
          />
        )}
        {selectedRide && (
          <RideDetailsModal 
            ride={selectedRide} 
            onClose={() => setSelectedRide(null)} 
            isDarkMode={isDarkMode} 
          />
        )}
        {showRideSummary && currentRideSummary && (
          <RideSummaryModal 
            ride={currentRideSummary}
            onSave={handleSaveRideSummary}
            onResume={() => {
              setShowRideSummary(false);
              setIsPaused(false);
            }}
            onDiscard={() => {
              setShowRideSummary(false);
              setIsRecording(false);
              setIsPaused(false);
              setCurrentRideSummary(null);
            }}
          />
        )}
        {showSensorsMenu && (
          <SensorsModal 
            onClose={() => setShowSensorsMenu(false)}
            sensors={sensors}
            setSensors={setSensors}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}
      </AnimatePresence>

      {!isRecording && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}





