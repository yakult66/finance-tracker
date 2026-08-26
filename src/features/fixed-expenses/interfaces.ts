export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  linkedLargeExpenseId?: string; // 紀錄是否由大額支出自動生成，用來防呆或覆蓋
  createdAt?: number;
  updatedAt?: number;
}

export interface LargeExpense {
  id: string;
  name: string;
  totalAmount: number;       // 總金額
  accumulatedAmount: number; // 已有金額 (預設 0)
  paymentMonth: string;      // 繳款時間 (格式: YYYY-MM)
  isAveraged: boolean;       // 是否平均分攤 (連動開關)
  lastProcessedMonth?: string; // 紀錄最後一次被發薪日自動結算的月份，防止重複結算
  createdAt?: number;
  updatedAt?: number;
}
