<script setup>
import { ref, computed } from 'vue'
import { useFirstGoal } from './useFirstGoal.js'
import { useCashFlow } from '../cash-flow/useCashFlow.js'

const { averageMonthlySaving } = useCashFlow()
const {
  goal,
  insuranceFund,
  totalAssets,
  remainingToGoal,
  progressPercentage,
  addPlan,
  INSURANCE_TARGET
} = useFirstGoal()

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

const insuranceGap = computed(() =>
  Math.max(0, INSURANCE_TARGET - Number(insuranceFund.value || 0))
)

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
    <!-- 進度看板 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div class="flex justify-between items-baseline mb-2">
        <h2 class="text-sm font-semibold text-slate-500">第一桶金進度</h2>
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
        <span
          v-if="saved"
          class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium"
        >
          已寫入歷史紀錄
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-xs text-slate-500 mb-1 block">目標金額</label>
          <input
            v-model.number="goal"
            type="number"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
          >
        </div>
        <div>
          <label class="text-xs text-slate-500 mb-1 block">每月預計累積</label>
          <input
            v-model.number="monthlyPlan"
            type="number"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
          >
        </div>
      </div>

      <p v-if="averageMonthlySaving" class="text-xs text-slate-400">
        依歷史紀錄，你平均每月累積 ${{ averageMonthlySaving.toLocaleString() }}。
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

      <button
        type="button"
        class="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium py-2.5 rounded-xl text-sm transition"
        @click="savePlan"
      >
        💾 儲存這份規劃
      </button>
    </section>

    <!-- 保費專戶 -->
    <section class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-sm font-semibold text-slate-500">
          🛡️ 保費專戶 (目標 {{ INSURANCE_TARGET.toLocaleString() }})
        </h2>
        <span
          class="text-xs font-semibold"
          :class="insuranceGap === 0 ? 'text-emerald-600' : 'text-amber-600'"
        >
          {{ insuranceGap === 0 ? '已達標' : `缺 $${insuranceGap.toLocaleString()}` }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model.number="insuranceFund"
          type="number"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
        >
        <span class="text-xs text-slate-400 shrink-0">元</span>
      </div>
    </section>
  </div>
</template>
