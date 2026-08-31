<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFixedExpenses } from './useFixedExpenses'
import type { FixedExpense, LargeExpense } from './interfaces'

const { 
  fixedExpenses, 
  largeExpenses, 
  addFixedExpense, 
  updateFixedExpense, 
  deleteFixedExpense, 
  addLargeExpense, 
  updateLargeExpense, 
  deleteLargeExpense,
  addAccumulatedAmount,
  totalFixedExpenses
} = useFixedExpenses()

// 一般支出表單狀態
const newFixedName = ref('')
const newFixedAmount = ref<number | null>(null)

const addFixed = () => {
  if (!newFixedName.value || !newFixedAmount.value) return
  addFixedExpense({ name: newFixedName.value, amount: newFixedAmount.value })
  newFixedName.value = ''
  newFixedAmount.value = null
}

// 臨時新增資金狀態
const tempAmounts = ref<Record<string, number>>({})

const submitTempAmount = (id: string) => {
  const amount = tempAmounts.value[id]
  if (amount && amount > 0) {
    addAccumulatedAmount(id, amount)
    tempAmounts.value[id] = 0
  }
}

// 大額支出表單狀態
const newLargeName = ref('')
const newLargeTotal = ref<number | null>(null)
const newLargeTargetMonth = ref<number>(new Date().getMonth() + 1)
const newLargeIsAveraged = ref(true)

const addLarge = () => {
  if (!newLargeName.value || !newLargeTotal.value || !newLargeTargetMonth.value) return
  addLargeExpense({
    name: newLargeName.value,
    totalAmount: newLargeTotal.value,
    accumulatedAmount: 0,
    targetMonth: newLargeTargetMonth.value,
    isAveraged: newLargeIsAveraged.value
  })
  newLargeName.value = ''
  newLargeTotal.value = null
  newLargeTargetMonth.value = new Date().getMonth() + 1
  newLargeIsAveraged.value = true
}

// 供模板計算差額的 Helper
const getRemaining = (exp: LargeExpense) => Math.max(0, exp.totalAmount - exp.accumulatedAmount)
</script>

