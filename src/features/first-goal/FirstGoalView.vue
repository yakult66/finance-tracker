<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFirstGoal } from './useFirstGoal.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

import Tabs from 'primevue/tabs'
import InputText from 'primevue/inputtext'

import EmergencyFundView from '../emergency-fund/EmergencyFundView.vue'

const { averageMonthlySaving } = useCashFlow()
const {
  goal,
  initialBalance,
  transactions,
  totalAssets,
  remainingToGoal,
  progressPercentage,
  addPlan,
  addTransaction,
  removeTransaction
} = useFirstGoal()

const activeTab = ref('first-goal')

const newTxDesc = ref('')
const newTxAmount = ref<number | null>(null)
const txType = ref<'in' | 'out'>('in')

function handleAddTransaction() {
  if (!newTxAmount.value) return
  addTransaction(newTxDesc.value || '', newTxAmount.value, new Date().toISOString().split('T')[0], txType.value)
  newTxDesc.value = ''
  newTxAmount.value = null
}

// 預設帶入歷史平均，沒有紀錄就給一個常見值
const monthlyPlan = ref(averageMonthlySaving.value || 7000)
const saved = ref(false)

const monthsToGoal = computed(() => {
  if (!monthlyPlan.value || monthlyPlan.value <= 0) return null
  return Math.ceil(remainingToGoal.value / monthlyPlan.value)
})

const targetDateLabel = computed(() => {
  if (monthsToGoal.value === null) return '—'
  if (monthsToGoal.value === 0) return '已達標 🎉'
  const d = new Date()
  d.setMonth(d.getMonth() + monthsToGoal.value)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
})



function savePlan() {
  addPlan({
    goal: Number(goal.value) || 0,
    monthlyPlan: Number(monthlyPlan.value) || 0,
    totalAssets: totalAssets.value,
    remaining: remainingToGoal.value,
    months: monthsToGoal.value,
    targetDateLabel: targetDateLabel.value
  })
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Segmented Control (Tabs) -->
    <div class="flex p-1 bg-slate-100/80 rounded-xl max-w-sm mx-auto">
      <button 
        @click="activeTab = 'first-goal'"
        class="flex-1 text-xs sm:text-sm font-bold py-2 rounded-lg transition-all duration-300"
        :class="activeTab === 'first-goal' ? 'text-indigo-600 bg-white shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'"
      >
        第一桶金
      </button>
      <button 
        @click="activeTab = 'emergency'"
        class="flex-1 text-xs sm:text-sm font-bold py-2 rounded-lg transition-all duration-300"
        :class="activeTab === 'emergency' ? 'text-indigo-600 bg-white shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'"
      >
        緊急備用金
      </button>
    </div>
    
    <!-- Tab Panels -->
    <div>
      <div v-if="activeTab === 'first-goal'">
        <div class="space-y-4">
          <!-- 進度看板 -->
          <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div class="flex justify-between items-baseline mb-2">
              <h2 class="text-sm font-semibold text-slate-500">第一桶金進度</h2>
              <span class="text-xs font-bold text-indigo-600">{{ progressPercentage }}%</span>
            </div>
            <ProgressBar
              :value="Number(progressPercentage)"
              :show-value="false"
              class="mb-3 h-3"
            />
            <div class="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-50">
              <div>
                <div class="text-xs text-slate-400">目前總累積資產</div>
                <div class="text-lg font-bold text-slate-800">
                  ${{ totalAssets.toLocaleString() }}
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400">距離目標還差</div>
                <div class="text-lg font-bold text-rose-500">
                  ${{ remainingToGoal.toLocaleString() }}
                </div>
              </div>
            </div>
          </section>

          <!-- 規劃試算 -->
          <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-500">🎯 達標試算</h2>
              <Message v-if="saved" severity="success" size="small" :closable="false">已寫入歷史紀錄</Message>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-slate-500 mb-1 block">目標金額</label>
                <InputNumber
                  v-model="goal"
                  :use-grouping="true"
                  class="w-full"
                  input-class="w-full text-sm font-bold"
                  size="small"
                />
              </div>
              <div>
                <label class="text-xs text-slate-500 mb-1 block">每月預計累積</label>
                <InputNumber
                  v-model="monthlyPlan"
                  :use-grouping="true"
                  class="w-full"
                  input-class="w-full text-sm font-bold"
                  size="small"
                />
              </div>
            </div>
            
            <div>
              <label class="text-xs text-slate-500 mb-1 block">初始資金</label>
              <InputNumber
                v-model="initialBalance"
                :use-grouping="true"
                class="w-full"
                input-class="w-full text-sm font-bold"
                size="small"
                placeholder="例如你原有的存款"
              />
            </div>

            <p v-if="averageMonthlySaving" class="text-xs text-slate-400">
              依歷史紀錄，你平均每月純存錢約 ${{ averageMonthlySaving.toLocaleString() }}。
            </p>

            <div class="grid grid-cols-2 gap-2">
              <div class="bg-slate-50 rounded-xl p-2.5">
                <div class="text-xs text-slate-500">還需要</div>
                <div class="text-base font-bold text-slate-800">
                  {{ monthsToGoal === null ? '—' : `${monthsToGoal} 個月` }}
                </div>
              </div>
              <div class="bg-indigo-50 rounded-xl p-2.5">
                <div class="text-xs text-indigo-500">預計達標</div>
                <div class="text-base font-bold text-indigo-700">{{ targetDateLabel }}</div>
              </div>
            </div>

            <Button
              label="💾 儲存這份規劃"
              class="w-full"
              @click="savePlan"
            />
          </section>

          <!-- 單次收支紀錄 -->
          <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
            <h2 class="text-sm font-semibold text-slate-500">📥 單次收支紀錄</h2>
            <p class="text-[11px] text-slate-400">紀錄第一桶金的意外大筆收入或大筆動用。</p>
            
            <div class="flex gap-2">
              <div class="flex bg-slate-100 rounded-lg p-1 shrink-0">
                <button 
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="txType === 'in' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'"
                  @click="txType = 'in'"
                >存入</button>
                <button 
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="txType === 'out' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'"
                  @click="txType = 'out'"
                >支出</button>
              </div>
              <InputText v-model="newTxDesc" placeholder="說明" class="flex-1 text-sm min-w-0" size="small" />
              <InputNumber v-model="newTxAmount" placeholder="金額" class="w-20 shrink-0" input-class="w-full text-sm" size="small" />
              <Button icon="pi pi-plus" size="small" class="shrink-0" @click="handleAddTransaction" />
            </div>

            <div class="space-y-2 mt-3">
              <div v-for="tx in transactions" :key="tx.id" class="flex items-center justify-between p-2 border-b border-slate-50 last:border-0">
                <div>
                  <div class="text-sm font-bold text-slate-700">{{ tx.description }}</div>
                  <div class="text-[10px] text-slate-400">{{ tx.date }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-bold" :class="tx.type === 'in' ? 'text-emerald-600' : 'text-rose-500'">
                    {{ tx.type === 'in' ? '+' : '-' }}${{ tx.amount.toLocaleString() }}
                  </span>
                  <Button icon="pi pi-times" severity="danger" text rounded class="w-6 h-6 p-0" @click="removeTransaction(tx.id)" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div v-else-if="activeTab === 'emergency'">
        <EmergencyFundView />
      </div>
    </div>
  </div>
</template>
