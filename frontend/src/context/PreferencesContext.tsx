import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Theme = 'light' | 'dark';
type Currency = 'USD' | 'EUR' | 'GBP';
type Language = 'en' | 'es' | 'fr';

interface NotificationSettings {
  email: boolean;
  push: boolean;
}

interface PreferencesContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  notifications: NotificationSettings;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  // Theme State
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Currency State
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('currency') as Currency) || 'USD';
    }
    return 'USD';
  });

  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as Language) || 'en';
    }
    return 'en';
  });

  // Notifications State
  const [notifications, setNotificationsState] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications');
      if (saved) return JSON.parse(saved);
    }
    return { email: true, push: false };
  });

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist Other Settings
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('language', language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const updateNotifications = (settings: Partial<NotificationSettings>) => {
    setNotificationsState(prev => ({ ...prev, ...settings }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        currency,
        setCurrency,
        language,
        setLanguage,
        notifications,
        updateNotifications,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
