import { computed } from 'vue'
import { useCashFlow } from '../cash-flow/useCashFlow.js'
import { useFirstGoal } from '../first-goal/useFirstGoal.js'

// 這個 feature 不擁有任何資料，只把別的 feature 產生的紀錄
// 合併成一條時間線，並把刪除轉交回原本的擁有者。

export function useHistory() {
  const { records, removeRecord } = useCashFlow()
  const { plans, removePlan } = useFirstGoal()

  const history = computed(() => {
    const entries = [
      ...records.value.map((item) => ({ kind: 'cashflow', ...item })),
      ...plans.value.map((item) => ({ kind: 'plan', ...item }))
    ]
    return entries.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return b.createdAt.localeCompare(a.createdAt)
    })
  })

  function removeEntry(entry) {
    if (entry.kind === 'cashflow') removeRecord(entry.id)
    else removePlan(entry.id)
  }

  return { history, records, plans, removeEntry }
}
