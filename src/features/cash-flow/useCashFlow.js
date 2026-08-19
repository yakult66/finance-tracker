import { computed } from 'vue'
import { persistedList, nextId } from '../../shared/storage.js'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses.js'

// 這個 feature 擁有「月現金流紀錄」。固定費用不歸它管，
// 存檔時向 fixed-expense 要當下的合計與明細。

const RECORDS_KEY = 'finance_records'

const records = persistedList(RECORDS_KEY, {
  // 舊紀錄沒有 id / createdAt，載入時補上
  revive: (list) =>
    list.map((item) => ({
      ...item,
      id: item.id ?? nextId(),
      createdAt: item.createdAt ?? null
    }))
})

// 每月平均可累積金額（存錢 + 緊急預備金）
const averageMonthlySaving = computed(() => {
  if (records.value.length === 0) return 0
  const sum = records.value.reduce(
    (acc, cur) => acc + Number(cur.saving || 0) + Number(cur.emergencyFund || 0),
    0
  )
  return Math.round(sum / records.value.length)
})

// 所有月份累積下來的存錢與預備金
const accumulatedSaving = computed(() =>
  records.value.reduce(
    (acc, cur) => acc + Number(cur.saving || 0) + Number(cur.emergencyFund || 0),
    0
  )
)

function findByMonth(month) {
  return records.value.find((r) => r.month === month)
}

const { fixedExpenseTotal, breakdownSnapshot } = useFixedExpenses()

function addRecord(form) {
  // 固定費用一律取當下的項目加總，並留下當時的組成明細
  const fixedExpense = fixedExpenseTotal.value

  const record = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    month: form.month,
    income: Number(form.income) || 0,
    fixedExpense,
    fixedBreakdown: breakdownSnapshot(),
    saving: Number(form.saving) || 0,
    emergencyFund: Number(form.emergencyFund) || 0,
    otherFund: Number(form.otherFund) || 0,
    balance:
      (Number(form.income) || 0) -
      fixedExpense -
      (Number(form.saving) || 0) -
      (Number(form.emergencyFund) || 0) -
      (Number(form.otherFund) || 0)
  }
  records.value.unshift(record)
  return record
}

function removeRecord(id) {
  const index = records.value.findIndex((r) => r.id === id)
  if (index !== -1) records.value.splice(index, 1)
}

export function useCashFlow() {
  return {
    records,
    averageMonthlySaving,
    accumulatedSaving,
    findByMonth,
    addRecord,
    removeRecord
  }
}
