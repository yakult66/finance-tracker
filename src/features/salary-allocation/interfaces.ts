export interface SalaryAllocation {
  id?: string;             // UUID
  month: number;           // 薪水月份
  payday: string;          // 發薪日 (YYYY-MM-DD)
  income: number;          // 薪資收入
  investment: number;      // 投資金額
  consumerFund: number;    // 消費基金
  fixedExpenses: number;   // 固定費用快照
  emergencyFund: number;   // 緊急備用金快照
  previousBalance: number; // 上月結餘快照
  
  createdAt?: number;      // 建立時間戳記
  updatedAt?: number;    // 更新時間戳記
  deletedAt?: number;    // 刪除時間戳記 (軟刪除用)
}
