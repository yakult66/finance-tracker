import { ref, computed, watch, onMounted } from 'vue'
import type { SalaryAllocation } from './interfaces'
import { useFixedExpenses } from '../fixed-expenses/useFixedExpenses'

const STORAGE_KEY = 'finance_salary_allocation'
const allocationsHistory = ref<SalaryAllocation[]>([])

// 初始載入與無痛資料轉移 (Migration)
const loadHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 如果是舊版單一物件，轉成陣列
      if (!Array.isArray(parsed) && parsed.month !== undefined) {
        allocationsHistory.value = [parsed]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
      } else if (Array.isArray(parsed)) {
        allocationsHistory.value = parsed
      }
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
    fixedExpenses: 0,
    emergencyFund: 0,
    previousBalance: 0
  })

  // 跨模組連動：自動同步固定支出總和與發薪日扣款
  const { totalFixedExpenses, processMonthlyPayment } = useFixedExpenses()
  watch(totalFixedExpenses, (newVal) => {
    draft.value.fixedExpenses = newVal
  }, { immediate: true })

  // 自動結算：剩餘零用金 = (收入 + 結餘) - (固定 + 緊急 + 投資 + 消費基金)
  const remainingAllowance = computed(() => {
    return (draft.value.income + draft.value.previousBalance) - 
           (totalFixedExpenses.value + draft.value.emergencyFund + draft.value.investment + draft.value.consumerFund)
  })

  // 驗證表單
  const validate = () => {
    errors.value = {}
    
    // 月份：1 到 12
    if (!/^(1[0-2]|[1-9])$/.test(String(draft.value.month))) {
      errors.value.month = '請輸入正確的月份 (1-12)'
    }
    
    // 發薪日：YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(draft.value.payday))) {
      errors.value.payday = '發薪日格式錯誤 (年份只能為四碼)'
    }
    
    // 金額：非負整數或浮點數
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.income))) {
      errors.value.income = '薪資收入不可為負數'
    }
    
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.investment))) {
      errors.value.investment = '投資金額不可為負數'
    }
    
    if (!/^\d+(\.\d+)?$/.test(String(draft.value.consumerFund))) {
      errors.value.consumerFund = '消費基金金額不可為負數'
    }
    
    return Object.keys(errors.value).length === 0
  }

  // 儲存至 LocalStorage
  const saveAllocation = async () => {
    if (!validate()) return

    isLoading.value = true
    isSaved.value = false
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const dataToSave = {
        ...draft.value,
        createdAt: draft.value.createdAt || Date.now(),
        updatedAt: Date.now()
      }
      
      const year = new Date(dataToSave.payday).getFullYear()
      const existingIndex = allocationsHistory.value.findIndex(a => 
        new Date(a.payday).getFullYear() === year && a.month === dataToSave.month
      )
      
      if (existingIndex !== -1) {
        // 更新現有月份紀錄
        allocationsHistory.value[existingIndex] = dataToSave
      } else {
        // 新增全新月份紀錄
        dataToSave.id = crypto.randomUUID()
        allocationsHistory.value.push(dataToSave)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allocationsHistory.value))
      isSaved.value = true
      
      // 觸發大額支出的自動扣款 (防呆：內部會檢查 lastProcessedMonth)
      const currentMonthStr = `${year}-${String(dataToSave.month).padStart(2, '0')}`
      processMonthlyPayment(currentMonthStr)

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
    const record = allocationsHistory.value.find(a => 
      new Date(a.payday).getFullYear() === year && a.month === month
    )
    
    if (record) {
      // 找到歷史紀錄，將金額帶入表單
      draft.value = { ...record }
    } else {
      // 全新月份，清空金額，保留當前年月設定與固定支出連動
      draft.value = {
        month: month,
        payday: draft.value.payday,
        income: 0,
        investment: 0,
        consumerFund: 0,
        fixedExpenses: draft.value.fixedExpenses, // 保留不洗掉，因外部有 watch 在連動
        emergencyFund: 0,
        previousBalance: 0
      }
    }
    // 切換月份後，將儲存狀態歸零
    isSaved.value = false
  }

  // 監聽年份與月份變化 (切換時自動讀取)
  watch(() => [draft.value.month, new Date(draft.value.payday).getFullYear()], (newVals, oldVals) => {
    // 只有當月份或年份真的改變時才觸發 (避免其他屬性變更誤觸)
    if (newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1]) {
      loadDraftForCurrentMonth()
    }
  })

  // 元件掛載時，先根據預設月份載入一次
  onMounted(() => {
    loadDraftForCurrentMonth()
  })

  // 如果使用者修改資料，就取消「已儲存」的綠色狀態
  watch(draft, () => {
    isSaved.value = false
  }, { deep: true })

  return {
    draft,
    totalFixedExpenses,
    isLoading,
    isSaved,
    errors,
    remainingAllowance,
    saveAllocation,
    allocationsHistory
  }
}
