<script setup>
import { ref, computed } from 'vue'
import { useFixedExpenses } from './useFixedExpenses.js'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'

const {
  annualItems,
  annualMonthlyTotal,
  annualYearlyTotal,
  addAnnualItem,
  updateAnnualItem,
  normalizeAnnualItem,
  removeAnnualItem,
  suggestMonthly
} = useFixedExpenses()

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

function pad(n) {
  return String(n).padStart(2, '0')
}

// Select options
const monthOptions = [{ label: '月', value: '' }, ...months.map((m) => ({ label: String(m), value: pad(m) }))]
const dayOptions = [{ label: '日', value: '' }, ...days.map((d) => ({ label: String(d), value: pad(d) }))]

const duePart = (value, index) => (value ? value.split('-')[index] : '')

// 月或日改動時，另一半沿用原本的值，兩邊都空就當作沒設定
function setDuePart(current, index, next) {
  const parts = [duePart(current, 0) || '', duePart(current, 1) || '']
  parts[index] = next ? pad(next) : ''
  if (!parts[0] && !parts[1]) return ''
  return `${parts[0] || '01'}-${parts[1] || '01'}`
}

const draft = ref({ name: '', amount: null, dueMonth: '', dueDay: '', monthly: null })
const error = ref('')
const openId = ref(null)

// 每月預留沒填就照年度金額除以 12 帶入
const draftMonthlyPlaceholder = computed(() =>
  draft.value.amount ? String(suggestMonthly(draft.value.amount)) : '自動平均'
)

function submit() {
  if (!draft.value.name.trim()) {
    error.value = '請填寫項目名稱'
    return
  }
  if (!draft.value.amount) {
    error.value = '請填寫年度金額'
    return
  }
  error.value = ''
  const dueDate =
    draft.value.dueMonth || draft.value.dueDay
      ? `${pad(draft.value.dueMonth || 1)}-${pad(draft.value.dueDay || 1)}`
      : ''
  addAnnualItem({
    name: draft.value.name.trim(),
    amount: draft.value.amount,
    monthly: draft.value.monthly,
    dueDate
  })
  draft.value = { name: '', amount: null, dueMonth: '', dueDay: '', monthly: null }
}

function remove(item) {
  if (confirm(`刪除「${item.name}」？`)) removeAnnualItem(item.id)
}

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

function formatDue(value) {
  if (!value) return '未設定繳款日'
  const [m, d] = value.split('-')
  return `每年 ${Number(m)}/${Number(d)} 繳款`
}

