<script setup>
import { ref, computed, watch } from 'vue'
import { useReport } from './useReport.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'

const { records } = useCashFlow()
const { monthReportCsv, allMonthsCsv, backupJson, download } = useReport()

const selectedMonth = ref(records.value[0]?.month ?? '')
const done = ref('')

watch(records, (list) => {
  if (!list.some((r) => r.month === selectedMonth.value)) {
    selectedMonth.value = list[0]?.month ?? ''
  }
})

const hasRecords = computed(() => records.value.length > 0)

// 檔名裡的月份可能有斜線之類的字，換掉才不會被當成路徑
const safe = (s) => String(s).replace(/[\\/:*?"<>|]/g, '-')

function flash(message) {
  done.value = message
  setTimeout(() => (done.value = ''), 2000)
}

function exportMonth() {
  if (!selectedMonth.value) return
  download(
    `財務報表-${safe(selectedMonth.value)}.csv`,
    monthReportCsv(selectedMonth.value),
    'text/csv;charset=utf-8'
  )
  flash(`已匯出 ${selectedMonth.value} 報表`)
}

function exportAll() {
  download('財務報表-全部月份.csv', allMonthsCsv(), 'text/csv;charset=utf-8')
  flash('已匯出全部月份總表')
}

function exportBackup() {
  download('財務資料備份.json', backupJson(), 'application/json')
  flash('已匯出原始資料備份')
}
</script>

<template>
  <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-500">📤 報表匯出</h2>
      <span v-if="done" class="text-xs text-emerald-600 font-medium">{{ done }}</span>
    </div>

    <p class="text-xs text-slate-400">
      單月報表涵蓋現金流、固定費用明細、年度費用、零用金與第一桶金進度。
    </p>

    <template v-if="hasRecords">
      <div class="flex items-center gap-2">
        <select
          v-model="selectedMonth"
          class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option v-for="r in records" :key="r.id" :value="r.month">{{ r.month }}</option>
        </select>
        <button
          type="button"
          class="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition"
          @click="exportMonth"
        >
          匯出此月
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium transition"
          @click="exportAll"
        >
          全部月份總表 CSV
        </button>
        <button
          type="button"
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium transition"
          @click="exportBackup"
        >
          原始資料備份 JSON
        </button>
      </div>
    </template>

    <p v-else class="text-xs text-slate-400 py-1">
      尚無月份紀錄可匯出。
    </p>
  </section>
</template>
