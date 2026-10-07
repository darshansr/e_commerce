'use client';

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Locale = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'pa' | 'or' | 'as';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  formatNumber: (value: number) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

const LOCALE_CURRENCY_MAP: Record<Locale, string> = {
  en: 'INR',
  hi: 'INR',
  mr: 'INR',
  gu: 'INR',
  ta: 'INR',
  te: 'INR',
  kn: 'INR',
  ml: 'INR',
  bn: 'INR',
  pa: 'INR',
  or: 'INR',
  as: 'INR',
};

const LOCALE_LOCALE_MAP: Record<Locale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [currency, setCurrencyState] = useState('INR');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      const savedCurrency = localStorage.getItem('currency');
      if (savedLocale) setLocaleState(savedLocale);
      if (savedCurrency) setCurrencyState(savedCurrency);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setCurrencyState(LOCALE_CURRENCY_MAP[newLocale]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      localStorage.setItem('currency', LOCALE_CURRENCY_MAP[newLocale]);
    }
  }, []);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency', newCurrency);
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(LOCALE_LOCALE_MAP[locale], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  }, [locale, currency]);

  const formatDate = useCallback((date: string | Date) => {
    return new Intl.DateTimeFormat(LOCALE_LOCALE_MAP[locale], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }, [locale]);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat(LOCALE_LOCALE_MAP[locale]).format(value);
  }, [locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrency,
        formatCurrency,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}