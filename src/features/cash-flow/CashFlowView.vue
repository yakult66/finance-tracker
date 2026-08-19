<script setup lang="ts">
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'
import CashFlowRecordList from './CashFlowRecordList.vue'
import { useCashFlowForm } from './useCashFlowForm'

const {
  form,
  error,
  saved,
  calculatedBalance,
  fixedExpenseTotal,
  activeEmergencyFund,
  records,
  editingId,
  handleMonthInput,
  editRecord,
  cancelEdit,
  submit,
} = useCashFlowForm()
</script>

<template>
  <div class="space-y-4">
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-500">📝現金流試算</h2>
        <Message v-if="saved" severity="success" size="small" :closable="false">已將試算結果寫入紀錄</Message>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-xs text-slate-500 mb-1 block">月份</label>
          <InputText
            :model-value="form.month"
            placeholder="例: 8"
            inputmode="numeric"
            class="w-full text-sm"
            size="small"
            @update:model-value="handleMonthInput($event as string)"
          />
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">薪資收入</label>
          <InputNumber
            :model-value="form.income ?? undefined"
            placeholder="0"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm"
            size="small"
            @update:model-value="form.income = $event ?? null"
          />
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">
            固定費用
          </label>
          <div
            class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            aria-readonly="true"
          >
            ${{ fixedExpenseTotal.toLocaleString() }}
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">存錢 / 投資</label>
          <InputNumber
            :model-value="form.saving ?? undefined"
            placeholder="0"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm"
            size="small"
            @update:model-value="form.saving = $event ?? null"
          />
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">緊急備用金</label>
          <div
            class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            aria-readonly="true"
          >
            ${{ activeEmergencyFund.toLocaleString() }}
          </div>
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">其它基金</label>
          <InputNumber
            :model-value="form.otherFund ?? undefined"
            placeholder="0"
            :use-grouping="true"
            class="w-full"
            input-class="w-full text-sm"
            size="small"
            @update:model-value="form.otherFund = $event ?? null"
          />
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

      <Message v-if="error" severity="error" size="small" :closable="false">{{ error }}</Message>

      <div class="flex gap-2">
        <Button
          v-if="editingId"
          label="取消"
          severity="secondary"
          class="w-1/3"
          @click="cancelEdit"
        />
        <Button
          label="儲存"
          :class="editingId ? 'w-2/3' : 'w-full'"
          @click="submit"
        />
      </div>
    </section>

    <CashFlowRecordList
      :records="records"
      :editing-id="editingId"
      @edit="editRecord"
    />
  </div>
</template>
