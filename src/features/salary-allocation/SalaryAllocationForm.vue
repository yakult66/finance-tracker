<script setup lang="ts">
import { useSalaryAllocation } from './useSalaryAllocation'

const { draft, remainingAllowance, isLoading, isSaved, errors, saveAllocation } = useSalaryAllocation()
</script>

<template>
  <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
    <div class="p-6 md:p-8 space-y-8">
      
      <!-- 基本設定區 -->
      <div>
        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <i class="pi pi-calendar text-indigo-500 mr-2"></i>
          基本設定
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-600 block">薪水月份</label>
            <div class="relative">
              <input 
                type="number" 
                v-model="draft.month"
                min="1" max="12"
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12"
              >
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">月</span>
            </div>
            <p v-if="errors.month" class="text-xs text-rose-500 mt-1"><i class="pi pi-exclamation-circle mr-1"></i>{{ errors.month }}</p>
          </div>
          
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-600 block">發薪日</label>
            <input 
              type="date" 
              v-model="draft.payday"
              max="9999-12-31"
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
            <p v-if="errors.payday" class="text-xs text-rose-500 mt-1"><i class="pi pi-exclamation-circle mr-1"></i>{{ errors.payday }}</p>
          </div>
        </div>
      </div>

      <hr class="border-slate-100">

      <!-- 資金流動區 -->
      <div>
        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <i class="pi pi-arrow-right-arrow-left text-emerald-500 mr-2"></i>
          資金流動
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- 可填寫區 -->
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-600 block">薪資收入</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number" 
                  v-model="draft.income"
                  class="w-full bg-emerald-50/50 border border-emerald-100 text-slate-800 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                >
              </div>
              <p v-if="errors.income" class="text-xs text-rose-500 mt-1"><i class="pi pi-exclamation-circle mr-1"></i>{{ errors.income }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-600 block">投資規劃</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number" 
                  v-model="draft.investment"
                  class="w-full bg-amber-50/50 border border-amber-100 text-slate-800 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                >
              </div>
              <p v-if="errors.investment" class="text-xs text-rose-500 mt-1"><i class="pi pi-exclamation-circle mr-1"></i>{{ errors.investment }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-600 block">消費基金</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number" 
                  v-model="draft.consumerFund"
                  class="w-full bg-purple-50/50 border border-purple-100 text-slate-800 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                >
              </div>
              <p v-if="errors.consumerFund" class="text-xs text-rose-500 mt-1"><i class="pi pi-exclamation-circle mr-1"></i>{{ errors.consumerFund }}</p>
            </div>
          </div>

          <!-- 唯讀帶入區 -->
          <div class="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-500 flex items-center gap-1">
                上月結餘 <i class="pi pi-lock text-[10px] text-slate-400"></i>
              </label>
              <span class="text-sm font-medium text-slate-600">${{ draft.previousBalance.toLocaleString() }}</span>
            </div>
            
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-500 flex items-center gap-1">
                固定費用 <i class="pi pi-lock text-[10px] text-slate-400"></i>
              </label>
              <span class="text-sm font-medium text-rose-500">-${{ draft.fixedExpenses.toLocaleString() }}</span>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-500 flex items-center gap-1">
                緊急備用金 <i class="pi pi-lock text-[10px] text-slate-400"></i>
              </label>
              <span class="text-sm font-medium text-blue-500">-${{ draft.emergencyFund.toLocaleString() }}</span>
            </div>
            
            <div class="text-xs text-slate-400 pt-2 border-t border-slate-200/60 text-center">
              此區塊未來將由其他模組自動結算帶入
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- 結算結果與儲存 -->
    <div class="bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t-2 border-slate-50/80 rounded-b-3xl">
      <div>
        <div class="text-slate-500 font-medium text-sm mb-1">本月可動用零用金</div>
        <div class="text-4xl font-bold tracking-tight drop-shadow-sm" :class="remainingAllowance >= 0 ? 'text-emerald-500' : 'text-rose-500'">
          ${{ remainingAllowance.toLocaleString() }}
        </div>
      </div>
      
      <button 
        @click="saveAllocation"
        :disabled="isLoading"
        class="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
        v-ripple
      >
        <template v-if="isLoading">
          <i class="pi pi-spinner pi-spin mr-2"></i>
          儲存中...
        </template>
        <template v-else-if="isSaved">
          <i class="pi pi-check mr-2"></i>
          已儲存
        </template>
        <template v-else>
          儲存配置
        </template>
      </button>
    </div>
  </div>
</template>
