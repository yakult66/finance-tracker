<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePocketMoney, type PocketMoneyMonthRecord } from './usePocketMoney'

const {
  pocketMoneyRecords,
  calculateUnspentAllowance,
  getCategoryStatistics
} = usePocketMoney()

// 依月份降冪排序 (新月份在前)
const sortedHistoryRecords = computed(() => {
  return [...pocketMoneyRecords.value].sort((a, b) => {
    const absA = a.year * 12 + a.month
    const absB = b.year * 12 + b.month
    return absB - absA
  })
})

// 展開明細狀態
const expandedRecords = ref<Record<string, boolean>>({})

const toggleExpand = (id: string) => {
  expandedRecords.value[id] = !expandedRecords.value[id]
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- 頂部說明 -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i class="pi pi-history text-indigo-500"></i>
          零用金歷史紀錄 (唯讀檢視)
        </h2>
        <p class="text-xs text-slate-500 mt-1">檢視過往各月份零用金額度、實際收支明細與花費類別佔比 (不可編輯)。</p>
      </div>
      <div class="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-center">
        <div class="text-xs text-slate-400 font-medium">紀錄月數</div>
        <div class="text-lg font-bold text-indigo-600">{{ sortedHistoryRecords.length }} 個月</div>
      </div>
    </div>

    <!-- 無紀錄提示 -->
    <div v-if="sortedHistoryRecords.length === 0" class="bg-white rounded-3xl border border-slate-100 p-12 text-center">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        <i class="pi pi-inbox"></i>
      </div>
      <h3 class="text-base font-bold text-slate-700">尚無零用金歷史紀錄</h3>
      <p class="text-xs text-slate-400 mt-1">在當月新增零用金收支項目後，紀錄即會顯示於此。</p>
    </div>

    <!-- 歷史紀錄列表 (不可編輯) -->
    <div v-else class="space-y-4">
      <div 
        v-for="record in sortedHistoryRecords" 
        :key="record.id || `${record.year}-${record.month}`"
        class="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="bg-indigo-50 text-indigo-600 font-bold px-3.5 py-1.5 rounded-xl text-sm">
            {{ record.year }} 年 {{ record.month }} 月
          </div>

          <div class="text-xs text-slate-400 font-medium">
            唯讀紀錄
          </div>
        </div>

        <!-- 數據統計區 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div class="text-[11px] text-slate-500 font-medium mb-0.5">薪資帶入零用金</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.allocatedAllowance || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/50">
            <div class="text-[11px] text-emerald-600 font-medium mb-0.5">總收入</div>
            <div class="text-sm font-bold text-emerald-700">
              +${{ record.transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0).toLocaleString() }}
            </div>
          </div>

          <div class="bg-rose-50/60 p-3 rounded-2xl border border-rose-100/50">
            <div class="text-[11px] text-rose-600 font-medium mb-0.5">總支出</div>
            <div class="text-sm font-bold text-rose-700">
              -${{ getCategoryStatistics(record.transactions).totalExpense.toLocaleString() }}
            </div>
          </div>

          <div class="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100/50">
            <div class="text-[11px] text-indigo-600 font-medium mb-0.5">未花完剩餘零用金</div>
            <div 
              class="text-sm font-extrabold"
              :class="calculateUnspentAllowance(record) >= 0 ? 'text-indigo-700' : 'text-rose-600'"
            >
              ${{ calculateUnspentAllowance(record).toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- 各類別花費與佔比區 -->
        <div class="mt-4 pt-3 border-t border-slate-100">
          <div class="text-xs font-bold text-slate-700 mb-2">類別花費與佔比統計：</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div 
              v-for="stat in getCategoryStatistics(record.transactions).stats" 
              :key="stat.category"
              class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs"
            >
              <div class="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                <span>{{ stat.category }}</span>
                <span>{{ stat.percentage }}%</span>
              </div>
              <div class="text-slate-800 font-bold mt-1">
                ${{ stat.amount.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 收支明細展開/收起 -->
        <div v-if="record.transactions.length > 0" class="mt-4 pt-3 border-t border-slate-100">
          <button 
            @click="toggleExpand(record.id || `${record.year}-${record.month}`)"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 focus:outline-none"
          >
            <i class="pi text-[10px]" :class="expandedRecords[record.id || `${record.year}-${record.month}`] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            {{ expandedRecords[record.id || `${record.year}-${record.month}`] ? '收起收支明細' : `檢視當月收支明細 (${record.transactions.length} 筆)` }}
          </button>

          <div v-if="expandedRecords[record.id || `${record.year}-${record.month}`]" class="mt-3 space-y-2 bg-slate-50 p-3 rounded-2xl">
            <div 
              v-for="tx in record.transactions" 
              :key="tx.id"
              class="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="tx.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
                >
                  {{ tx.type === 'expense' ? '支出' : '收入' }}
                </span>
                <span class="font-bold text-slate-800">{{ tx.name }}</span>
                <span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{{ tx.category }}</span>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-slate-400 text-[11px]">{{ tx.date }}</span>
                <span 
                  class="font-extrabold"
                  :class="tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'"
                >
                  {{ tx.type === 'expense' ? '-' : '+' }}${{ Number(tx.amount || 0).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
