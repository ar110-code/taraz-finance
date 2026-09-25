export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  bankName: string;
  color: string;
  icon: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  categoryId: string;
  accountId: string;
  date: string; // ISO string YYYY-MM-DD
  note?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  period: string; // YYYY-MM
  category?: Category;
  spent?: number;
  percentage?: number;
  remaining?: number;
  status?: 'safe' | 'warning' | 'danger';
}

export interface Loan {
  id: string;
  title: string;
  lender: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDay: number; // 1 to 31
  startDate: string;
  accountId: string;
  status: 'active' | 'completed';
  createdAt: string;
  account?: Account;
  remainingAmount?: number;
  remainingInstallments?: number;
  progressPercentage?: number;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

export interface AnalyticsSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  netSavings: number;
  savingsRate: number; // percentage (0 - 100)
  previousMonthExpense: number;
  expenseChangePercentage: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    totalAmount: number;
    percentage: number;
  }[];
  monthlyCashflow: {
    monthName: string;
    income: number;
    expense: number;
  }[];
}