// 每年重複，所以算的是「下一次」繳款日還有幾天
function daysLeft(value) {
  if (!value) return null
  const [m, d] = value.split('-').map(Number)
  if (!m || !d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let due = new Date(today.getFullYear(), m - 1, d)
  if (due < today) due = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.round((due - today) / 86400000)
}

// 照目前的每月預留，到下次繳款日前能存到多少
function coverage(item) {
  const left = daysLeft(item.dueDate)
  if (left === null) return null
  const months = Math.max(0, Math.floor(left / 30))
  const saved = months * (Number(item.monthly) || 0)
  return { months, saved, enough: saved >= (Number(item.amount) || 0) }
}
</script>

<template>
  <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-slate-500">📌 年度重大費用</h2>
        <p class="text-xs text-slate-400 mt-0.5">
          每月預留金額會計入固定費用
        </p>
      </div>
      <div class="text-right shrink-0">
        <div class="text-xs font-bold text-slate-700">
          每月 ${{ annualMonthlyTotal.toLocaleString() }}
        </div>
        <div class="text-[11px] text-slate-400">
          年度 ${{ annualYearlyTotal.toLocaleString() }}
        </div>
      </div>
    </div>

    <div v-if="annualItems.length" class="space-y-2">
      <div
        v-for="item in annualItems"
        :key="item.id"
        class="border border-slate-100 rounded-xl overflow-hidden"
      >
        <!-- 摘要列，點一下展開編輯 -->
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition"
          :aria-expanded="openId === item.id"
          @click="toggle(item.id)"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-slate-800 truncate">{{ item.name }}</div>
            <div class="text-[11px] text-slate-400">
              {{ formatDue(item.dueDate) }}
              <span v-if="daysLeft(item.dueDate) !== null">
                ・{{
                  daysLeft(item.dueDate) >= 0
                    ? `還有 ${daysLeft(item.dueDate)} 天`
                    : `已過期 ${-daysLeft(item.dueDate)} 天`
                }}
              </span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold text-slate-700">
              ${{ Number(item.monthly).toLocaleString() }}<span class="text-[11px] font-normal text-slate-400">/月</span>
            </div>
            <div class="text-[11px] text-slate-400">
              共 ${{ Number(item.amount).toLocaleString() }}
            </div>
          </div>
          <span
            class="text-slate-300 text-xs shrink-0 transition-transform"
            :class="openId === item.id ? 'rotate-90' : ''"
          >
            ▶
          </span>
        </button>

        <!-- 展開後的編輯區 -->
        <div v-if="openId === item.id" class="px-3 pb-3 pt-1 space-y-2 bg-slate-50/60">
          <div class="grid grid-cols-2 gap-2">
            <div class="col-span-2">
              <label class="text-xs text-slate-500 mb-1 block">項目名稱</label>
              <InputText
                :model-value="item.name"
                class="w-full text-sm"
                size="small"
                @update:model-value="updateAnnualItem(item.id, { name: $event })"
                @blur="normalizeAnnualItem(item.id)"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500 mb-1 block">年度金額</label>
              <InputNumber
                :model-value="item.amount"
                :use-grouping="true"
                class="w-full"
                input-class="w-full text-sm"
                size="small"
                @update:model-value="updateAnnualItem(item.id, { amount: $event })"
                @blur="normalizeAnnualItem(item.id)"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500 mb-1 block">繳款日</label>
              <div class="flex items-center gap-1">
                <Select
                  :model-value="duePart(item.dueDate, 0)"
                  :options="monthOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                  size="small"
                  @update:model-value="updateAnnualItem(item.id, { dueDate: setDuePart(item.dueDate, 0, $event) })"
                />
                <span class="text-slate-300 text-xs shrink-0">/</span>
                <Select
                  :model-value="duePart(item.dueDate, 1)"
                  :options="dayOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                  size="small"
                  @update:model-value="updateAnnualItem(item.id, { dueDate: setDuePart(item.dueDate, 1, $event) })"
                />
              </div>
            </div>
            <div class="col-span-2">
              <label class="text-xs text-slate-500 mb-1 block">
                每月預留金額
                <span class="text-slate-300">（可自訂，預設是等於年度 ÷ 12）</span>
              </label>
              <div class="flex items-center gap-2">
                <InputNumber
                  :model-value="item.monthly"
                  :use-grouping="true"
                  class="w-full"
                  input-class="w-full text-sm font-bold"
                  size="small"
                  @update:model-value="updateAnnualItem(item.id, { monthly: $event })"
                  @blur="normalizeAnnualItem(item.id)"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 mt-1">
            <div class="flex-1">
              <p
                v-if="coverage(item)"
                class="text-[11px] leading-snug"
                :class="coverage(item).enough ? 'text-emerald-600' : 'text-amber-600'"
              >
                到繳款日前約可存 ${{ coverage(item).saved.toLocaleString() }}
                <template v-if="!coverage(item).enough">
                  ，距離 ${{ Number(item.amount).toLocaleString() }} 還差
                  ${{ (Number(item.amount) - coverage(item).saved).toLocaleString() }}
                </template>
                <template v-else>，足夠支付</template>
              </p>
            </div>
            
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              class="shrink-0 w-8 h-8 p-0"
              @click="remove(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-xs text-slate-400 py-2">
      尚無年度費用項目，例如保費、稅金、續約費。
    </p>

    <!-- 新增 -->
    <div class="pt-2 border-t border-slate-50 space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <div class="col-span-2">
          <InputText
            v-model="draft.name"
            placeholder="項目名稱（例: 汽車保險）"
            class="w-full text-sm"
            size="small"
          />
        </div>
        <InputNumber
          v-model="draft.amount"
          placeholder="年度金額"
          :use-grouping="true"
          class="w-full"
          input-class="w-full text-sm"
          size="small"
        />
        <div class="flex items-center gap-1">
          <Select
            v-model="draft.dueMonth"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            size="small"
          />
          <span class="text-slate-300 text-xs shrink-0">/</span>
          <Select
            v-model="draft.dueDay"
            :options="dayOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            size="small"
          />
        </div>
        <div class="col-span-2 flex items-center gap-2">
          <InputNumber
            v-model="draft.monthly"
            :placeholder="`每月預留（留空＝${draftMonthlyPlaceholder}）`"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm"
            size="small"
          />
          <Button
            icon="pi pi-plus"
            size="small"
            class="shrink-0"
            @click="submit"
          />
        </div>
      </div>
      <Message v-if="error" severity="error" size="small" :closable="false">{{ error }}</Message>
    </div>
  </section>
</template>
