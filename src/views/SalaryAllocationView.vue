<script setup lang="ts">
import { ref } from 'vue'
import SalaryAllocationForm from '../features/salary-allocation/SalaryAllocationForm.vue'
import FixedExpensesManager from '../features/fixed-expenses/FixedExpensesManager.vue'
import SalaryHistory from '../features/salary-history/SalaryHistory.vue'

const activeTab = ref<'salary' | 'fixed' | 'history'>('salary')
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">當月薪資配置與歷史紀錄</h1>
      <p class="text-sm text-slate-500 mt-1">管理您每個月的薪資收入與各項花費配置。</p>

      <div class="mt-6 inline-flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
        <button 
          @click="activeTab = 'salary'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-wallet mr-1.5 text-xs"></i>薪資分配
        </button>
        <button 
          @click="activeTab = 'fixed'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'fixed' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-receipt mr-1.5 text-xs"></i>固定支出項目
        </button>
        <button 
          @click="activeTab = 'history'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
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
