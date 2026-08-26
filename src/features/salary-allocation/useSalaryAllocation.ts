import { ref, computed, watch, onMounted } from 'vue'
import type { SalaryAllocation } from './interfaces'

const STORAGE_KEY = 'finance_salary_allocation'

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

  // 自動結算：剩餘零用金 = (收入 + 結餘) - (固定 + 緊急 + 投資 + 消費基金)
  const remainingAllowance = computed(() => {
    return (draft.value.income + draft.value.previousBalance) - 
           (draft.value.fixedExpenses + draft.value.emergencyFund + draft.value.investment + draft.value.consumerFund)
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
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      isSaved.value = true
      
      setTimeout(() => {
        isSaved.value = false
      }, 3000)
    } catch (e: any) {
      console.error('儲存失敗:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 從 LocalStorage 載入紀錄
  const loadAllocations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        draft.value = { ...draft.value, ...data }
      }
    } catch (e) {
      console.error('載入失敗:', e)
    }
  }

  onMounted(() => {
    loadAllocations()
  })

  // 如果使用者修改資料，就取消「已儲存」的綠色狀態
  watch(draft, () => {
    isSaved.value = false
  }, { deep: true })

  return {
    draft,
    isLoading,
    isSaved,
    errors,
    remainingAllowance,
    saveAllocation,
    loadAllocations
  }
}
