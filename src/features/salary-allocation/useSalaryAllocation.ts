import { ref, computed, watch, onMounted } from 'vue'
import type { SalaryAllocation } from './interfaces'
import { useFixedExpenses } from '../fixed-expenses/useFixedExpenses'
import { useEmergencyFund } from '../emergency-fund/useEmergencyFund'
import { calculateUnspentAllowance } from '../pocket-money/usePocketMoney'

import { fetchApi } from '../../shared/api'

const STORAGE_KEY = 'finance_salary_allocation'
export const allocationsHistory = ref<SalaryAllocation[]>([])

// 初始載入與無痛資料轉移 (Migration + MongoDB Sync)
const loadHistory = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed) && parsed.month !== undefined) {
        allocationsHistory.value = [parsed]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
      } else if (Array.isArray(parsed)) {
        allocationsHistory.value = parsed
      }
    }

    // 連線 MongoDB 雲端資料庫進行同步
    const remoteData = await fetchApi<SalaryAllocation[]>('/api/salary-allocation')
    if (remoteData !== null) {
      allocationsHistory.value = remoteData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData))
    }
  } catch (e) {
    console.error('歷史紀錄載入失敗:', e)
  }
}
loadHistory()

export function useSalaryAllocation() {
  const isLoading = ref(false)
  const isSaved = ref(false)
  const errors = ref<Record<string, string>>({})

  // 當月設定草稿
  const draft = ref<SalaryAllocation>({
    month: new Date().getMonth() + 1,
    payday: new Date().toISOString().split('T')[0],
    income: 0,
    investment: 0,
    consumerFund: 0,
    allowance: 0,
    fixedExpenses: 0,
    emergencyFund: 0,
    previousBalance: 0,
    fixedExpensesSnapshot: []
  })

  // 輔助函式：推算「上月結餘 = 上月剩餘未花完零用金 + 上月淨額」
  const calculatePreviousBalance = (year: number, month: number): number => {
    let prevYear = year
    let prevMonth = month - 1
    if (prevMonth < 1) {
      prevMonth = 12
      prevYear = year - 1
    }

    const prevRecord = allocationsHistory.value.find(a => {
      const rYear = new Date(a.payday).getFullYear()
      return rYear === prevYear && a.month === prevMonth
    })

    if (!prevRecord) return 0

    const prevIncome = Number(prevRecord.income || 0)
    const prevPrevBal = Number(prevRecord.previousBalance || 0)
    const prevFixed = Number(prevRecord.fixedExpenses || 0)
    const prevEmergency = Number(prevRecord.emergencyFund || 0)
    const prevInv = Number(prevRecord.investment || 0)
    const prevCons = Number(prevRecord.consumerFund || 0)
    const prevAllow = Number(prevRecord.allowance || 0)

    // 上月淨額
    const prevNet = (prevIncome + prevPrevBal) - (prevFixed + prevEmergency + prevInv + prevCons + prevAllow)

    // 上月未花完零用金
    const unspent = calculateUnspentAllowance(prevYear, prevMonth, prevAllow)

    // 上月結餘 = 剩餘未花完零用金 + 上月淨額
    return unspent + prevNet
  }

  // 跨模組連動：自動同步固定支出總和
  const { fixedExpenses, totalFixedExpenses, processMonthlyPayment } = useFixedExpenses()
  watch(totalFixedExpenses, (newVal) => {
    if (!draft.value.fixedExpensesSnapshot || draft.value.fixedExpensesSnapshot.length === 0) {
      draft.value.fixedExpenses = newVal
    }
  }, { immediate: true })

  // 跨模組連動：自動同步緊急備用金每月存入總額
  const { activeMonthlyDepositTotal, processSalaryPayment } = useEmergencyFund()
  watch(activeMonthlyDepositTotal, (newVal) => {
    draft.value.emergencyFund = newVal
  }, { immediate: true })

  // 自動結算：淨額 = (收入 + 上月結餘) - (固定支出 + 緊急備用金 + 投資理財 + 消費基金 + 零用金)
  const netAmount = computed(() => {
    return (Number(draft.value.income || 0) + Number(draft.value.previousBalance || 0)) - 
           (Number(draft.value.fixedExpenses || 0) + Number(draft.value.emergencyFund || 0) + Number(draft.value.investment || 0) + Number(draft.value.consumerFund || 0) + Number(draft.value.allowance || 0))
  })

  // 相容舊語法
  const remainingAllowance = netAmount

  // 驗證表單
  const validate = () => {
    errors.value = {}
    
    if (!/^(1[0-2]|[1-9])$/.test(String(draft.value.month))) {
      errors.value.month = '請輸入正確的月份 (1-12)'
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(draft.value.payday))) {
      errors.value.payday = '發薪日格式錯誤 (年份只能為四碼)'
    }
    
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.income))) {
      errors.value.income = '薪資收入不可為負數'
    }
    
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.investment))) {
      errors.value.investment = '投資金額不可為負數'
    }
    
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.consumerFund))) {
      errors.value.consumerFund = '消費基金金額不可為負數'
    }

    if (!/^\d+(\.\d+)?$/.test(String(draft.value.allowance))) {
      errors.value.allowance = '零用金不可為負數'
    }
    
    return Object.keys(errors.value).length === 0
  }

  // 儲存至 LocalStorage 與 MongoDB Atlas (要求1: 按儲存後欄位值都清空/不要)
  const saveAllocation = async () => {
    if (!validate()) return

    isLoading.value = true
    isSaved.value = false
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const dataToSave: SalaryAllocation = {
        ...draft.value,
        createdAt: draft.value.createdAt || Date.now(),
        updatedAt: Date.now()
      }
      
      const year = new Date(dataToSave.payday).getFullYear()
      const existingIndex = allocationsHistory.value.findIndex(a => 
        new Date(a.payday).getFullYear() === year && a.month === dataToSave.month
      )
      
      if (existingIndex !== -1) {
        allocationsHistory.value[existingIndex] = dataToSave
      } else {
        dataToSave.id = crypto.randomUUID()
        allocationsHistory.value.push(dataToSave)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
      
      // 同步至 MongoDB Atlas 雲端資料庫
      await fetchApi('/api/salary-allocation', {
        method: 'POST',
        body: JSON.stringify(allocationsHistory.value)
      })
      isSaved.value = true
      
      const currentMonthStr = `${year}-${String(dataToSave.month).padStart(2, '0')}`
      processMonthlyPayment(currentMonthStr)
      processSalaryPayment(currentMonthStr)

      // 【需求1】按儲存後，將填寫欄位值清空
      draft.value.income = 0
      draft.value.investment = 0
      draft.value.consumerFund = 0
      draft.value.allowance = 0

      // 重新推算下一次的上月結餘
      draft.value.previousBalance = calculatePreviousBalance(year, draft.value.month)

      setTimeout(() => {
        isSaved.value = false
      }, 3000)
    } catch (e: any) {
      console.error('儲存失敗:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 從歷史紀錄載入特定月份的表單資料
  const loadDraftForCurrentMonth = () => {
    const year = new Date(draft.value.payday).getFullYear()
    const month = draft.value.month
    
    // 【需求3】推算上月結餘 = 上月零用金 + 上月淨額
    const calculatedPrevBalance = calculatePreviousBalance(year, month)

    const record = allocationsHistory.value.find(a => 
      new Date(a.payday).getFullYear() === year && a.month === month
    )
    
    if (record) {
      draft.value = { 
        ...record,
        allowance: record.allowance || 0,
        previousBalance: calculatedPrevBalance || record.previousBalance || 0,
        fixedExpensesSnapshot: record.fixedExpensesSnapshot ? [...record.fixedExpensesSnapshot] : []
      }
    } else {
      const snapshot = fixedExpenses.value.map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        amount: item.amount,
        linkedLargeExpenseId: item.linkedLargeExpenseId
      }))

      draft.value = {
        month: month,
        payday: draft.value.payday,
        income: 0,
        investment: 0,
        consumerFund: 0,
        allowance: 0,
        fixedExpenses: totalFixedExpenses.value,
        emergencyFund: draft.value.emergencyFund,
        previousBalance: calculatedPrevBalance,
        fixedExpensesSnapshot: snapshot
      }
    }
    isSaved.value = false
  }

  // 監聽年份與月份變化 (切換時自動讀取與推算上月結餘)
  watch(() => [draft.value.month, new Date(draft.value.payday).getFullYear()], (newVals, oldVals) => {
    if (newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1]) {
      loadDraftForCurrentMonth()
    }
  })

  // 監聽歷史紀錄變動，時時更新上月結餘推算
  watch(allocationsHistory, () => {
    const year = new Date(draft.value.payday).getFullYear()
    draft.value.previousBalance = calculatePreviousBalance(year, draft.value.month)
  }, { deep: true })

  onMounted(() => {
    loadDraftForCurrentMonth()
  })

  watch(draft, () => {
    isSaved.value = false
  }, { deep: true })

  return {
    draft,
    totalFixedExpenses,
    activeMonthlyDepositTotal,
    isLoading,
    isSaved,
    errors,
    netAmount,
    remainingAllowance,
    saveAllocation,
    allocationsHistory,
    loadDraftForCurrentMonth,
    calculatePreviousBalance
  }
}
