/** 每月預設存入設定項目 */
export interface EmergencyDepositPlan {
  id: string;
  amount: number;          // 每月存入金額 (純數字，無上下箭頭)
  isActive: boolean;       // 啟用/停用 Switch (同一個 Goal 底下只能有 1 個 true)
  isLocked: boolean;       // 是否已儲存鎖定 (鎖定後金額不可編輯)
  createdAt: number;
}

/** 臨時新增 / 臨時支出異動紀錄 */
export interface EmergencyTransaction {
  id: string;
  type: 'deposit' | 'expense'; // 'deposit': 臨時新增, 'expense': 臨時支出
  name: string;                // 項目名稱 (例如：年終獎金存入、緊急維修)
  amount: number;              // 異動金額
  date: string;                // 異動日期 (YYYY-MM-DD)
  createdAt: number;
}

/** 緊急備用金目標項目 */
export interface EmergencyGoal {
  id: string;
  name: string;                         // 目標名稱 (例如：個人基本備用金)
  targetAmount: number;                 // 目標金額 (可輸入，預設 0，純數字)
  currentAmount: number;                // 累積金額 (唯讀，自動計算)
  depositPlans: EmergencyDepositPlan[]; // 每月存入設定清單
  transactions: EmergencyTransaction[]; // 臨時異動紀錄
  lastProcessedMonth?: string;          // 紀錄最後一次發薪日結算的月份 (YYYY-MM)，防重複扣款
  createdAt: number;
  updatedAt: number;
}
