import { usePreferences } from '../context/PreferencesContext';

export function useCurrencyFormatter() {
  const { currency, language } = usePreferences();

  const formatCurrency = (amount: number) => {
    // Map simple language codes to full locales
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
    };

    const locale = localeMap[language] || 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return formatCurrency;
}
