import { markRaw } from 'vue'
import type { Tab } from '../types'
import CashFlowView from '../features/cash-flow/CashFlowView.vue'
import FixedExpenseView from '../features/fixed-expense/FixedExpenseView.vue'
import AllowanceView from '../features/allowance/AllowanceView.vue'
import FirstGoalView from '../features/first-goal/FirstGoalView.vue'
import HistoryView from '../features/history/HistoryView.vue'

// 每個 feature 對外只暴露一個進入畫面，導覽列在這裡組起來。
// 要加新功能就是新增一個 feature 資料夾，然後在這張表登記一列。
export const tabs: Tab[] = [
  {
    id: 'cashflow',
    label: '月現金流計算',
    shortLabel: '現金流',
    icon: '💵',
    component: markRaw(CashFlowView)
  },
  {
    id: 'fixed',
    label: '固定支出設定',
    shortLabel: '固定支出',
    icon: '🧾',
    component: markRaw(FixedExpenseView)
  },
  {
    id: 'allowance',
    label: '零用金計算',
    shortLabel: '零用金',
    icon: '💸',
    component: markRaw(AllowanceView)
  },
  {
    id: 'goal',
    label: '第一桶金規劃',
    shortLabel: '第一桶金',
    icon: '🎯',
    component: markRaw(FirstGoalView)
  },
  {
    id: 'history',
    label: '歷史紀錄',
    shortLabel: '歷史',
    icon: '📅',
    component: markRaw(HistoryView)
  }
]
