<script setup lang="ts">
import { ref } from 'vue'
import { useEntertainmentFund } from './useEntertainmentFund'

const {
  fundData,
  accumulatedFromSalary,
  totalDeposits,
  totalExpenses,
  currentBalance,
  addTransaction,
  deleteTransaction
} = useEntertainmentFund()

// 表單狀態
const formType = ref<'deposit' | 'expense'>('deposit')
const formName = ref('')
const formAmount = ref<number | ''>('')
const formDate = ref(new Date().toISOString().split('T')[0])
const formError = ref('')

const handleAdd = () => {
  formError.value = ''
  if (!formName.value.trim()) {
    formError.value = '請輸入項目名稱'
    return
  }
  if (!formAmount.value || Number(formAmount.value) <= 0) {
    formError.value = '請輸入大於 0 的金額'
    return
  }

  addTransaction(
    formType.value,
    formName.value.trim(),
    Number(formAmount.value),
    formDate.value
  )

  formName.value = ''
  formAmount.value = ''
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- 概覽卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
          <i class="pi pi-wallet text-purple-500"></i> 薪資累積消費基金
        </div>
        <div class="text-2xl font-bold text-slate-800">
          ${{ accumulatedFromSalary.toLocaleString() }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-emerald-500 mb-1 flex items-center gap-1">
          <i class="pi pi-arrow-down-left"></i> 臨時增額總計
        </div>
        <div class="text-2xl font-bold text-emerald-600">
          +${{ totalDeposits.toLocaleString() }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-rose-500 mb-1 flex items-center gap-1">
          <i class="pi pi-arrow-up-right"></i> 臨時支出總計
        </div>
        <div class="text-2xl font-bold text-rose-600">
          -${{ totalExpenses.toLocaleString() }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
          <i class="pi pi-gift"></i> 娛樂基金目前總額
        </div>
        <div 
          class="text-2xl font-extrabold"
          :class="currentBalance >= 0 ? 'text-purple-600' : 'text-rose-600'"
        >
          ${{ currentBalance.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- 臨時增額 / 支出表單 -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
        <i class="pi pi-sliders-h text-purple-500"></i>
        娛樂基金臨時調整 (增額 / 支出)
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <!-- 類型 -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-600">調整類型</label>
          <select 
            v-model="formType" 
            class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="deposit">臨時增額 (+)</option>
            <option value="expense">臨時支出 (-)</option>
          </select>
        </div>

        <!-- 項目名稱 -->
        <div class="space-y-1 sm:col-span-2">
          <label class="text-xs font-semibold text-slate-600">項目名稱</label>
          <input 
            type="text" 
            v-model="formName"
            placeholder="例如: 門票收入 / 旅遊大額花費" 
            class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
        </div>

        <!-- 金額 -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-600">金額</label>
          <input 
            type="number" 
            v-model="formAmount"
            placeholder="金額" 
            class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
        </div>

        <!-- 新增按鈕 -->
        <div class="flex items-end">
          <button 
            @click="handleAdd"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors shadow-sm shadow-purple-500/20 flex items-center justify-center gap-1"
          >
            <i class="pi pi-plus"></i> 新增項目
          </button>
        </div>
      </div>

      <p v-if="formError" class="text-xs text-rose-500"><i class="pi pi-exclamation-circle mr-1"></i>{{ formError }}</p>
    </div>

    <!-- 調整明細列表 -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
          <i class="pi pi-list text-purple-500"></i>
          娛樂基金臨時調整明細 (共 {{ fundData.transactions.length }} 筆)
        </h2>
      </div>

      <div v-if="fundData.transactions.length === 0" class="p-8 text-center text-slate-400 text-sm">
        目前無任何娛樂基金臨時調整紀錄。
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div 
          v-for="tx in fundData.transactions" 
          :key="tx.id"
          class="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <span 
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              :class="tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
            >
              {{ tx.type === 'deposit' ? '增' : '支' }}
            </span>

            <div>
              <div class="text-sm font-bold text-slate-800">
                {{ tx.name }}
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ tx.date }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span 
              class="text-base font-extrabold"
              :class="tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ tx.type === 'deposit' ? '+' : '-' }}${{ Number(tx.amount || 0).toLocaleString() }}
            </span>

            <button 
              @click="deleteTransaction(tx.id)"
              class="text-slate-300 hover:text-rose-500 p-1.5 transition-colors"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
