import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi, transactionApi } from '../services/api';
import { Wallet, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import type { Budget } from '../types';

const CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Income',
  'Other'
];

export function BudgetingPage() {
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormatter();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetApi.getBudgets,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionApi.getTransactions,
  });

  const createMutation = useMutation({
    mutationFn: budgetApi.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => budgetApi.updateBudget(id, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: budgetApi.deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, amount: parseFloat(amount) });
    } else {
      createMutation.mutate({ category, amount: parseFloat(amount) });
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingBudget(null);
    setCategory('');
    setAmount('');
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setAmount(budget.amount.toString());
    setIsAddModalOpen(true);
  };

  // Calculate current month spending per category
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.amount < 0; // Only expenses
  });

  const categorySpending = currentMonthTransactions.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (categorySpending[b.category] || 0), 0);

  if (budgetsLoading || transactionsLoading) {
    return <div className="p-6">{t('Loading')}...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-500" />
            {t('Budgeting') || 'Budgeting'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('Manage your monthly spending limits.') || 'Manage your monthly spending limits.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          {t('Add Budget') || 'Add Budget'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Total Monthly Budget
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalBudget)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Total Spent in Budgets
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalSpent)}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Category Budgets</h3>
        </div>
        {budgets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No budgets set up yet. Click "Add Budget" to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {budgets.map(budget => {
              const spent = categorySpending[budget.category] || 0;
              const percent = Math.min((spent / budget.amount) * 100, 100);
              let barColor = 'bg-green-500';
              if (percent >= 100) barColor = 'bg-red-500';
              else if (percent >= 80) barColor = 'bg-orange-500';

              return (
                <div key={budget.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-full sm:w-1/4">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {budget.category}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <div className="w-full sm:w-2/4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">0%</span>
                      <span className="text-slate-500 dark:text-slate-400">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    {percent >= 100 && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                        <AlertCircle className="w-3 h-3" /> Over budget by {formatCurrency(spent - budget.amount)}
                      </p>
                    )}
                  </div>
                  <div className="w-full sm:w-1/4 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this budget?')) {
                          deleteMutation.mutate(budget.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    required
                    disabled={!!editingBudget}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Limit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
