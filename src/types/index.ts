export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
  account_id?: string; // Associated source of funds Account ID
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Account {
  id: string;
  name: string; // e.g. "BCA", "GoPay", "OVO", "Tunai"
  type: 'bank' | 'ewallet' | 'cash' | 'other';
  balance: number;
}

export type CategoryType = 'income' | 'expense';
export type AccountType = 'bank' | 'ewallet' | 'cash' | 'other';

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Tagihan & Utilitas',
  'Hiburan & Rekreasi',
  'Kesehatan',
  'Pendidikan',
  'Lain-lain'
];

export const INCOME_CATEGORIES = [
  'Gaji',
  'Investasi',
  'Sampingan',
  'Hadiah / Bonus',
  'Lain-lain'
];

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'cash', label: 'Uang Tunai (Cash)' },
  { value: 'other', label: 'Lainnya' }
];

export interface User {
  id: string;
  username: string;
  name: string;
  summary_start_day?: number;
}

