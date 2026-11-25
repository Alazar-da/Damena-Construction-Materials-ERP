'use client';

import React, { useState, useEffect } from 'react';
import {
  ETHIOPIAN_MONTHS,
  getTodayEthiopic,
  gregorianToEthiopic,
  ethiopicToGregorian,
  getDaysInEthMonth,
} from '@/lib/ethiopian-calendar';

export function EthiopianDatePicker({
  name,
  defaultValue,
  value,
  onChange,
  compact = false,
  className = '',
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (isoDate: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const initialEth = gregorianToEthiopic(value || defaultValue || getTodayEthiopic().isoDate);
  const todayEth = getTodayEthiopic();

  const [ethYear, setEthYear] = useState<number>(initialEth.year);
  const [ethMonth, setEthMonth] = useState<number>(initialEth.month);
  const [ethDay, setEthDay] = useState<number>(initialEth.day);

  // Sync if controlled value changes externally
  useEffect(() => {
    if (value) {
      const next = gregorianToEthiopic(value);
      setEthYear(next.year);
      setEthMonth(next.month);
      setEthDay(next.day);
    }
  }, [value]);

  const maxDays = getDaysInEthMonth(ethYear, ethMonth);
  const clampedDay = Math.min(ethDay, maxDays);

  const isoValue = ethiopicToGregorian(ethYear, ethMonth, clampedDay);

  const updateDate = (y: number, m: number, d: number) => {
    const mDays = getDaysInEthMonth(y, m);
    const validDay = Math.min(d, mDays);
    setEthYear(y);
    setEthMonth(m);
    setEthDay(validDay);
    if (onChange) {
      onChange(ethiopicToGregorian(y, m, validDay));
    }
  };

  const hClass = compact ? 'h-9' : 'h-10';
  const years = Array.from({ length: 7 }, (_, i) => todayEth.year - 4 + i);

  return (
    <div className={`grid grid-cols-12 gap-1 ${className}`}>
      <select
        value={clampedDay}
        onChange={(e) => updateDate(ethYear, ethMonth, Number(e.target.value))}
        className={`col-span-3 erp-input ${hClass} px-1.5 font-mono font-bold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl`}
        aria-label="ቀን"
      >
        {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={ethMonth}
        onChange={(e) => updateDate(ethYear, Number(e.target.value), clampedDay)}
        className={`col-span-5 erp-input ${hClass} px-1.5 font-semibold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl`}
        aria-label="ወር"
      >
        {ETHIOPIAN_MONTHS.map((m, idx) => (
          <option key={m} value={idx + 1}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={ethYear}
        onChange={(e) => updateDate(Number(e.target.value), ethMonth, clampedDay)}
        className={`col-span-4 erp-input ${hClass} px-1.5 font-mono font-bold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl`}
        aria-label="ዓመት"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y} ዓ.ም
          </option>
        ))}
      </select>

      {name && <input type="hidden" name={name} value={isoValue} />}
    </div>
  );
}
