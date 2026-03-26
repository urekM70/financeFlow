import { Bell, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { t } = useTranslation();
  const { 
    currency, setCurrency, 
    language, setLanguage,
    notifications, updateNotifications 
  } = usePreferences();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('Settings')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('ManageSettings')}</p>
      </div>

      <div className="grid gap-6">
        {/* Preferences Section */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <CardTitle className="text-slate-900 dark:text-white">{t('Preferences')}</CardTitle>
            </div>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {t('ManageRegional')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="currency">{t('Currency')}</Label>
              <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="bg-transparent border-none focus:ring-0 flex-1 text-sm text-slate-900 dark:text-slate-200"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">{t('Language')}</Label>
              <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-transparent border-none focus:ring-0 flex-1 text-sm text-slate-900 dark:text-slate-200"
                >
                  <option value="en">{t('English')}</option>
                  <option value="es">{t('Spanish')}</option>
                  <option value="fr">{t('French')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-slate-900 dark:text-white">{t('Notifications')}</CardTitle>
            </div>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {t('ConfigureNotifications')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-900 dark:text-white">{t('EmailNotifications')}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('ReceiveWeeklySummaries')}</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => updateNotifications({ email: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-900 dark:text-white">{t('PushNotifications')}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('GetInstantAlerts')}</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => updateNotifications({ push: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
