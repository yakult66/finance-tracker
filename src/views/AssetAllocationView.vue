<script setup lang="ts">
import { ref } from 'vue'
import InvestmentOverview from '../features/investment/InvestmentOverview.vue'
import EntertainmentFundManager from '../features/entertainment-fund/EntertainmentFundManager.vue'
import EmergencyFundManager from '../features/emergency-fund/EmergencyFundManager.vue'

const activeTab = ref<'investment' | 'entertainment' | 'emergency'>('investment')
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">資產配置</h1>
      <p class="text-sm text-slate-500 mt-1">管理投資規劃、娛樂基金與緊急備用金之資產累積。</p>

      <div class="mt-6 inline-flex bg-slate-100 p-1 rounded-xl gap-1">
        <button 
          @click="activeTab = 'investment'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'investment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-chart-line mr-1.5 text-xs"></i>投資規劃
        </button>

        <button 
          @click="activeTab = 'entertainment'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'entertainment' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-gift mr-1.5 text-xs"></i>娛樂基金
        </button>

        <button 
          @click="activeTab = 'emergency'"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'emergency' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-shield mr-1.5 text-xs"></i>緊急備用金
        </button>
      </div>
    </div>
    
    <div class="max-w-5xl mx-auto">
      <KeepAlive>
        <InvestmentOverview v-if="activeTab === 'investment'" />
        <EntertainmentFundManager v-else-if="activeTab === 'entertainment'" />
        <EmergencyFundManager v-else-if="activeTab === 'emergency'" />
      </KeepAlive>
    </div>
  </div>
</template>
