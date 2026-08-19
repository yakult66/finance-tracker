import { computed } from 'vue'
import { useCashFlow } from '../cash-flow/useCashFlow'
import { useFirstGoal } from '../first-goal/useFirstGoal'
import { useAllowance } from '../allowance/useAllowance'
import type { HistoryEntry } from '../../types'

// 這個 feature 不擁有任何資料，只把別的 feature 產生的紀錄
// 合併成一條時間線，並把刪除轉交回原本的擁有者。

export function useHistory() {
  const { records, removeRecord } = useCashFlow()
  const { plans, removePlan } = useFirstGoal()
  const { allowanceItems, removeItemsOf } = useAllowance()

  const history = computed<HistoryEntry[]>(() => {
    const entries: HistoryEntry[] = [
      ...records.value.map((item): HistoryEntry => ({ kind: 'cashflow', ...item })),
      ...plans.value.map((item): HistoryEntry => ({ kind: 'plan', ...item }))
    ]
    return entries.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return b.createdAt.localeCompare(a.createdAt)
    })
  })

  function removeEntry(entry: HistoryEntry): void {
    if (entry.kind === 'cashflow') {
      removeRecord(entry.id)
      removeItemsOf(entry.month)
    } else {
      removePlan(entry.id)
    }
  }

  return { history, records, plans, allowanceItems, removeEntry }
}
