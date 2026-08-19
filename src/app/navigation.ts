import { markRaw } from 'vue'
import type { Tab } from '../types'
import CashFlowView from '../features/cash-flow/CashFlowView.vue'
import FixedExpenseView from '../features/fixed-expense/FixedExpenseView.vue'
import AllowanceView from '../features/allowance/AllowanceView.vue'
import FirstGoalView from '../features/first-goal/FirstGoalView.vue'
import HistoryView from '../features/history/HistoryView.vue'

export const tabs: Tab[] = [
  {
    id: 'cashflow',
    label: '薪資分配',
    shortLabel: '薪資分配',
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
    label: '零用金',
    shortLabel: '零用金',
    icon: '💸',
    component: markRaw(AllowanceView)
  },
  {
    id: 'goal',
    label: '資產規劃',
    shortLabel: '資產規劃',
    icon: '🎯',
    component: markRaw(FirstGoalView)
  },
  {
    id: 'history',
    label: '紀錄查詢',
    shortLabel: '紀錄查詢',
    icon: '📝',
    component: markRaw(HistoryView)
  }
]
