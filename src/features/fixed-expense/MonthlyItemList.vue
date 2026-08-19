<script setup>
import { ref } from 'vue'
import { useFixedExpenses } from './useFixedExpenses.js'

const {
  fixedRows,
  fixedExpenseTotal,
  addFixedItem,
  updateFixedItem,
  normalizeFixedItem,
  removeFixedItem
} = useFixedExpenses()

const draft = ref({ name: '', amount: null })
const error = ref('')

function submit() {
  if (!draft.value.name.trim()) {
    error.value = '請填寫項目名稱'
    return
  }
  if (!draft.value.amount) {
    error.value = '請填寫金額'
    return
  }
  error.value = ''
  addFixedItem({ name: draft.value.name, amount: draft.value.amount })
  draft.value.name = ''
  draft.value.amount = null
}

function remove(row) {
  if (confirm(`刪除「${row.name}」？`)) removeFixedItem(row.id)
}

function formatDue(value) {
  if (!value) return ''
  const [m, d] = value.split('-')
  return `${Number(m)}/${Number(d)}`
}
</script>

<template>
  <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-500">🧾 固定項目</h2>
      <span class="text-xs font-bold text-slate-700">
        合計 ${{ fixedExpenseTotal.toLocaleString() }}
      </span>
    </div>

    <div v-if="fixedRows.length" class="space-y-2">
      <div v-for="row in fixedRows" :key="row.source + row.id" class="flex items-center gap-2">
        <!-- 每月項目：名稱與金額可直接改 -->
        <template v-if="row.source === 'monthly'">
          <input
            :value="row.name"
            type="text"
            class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            @input="updateFixedItem(row.id, { name: $event.target.value })"
            @blur="normalizeFixedItem(row.id)"
          >
          <input
            :value="row.amount"
            type="number"
            class="w-24 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-indigo-500"
            @input="updateFixedItem(row.id, { amount: $event.target.value })"
            @blur="normalizeFixedItem(row.id)"
          >
          <button
            type="button"
            class="text-slate-300 hover:text-rose-500 p-1 text-xs shrink-0"
            :aria-label="`刪除 ${row.name}`"
            @click="remove(row)"
          >
            ✕
          </button>
        </template>

        <!-- 年度費用：自動出現在這裡，內容在年度區塊維護 -->
        <template v-else>
          <div
            class="flex-1 min-w-0 bg-slate-50/60 border border-dashed border-slate-200 rounded-lg px-3 py-2"
          >
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium shrink-0"
              >
                年度
              </span>
              <span class="text-sm text-slate-600 truncate">{{ row.name }}</span>
            </div>
            <div v-if="row.dueDate" class="text-[11px] text-slate-400 mt-0.5">
              {{ formatDue(row.dueDate) }} 繳款・年度 ${{ Number(row.yearly).toLocaleString() }}
            </div>
          </div>
          <div
            class="w-24 shrink-0 px-3 py-2 text-sm text-right text-slate-500"
            aria-readonly="true"
          >
            {{ Number(row.amount).toLocaleString() }}
          </div>
          <span class="p-1 text-xs shrink-0 w-[22px]" aria-hidden="true"></span>
        </template>
      </div>
    </div>

    <p v-else class="text-xs text-slate-400 py-2">
      尚無固定項目，固定費用目前算 $0。
    </p>

    <!-- 新增每月項目 -->
    <div class="flex items-center gap-2 pt-2 border-t border-slate-50">
      <input
        v-model="draft.name"
        type="text"
        placeholder="項目名稱（例: 房租）"
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
    <p class="text-[11px] text-slate-400">
      標示「年度」的項目由下方年度重大費用自動帶入，請在該區塊修改。
    </p>
  </section>
</template>
