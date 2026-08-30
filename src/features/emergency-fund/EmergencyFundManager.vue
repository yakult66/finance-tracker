<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyFund } from './useEmergencyFund'
import type { EmergencyGoal } from './interfaces'

const {
  goals,
  totalCurrentEmergencyFund,
  totalTargetEmergencyFund,
  overallProgress,
  activeMonthlyDepositTotal,
  addGoal,
  updateGoal,
  deleteGoal,
  addDepositPlan,
  saveAndLockDepositPlan,
  toggleDepositPlanActive,
  deleteDepositPlan,
  addTransaction
} = useEmergencyFund()

// 新增目標表單
const newGoalName = ref('')
const newGoalTarget = ref<number | null>(null)
const showAddGoal = ref(false)

const submitNewGoal = () => {
  if (!newGoalName.value.trim()) return
  addGoal(newGoalName.value.trim(), newGoalTarget.value || 0)
  newGoalName.value = ''
  newGoalTarget.value = null
  showAddGoal.value = false
}

// 每個目標的新增存入金額暫存
const newPlanAmounts = ref<Record<string, number | null>>({})

const submitNewPlan = (goalId: string) => {
  const amount = newPlanAmounts.value[goalId]
  if (!amount || amount <= 0) return
  addDepositPlan(goalId, amount)
  newPlanAmounts.value[goalId] = null
}

// 臨時異動表單暫存
const txForms = ref<Record<string, { name: string; amount: number | null; type: 'deposit' | 'expense' }>>({})

const getTxForm = (goalId: string) => {
  if (!txForms.value[goalId]) {
    txForms.value[goalId] = { name: '', amount: null, type: 'deposit' }
  }
  return txForms.value[goalId]
}

const submitTransaction = (goalId: string) => {
  const form = txForms.value[goalId]
  if (!form || !form.name.trim() || !form.amount || form.amount <= 0) return
  addTransaction(goalId, {
    type: form.type,
    name: form.name.trim(),
    amount: form.amount,
    date: new Date().toISOString().split('T')[0]
  })
  txForms.value[goalId] = { name: '', amount: null, type: 'deposit' }
}

// 展開/收合臨時異動歷史
const expandedTxHistory = ref<Record<string, boolean>>({})

// 刪除目標確認
const confirmDeleteGoal = (goal: EmergencyGoal) => {
  if (goal.currentAmount > 0) {
    if (!confirm(`目標「${goal.name}」目前累積金額 $${goal.currentAmount.toLocaleString()}，確定要刪除嗎？`)) return
  }
  deleteGoal(goal.id)
}

// 計算單一目標進度
const getGoalProgress = (goal: EmergencyGoal) => {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
}

// 是否已達標
const isGoalCompleted = (goal: EmergencyGoal) => {
  return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount
}

// 數字輸入過濾 (只允許數字)
const onNumericInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/[^0-9]/g, '')
}
</script>

