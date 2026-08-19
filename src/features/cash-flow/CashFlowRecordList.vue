<script setup lang="ts">
import type { CashFlowRecord } from '../../types'

defineProps<{
  records: CashFlowRecord[]
  editingId: string | null
}>()

const emit = defineEmits<{
  (e: 'edit', record: CashFlowRecord): void
}>()
</script>

<template>
  <section
    v-if="records.length > 0"
    class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
  >
    <h2 class="text-sm font-semibold text-slate-500 mb-3">試算紀錄</h2>
    <div class="space-y-2">
      <div
        v-for="record in records"
        :key="record.id"
        @click="emit('edit', record)"
        class="p-3 rounded-xl border transition-colors cursor-pointer"
        :class="
          editingId === record.id
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
        "
      >
        <div class="flex items-baseline justify-between">
          <span class="font-bold text-slate-800">{{ record.month }} 月</span>
          <span class="text-xs text-slate-500">
            收入 ${{ Number(record.income).toLocaleString() }} ・ 結餘
            <span :class="record.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'">
              ${{ Number(record.balance).toLocaleString() }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
