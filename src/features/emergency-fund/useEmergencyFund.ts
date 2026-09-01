import { ref, computed, watch } from 'vue'
import type { EmergencyGoal, EmergencyDepositPlan, EmergencyTransaction } from './interfaces'
import { fetchApi } from '../../shared/api'

const STORAGE_KEY = 'finance_emergency_funds'

const goals = ref<EmergencyGoal[]>([])
let isInitialized = false

// 提昇為全域 Computed，確保跨模組響應
const totalCurrentEmergencyFund = computed(() => {
  return goals.value.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0)
})

const totalTargetEmergencyFund = computed(() => {
  return goals.value.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0)
})

const overallProgress = computed(() => {
  if (totalTargetEmergencyFund.value <= 0) return 0
  return Math.min(100, Math.round((totalCurrentEmergencyFund.value / totalTargetEmergencyFund.value) * 100))
})

const activeMonthlyDepositTotal = computed(() => {
  return goals.value.reduce((sum, g) => {
    const activePlan = g.depositPlans.find(p => p.isActive)
    return sum + (activePlan ? Number(activePlan.amount) || 0 : 0)
  }, 0)
})

// 自動儲存至 LocalStorage 與 MongoDB Atlas (Module Singleton Watcher)
watch(goals, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
  fetchApi('/api/emergency-fund', {
    method: 'POST',
    body: JSON.stringify(newVal)
  })
}, { deep: true })

export function useEmergencyFund() {
  // 自動清理重複的發薪日存入紀錄並校正金額
  const deduplicateEmergencyTransactions = () => {
    let hasCleaned = false
    goals.value.forEach(goal => {
      const seenMonths = new Set<string>()
      const cleanedTransactions: EmergencyTransaction[] = []

      goal.transactions.forEach(tx => {
        if (tx.name === '每月定期存入 (發薪日)' && tx.type === 'deposit') {
          const monthKey = tx.date.substring(0, 7) // YYYY-MM
          if (seenMonths.has(monthKey)) {
            // 已存在同月份的發薪日存入紀錄，自動濾除重複項目
            hasCleaned = true
            return
          }
          seenMonths.add(monthKey)
        }
        cleanedTransactions.push(tx)
      })

      if (hasCleaned) {
        goal.transactions = cleanedTransactions
        const depositTotal = cleanedTransactions
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        const expenseTotal = cleanedTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        
        goal.currentAmount = Math.max(0, depositTotal - expenseTotal)
        goal.updatedAt = Date.now()
      }
    })

    if (hasCleaned) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals.value))
      fetchApi('/api/emergency-fund', {
        method: 'POST',
        body: JSON.stringify(goals.value)
      })
    }
  }

  const loadData = async () => {
    if (isInitialized) return
    isInitialized = true
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        goals.value = JSON.parse(stored)
      }

      // 同步 MongoDB Atlas 雲端資料
      const remoteGoals = await fetchApi<EmergencyGoal[]>('/api/emergency-fund')
      if (remoteGoals !== null) {
        goals.value = remoteGoals
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteGoals))
      }

      // 自動執行去重與校正
      deduplicateEmergencyTransactions()
    } catch (e) {
      console.error('載入緊急備用金失敗:', e)
    }
  }

  // 達標檢查：若已達標則自動將該目標底下所有每月存入設為停用
  const checkGoalCompletion = (goal: EmergencyGoal) => {
    if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
      goal.depositPlans.forEach(p => {
        p.isActive = false
      })
    }
  }

  // 目標 CRUD
  const addGoal = (name: string, targetAmount: number = 0) => {
    const newGoal: EmergencyGoal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      currentAmount: 0,
      depositPlans: [],
      transactions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    goals.value.push(newGoal)
  }

  const updateGoal = (id: string, updates: Partial<EmergencyGoal>) => {
    const goal = goals.value.find(g => g.id === id)
    if (goal) {
      Object.assign(goal, updates, { updatedAt: Date.now() })
      checkGoalCompletion(goal)
    }
  }

  const deleteGoal = (id: string) => {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value.splice(index, 1)
    }
  }

  // 每月存入設定 CRUD
  const addDepositPlan = (goalId: string, amount: number) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const newPlan: EmergencyDepositPlan = {
        id: crypto.randomUUID(),
        amount,
        isActive: false,
        isLocked: false,
        createdAt: Date.now()
      }
      goal.depositPlans.push(newPlan)
      goal.updatedAt = Date.now()
    }
  }

  const saveAndLockDepositPlan = (goalId: string, planId: string) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const plan = goal.depositPlans.find(p => p.id === planId)
      if (plan) {
        plan.isLocked = true
        goal.updatedAt = Date.now()
      }
    }
  }

  const toggleDepositPlanActive = (goalId: string, planId: string, isActive: boolean) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      goal.depositPlans.forEach(p => {
        if (p.id === planId) {
          p.isActive = isActive
        } else if (isActive) {
          // 單一啟用互斥：若此項啟用，其他自動停用
          p.isActive = false
        }
      })
      goal.updatedAt = Date.now()
    }
  }

  const deleteDepositPlan = (goalId: string, planId: string) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const index = goal.depositPlans.findIndex(p => p.id === planId)
      if (index !== -1) {
        goal.depositPlans.splice(index, 1)
        goal.updatedAt = Date.now()
      }
    }
  }

  // 臨時異動紀錄
  const addTransaction = (goalId: string, tx: Omit<EmergencyTransaction, 'id' | 'createdAt'>) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const newTx: EmergencyTransaction = {
        ...tx,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      }
      goal.transactions.push(newTx)
      
      if (tx.type === 'deposit') {
        goal.currentAmount += tx.amount
      } else {
        goal.currentAmount = Math.max(0, goal.currentAmount - tx.amount)
      }
      
      checkGoalCompletion(goal)
      goal.updatedAt = Date.now()
    }
  }

  // 發薪日自動結算 (具備雙重防重複存入保護)
  const processSalaryPayment = (currentMonthStr: string) => {
    goals.value.forEach(goal => {
      // 防呆保護 1：該月份已標記處理過
      if (goal.lastProcessedMonth === currentMonthStr) return

      // 防呆保護 2：檢查交易明細是否已有該月份發薪日存入紀錄
      const alreadyProcessed = goal.transactions.some(tx => 
        tx.type === 'deposit' && 
        tx.name === '每月定期存入 (發薪日)' && 
        tx.date.startsWith(currentMonthStr)
      )

      if (alreadyProcessed) {
        goal.lastProcessedMonth = currentMonthStr
        return
      }

      const activePlan = goal.depositPlans.find(p => p.isActive)
      if (activePlan && activePlan.amount > 0) {
        goal.currentAmount += activePlan.amount
        goal.transactions.push({
          id: crypto.randomUUID(),
          type: 'deposit',
          name: '每月定期存入 (發薪日)',
          amount: activePlan.amount,
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now()
        })
        goal.lastProcessedMonth = currentMonthStr
        checkGoalCompletion(goal)
        goal.updatedAt = Date.now()
      }
    })
  }

  loadData()

  return {
    goals,
    totalCurrentEmergencyFund,
    totalTargetEmergencyFund,
    overallProgress,
    activeMonthlyDepositTotal,
    addGoal,
    updateGoal,
    deleteGoal,
    addDepositPlan,
    saveAndLockDepositPlan,
    toggleDepositPlanActive,
    deleteDepositPlan,
    addTransaction,
    processSalaryPayment
  }
}
