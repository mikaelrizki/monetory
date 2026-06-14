export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export type CategoryType = 'income' | 'expense';

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
