<script setup lang="ts">
import EmergencyFundManager from  '../features/emergency-fund/EmergencyFundManager.vue'
import InvestmentOverview from '../features/investment/InvestmentOverview.vue'
import { ref } from 'vue'

const activeTab = ref<'investment' | 'emergency'>('investment')
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">資產配置</h1>
      <p class="text-sm text-slate-500 mt-1">統計總資產總額</p>

      <div class="mt-6 inline-flex bg-slate-100 p-1 rounded-xl">
        <button 
          @click="activeTab = 'investment'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'investment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-wallet mr-1.5 text-xs"></i>投資規劃
        </button>
        <button 
          @click="activeTab = 'emergency'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'emergency' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-receipt mr-1.5 text-xs"></i>緊急備用金
        </button>
      </div>
    </div>
    
    <div class="max-w-4xl mx-auto">
      <KeepAlive>
        <InvestmentOverview v-if="activeTab === 'investment'" />
        <EmergencyFundManager v-else-if="activeTab === 'emergency'" />
      </KeepAlive>
    </div>
  </div>
</template>
