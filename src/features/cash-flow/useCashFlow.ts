import { computed, watch } from 'vue'
import { persistedList, nextId } from '../../shared/storage'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses'
import type { CashFlowRecord, CashFlowForm } from '../../types'

const RECORDS_KEY = 'finance_records'

const records = persistedList<CashFlowRecord>(RECORDS_KEY, {
  revive: (list) =>
    list.map((item) => ({
      ...item,
      id: item.id ?? nextId(),
      createdAt: item.createdAt ?? null
    }))
})

const averageMonthlySaving = computed(() => {
  if (records.value.length === 0) return 0
  const sum = records.value.reduce(
    (acc, cur) => acc + Number(cur.saving || 0),
    0
  )
  return Math.round(sum / records.value.length)
})

// 單純的存錢 (供第一桶金使用)
const accumulatedPureSaving = computed(() =>
  records.value.reduce(
    (acc, cur) => acc + Number(cur.saving || 0),
    0
  )
)

// 歷史紀錄中的緊急備用金 (供緊急備用金初始餘額使用)
const accumulatedEmergencyFund = computed(() =>
  records.value.reduce(
    (acc, cur) => acc + Number(cur.emergencyFund || 0),
    0
  )
)

function findByMonth(month: string): CashFlowRecord | undefined {
  return records.value.find((r) => r.month === month)
}

const { fixedExpenseTotal, breakdownSnapshot } = useFixedExpenses()

export function isPastMonth(monthStr: string): boolean {
  const m = parseInt(monthStr, 10)
  if (isNaN(m) || m < 1 || m > 12) return false

  const now = new Date()
  const currentMonth = now.getMonth() + 1

  if (m === currentMonth) return false

  if (m < currentMonth) {
    return (currentMonth - m < 6)
  } else {
    return (m - currentMonth >= 6)
  }
}

export function isRecordLocked(monthStr: string): boolean {
  const m = parseInt(monthStr, 10)
  if (isNaN(m) || m < 1 || m > 12) return false

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDate = now.getDate()

  if (m === currentMonth) {
    return currentDate > 1
  }

  if (m < currentMonth) {
    return (currentMonth - m < 6)
  } else {
    return (m - currentMonth >= 6)
  }
}

// 連動變更未來月份的固定費用
watch(fixedExpenseTotal, (newTotal) => {
  records.value.forEach((record) => {
    if (!isRecordLocked(record.month)) {
      record.fixedExpense = newTotal
      record.fixedBreakdown = breakdownSnapshot()
      // 未來月份的 balance 不再重複扣除 emergencyFund (因為已在 newTotal 內)
      record.balance =
        (Number(record.income) || 0) -
        newTotal -
        (Number(record.saving) || 0) -
        (Number(record.otherFund) || 0)
    }
  })
})

function addRecord(form: CashFlowForm): CashFlowRecord {
  const fixedExpense = fixedExpenseTotal.value

  const record: CashFlowRecord = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    month: form.month,
    income: Number(form.income) || 0,
    fixedExpense,
    fixedBreakdown: breakdownSnapshot(),
    saving: Number(form.saving) || 0,
    // 新增紀錄時，緊急預備金欄位存入 0 (因為金額已經包含在 fixedExpense 中了)
    emergencyFund: 0,
    otherFund: Number(form.otherFund) || 0,
    balance:
      (Number(form.income) || 0) -
      fixedExpense -
      (Number(form.saving) || 0) -
      (Number(form.otherFund) || 0)
  }
  records.value.unshift(record)
  return record
}

function updateRecord(id: string, form: CashFlowForm): CashFlowRecord | undefined {
  const index = records.value.findIndex((r) => r.id === id)
  if (index === -1) return undefined
  
  const existing = records.value[index]
  
  // Update fields while keeping id, createdAt, fixedExpense and breakdown (unless we want to refresh them?)
  // Usually updating cash flow means updating the inputted numbers. 
  // Let's keep the historical fixed expense snapshot for consistency.
  
  const updated: CashFlowRecord = {
    ...existing,
    month: form.month,
    income: Number(form.income) || 0,
    saving: Number(form.saving) || 0,
    otherFund: Number(form.otherFund) || 0,
    balance:
      (Number(form.income) || 0) -
      (isRecordLocked(form.month) ? existing.fixedExpense : fixedExpenseTotal.value) -
      (Number(form.saving) || 0) -
      (isRecordLocked(form.month) ? existing.emergencyFund : 0) -
      (Number(form.otherFund) || 0)
  }
  
  if (!isRecordLocked(form.month)) {
    updated.fixedExpense = fixedExpenseTotal.value
    updated.fixedBreakdown = breakdownSnapshot()
    updated.emergencyFund = 0 // 未來紀錄歸零
  }
  
  records.value[index] = updated
  return updated
}

function removeRecord(id: string): void {
  const index = records.value.findIndex((r) => r.id === id)
  if (index !== -1) records.value.splice(index, 1)
}

export function useCashFlow() {
  return {
    records,
    averageMonthlySaving,
    accumulatedPureSaving,
    accumulatedEmergencyFund,
    findByMonth,
    addRecord,
    updateRecord,
    removeRecord,
    isRecordLocked,
    isPastMonth
  }
}
