<script setup>
import { useFixedExpenses } from './useFixedExpenses.js'
import MonthlyItemList from './MonthlyItemList.vue'
import AnnualItemList from './AnnualItemList.vue'

const { fixedExpenseTotal, monthlyFixedTotal, annualMonthlyTotal } = useFixedExpenses()
</script>

<template>
  <div class="space-y-4">
    <!-- 總覽：這裡的合計就是月現金流的固定費用 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h2 class="text-sm font-semibold text-slate-500 mb-2">每月固定支出合計</h2>
      <div class="text-2xl font-bold text-slate-900">
        ${{ fixedExpenseTotal.toLocaleString() }}
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 text-center">
        <div>
          <div class="text-xs text-slate-400">一般每月項目</div>
          <div class="text-sm font-bold text-slate-700">
            ${{ monthlyFixedTotal.toLocaleString() }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400">年度費用攤提</div>
          <div class="text-sm font-bold text-slate-700">
            ${{ annualMonthlyTotal.toLocaleString() }}
          </div>
        </div>
      </div>
      <p class="text-[11px] text-slate-400 mt-3">
        月現金流的「固定費用」會直接套用這個合計。
      </p>
    </section>

    <MonthlyItemList />
    <AnnualItemList />
  </div>
</template>
