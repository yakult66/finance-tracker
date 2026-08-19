<script setup>
import { ref, computed } from 'vue'
import { useCashFlow } from './useCashFlow.js'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses.js'

const { records, addRecord } = useCashFlow()
const { fixedExpenseTotal } = useFixedExpenses()

// fixedExpense 不在表單裡：它是固定金額項目的加總，唯讀
const form = ref({
  month: '',
  income: null,
  saving: 5000,
  emergencyFund: 2000,
  otherFund: 1000
})

const error = ref('')
const saved = ref(false)

const calculatedBalance = computed(() => {
  return (
    (form.value.income || 0) -
    fixedExpenseTotal.value -
    (form.value.saving || 0) -
    (form.value.emergencyFund || 0) -
    (form.value.otherFund || 0)
  )
})

const latest = computed(() => records.value[0])

function submit() {
  if (!form.value.month.trim()) {
    error.value = '請填寫月份名稱'
    return
  }
  if (!form.value.income) {
    error.value = '請填寫月總收入'
    return
  }

  error.value = ''
  addRecord({ ...form.value, month: form.value.month.trim() })

  form.value.month = ''
  form.value.income = null

  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <div class="space-y-4">
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-500">📝 這個月的現金流</h2>
        <span
          v-if="saved"
          class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium"
        >
          已寫入歷史紀錄
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-xs text-slate-500 mb-1 block">月份名稱</label>
          <input
            v-model="form.month"
            type="text"
            placeholder="例: 8月"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">月總收入</label>
          <input
            v-model.number="form.income"
            type="number"
            placeholder="0"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">
            固定費用
            <span class="text-slate-300">（於固定支出設定）</span>
          </label>
          <div
            class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            aria-readonly="true"
          >
            ${{ fixedExpenseTotal.toLocaleString() }}
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">純存錢 / 投資</label>
          <input
            v-model.number="form.saving"
            type="number"
            placeholder="5000"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">緊急預備金</label>
          <input
            v-model.number="form.emergencyFund"
            type="number"
            placeholder="2000"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">其它基金 (旅遊等)</label>
          <input
            v-model.number="form.otherFund"
            type="number"
            placeholder="1000"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>
      </div>

      <div class="pt-1">
        <div class="bg-slate-50 rounded-xl p-2.5 flex items-baseline justify-between">
          <span class="text-xs text-slate-500">剩餘零用金</span>
          <span
            class="text-base font-bold"
            :class="calculatedBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            ${{ calculatedBalance.toLocaleString() }}
          </span>
        </div>
      </div>

      <p v-if="error" class="text-xs text-rose-500">{{ error }}</p>

      <button
        type="button"
        class="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium py-2.5 rounded-xl text-sm transition"
        @click="submit"
      >
        ➕ 加入紀錄
      </button>
    </section>

    <section
      v-if="latest"
      class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
    >
      <h2 class="text-sm font-semibold text-slate-500 mb-2">最近一筆</h2>
      <div class="flex items-baseline justify-between">
        <span class="font-bold text-slate-800">{{ latest.month }}</span>
        <span class="text-xs text-slate-500">
          收入 ${{ Number(latest.income).toLocaleString() }} ・ 結餘
          <span :class="latest.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'">
            ${{ Number(latest.balance).toLocaleString() }}
          </span>
        </span>
      </div>
      <p class="text-xs text-slate-400 mt-2">
        完整清單在「歷史紀錄」分頁。
      </p>
    </section>
  </div>
</template>
