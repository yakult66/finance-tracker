<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// 保費專戶金額（預設為解約金 30,000）
const insuranceFund = ref(30000)

// 歷史紀錄列表
const records = ref([])

// 新增資料表單狀態
const newRecord = ref({
  month: '',
  income: null,
  fixedExpense: 6000,
  saving: 5000,
  emergencyFund: 2000,
  otherFund: 1000
})

// 從 LocalStorage 載入資料
onMounted(() => {
  const savedRecords = localStorage.getItem('finance_records')
  const savedInsurance = localStorage.getItem('insurance_fund')
  
  if (savedRecords) {
    try {
      records.value = JSON.parse(savedRecords)
    } catch (e) {
      console.error('Failed to parse records from localStorage', e)
    }
  }
  
  if (savedInsurance) {
    insuranceFund.value = Number(savedInsurance)
  }
})

// 自動同步回 LocalStorage
watch(
  records,
  (newVal) => {
    localStorage.setItem('finance_records', JSON.stringify(newVal))
  },
  { deep: true }
)

watch(insuranceFund, (newVal) => {
  localStorage.setItem('insurance_fund', newVal.toString())
})

// 計算當前輸入表單中的零用金餘額
const calculatedBalance = computed(() => {
  const inc = newRecord.value.income || 0
  return inc - (newRecord.value.fixedExpense || 0)
             - (newRecord.value.saving || 0)
             - (newRecord.value.emergencyFund || 0)
             - (newRecord.value.otherFund || 0)
})

// 總累積資產（所有月份存錢 + 預備金 + 保費專戶）
const totalAssets = computed(() => {
  const monthlyAccumulated = records.value.reduce((acc, cur) => {
    return acc + Number(cur.saving || 0) + Number(cur.emergencyFund || 0)
  }, 0)
  return monthlyAccumulated + Number(insuranceFund.value || 0)
})

// 100 萬進度百分比
const progressPercentage = computed(() => {
  const p = (totalAssets.value / 1000000) * 100
  return Math.min(100, Math.max(0, p)).toFixed(1)
})

// 新增紀錄
const addRecord = () => {
  if (!newRecord.value.month || !newRecord.value.income) {
    alert('請填寫月份名稱與月收入！')
    return
  }

  records.value.unshift({
    month: newRecord.value.month,
    income: newRecord.value.income,
    fixedExpense: newRecord.value.fixedExpense || 0,
    saving: newRecord.value.saving || 0,
    emergencyFund: newRecord.value.emergencyFund || 0,
    otherFund: newRecord.value.otherFund || 0,
    balance: calculatedBalance.value
  })

  // 重置表單輸入項
  newRecord.value.month = ''
  newRecord.value.income = null
}

// 刪除紀錄
const removeRecord = (index) => {
  if (confirm('確定刪除這筆紀錄？')) {
    records.value.splice(index, 1)
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
    <div class="max-w-md mx-auto p-4 space-y-4">
      
      <!-- 頂部標題與狀態 -->
      <header class="flex justify-between items-center py-2">
        <h1 class="text-xl font-bold text-slate-900">💰 財務與資產管家</h1>
        <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">資料已自動儲存</span>
      </header>

      <!-- 第一桶金進度看板 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div class="flex justify-between items-baseline mb-2">
          <h2 class="text-sm font-semibold text-slate-500">第一桶金進度 (目標 100 萬)</h2>
          <span class="text-xs font-bold text-indigo-600">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3">
          <div 
            class="bg-indigo-600 h-full rounded-full transition-all duration-300" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-50">
          <div>
            <div class="text-xs text-slate-400">目前總累積資產</div>
            <div class="text-lg font-bold text-slate-800">${{ totalAssets.toLocaleString() }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">距離目標還差</div>
            <div class="text-lg font-bold text-rose-500">${{ Math.max(0, 1000000 - totalAssets).toLocaleString() }}</div>
          </div>
        </div>
      </section>

      <!-- 6/30 保費專款進度 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-sm font-semibold text-slate-500">🛡️ 6/30 保費專戶 (目標 40,000)</h2>
          <span 
            class="text-xs font-semibold" 
            :class="insuranceFund >= 40000 ? 'text-emerald-600' : 'text-amber-600'"
          >
            {{ insuranceFund >= 40000 ? '已達標' : `缺 $${(40000 - insuranceFund).toLocaleString()}` }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <input 
            type="number" 
            v-model.number="insuranceFund" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
          >
          <span class="text-xs text-slate-400 shrink-0">元</span>
        </div>
      </section>

      <!-- 新增 / 編輯月份現金流 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <h2 class="text-sm font-semibold text-slate-500">📝 新增月份現金流</h2>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">月份名稱</label>
            <input 
              type="text" 
              v-model="newRecord.month" 
              placeholder="例: 8月" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">月總收入</label>
            <input 
              type="number" 
              v-model.number="newRecord.income" 
              placeholder="0" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">固定費用</label>
            <input 
              type="number" 
              v-model.number="newRecord.fixedExpense" 
              placeholder="6000" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">純存錢 / 投資</label>
            <input 
              type="number" 
              v-model.number="newRecord.saving" 
              placeholder="5000" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-500 mb-1 block">緊急預備金</label>
            <input 
              type="number" 
              v-model.number="newRecord.emergencyFund" 
              placeholder="2000" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
          <div>
            <label class="text-xs text-slate-500 mb-1 block">其它基金 (旅遊等)</label>
            <input 
              type="number" 
              v-model.number="newRecord.otherFund" 
              placeholder="1000" 
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
        </div>

        <div class="pt-2 flex justify-between items-center text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl">
          <span>計算剩餘零用金：</span>
          <span 
            class="text-sm font-bold" 
            :class="calculatedBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            ${{ calculatedBalance.toLocaleString() }}
          </span>
        </div>

        <button 
          @click="addRecord" 
          class="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium py-2.5 rounded-xl text-sm transition"
        >
          ➕ 加入紀錄
        </button>
      </section>

      <!-- 歷史月份列表 -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-slate-500 px-1">📅 歷史月度明細</h2>
        <div v-if="records.length === 0" class="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-100">
          目前尚無紀錄
        </div>
        
        <div 
          v-for="(item, index) in records" 
          :key="index" 
          class="bg-white rounded-xl p-3.5 shadow-sm border border-slate-100 space-y-2"
        >
          <div class="flex justify-between items-center border-b border-slate-50 pb-2">
            <span class="font-bold text-slate-800">{{ item.month }}</span>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">結餘 ${{ item.balance }}</span>
              <button 
                @click="removeRecord(index)" 
                class="text-slate-300 hover:text-rose-500 p-1 text-xs"
                aria-label="刪除此紀錄"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1 text-xs text-slate-500">
            <div>收入：<span class="font-medium text-slate-700">${{ item.income }}</span></div>
            <div>存錢：<span class="font-medium text-slate-700">${{ item.saving }}</span></div>
            <div>預備金：<span class="font-medium text-slate-700">${{ item.emergencyFund }}</span></div>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>