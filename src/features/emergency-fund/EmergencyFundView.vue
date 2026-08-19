<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyFund } from './useEmergencyFund'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'

const {
  targetAmount,
  initialBalance,
  monthlyItems,
  transactions,
  balance,
  addItem,
  removeItem,
  addTransaction,
  removeTransaction
} = useEmergencyFund()

const newItemName = ref('')
const newItemAmount = ref<number | null>(null)

const newTxDesc = ref('')
const newTxAmount = ref<number | null>(null)
const txType = ref<'in' | 'out'>('in')

function handleAddItem() {
  if (!newItemName.value.trim() || !newItemAmount.value) return
  addItem(newItemName.value, newItemAmount.value)
  newItemName.value = ''
  newItemAmount.value = null
}

function handleAddTransaction() {
  if (!newTxAmount.value) return
  addTransaction(newTxDesc.value || '', newTxAmount.value, new Date().toISOString().split('T')[0], txType.value)
  newTxDesc.value = ''
  newTxAmount.value = null
}

const progressPercentage = computed(() => {
  if (targetAmount.value <= 0) return 0
  const pct = Math.floor((balance.value / targetAmount.value) * 100)
  return pct > 100 ? 100 : pct
})
</script>


<template>
  <div class="space-y-4">
    <!-- 目標與餘額 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div class="flex justify-between items-baseline mb-2">
        <h2 class="text-sm font-semibold text-slate-500">緊急備用金進度</h2>
        <span class="text-xs font-bold" :class="balance >= targetAmount ? 'text-emerald-600' : 'text-indigo-600'">
          {{ progressPercentage }}%
        </span>
      </div>
      <ProgressBar
        :value="Number(progressPercentage)"
        :show-value="false"
        class="mb-3 h-3"
        :class="balance >= targetAmount ? '[&>div]:bg-emerald-500' : ''"
      />
      
      <div class="grid grid-cols-2 gap-2 mt-4">
        <div>
          <label class="text-xs text-slate-500 mb-1 block">目標金額</label>
          <InputNumber
            v-model="targetAmount"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm font-bold"
            size="small"
          />
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">初始資金</label>
          <InputNumber
            v-model="initialBalance"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm font-bold"
            size="small"
          />
        </div>
      </div>
      <div class="mt-2">
        <div class="text-xs text-slate-500 mb-1">目前累積餘額</div>
        <div class="h-9 flex items-center px-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-lg font-bold" :class="balance >= targetAmount ? 'text-emerald-600' : 'text-slate-800'">
            ${{ balance.toLocaleString() }}
          </span>
        </div>
      </div>
      
      <Message v-if="balance >= targetAmount" severity="success" size="small" :closable="false" class="mt-3">
        🎉 已達標！已自動為您停用所有每月扣繳項目。
      </Message>
    </section>

    <!-- 每月存入設定 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
      <h2 class="text-sm font-semibold text-slate-500">📥 每月存入項目</h2>
      <p class="text-[11px] text-slate-400">啟用的項目會自動加入到「固定支出」中扣繳。</p>
      
      <div class="space-y-2">
        <div v-for="item in monthlyItems" :key="item.id" class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
          <ToggleSwitch v-model="item.isEnabled" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-slate-700 truncate">{{ item.name }}</div>
            <div class="text-xs text-slate-500">${{ item.amount.toLocaleString() }}</div>
          </div>
          <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="removeItem(item.id)" />
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <InputText v-model="newItemName" placeholder="項目名稱" class="flex-1 text-sm" size="small" />
        <InputNumber v-model="newItemAmount" placeholder="金額" class="w-24 shrink-0" input-class="w-full text-sm" size="small" />
        <Button icon="pi pi-plus" size="small" class="shrink-0" @click="handleAddItem" />
      </div>
    </section>

    <!-- 單次收支紀錄 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
      <h2 class="text-sm font-semibold text-slate-500">📥 單次收支紀錄</h2>
      <p class="text-[11px] text-slate-400">紀錄意外之財、獎金或緊急狀況動用的支出。</p>
      
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
</template>
