<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHistory } from './useHistory.js'
import ReportExport from '../report/ReportExport.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'

const { records, plans, allowanceItems, removeEntry } = useHistory()

const filterOptions = [
  { label: '現金流報表', value: 'cashflow' },
  { label: '零用金報表', value: 'allowance' },
  { label: '規劃快照', value: 'plan' }
]
const filter = ref('cashflow')

// --- Cash Flow Bar & Line Chart Data ---
const cashflowChartData = computed(() => {
  const sorted = [...records.value].sort((a, b) => parseInt(a.month) - parseInt(b.month))
  
  return {
    labels: sorted.map(r => `${r.month} 月`),
    datasets: [
      {
        type: 'bar',
        label: '總收入',
        backgroundColor: '#10b981', // emerald-500
        borderRadius: 6,
        barPercentage: 0.6,
        data: sorted.map(r => Number(r.income) || 0)
      },
      {
        type: 'bar',
        label: '總支出',
        backgroundColor: '#f43f5e', // rose-500
        borderRadius: 6,
        barPercentage: 0.6,
        data: sorted.map(r => 
          (Number(r.saving) || 0) + 
          (Number(r.emergencyFund) || 0) + 
          (Number(r.fixedExpense) || 0) + 
          (Number(r.otherFund) || 0)
        )
      },
      {
        type: 'line',
        label: '結餘趨勢',
        borderColor: '#6366f1', // indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.1)', // indigo-500 with opacity
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        data: sorted.map(r => Number(r.balance) || 0)
      }
    ]
  }
})

const cashflowChartOptions = ref({
  maintainAspectRatio: false,
  plugins: {
    tooltips: { mode: 'index', intersect: false },
    legend: { labels: { color: '#64748b', usePointStyle: true } }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'transparent', drawBorder: false }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#f8fafc', drawBorder: false }
    }
  }
})

// --- Allowance Pie Chart Data ---
const allowanceSummary = computed(() => {
  const map = new Map<string, number>()
  let total = 0
  allowanceItems.value.forEach(item => {
    map.set(item.name, (map.get(item.name) || 0) + item.amount)
    total += item.amount
  })
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  return { sorted, total }
})

const pieChartData = computed(() => {
  return {
    labels: allowanceSummary.value.sorted.map(i => i[0]),
    datasets: [
      {
        data: allowanceSummary.value.sorted.map(i => i[1]),
        backgroundColor: [
          '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', 
          '#8b5cf6', '#14b8a6', '#f97316', '#ef4444', '#64748b'
        ],
        borderWidth: 0
      }
    ]
  }
})

const pieChartOptions = ref({
  plugins: {
    legend: {
      position: 'right',
      labels: { color: '#64748b', usePointStyle: true }
    }
  }
})

