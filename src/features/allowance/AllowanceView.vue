<script setup>
import { ref, computed, watch } from 'vue'
import { useAllowance } from './useAllowance.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

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

// Select 需要 options 格式
const monthOptions = computed(() =>
  records.value.map((r) => ({ label: r.month, value: r.month }))
)

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
          <Select
            v-model="selectedMonth"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            class="text-xs"
            size="small"
          />
        </div>

        <div class="text-2xl font-bold" :class="left >= 0 ? 'text-slate-900' : 'text-rose-500'">
          ${{ left.toLocaleString() }}
        </div>
        <p class="text-xs text-slate-400 mt-0.5">可用餘額</p>

        <ProgressBar
          :value="usedPercentage"
          :show-value="false"
          class="my-3 h-2"
          :pt="{
            value: { class: left >= 0 ? 'bg-indigo-600' : 'bg-rose-500' }
          }"
        />

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
      </section>

      <!-- 支出項目 -->
      <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-500">💸 支出項目</h2>
          <span class="text-xs text-slate-400">{{ items.length }} 筆</span>
        </div>

        <div v-if="items.length" class="space-y-2">
          <div v-for="item in items" :key="item.id" class="flex items-center gap-2">
            <InputText
              :model-value="item.name"
              class="flex-1 min-w-0 text-sm"
              size="small"
              @update:model-value="updateItem(item.id, { name: $event })"
              @blur="normalizeItem(item.id)"
            />
            <span class="text-[11px] text-slate-300 shrink-0 w-8 text-right">
              {{ formatTime(item.createdAt) }}
            </span>
            <InputNumber
              :model-value="item.amount"
              :use-grouping="true"
              class="w-20 shrink-0"
              input-class="w-full text-sm text-right"
              size="small"
              @update:model-value="updateItem(item.id, { amount: $event })"
              @blur="normalizeItem(item.id)"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              text
              size="small"
              :aria-label="`刪除 ${item.name}`"
              @click="remove(item)"
            />
          </div>
        </div>

        <p v-else class="text-xs text-slate-400 py-2">
          尚無支出，額度全數可用。
        </p>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-50">
          <InputText
            v-model="draft.name"
            placeholder="支出名稱（例: 午餐）"
            class="flex-1 min-w-0 text-sm"
            size="small"
            @keyup.enter="submit"
          />
          <InputNumber
            :model-value="draft.amount ?? undefined"
            placeholder="金額"
            :use-grouping="true"
            class="w-24 shrink-0"
            input-class="w-full text-sm text-right"
            size="small"
            @update:model-value="draft.amount = $event ?? null"
            @keyup.enter="submit"
          />
          <Button
            icon="pi pi-plus"
            size="small"
            @click="submit"
          />
        </div>

        <Message v-if="error" severity="error" size="small" :closable="false">{{ error }}</Message>
      </section>
    </template>
  </div>
</template>
