import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../services/api';
import { Upload as UploadIcon, Check, Loader2, Settings2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PreviewResponse, TransactionSummary, NewTransaction } from '../types';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { useTranslation } from 'react-i18next';

export function UploadPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'select' | 'mapping' | 'preview' | 'success'>('select');
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [uploadSummary, setUploadSummary] = useState<TransactionSummary | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mapping state
  const [originalColumns, setOriginalColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const previewMutation = useMutation({
    mutationFn: (data: { file: File; mapping?: Record<string, string> }) => 
      transactionApi.previewTransactions(data.file, data.mapping),
    onSuccess: (data) => {
      if (data.success) {
        setPreviewData(data);
        setStep('preview');
      } else if (data.column_mapping && data.original_columns) {
        // Parsing failed, but we have a suggested mapping
        setOriginalColumns(data.original_columns);
        setColumnMapping(data.column_mapping);
        setStep('mapping');
      } else {
        // Generic error
        alert(data.message || 'Error processing file');
        setFile(null);
        setStep('select');
      }
    },
    onError: (error) => {
      console.error(error);
      alert('Error uploading file');
      setFile(null);
      setStep('select');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { file?: File; mapping?: Record<string, string>; transactions?: NewTransaction[] }) => {
      if (data.transactions) {
        return transactionApi.batchCreateTransactions(data.transactions);
      }
      if (data.file) {
        return transactionApi.uploadTransactions(data.file, data.mapping);
      }
      throw new Error('No data provided for upload');
    },
    onSuccess: (data) => {
      setUploadSummary(data);
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      previewMutation.mutate({ file: selectedFile });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleMappingChange = (standardColumn: string, fileColumn: string) => {
    // Invert the logic: We want to map File Column -> Standard Column
    // But the UI might present "Date -> Select File Column"
    
    // We need to construct { "File Column": "standard_column" }
    
    // Remove any existing mapping for this standard column
    const newMapping = { ...columnMapping };
    
    // Find key where value is standardColumn and remove it
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === standardColumn) {
        delete newMapping[key];
      }
    });
    
    if (fileColumn) {
      newMapping[fileColumn] = standardColumn;
    }
    
    setColumnMapping(newMapping);
  };

  const handleConfirmMapping = () => {
    if (file) {
      previewMutation.mutate({ file, mapping: columnMapping });
    }
  };

  const handleConfirmUpload = () => {
    if (previewData && previewData.transactions) {
      // Use batch creation with the transactions we already parsed
      uploadMutation.mutate({ transactions: previewData.transactions });
    } else if (file) {
      // Fallback (though normally we go through preview)
      uploadMutation.mutate({ file, mapping: Object.keys(columnMapping).length > 0 ? columnMapping : undefined });
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData(null);
    setUploadSummary(null);
    setOriginalColumns([]);
    setColumnMapping({});
    setStep('select');
    previewMutation.reset();
    uploadMutation.reset();
  };
  
  // Helper to find which file column is mapped to a standard column
  const getMappedColumn = (standardColumn: string) => {
    return Object.keys(columnMapping).find(key => columnMapping[key] === standardColumn) || '';
  };
  
  const mappingFields = [
    { key: 'date', label: t('Date'), required: true, description: 'Transaction date' },
    { key: 'amount', label: t('AmountSingle'), required: false, description: 'Single column for amount' },
    { key: 'amount_debit', label: t('DebitOutflow'), required: false, description: 'If split: Expense/Debit column' },
    { key: 'amount_credit', label: t('CreditInflow'), required: false, description: 'If split: Income/Credit column' },
    { key: 'description', label: t('Description'), required: true, description: 'Transaction details/payee' },
    { key: 'category', label: t('Category'), required: false, description: 'Optional category column' },
  ];

  if (step === 'select') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{t('UploadTransactions')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{t('ImportYourBank')}</p>
        
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-12 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-slate-900",
            isDragging 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
              : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className={cn(
            "p-4 rounded-full mb-4 transition-colors",
            isDragging ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          )}>
            {previewMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <UploadIcon className="h-8 w-8" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {previewMutation.isPending ? t('ProcessingFile') : t('ClickToUpload')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {previewMutation.isPending 
              ? t('AnalyzingTransactions') 
              : t('SupportForFormats')}
          </p>
          
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={previewMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Settings2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('MapColumns')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t('WeCouldntAutomaticallyDetect')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
              {t('TipMapAmount')}
            </div>
            
            {mappingFields.map((field) => (
              <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {field.description}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-white"
                    value={getMappedColumn(field.key)}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  >
                    <option value="">{t('SelectColumn')}</option>
                    {originalColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleConfirmMapping}
            disabled={previewMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {previewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('Processing')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {t('ConfirmMapping')}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'preview' && previewData && previewData.success && previewData.summary && previewData.transactions) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('PreviewImport')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('ReviewBeforeSaving')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              {t('Cancel')}
            </button>
            <button
              onClick={handleConfirmUpload}
              disabled={uploadMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('Saving')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('ConfirmUpload')}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{previewData.summary.total_transactions}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('TotalAmount')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(previewData.summary.total_amount)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('DateRange')}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
              {new Date(previewData.summary.date_range[0]).toLocaleDateString()} - {new Date(previewData.summary.date_range[1]).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('TransactionsList')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Description')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Category')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Amount')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {previewData.transactions.slice(0, 50).map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      {t.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {t.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={t.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
                {previewData.transactions.length > 50 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                      {t('And')} {previewData.transactions.length - 50} {t('MoreTransactions')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success' && uploadSummary) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center pt-20">
        <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('ImportSuccessful')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          {t('SuccessfullyImported')} {uploadSummary.total_transactions} {t('TransactionsTotaling')} {formatCurrency(uploadSummary.total_amount)}.
        </p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleCancel()}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            {t('UploadAnother')}
          </button>
          <button
            onClick={() => window.location.href = '/transactions'}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
          >
            {t('ViewTransactions')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}