<template>
  <div class="space-y-6">
    
    <!-- 一般固定支出區塊 -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 md:p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-800 flex items-center">
            <i class="pi pi-receipt text-rose-500 mr-2"></i>
            一般固定支出
          </h2>
          <div class="text-sm font-medium text-slate-500">
            總計：<span class="text-rose-500 font-bold">${{ totalFixedExpenses.toLocaleString() }}</span>
          </div>
        </div>

        <!-- 列表 -->
        <div class="space-y-3 mb-6">
          <div v-for="expense in fixedExpenses" :key="expense.id" 
               class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:border-slate-200 transition-colors group">
            
            <div class="flex items-center gap-3">
              <i v-if="expense.linkedLargeExpenseId" class="pi pi-link text-indigo-400 text-xs" title="由大額支出連動產生"></i>
              <div class="font-medium text-slate-700">{{ expense.name }}</div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="font-bold text-slate-800">
                <!-- 直接綁定 v-model 供快速修改，並隱藏原生上下箭頭 -->
                <input 
                  type="number" 
                  v-model.number="expense.amount" 
                  @blur="updateFixedExpense(expense.id, { amount: expense.amount })"
                  class="w-24 text-right bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none px-1 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                >
              </div>
              
              <button v-if="!expense.linkedLargeExpenseId" @click="deleteFixedExpense(expense.id)" class="text-slate-300 hover:text-rose-500 transition-colors">
                <i class="pi pi-trash"></i>
              </button>
            </div>

          </div>
          
          <div v-if="fixedExpenses.length === 0" class="text-center py-6 text-slate-400 text-sm">
            目前沒有固定支出項目
          </div>
        </div>

        <!-- 新增欄位 -->
        <div class="flex flex-col sm:flex-row gap-3 items-end bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
          <div class="flex-1 w-full space-y-1.5">
            <label class="text-xs font-medium text-slate-500">項目名稱</label>
            <input type="text" v-model="newFixedName" placeholder="例如：手機費、房租" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          </div>
          <div class="flex-1 w-full space-y-1.5">
            <label class="text-xs font-medium text-slate-500">金額</label>
            <input type="number" v-model="newFixedAmount" placeholder="金額" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
          </div>
          <button @click="addFixed" :disabled="!newFixedName || !newFixedAmount" class="w-full sm:w-auto h-10 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center">
            <i class="pi pi-plus mr-1.5"></i> 新增
          </button>
        </div>

      </div>
    </div>

    <!-- 大額支出區塊 -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 md:p-8">
        <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <i class="pi pi-car text-indigo-500 mr-2"></i>
          大額支出項目
        </h2>

        <!-- 列表 -->
        <div class="space-y-4 mb-8">
          <div v-for="expense in largeExpenses" :key="expense.id" 
               class="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 group">
            
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="font-bold text-slate-800 text-lg">{{ expense.name }}</div>
                <div class="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>
                    <i class="pi pi-calendar mr-1"></i>
                    預計繳款：{{ expense.paymentMonth.split('-')[0] }} 年 {{ parseInt(expense.paymentMonth.split('-')[1]) }} 月
                  </span>
                  <span v-if="expense.isAveraged" class="text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full"><i class="pi pi-sync mr-1 text-[10px]"></i>自動均攤中</span>
                  <span v-if="expense.lastProcessedMonth" class="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full"><i class="pi pi-check-circle mr-1 text-[10px]"></i>已扣 {{ expense.lastProcessedMonth }}</span>
                </div>
              </div>
              <button @click="deleteLargeExpense(expense.id)" class="text-slate-300 hover:text-rose-500 transition-colors">
                <i class="pi pi-trash"></i>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 items-end">
              <div>
                <div class="text-xs text-slate-400 mb-1">目標總金額</div>
                <div class="font-bold text-slate-700">${{ expense.totalAmount.toLocaleString() }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 mb-1">已有金額</div>
                <div class="font-bold text-indigo-600">${{ expense.accumulatedAmount.toLocaleString() }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-400 mb-1">還差多少</div>
                <div class="font-bold text-rose-500">${{ getRemaining(expense).toLocaleString() }}</div>
              </div>
              
              <!-- 臨時項目新增 -->
              <div>
                <div class="text-xs text-slate-400 mb-1">臨時存入</div>
                <div class="flex gap-2">
                  <input 
                    type="number" 
                    v-model.number="tempAmounts[expense.id]" 
                    placeholder="金額" 
                    class="w-full min-w-17.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm"
                  >
                  <button @click="submitTempAmount(expense.id)" :disabled="!tempAmounts[expense.id]" class="px-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                    <i class="pi pi-plus text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div v-if="largeExpenses.length === 0" class="text-center py-6 text-slate-400 text-sm">
            目前沒有大額支出項目
          </div>
        </div>

        <!-- 新增欄位 -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 class="text-sm font-bold text-slate-700 mb-4">新增大額支出</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-slate-500">項目名稱</label>
              <input type="text" v-model="newLargeName" placeholder="例如：保費、旅遊" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            </div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-slate-500">總金額</label>
              <input type="number" v-model="newLargeTotal" placeholder="總額" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-slate-500">每年繳款月份</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><i class="pi pi-calendar"></i></span>
                <select v-model="newLargeTargetMonth" class="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
                </select>
                <i class="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
              </div>
            </div>

            <div class="flex items-center h-10.5 px-2">
              <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium select-none">
                <input type="checkbox" v-model="newLargeIsAveraged" class="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500/20 border-slate-300">
                自動均攤至固定支出
              </label>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button @click="addLarge" :disabled="!newLargeName || !newLargeTotal || !newLargeTargetMonth" class="h-10 px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center">
              <i class="pi pi-plus mr-1.5"></i> 新增項目
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