<template>
  <div class="space-y-6">

    <!-- 頂部總覽看板 -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 md:p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-800 flex items-center">
            <i class="pi pi-shield text-blue-500 mr-2"></i>
            緊急備用金總覽
          </h2>
          <button
            @click="showAddGoal = !showAddGoal"
            class="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <i class="pi pi-plus text-xs"></i> 新增目標
          </button>
        </div>

        <!-- 統計卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50/60 rounded-2xl p-4 border border-blue-100/50">
            <div class="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
              <i class="pi pi-lock text-[10px]"></i> 累積總額
            </div>
            <div class="text-2xl font-bold text-blue-600">${{ totalCurrentEmergencyFund.toLocaleString() }}</div>
          </div>
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
            <div class="text-xs font-medium text-slate-400 mb-1">目標總額</div>
            <div class="text-2xl font-bold text-slate-700">${{ totalTargetEmergencyFund.toLocaleString() }}</div>
          </div>
          <div class="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/50">
            <div class="text-xs font-medium text-emerald-400 mb-1">總達成進度</div>
            <div class="text-2xl font-bold text-emerald-600">{{ overallProgress }}%</div>
            <div class="w-full bg-emerald-100 rounded-full h-1.5 mt-2">
              <div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" :style="{ width: overallProgress + '%' }"></div>
            </div>
          </div>
          <div class="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100/50">
            <div class="text-xs font-medium text-indigo-400 mb-1">每月預計存入</div>
            <div class="text-2xl font-bold text-indigo-600">${{ activeMonthlyDepositTotal.toLocaleString() }}</div>
          </div>
        </div>

        <!-- 新增目標表單 -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="showAddGoal" class="mt-6 bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
            <h3 class="text-sm font-bold text-slate-700 mb-4">建立新的備用金目標</h3>
            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1 w-full space-y-1.5">
                <label class="text-xs font-medium text-slate-500">目標名稱</label>
                <input
                  type="text"
                  v-model="newGoalName"
                  placeholder="例如：個人生活備用金"
                  class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                >
              </div>
              <div class="flex-1 w-full space-y-1.5">
                <label class="text-xs font-medium text-slate-500">目標金額</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="text"
                    inputmode="numeric"
                    :value="newGoalTarget ?? ''"
                    @input="(e) => { onNumericInput(e); newGoalTarget = Number((e.target as HTMLInputElement).value) || null }"
                    placeholder="0"
                    class="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  >
                </div>
              </div>
              <div class="flex gap-2 w-full sm:w-auto">
                <button
                  @click="submitNewGoal"
                  :disabled="!newGoalName.trim()"
                  class="flex-1 sm:flex-none h-[38px] px-5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <i class="pi pi-plus mr-1"></i> 建立
                </button>
                <button
                  @click="showAddGoal = false"
                  class="h-[38px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 目標卡片清單 -->
    <div v-for="goal in goals" :key="goal.id" class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 md:p-8">

        <!-- 卡片頭部 -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <input
                type="text"
                :value="goal.name"
                @blur="(e) => updateGoal(goal.id, { name: (e.target as HTMLInputElement).value })"
                @keyup.enter="(e) => (e.target as HTMLInputElement).blur()"
                class="text-lg font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors py-0.5 w-full max-w-[300px]"
              >
              <span
                v-if="isGoalCompleted(goal)"
                class="text-xs bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1"
              >
                <i class="pi pi-check-circle text-[10px]"></i> 已達標 🎉
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <!-- 目標金額 (可輸入) -->
              <div>
                <div class="text-xs text-slate-400 mb-1">目標金額</div>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="text"
                    inputmode="numeric"
                    :value="goal.targetAmount"
                    @input="onNumericInput"
                    @blur="(e) => updateGoal(goal.id, { targetAmount: Number((e.target as HTMLInputElement).value) || 0 })"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  >
                </div>
              </div>
              <!-- 累積金額 (唯讀) -->
              <div>
                <div class="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <i class="pi pi-lock text-[10px]"></i> 已累積
                </div>
                <div class="font-bold text-blue-600 text-lg">${{ goal.currentAmount.toLocaleString() }}</div>
              </div>
              <!-- 進度 -->
              <div>
                <div class="text-xs text-slate-400 mb-1">達成進度</div>
                <div class="font-bold text-lg" :class="isGoalCompleted(goal) ? 'text-emerald-500' : 'text-slate-700'">{{ getGoalProgress(goal) }}%</div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                  <div
                    class="h-1.5 rounded-full transition-all duration-500"
                    :class="isGoalCompleted(goal) ? 'bg-emerald-500' : 'bg-blue-500'"
                    :style="{ width: getGoalProgress(goal) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 刪除目標 -->
          <button
            @click="confirmDeleteGoal(goal)"
            class="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0 ml-4"
            title="刪除目標"
          >
            <i class="pi pi-trash text-sm"></i>
          </button>
        </div>

        <hr class="border-slate-100 mb-6">

        <!-- 每月預設存入設定區塊 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <i class="pi pi-sync text-blue-400 text-xs"></i>
              每月預設存入設定
            </h3>
            <span class="text-[11px] text-slate-400">僅可啟用一項</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="plan in goal.depositPlans"
              :key="plan.id"
              class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              :class="plan.isActive ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/50 border-slate-100'"
            >
              <!-- 金額 -->
              <div class="relative flex-1 max-w-[180px]">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  v-if="!plan.isLocked"
                  type="text"
                  inputmode="numeric"
                  :value="plan.amount"
                  @input="(e) => { onNumericInput(e); plan.amount = Number((e.target as HTMLInputElement).value) || 0 }"
                  class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm font-medium text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="輸入金額"
                >
                <div v-else class="w-full bg-slate-100 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm font-medium text-right text-slate-600 cursor-not-allowed flex items-center justify-end gap-1">
                  {{ plan.amount.toLocaleString() }}
                  <i class="pi pi-lock text-[10px] text-slate-400"></i>
                </div>
              </div>

              <!-- 儲存按鈕 (未鎖定時顯示) -->
              <button
                v-if="!plan.isLocked"
                @click="saveAndLockDepositPlan(goal.id, plan.id)"
                :disabled="!plan.amount || plan.amount <= 0"
                class="h-[36px] px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
              >
                <i class="pi pi-save text-[11px]"></i> 儲存
              </button>

              <!-- 啟用/停用 Switch -->
              <label
                class="relative inline-flex items-center cursor-pointer flex-shrink-0"
                :class="{ 'opacity-50 pointer-events-none': !plan.isLocked }"
                :title="!plan.isLocked ? '請先儲存金額再啟用' : (plan.isActive ? '停用' : '啟用')"
              >
                <input
                  type="checkbox"
                  :checked="plan.isActive"
                  @change="toggleDepositPlanActive(goal.id, plan.id, !plan.isActive)"
                  :disabled="!plan.isLocked"
                  class="sr-only peer"
                >
                <div class="w-10 h-[22px] bg-slate-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:after:translate-x-[18px] after:shadow-sm"></div>
              </label>

              <!-- 刪除 -->
              <button
                @click="deleteDepositPlan(goal.id, plan.id)"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                title="刪除此設定"
              >
                <i class="pi pi-trash text-sm"></i>
              </button>
            </div>

            <div v-if="goal.depositPlans.length === 0" class="text-center py-4 text-slate-400 text-sm">
              尚未設定每月存入金額
            </div>
          </div>

          <!-- 新增存入項目 -->
          <button
            @click="newPlanAmounts[goal.id] = newPlanAmounts[goal.id] ?? 0"
            v-if="newPlanAmounts[goal.id] === undefined || newPlanAmounts[goal.id] === null"
            class="w-full mt-3 py-2.5 border border-dashed border-slate-200 rounded-xl text-xs font-medium text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1"
          >
            <i class="pi pi-plus"></i> 新增存入項目
          </button>
          <div v-else class="flex gap-2 mt-3 items-center">
            <div class="relative flex-1 max-w-[200px]">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="text"
                inputmode="numeric"
                :value="newPlanAmounts[goal.id] || ''"
                @input="(e) => { onNumericInput(e); newPlanAmounts[goal.id] = Number((e.target as HTMLInputElement).value) || null }"
                placeholder="每月存入金額"
                class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>
            <button
              @click="submitNewPlan(goal.id)"
              :disabled="!newPlanAmounts[goal.id]"
              class="h-[36px] px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              新增
            </button>
            <button
              @click="newPlanAmounts[goal.id] = null"
              class="h-[36px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </div>

        <hr class="border-slate-100 mb-6">

        <!-- 臨時新增 / 臨時支出區塊 -->
        <div>
          <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
            <i class="pi pi-bolt text-amber-400 text-xs"></i>
            臨時存入 / 支出
          </h3>

          <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-3">
            <!-- 類型切換 -->
            <div class="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                @click="getTxForm(goal.id).type = 'deposit'"
                class="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
                :class="getTxForm(goal.id).type === 'deposit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              >
                <i class="pi pi-plus-circle mr-1 text-[11px]"></i>臨時存入
              </button>
              <button
                @click="getTxForm(goal.id).type = 'expense'"
                class="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
                :class="getTxForm(goal.id).type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              >
                <i class="pi pi-minus-circle mr-1 text-[11px]"></i>臨時支出
              </button>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 items-end">
              <div class="flex-1 w-full space-y-1">
                <label class="text-xs text-slate-400">項目名稱</label>
                <input
                  type="text"
                  v-model="getTxForm(goal.id).name"
                  :placeholder="getTxForm(goal.id).type === 'deposit' ? '例如：年終獎金存入' : '例如：緊急維修'"
                  class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
              </div>
              <div class="w-full sm:w-[140px] space-y-1">
                <label class="text-xs text-slate-400">金額</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="text"
                    inputmode="numeric"
                    :value="getTxForm(goal.id).amount ?? ''"
                    @input="(e) => { onNumericInput(e); getTxForm(goal.id).amount = Number((e.target as HTMLInputElement).value) || null }"
                    placeholder="0"
                    class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  >
                </div>
              </div>
              <button
                @click="submitTransaction(goal.id)"
                :disabled="!getTxForm(goal.id).name.trim() || !getTxForm(goal.id).amount"
                class="w-full sm:w-auto h-[36px] px-5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                :class="getTxForm(goal.id).type === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'"
              >
                {{ getTxForm(goal.id).type === 'deposit' ? '存入' : '支出' }}
              </button>
            </div>
          </div>

          <!-- 異動歷史 -->
          <div v-if="goal.transactions.length > 0" class="mt-3">
            <button
              @click="expandedTxHistory[goal.id] = !expandedTxHistory[goal.id]"
              class="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <i class="pi text-[10px]" :class="expandedTxHistory[goal.id] ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
              近期異動紀錄 ({{ goal.transactions.length }})
            </button>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[500px]"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[500px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="expandedTxHistory[goal.id]" class="mt-2 space-y-1.5 overflow-hidden">
                <div
                  v-for="tx in [...goal.transactions].reverse().slice(0, 10)"
                  :key="tx.id"
                  class="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm"
                >
                  <div class="flex items-center gap-2">
                    <i
                      class="text-[11px]"
                      :class="tx.type === 'deposit' ? 'pi pi-arrow-down text-emerald-500' : 'pi pi-arrow-up text-rose-500'"
                    ></i>
                    <span class="text-slate-600">{{ tx.name }}</span>
                    <span class="text-[11px] text-slate-400">{{ tx.date }}</span>
                  </div>
                  <span class="font-medium" :class="tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'">
                    {{ tx.type === 'deposit' ? '+' : '-' }}${{ tx.amount.toLocaleString() }}
                  </span>
                </div>
              </div>
            </Transition>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
