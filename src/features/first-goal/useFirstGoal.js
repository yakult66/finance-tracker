import { computed } from 'vue'
import { persistedList, persistedNumber, nextId } from '../../shared/storage.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'

// 這個 feature 擁有目標金額、保費專戶與規劃快照。
// 累積資產要靠 cash-flow 的紀錄，所以向它拿。

const PLANS_KEY = 'finance_plans'
const GOAL_KEY = 'finance_goal'
const INSURANCE_KEY = 'insurance_fund'

export const DEFAULT_GOAL = 1000000
export const INSURANCE_TARGET = 40000

const plans = persistedList(PLANS_KEY)
const goal = persistedNumber(GOAL_KEY, DEFAULT_GOAL)
const insuranceFund = persistedNumber(INSURANCE_KEY, 30000)

const { accumulatedSaving } = useCashFlow()

// 所有月份的「純存錢 + 緊急預備金」+ 保費專戶
const totalAssets = computed(
  () => accumulatedSaving.value + Number(insuranceFund.value || 0)
)

const remainingToGoal = computed(() => Math.max(0, goal.value - totalAssets.value))

const progressPercentage = computed(() => {
  if (!goal.value) return '0.0'
  const p = (totalAssets.value / goal.value) * 100
  return Math.min(100, Math.max(0, p)).toFixed(1)
})

// 按下「儲存這份規劃」時產生的快照
function addPlan(snapshot) {
  const plan = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...snapshot
  }
  plans.value.unshift(plan)
  return plan
}

function removePlan(id) {
  const index = plans.value.findIndex((p) => p.id === id)
  if (index !== -1) plans.value.splice(index, 1)
}

export function useFirstGoal() {
  return {
    plans,
    goal,
    insuranceFund,
    totalAssets,
    remainingToGoal,
    progressPercentage,
    addPlan,
    removePlan,
    INSURANCE_TARGET,
    DEFAULT_GOAL
  }
}
