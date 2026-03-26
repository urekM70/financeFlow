import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transactionApi } from '../services/api';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

interface ReportData {
  stats: {
    total_income: number;
    total_expenses: number;
    net_savings: number;
    top_categories: Record<string, number>;
  };
  narrative: string;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormatter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState('last_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate = '';
      let endDate = '';
      const now = new Date();

      if (timeframe === 'last_month') {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        startDate = date.toISOString();
      } else if (timeframe === 'last_3_months') {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        startDate = date.toISOString();
      } else if (timeframe === 'last_6_months') {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        startDate = date.toISOString();
      } else if (timeframe === 'last_year') {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        startDate = date.toISOString();
      } else if (timeframe === 'ytd') {
        const date = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        startDate = date.toISOString();
      } else if (timeframe === 'custom') {
        if (!customStart || !customEnd) {
          setError(t('pleaseSelectDates', 'Please select both start and end dates.'));
          setLoading(false);
          return;
        }
        startDate = new Date(customStart).toISOString();
        endDate = new Date(customEnd).toISOString();
      }

      const reportData = await transactionApi.getReportSummary(startDate, endDate);
      setData(reportData);
    } catch (err: any) {
      console.error('Failed to fetch report:', err);
      setError(t('failedToFetchReport') || 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount with default 'last_month'

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('Financial Report', 'Financial Report')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('reportDescription', 'AI-generated summary and pure-code statistics of your finances.')}
          </p>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('Timeframe', 'Timeframe')}
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="last_month">{t('Last Month', 'Last Month')}</option>
              <option value="last_3_months">{t('Last 3 Months', 'Last 3 Months')}</option>
              <option value="last_6_months">{t('Last 6 Months', 'Last 6 Months')}</option>
              <option value="last_year">{t('Last Year', 'Last Year')}</option>
              <option value="ytd">{t('Year to Date', 'Year to Date')}</option>
              <option value="custom">{t('Custom', 'Custom')}</option>
            </select>
          </div>

          {timeframe === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('Start Date', 'Start Date')}
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('End Date', 'End Date')}
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {t('Generating...', 'Generating...')}
              </span>
            ) : (
              t('Generate Report', 'Generate Report')
            )}
          </button>
        </div>
      </div>

      {loading && data && (
        <div className="flex justify-center p-4">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-900 px-4 py-5 shadow sm:p-6 border border-slate-200 dark:border-slate-800">
          <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Income', 'Total Income')}</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.stats.total_income)}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-900 px-4 py-5 shadow sm:p-6 border border-slate-200 dark:border-slate-800">
          <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Expenses', 'Total Expenses')}</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
            {formatCurrency(data.stats.total_expenses)}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-900 px-4 py-5 shadow sm:p-6 border border-slate-200 dark:border-slate-800">
          <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{t('Net Savings', 'Net Savings')}</dt>
          <dd className={`mt-1 text-3xl font-semibold tracking-tight ${data.stats.net_savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {formatCurrency(data.stats.net_savings)}
          </dd>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-5 sm:px-6 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-.813.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">{t('AI Insights', 'AI Insights')}</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {data.narrative}
        </div>
      </div>

      {/* Top Categories */}
      {Object.keys(data.stats.top_categories).length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-5 sm:px-6">
            <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white">{t('Top Categories', 'Top Expense Categories')}</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="mt-5 space-y-4">
              {Object.entries(data.stats.top_categories).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{category}</dt>
                  <dd className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(amount)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