function formatDate(iso: string) {
  if (!iso) return '較早的紀錄'
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function remove(item: any) {
  if (!confirm('確定刪除這筆紀錄？')) return
  removeEntry(item)
}
</script>

<template>
  <div class="space-y-4">
    <ReportExport />

    <!-- Segmented Control (Tabs) -->
    <div class="flex p-1 bg-slate-100/80 rounded-xl max-w-lg mx-auto mb-2">
      <button 
        v-for="opt in filterOptions"
        :key="opt.value"
        @click="filter = opt.value"
        class="flex-1 text-xs sm:text-sm font-bold py-2 rounded-lg transition-all duration-300"
        :class="filter === opt.value ? 'text-indigo-600 bg-white shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- ================= 現金流報表 ================= -->
    <div v-if="filter === 'cashflow'" class="space-y-4">
      <section v-if="records.length > 0" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 class="text-sm font-semibold text-slate-500 mb-3">📊 年度收支統計</h2>
        <div class="h-72 w-full">
          <Chart type="bar" :data="cashflowChartData" :options="cashflowChartOptions" class="h-full w-full" />
        </div>
      </section>

      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-hidden">
        <h2 class="text-sm font-semibold text-slate-500 mb-3">🧾 總帳表</h2>
        
        <div v-if="records.length === 0" class="text-center py-8 text-xs text-slate-400">
          目前尚無現金流紀錄，去「薪資分配」新增一筆吧。
        </div>
        
        <DataTable
          v-else
          :value="records"
          stripedRows
          scrollable
          class="text-sm"
          :pt="{
            table: { class: 'min-w-max w-full' },
            thead: { class: 'bg-slate-50' }
          }"
        >
          <Column field="month" header="月份" sortable>
            <template #body="{ data }"><span class="font-bold text-slate-700">{{ data.month }} 月</span></template>
          </Column>
          <Column field="income" header="收入">
            <template #body="{ data }"><span class="text-slate-600">${{ Number(data.income).toLocaleString() }}</span></template>
          </Column>
          <Column field="saving" header="存錢" class="hidden md:table-cell">
            <template #body="{ data }"><span class="text-slate-500">${{ Number(data.saving).toLocaleString() }}</span></template>
          </Column>
          <Column field="emergencyFund" header="預備金" class="hidden md:table-cell">
            <template #body="{ data }"><span class="text-slate-500">${{ Number(data.emergencyFund).toLocaleString() }}</span></template>
          </Column>
          <Column field="fixedExpense" header="固定支出">
            <template #body="{ data }"><span class="text-slate-500">${{ Number(data.fixedExpense).toLocaleString() }}</span></template>
          </Column>
          <Column field="balance" header="結餘">
            <template #body="{ data }">
              <span class="font-bold" :class="data.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                ${{ Number(data.balance).toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column header="操作" :exportable="false" style="min-width: 3rem">
            <template #body="{ data }">
              <Button icon="pi pi-trash" severity="danger" text rounded class="w-8 h-8 p-0" @click="remove(data)" />
            </template>
          </Column>
        </DataTable>
      </section>
    </div>

    <!-- ================= 零用金報表 ================= -->
    <div v-else-if="filter === 'allowance'" class="space-y-4">
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 class="text-sm font-semibold text-slate-500 mb-3">🥧 總花費佔比 (所有月份)</h2>
        <div v-if="allowanceItems.length === 0" class="text-center py-8 text-xs text-slate-400">
          目前尚無零用金紀錄，去「零用金」記一筆吧。
        </div>
        <div v-else class="flex flex-col md:flex-row items-center gap-6">
          <div class="w-full md:w-1/2 flex justify-center">
            <Chart type="pie" :data="pieChartData" :options="pieChartOptions" class="w-64 max-w-full" />
          </div>
          <div class="w-full md:w-1/2">
            <div class="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">
              總支出：<span class="text-rose-500">${{ allowanceSummary.total.toLocaleString() }}</span>
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
              <div v-for="(item, index) in allowanceSummary.sorted" :key="item[0]" class="flex justify-between items-center text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: pieChartData.datasets[0].backgroundColor[index % 10] }"></span>
                  <span class="text-slate-600 font-medium">{{ item[0] }}</span>
                </div>
                <span class="text-slate-800 font-bold">${{ item[1].toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================= 規劃快照 ================= -->
    <div v-else-if="filter === 'plan'" class="space-y-4">
      <div v-if="plans.length === 0" class="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
        目前尚無規劃紀錄，去「第一桶金」試算並儲存一份吧。
      </div>

      <div
        v-for="item in plans"
        :key="item.id"
        class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3"
      >
        <div class="flex justify-between items-center border-b border-slate-50 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 bg-violet-100 text-violet-700">
              規劃快照
            </span>
            <span class="font-bold text-slate-800 text-sm">
              目標 ${{ item.goal.toLocaleString() }}
            </span>
          </div>
          <Button icon="pi pi-times" severity="danger" text size="small" class="w-8 h-8 p-0" @click="remove(item)" />
        </div>

        <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-slate-500">
          <div>每月累積：<span class="font-medium text-slate-700">${{ item.monthlyPlan.toLocaleString() }}</span></div>
          <div>當時資產：<span class="font-medium text-slate-700">${{ item.totalAssets.toLocaleString() }}</span></div>
          <div>還差金額：<span class="font-medium text-slate-700">${{ item.remaining.toLocaleString() }}</span></div>
          <div class="col-span-2 bg-slate-50 p-2 rounded-lg mt-1">
            預計達標：<span class="font-bold text-indigo-600">
              {{ item.months === null ? '—' : `${item.months} 個月・${item.targetDateLabel}` }}
            </span>
          </div>
        </div>
        <div class="text-[11px] text-slate-300 pt-1">{{ formatDate(item.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>
