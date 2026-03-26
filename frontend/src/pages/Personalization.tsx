import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { usePreferences } from '../context/PreferencesContext';

export function Personalization() {
  const { theme, setTheme } = usePreferences();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Personalization</h1>
        <p className="text-slate-500 dark:text-slate-400">Customize your workspace appearance.</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Section */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-slate-900 dark:text-white">Appearance</CardTitle>
            </div>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Select your preferred theme for the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className={`flex-1 h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  theme === 'light' ? 'border-blue-500 bg-slate-100 text-slate-900' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                } dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white ${
                  theme === 'light' ? '' : 'dark:data-[state=active]:border-blue-500' // Keeping simple logic first
                }`}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-6 w-6" />
                <span>Light</span>
              </Button>
              <Button
                variant="outline"
                className={`flex-1 h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  theme === 'dark' ? 'border-blue-500 bg-slate-800 text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                } dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white ${
                  theme === 'dark' ? 'dark:border-blue-500' : ''
                }`}
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-6 w-6" />
                <span>Dark</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
