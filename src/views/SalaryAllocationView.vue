<script setup lang="ts">
import { ref } from 'vue'
import SalaryAllocationForm from '../features/salary-allocation/SalaryAllocationForm.vue'
import FixedExpensesManager from '../features/fixed-expenses/FixedExpensesManager.vue'
import SalaryHistory from '../features/salary-history/SalaryHistory.vue'

const activeTab = ref<'salary' | 'fixed' | 'history'>('salary')
</script>

<template>
  <div class="p-3 sm:p-6">
    <div class="mb-6 sm:mb-8">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-800">當月薪資配置與歷史紀錄</h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">管理您每個月的薪資收入與各項花費配置。</p>

      <div class="mt-4 sm:mt-6 flex flex-wrap sm:inline-flex bg-slate-100 p-1 rounded-2xl gap-1 w-full sm:w-auto">
        <button 
          @click="activeTab = 'salary'"
          class="flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
          :class="activeTab === 'salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-wallet mr-1.5 text-xs"></i>薪資分配
        </button>
        <button 
          @click="activeTab = 'fixed'"
          class="flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
          :class="activeTab === 'fixed' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-receipt mr-1.5 text-xs"></i>固定支出項目
        </button>
        <button 
          @click="activeTab = 'history'"
          class="flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
          :class="activeTab === 'history' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-history mr-1.5 text-xs"></i>歷史紀錄
        </button>
      </div>
    </div>
    
    <div class="max-w-5xl mx-auto">
      <KeepAlive>
        <SalaryAllocationForm v-if="activeTab === 'salary'" />
        <FixedExpensesManager v-else-if="activeTab === 'fixed'" />
        <SalaryHistory v-else-if="activeTab === 'history'" />
      </KeepAlive>
    </div>
  </div>
</template>
