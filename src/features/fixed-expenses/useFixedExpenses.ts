import { ref, watch, computed } from 'vue'
import type { FixedExpense, LargeExpense } from './interfaces'
import { fetchApi } from '../../shared/api'

const FIXED_STORAGE_KEY = 'finance_fixed_expenses'
const LARGE_STORAGE_KEY = 'finance_large_expenses'

const fixedExpenses = ref<FixedExpense[]>([])
const largeExpenses = ref<LargeExpense[]>([])
let isInitialized = false

// 提昇為全域 Computed，確保跨模組絕對響應
const totalFixedExpenses = computed(() => {
  return fixedExpenses.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

// 單例全域自動儲存至 LocalStorage 與 MongoDB Atlas
watch(fixedExpenses, (newVal) => {
  localStorage.setItem(FIXED_STORAGE_KEY, JSON.stringify(newVal))
  fetchApi('/api/fixed-expenses', {
    method: 'POST',
    body: JSON.stringify({ monthly: fixedExpenses.value, annual: largeExpenses.value })
  })
}, { deep: true })

watch(largeExpenses, (newVal) => {
  localStorage.setItem(LARGE_STORAGE_KEY, JSON.stringify(newVal))
  fetchApi('/api/fixed-expenses', {
    method: 'POST',
    body: JSON.stringify({ monthly: fixedExpenses.value, annual: largeExpenses.value })
  })
}, { deep: true })

export function useFixedExpenses() {
  // 檢查並執行自動展期 (Rollover)
  const checkAndRollover = () => {
    const now = new Date()
    const currentAbsoluteMonth = now.getFullYear() * 12 + (now.getMonth() + 1)
    let hasChanges = false

    largeExpenses.value.forEach(exp => {
      // 處理舊資料轉換，如果還有 paymentYear/targetMonth，轉回 paymentMonth
      if ((exp as any).paymentYear && (exp as any).targetMonth && !exp.paymentMonth) {
        const mm = String((exp as any).targetMonth).padStart(2, '0')
        exp.paymentMonth = `${(exp as any).paymentYear}-${mm}`
        delete (exp as any).paymentYear
        delete (exp as any).targetMonth
        hasChanges = true
      }

      // 遷移：如果舊資料沒有 isAveraged，預設補上 true (早期版本預設都是連動的)
      if (typeof exp.isAveraged === 'undefined') {
        exp.isAveraged = true
        hasChanges = true
      }

      if (!exp.paymentMonth) return

      const [pYear, pMonth] = exp.paymentMonth.split('-').map(Number)
      const targetAbsoluteMonth = pYear * 12 + pMonth

      // 如果目前時間已經「超過」了原訂的繳費月份，執行自動展期到明年
      if (currentAbsoluteMonth > targetAbsoluteMonth) {
        const newYear = pYear + 1
        const mm = String(pMonth).padStart(2, '0')
        exp.paymentMonth = `${newYear}-${mm}`
        exp.accumulatedAmount = 0 // 已有金額歸零
        exp.updatedAt = Date.now()
        hasChanges = true
      }
    })

    if (hasChanges) {
      largeExpenses.value.forEach(exp => syncLargeToFixed(exp))
    }
  }

  // 載入資料 (只在第一次被呼叫時執行)
  const loadData = async () => {
    if (isInitialized) return
    isInitialized = true
    try {
      const fixedStored = localStorage.getItem(FIXED_STORAGE_KEY)
      if (fixedStored) fixedExpenses.value = JSON.parse(fixedStored)

      const largeStored = localStorage.getItem(LARGE_STORAGE_KEY)
      if (largeStored) {
        largeExpenses.value = JSON.parse(largeStored)
        checkAndRollover()
      }

      // 同步 MongoDB 雲端資料
      const remoteData = await fetchApi<any>('/api/fixed-expenses')
      if (remoteData !== null) {
        if (Array.isArray(remoteData.monthly)) fixedExpenses.value = remoteData.monthly
        if (Array.isArray(remoteData.annual)) largeExpenses.value = remoteData.annual
        localStorage.setItem(FIXED_STORAGE_KEY, JSON.stringify(fixedExpenses.value))
        localStorage.setItem(LARGE_STORAGE_KEY, JSON.stringify(largeExpenses.value))
      }
    } catch (e) {
      console.error('Failed to load expenses:', e)
    }
  }

  // 輔助函式：推算目標年份
  const calculateTargetYear = (targetMonth: number): number => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    return targetMonth <= currentMonth ? currentYear + 1 : currentYear
  }

  // 輔助函式：計算到繳款前一個月還有幾期 (至少為 1)
  const calculateInstallments = (paymentMonthStr: string): number => {
    if (!paymentMonthStr) return 1
    const [pYear, pMonth] = paymentMonthStr.split('-').map(Number)
    const targetAbsoluteMonth = pYear * 12 + pMonth

    const now = new Date()
    const currentAbsoluteMonth = now.getFullYear() * 12 + (now.getMonth() + 1)

    // 到繳款當月的總月數差
    const diff = targetAbsoluteMonth - currentAbsoluteMonth
    
    // 存到前一個月，所以期數是 diff - 1
    const installments = diff - 1

    return installments > 0 ? installments : 1
  }

  // 核心：大額支出同步到一般固定支出
  const syncLargeToFixed = (largeExp: LargeExpense) => {
    // 尋找是否已經有連動的固定支出
    const existingIndex = fixedExpenses.value.findIndex(e => e.linkedLargeExpenseId === largeExp.id)
    
    if (largeExp.isAveraged) {
      const remainingAmount = largeExp.totalAmount - largeExp.accumulatedAmount
      const installments = calculateInstallments(largeExp.paymentMonth)
      const monthlyAmount = remainingAmount > 0 ? Math.ceil(remainingAmount / installments) : 0

      if (existingIndex !== -1) {
        // 更新現有的
        fixedExpenses.value[existingIndex].name = largeExp.name
        fixedExpenses.value[existingIndex].amount = monthlyAmount
        fixedExpenses.value[existingIndex].updatedAt = Date.now()
      } else {
        // 新增連動項目
        fixedExpenses.value.push({
          id: crypto.randomUUID(),
          name: largeExp.name,
          amount: monthlyAmount,
          linkedLargeExpenseId: largeExp.id,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }
    } else {
      // 若取消平均分攤，則刪除對應的一般固定支出
      if (existingIndex !== -1) {
        fixedExpenses.value.splice(existingIndex, 1)
      }
    }
  }

  // 一般固定支出 CRUD
  const addFixedExpense = (expense: Omit<FixedExpense, 'id'>) => {
    fixedExpenses.value.push({
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    const index = fixedExpenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      fixedExpenses.value[index] = {
        ...fixedExpenses.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const deleteFixedExpense = (id: string) => {
    const index = fixedExpenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      fixedExpenses.value.splice(index, 1)
    }
  }

  // 大額支出 CRUD
  const addLargeExpense = (expense: Omit<LargeExpense, 'id' | 'paymentMonth'> & { targetMonth: number }) => {
    const pYear = calculateTargetYear(expense.targetMonth)
    const pMonthStr = String(expense.targetMonth).padStart(2, '0')
    const newExpense: LargeExpense = {
      ...expense,
      id: crypto.randomUUID(),
      paymentMonth: `${pYear}-${pMonthStr}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    // 移除 targetMonth 屬性 (因為在 spread 中被包進去了，手動清掉)
    delete (newExpense as any).targetMonth

    largeExpenses.value.push(newExpense)
    syncLargeToFixed(newExpense)
  }

  const updateLargeExpense = (id: string, updates: Partial<LargeExpense> & { targetMonth?: number }) => {
    const index = largeExpenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      // 若更新了目標月份，需重新推算年份並組合成 paymentMonth
      let updatedPaymentMonth = largeExpenses.value[index].paymentMonth
      if (updates.targetMonth) {
        const pYear = calculateTargetYear(updates.targetMonth)
        const pMonthStr = String(updates.targetMonth).padStart(2, '0')
        updatedPaymentMonth = `${pYear}-${pMonthStr}`
      }

      const updated = {
        ...largeExpenses.value[index],
        ...updates,
        paymentMonth: updatedPaymentMonth,
        updatedAt: Date.now()
      }
      delete (updated as any).targetMonth

      largeExpenses.value[index] = updated
      syncLargeToFixed(updated)
    }
  }

  const deleteLargeExpense = (id: string) => {
    const index = largeExpenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      // 刪除大額時，也刪除連動的固定支出
      const existingFixedIndex = fixedExpenses.value.findIndex(e => e.linkedLargeExpenseId === id)
      if (existingFixedIndex !== -1) {
        fixedExpenses.value.splice(existingFixedIndex, 1)
      }
      largeExpenses.value.splice(index, 1)
    }
  }

  // 大額支出臨時注入資金
  const addAccumulatedAmount = (id: string, amount: number) => {
    if (amount <= 0) return
    const index = largeExpenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      const exp = largeExpenses.value[index]
      exp.accumulatedAmount += amount
      exp.updatedAt = Date.now()
      // 重新計算均攤金額
      syncLargeToFixed(exp)
    }
  }

  // 發薪日自動結算：掃描所有自動均攤的大額支出，將本月的均攤金存入
  const processMonthlyPayment = (currentMonthStr: string) => {
    let hasChanges = false
    largeExpenses.value.forEach(exp => {
      // 只有「自動均攤」且「本月尚未結算過」的項目才處理
      if (exp.isAveraged && exp.lastProcessedMonth !== currentMonthStr) {
        // 找出對應的一般固定支出項目 (即本月的均攤金額)
        // 考量防呆：如果使用者以前不小心把一般固定支出刪掉了，這裡有可能找不到，因此加入容錯
        const linkedFixed = fixedExpenses.value.find(f => f.linkedLargeExpenseId === exp.id)
        
        // 若找不到 linkedFixed，但它是 isAveraged，我們仍需用原本的均攤公式強行扣款
        const amountToDeduct = linkedFixed ? linkedFixed.amount : (exp.totalAmount - exp.accumulatedAmount) > 0 ? Math.ceil((exp.totalAmount - exp.accumulatedAmount) / calculateInstallments(exp.paymentMonth)) : 0

        if (amountToDeduct > 0) {
          exp.accumulatedAmount += amountToDeduct
          exp.lastProcessedMonth = currentMonthStr
          exp.updatedAt = Date.now()
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      largeExpenses.value.forEach(exp => syncLargeToFixed(exp))
    }
  }

  // 初始載入
  loadData()

  return {
    fixedExpenses,
    largeExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addLargeExpense,
    updateLargeExpense,
    deleteLargeExpense,
    addAccumulatedAmount,
    processMonthlyPayment,
    calculateInstallments,
    totalFixedExpenses
  }
}
