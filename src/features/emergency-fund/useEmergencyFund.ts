import { computed, watch } from 'vue'
import { persistedList, persistedNumber, nextId } from '../../shared/storage'
import { useCashFlow } from '../cash-flow/useCashFlow'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses'
import type { EmergencyFundItem, TransactionRecord } from '../../types'

const TARGET_KEY = 'ef_target'
const ITEMS_KEY = 'ef_items'
const TRANSACTIONS_KEY = 'ef_transactions'
const INITIAL_BALANCE_KEY = 'ef_initial_balance'

const targetAmount = persistedNumber(TARGET_KEY, 100000)
const initialBalance = persistedNumber(INITIAL_BALANCE_KEY, 0)
const monthlyItems = persistedList<EmergencyFundItem>(ITEMS_KEY)
const transactions = persistedList<TransactionRecord>(TRANSACTIONS_KEY)

const { records, accumulatedEmergencyFund } = useCashFlow()

// 餘額 = 初始資金 + 舊版預備金總和 + 新版在現金流紀錄中的加總 + 單次存入 - 單次支出
const balance = computed(() => {
  let sum = initialBalance.value + accumulatedEmergencyFund.value

  records.value.forEach((record) => {
    if (record.fixedBreakdown) {
      record.fixedBreakdown.forEach((b) => {
        if (b.name.startsWith('緊急備用金 - ')) {
          sum += b.amount
        }
      })
    }
  })

  transactions.value.forEach((t) => {
    if (t.type === 'in') {
      sum += t.amount
    } else {
      sum -= t.amount
    }
  })

  return sum
})


// 當餘額達到目標時，自動停用所有扣繳項目
watch(balance, (newVal) => {
  if (targetAmount.value > 0 && newVal >= targetAmount.value) {
    let changed = false
    monthlyItems.value.forEach((item) => {
      if (item.isEnabled) {
        item.isEnabled = false
        changed = true
      }
    })
    // 雖然改了 monthlyItems 會觸發 sync，但這是預期行為
  }
})

function addItem(name: string, amount: number) {
  monthlyItems.value.push({
    id: nextId(),
    name: name.trim() || '未命名',
    amount: amount || 0,
    isEnabled: true
  })
}

function removeItem(id: string) {
  const idx = monthlyItems.value.findIndex((i) => i.id === id)
  if (idx !== -1) monthlyItems.value.splice(idx, 1)
}

function addTransaction(description: string, amount: number, date: string, type: 'in' | 'out') {
  transactions.value.unshift({
    id: nextId(),
    description: description.trim() || (type === 'in' ? '單次存入' : '單次支出'),
    amount: amount || 0,
    date: date || new Date().toISOString().split('T')[0],
    type
  })
}

function removeTransaction(id: string) {
  const idx = transactions.value.findIndex((i) => i.id === id)
  if (idx !== -1) transactions.value.splice(idx, 1)
}

export function useEmergencyFund() {
  return {
    targetAmount,
    initialBalance,
    monthlyItems,
    transactions,
    balance,
    addItem,
    removeItem,
    addTransaction,
    removeTransaction
  }
}
