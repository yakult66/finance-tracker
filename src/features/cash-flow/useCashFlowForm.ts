import { ref, computed } from 'vue'
import { useCashFlow } from './useCashFlow.js'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses.js'
import { useEmergencyFund } from '../emergency-fund/useEmergencyFund.js'
import type { CashFlowRecord } from '../../types.js'

export function useCashFlowForm() {
  const { records, addRecord, updateRecord, isRecordLocked, isPastMonth } = useCashFlow()
  const { fixedExpenseTotal } = useFixedExpenses()
  const { monthlyItems } = useEmergencyFund()

  const form = ref({
    month: '',
    income: null as number | null,
    saving: null as number | null,
    emergencyFund: null as number | null,
    otherFund: null as number | null,
  })

  const editingId = ref<string | null>(null)
  const error = ref('')
  const saved = ref(false)

  const activeFixedExpense = computed(() => {
    if (editingId.value) {
      const record = records.value.find(r => r.id === editingId.value)
      if (record && isRecordLocked(record.month)) {
        return record.fixedExpense
      }
    }
    // 未來的月份，或者還沒建立的新紀錄（依賴輸入的 month 判斷）
    if (form.value.month && isRecordLocked(form.value.month)) {
      // 保險起見
    }
    return fixedExpenseTotal.value
  })

  // 緊急備用金改為唯讀顯示，若鎖定則顯示歷史紀錄值，否則顯示目前啟用的緊急備用金總額
  const activeEmergencyFund = computed(() => {
    if (editingId.value) {
      const record = records.value.find(r => r.id === editingId.value)
      if (record && isRecordLocked(record.month)) {
        return record.emergencyFund
      }
    }
    return monthlyItems.value
      .filter(i => i.isEnabled)
      .reduce((acc, cur) => acc + cur.amount, 0)
  })

  const calculatedBalance = computed(() => {
    return (
      (form.value.income || 0) -
      activeFixedExpense.value -
      (form.value.saving || 0) -
      activeEmergencyFund.value -
      (form.value.otherFund || 0)
    )
  })

  // 只顯示當月及未來的紀錄，過期的在「紀錄查詢」歷史中顯示
  const activeRecords = computed(() => 
    records.value.filter(record => !isPastMonth(record.month))
  )

  const latest = computed(() => activeRecords.value[0])

  function handleMonthInput(value: string) {
    const normalized = value.replace(/[０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    form.value.month = normalized.replace(/[^\d]/g, '')
  }

  function editRecord(record: CashFlowRecord) {
    editingId.value = record.id
    form.value.month = record.month
    form.value.income = record.income || null
    form.value.saving = record.saving || null
    form.value.emergencyFund = record.emergencyFund || null // 僅供過渡或歷史顯示
    form.value.otherFund = record.otherFund || null
    error.value = ''
    saved.value = false
  }

  function cancelEdit() {
    editingId.value = null
    form.value.month = ''
    form.value.income = null
    form.value.saving = null
    form.value.emergencyFund = null
    form.value.otherFund = null
    error.value = ''
    saved.value = false
  }

  function submit() {
    if (!form.value.month.trim()) {
      error.value = '請輸入月份數字'
      return
    }
    if (!form.value.income) {
      error.value = '請輸入薪資收入'
      return
    }

    error.value = ''
    
    const formData = {
      month: form.value.month.trim(),
      income: form.value.income ?? 0,
      saving: form.value.saving ?? 0,
      emergencyFund: activeEmergencyFund.value,
      otherFund: form.value.otherFund ?? 0,
    }

    if (editingId.value) {
      updateRecord(editingId.value, formData)
    } else {
      addRecord(formData)
    }

    cancelEdit()

    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  }

  return {
    form,
    editingId,
    error,
    saved,
    calculatedBalance,
    latest,
    fixedExpenseTotal: activeFixedExpense,
    activeEmergencyFund,
    records: activeRecords,
    handleMonthInput,
    editRecord,
    cancelEdit,
    submit,
  }
}
