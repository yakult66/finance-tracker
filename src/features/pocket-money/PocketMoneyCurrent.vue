<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  usePocketMoney, 
  POCKET_CATEGORIES, 
  getAllocatedAllowanceFromSalary,
  type PocketCategory 
} from './usePocketMoney'

const {
  getOrCreateMonthRecord,
  addTransaction,
  deleteTransaction,
  calculateUnspentAllowance,
  getCategoryStatistics
} = usePocketMoney()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

// 當月紀錄
const currentRecord = computed(() => {
  return getOrCreateMonthRecord(currentYear.value, currentMonth.value)
})

// 當月薪資分配帶入之零用金 (即時動態連動)
const allocatedAllowance = computed(() => {
  const salaryVal = getAllocatedAllowanceFromSalary(currentYear.value, currentMonth.value)
  return salaryVal > 0 ? salaryVal : (currentRecord.value.allocatedAllowance || 0)
})

// 當月統計
const unspentAllowance = computed(() => calculateUnspentAllowance(currentRecord.value))
const categoryStats = computed(() => getCategoryStatistics(currentRecord.value.transactions))

const totalIncome = computed(() => {
  return currentRecord.value.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
})

// 新增明細表單
const formType = ref<'expense' | 'income'>('expense')
const formCategory = ref<PocketCategory>('餐費')
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

  addTransaction(currentYear.value, currentMonth.value, {
    type: formType.value,
    category: formCategory.value,
    name: formName.value.trim(),
    amount: Number(formAmount.value),
    date: formDate.value
  })

  // 重置表單
  formName.value = ''
  formAmount.value = ''
}

const handleDelete = (txId: string) => {
  deleteTransaction(currentYear.value, currentMonth.value, txId)
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- 頂部概覽卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
          <i class="pi pi-wallet text-indigo-500"></i> 本月薪資分配零用金
        </div>
        <div class="text-2xl font-bold text-slate-800">
          ${{ allocatedAllowance.toLocaleString() }}
        </div>
        <p v-if="allocatedAllowance === 0" class="text-[10px] text-amber-600 font-medium mt-1">
          💡 請至「當月薪資配置」設定零用金並點選儲存
        </p>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-emerald-500 mb-1 flex items-center gap-1">
          <i class="pi pi-arrow-down-left"></i> 本月總收入
        </div>
        <div class="text-2xl font-bold text-emerald-600">
          +${{ totalIncome.toLocaleString() }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-rose-500 mb-1 flex items-center gap-1">
          <i class="pi pi-arrow-up-right"></i> 本月總支出
        </div>
        <div class="text-2xl font-bold text-rose-600">
          -${{ categoryStats.totalExpense.toLocaleString() }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div class="text-xs font-semibold text-indigo-500 mb-1 flex items-center gap-1">
          <i class="pi pi-sparkles"></i> 剩餘可動用零用金
        </div>
        <div 
          class="text-2xl font-extrabold"
          :class="unspentAllowance >= 0 ? 'text-indigo-600' : 'text-rose-600'"
        >
          ${{ unspentAllowance.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- 類別花費與佔比統計區 -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
        <i class="pi pi-chart-bar text-indigo-500"></i>
        各類別花費統計與佔比
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div 
          v-for="stat in categoryStats.stats" 
          :key="stat.category"
          class="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 space-y-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">{{ stat.category }}</span>
            <span class="text-xs font-semibold text-indigo-600">{{ stat.percentage }}%</span>
          </div>

          <div class="text-lg font-bold text-slate-800">
            ${{ stat.amount.toLocaleString() }}
          </div>

          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              class="bg-indigo-500 h-full rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(stat.percentage, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增收支明細表單 -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
        <i class="pi pi-plus-circle text-emerald-500"></i>
        新增當月零用金收支項目
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <!-- 類型 -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-600">收支類型</label>
          <select v-model="formType" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500">
            <option value="expense">支出 (-)</option>
            <option value="income">收入 (+)</option>
          </select>
        </div>

        <!-- 類別 (只能從固定選單選) -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-600">固定類別</label>
          <select v-model="formCategory" class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500">
            <option v-for="cat in POCKET_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- 名稱 -->
        <div class="space-y-1 col-span-1 sm:col-span-2">
          <label class="text-xs font-semibold text-slate-600">項目名稱</label>
          <input 
            type="text" 
            v-model="formName"
            placeholder="例如: 午餐便當 / 悠遊卡加值" 
            class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>

        <!-- 金額 -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-600">金額</label>
          <input 
            type="number" 
            v-model="formAmount"
            placeholder="金額" 
            class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>

        <!-- 按鈕 -->
        <div class="flex items-end">
          <button 
            @click="handleAdd"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-1"
          >
            <i class="pi pi-check"></i> 新增
          </button>
        </div>
      </div>

      <p v-if="formError" class="text-xs text-rose-500"><i class="pi pi-exclamation-circle mr-1"></i>{{ formError }}</p>
    </div>

    <!-- 收支明細列表 -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
          <i class="pi pi-list text-indigo-500"></i>
          本月零用金明細列表 (共 {{ currentRecord.transactions.length }} 筆)
        </h2>
      </div>

      <div v-if="currentRecord.transactions.length === 0" class="p-8 text-center text-slate-400 text-sm">
        當月尚無零用金收支紀錄，請於上方新增。
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div 
          v-for="tx in currentRecord.transactions" 
          :key="tx.id"
          class="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <span 
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              :class="tx.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
            >
              {{ tx.type === 'expense' ? '支' : '收' }}
            </span>

            <div>
              <div class="text-sm font-bold text-slate-800 flex items-center gap-2">
                {{ tx.name }}
                <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                  {{ tx.category }}
                </span>
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ tx.date }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span 
              class="text-base font-extrabold"
              :class="tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'"
            >
              {{ tx.type === 'expense' ? '-' : '+' }}${{ Number(tx.amount || 0).toLocaleString() }}
            </span>

            <button 
              @click="handleDelete(tx.id)"
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
