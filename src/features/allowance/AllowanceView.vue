<script setup>
import { ref, computed, watch } from 'vue'
import { useAllowance } from './useAllowance.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'

const { records } = useCashFlow()
const {
  itemsOf,
  spent: spentOf,
  budget: budgetOf,
  left: leftOf,
  addItem,
  updateItem,
  normalizeItem,
  removeItem
} = useAllowance()

const selectedMonth = ref(records.value[0]?.month ?? '')

// 紀錄變動後若選到不存在的月份，退回最新一筆
watch(records, (list) => {
  if (!list.some((r) => r.month === selectedMonth.value)) {
    selectedMonth.value = list[0]?.month ?? ''
  }
})

const items = computed(() => itemsOf(selectedMonth.value))
const budget = computed(() => budgetOf(selectedMonth.value))
const spent = computed(() => spentOf(selectedMonth.value))
const left = computed(() => leftOf(selectedMonth.value))

const usedPercentage = computed(() => {
  if (budget.value <= 0) return 0
  return Math.min(100, Math.max(0, (spent.value / budget.value) * 100))
})

const draft = ref({ name: '', amount: null })
const error = ref('')

function submit() {
  if (!selectedMonth.value) {
    error.value = '請先到月現金流建立一筆紀錄'
    return
  }
  if (!draft.value.name.trim()) {
    error.value = '請填寫支出名稱'
    return
  }
  if (!draft.value.amount) {
    error.value = '請填寫金額'
    return
  }
  error.value = ''
  addItem({
    month: selectedMonth.value,
    name: draft.value.name,
    amount: draft.value.amount
  })
  draft.value.name = ''
  draft.value.amount = null
}

function remove(item) {
  if (confirm(`刪除「${item.name}」？`)) removeItem(item.id)
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="records.length === 0"
      class="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100"
    >
      還沒有月現金流紀錄。零用金額度來自現金流算出的剩餘餘額，請先到「月現金流計算」新增一筆。
    </div>

    <template v-else>
      <!-- 額度總覽 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h2 class="text-sm font-semibold text-slate-500">零用金額度</h2>
          <select
            v-model="selectedMonth"
            class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
          >
            <option v-for="r in records" :key="r.id" :value="r.month">{{ r.month }}</option>
          </select>
        </div>

        <div class="text-2xl font-bold" :class="left >= 0 ? 'text-slate-900' : 'text-rose-500'">
          ${{ left.toLocaleString() }}
        </div>
        <p class="text-xs text-slate-400 mt-0.5">可用餘額</p>

        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-3">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="left >= 0 ? 'bg-indigo-600' : 'bg-rose-500'"
            :style="{ width: usedPercentage + '%' }"
          ></div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-50">
          <div>
            <div class="text-xs text-slate-400">本月額度</div>
            <div class="text-sm font-bold text-slate-700">${{ budget.toLocaleString() }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">已支出</div>
            <div class="text-sm font-bold text-slate-700">${{ spent.toLocaleString() }}</div>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 mt-3">
          額度＝{{ selectedMonth }} 現金流的剩餘零用金，會隨該筆紀錄變動。
        </p>
      </section>

      <!-- 支出項目 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-500">💸 支出項目</h2>
          <span class="text-xs text-slate-400">{{ items.length }} 筆</span>
        </div>

        <div v-if="items.length" class="space-y-2">
          <div v-for="item in items" :key="item.id" class="flex items-center gap-2">
            <input
              :value="item.name"
              type="text"
              class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              @input="updateItem(item.id, { name: $event.target.value })"
              @blur="normalizeItem(item.id)"
            >
            <span class="text-[11px] text-slate-300 shrink-0 w-8 text-right">
              {{ formatTime(item.createdAt) }}
            </span>
            <input
              :value="item.amount"
              type="number"
              class="w-20 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-indigo-500"
              @input="updateItem(item.id, { amount: $event.target.value })"
              @blur="normalizeItem(item.id)"
            >
            <button
              type="button"
              class="text-slate-300 hover:text-rose-500 p-1 text-xs shrink-0"
              :aria-label="`刪除 ${item.name}`"
              @click="remove(item)"
            >
              ✕
            </button>
          </div>
        </div>

        <p v-else class="text-xs text-slate-400 py-2">
          尚無支出，額度全數可用。
        </p>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-50">
          <input
            v-model="draft.name"
            type="text"
            placeholder="支出名稱（例: 午餐）"
            class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            @keyup.enter="submit"
          >
          <input
            v-model.number="draft.amount"
            type="number"
            placeholder="金額"
            class="w-24 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-indigo-500"
            @keyup.enter="submit"
          >
          <button
            type="button"
            class="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-medium transition"
            @click="submit"
          >
            ＋
          </button>
        </div>

        <p v-if="error" class="text-xs text-rose-500">{{ error }}</p>
      </section>
    </template>
  </div>
</template>
