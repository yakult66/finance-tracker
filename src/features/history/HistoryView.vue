<script setup>
import { ref, computed } from 'vue'
import { useHistory } from './useHistory.js'
import ReportExport from '../report/ReportExport.vue'

const { history, records, plans, removeEntry } = useHistory()

const filters = [
  { id: 'all', label: '全部' },
  { id: 'cashflow', label: '月現金流' },
  { id: 'plan', label: '第一桶金規劃' }
]
const filter = ref('all')

const filtered = computed(() =>
  filter.value === 'all'
    ? history.value
    : history.value.filter((item) => item.kind === filter.value)
)

function formatDate(iso) {
  if (!iso) return '較早的紀錄'
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 實際刪哪一份資料由 useHistory 轉交給原本的擁有者
function remove(item) {
  if (!confirm('確定刪除這筆紀錄？')) return
  removeEntry(item)
}
</script>

<template>
  <div class="space-y-4">
    <ReportExport />

    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h2 class="text-sm font-semibold text-slate-500 mb-3">📅 歷史紀錄</h2>
      <div class="flex gap-2">
        <button
          v-for="item in filters"
          :key="item.id"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition"
          :class="
            filter === item.id
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          "
          @click="filter = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 text-center">
        <div>
          <div class="text-xs text-slate-400">現金流筆數</div>
          <div class="text-base font-bold text-slate-800">{{ records.length }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-400">規劃快照</div>
          <div class="text-base font-bold text-slate-800">{{ plans.length }}</div>
        </div>
      </div>
    </section>

    <div
      v-if="filtered.length === 0"
      class="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100"
    >
      目前尚無紀錄，去「月現金流計算」或「第一桶金規劃」新增一筆吧。
    </div>

    <div
      v-for="item in filtered"
      :key="item.kind + item.id"
      class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 space-y-2"
    >
      <div class="flex justify-between items-center border-b border-slate-50 pb-2">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
            :class="
              item.kind === 'cashflow'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-violet-100 text-violet-700'
            "
          >
            {{ item.kind === 'cashflow' ? '現金流' : '規劃' }}
          </span>
          <span class="font-bold text-slate-800 truncate">
            {{ item.kind === 'cashflow' ? item.month : `目標 $${item.goal.toLocaleString()}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-slate-300 hover:text-rose-500 p-1 text-xs shrink-0"
          aria-label="刪除此紀錄"
          @click="remove(item)"
        >
          ✕
        </button>
      </div>

      <div v-if="item.kind === 'cashflow'" class="grid grid-cols-3 gap-1 text-xs text-slate-500">
        <div>收入：<span class="font-medium text-slate-700">${{ Number(item.income).toLocaleString() }}</span></div>
        <div>存錢：<span class="font-medium text-slate-700">${{ Number(item.saving).toLocaleString() }}</span></div>
        <div>預備金：<span class="font-medium text-slate-700">${{ Number(item.emergencyFund).toLocaleString() }}</span></div>
        <div>
          固定費用：<span class="font-medium text-slate-700">${{ Number(item.fixedExpense).toLocaleString() }}</span>
          <span
            v-if="item.fixedBreakdown?.length"
            class="block text-[11px] text-slate-400 leading-snug"
          >
            {{ item.fixedBreakdown.map((f) => `${f.name} ${f.amount}`).join('、') }}
          </span>
        </div>
        <div>其它基金：<span class="font-medium text-slate-700">${{ Number(item.otherFund).toLocaleString() }}</span></div>
        <div>
          結餘：
          <span
            class="font-medium"
            :class="item.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            ${{ Number(item.balance).toLocaleString() }}
          </span>
        </div>
      </div>

      <div v-else class="grid grid-cols-3 gap-1 text-xs text-slate-500">
        <div>每月累積：<span class="font-medium text-slate-700">${{ item.monthlyPlan.toLocaleString() }}</span></div>
        <div>當時資產：<span class="font-medium text-slate-700">${{ item.totalAssets.toLocaleString() }}</span></div>
        <div>還差：<span class="font-medium text-slate-700">${{ item.remaining.toLocaleString() }}</span></div>
        <div class="col-span-3">
          預計達標：<span class="font-medium text-slate-700">
            {{ item.months === null ? '—' : `${item.months} 個月・${item.targetDateLabel}` }}
          </span>
        </div>
      </div>

      <div class="text-[11px] text-slate-300 pt-1">{{ formatDate(item.createdAt) }}</div>
    </div>
  </div>
</template>
