export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export type NewTransaction = Omit<Transaction, 'id' | 'type'> & {
  type?: 'income' | 'expense';
};

export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
}

export interface TransactionSummary {
  total_transactions: number;
  total_amount: number;
  categories: Record<string, number>;
  date_range: [string, string];
}

export interface TransactionPreview {
  summary: TransactionSummary;
  transactions: NewTransaction[];
}

export interface PreviewResponse {
  success: boolean;
  summary?: TransactionSummary;
  transactions?: NewTransaction[];
  column_mapping?: Record<string, string>;
  message?: string;
  original_columns?: string[];
}
