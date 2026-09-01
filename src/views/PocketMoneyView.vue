<script setup lang="ts">
import { ref } from 'vue'
import PocketMoneyCurrent from '../features/pocket-money/PocketMoneyCurrent.vue'
import PocketMoneyHistory from '../features/pocket-money/PocketMoneyHistory.vue'

const activeTab = ref<'current' | 'history'>('current')
</script>

<template>
  <div class="p-3 sm:p-6">
    <div class="mb-6 sm:mb-8">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-800">零用金收支管理</h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">追蹤每月零用金收支明細、花費分類佔比與歷史檢視。</p>

      <div class="mt-4 sm:mt-6 flex flex-wrap sm:inline-flex bg-slate-100 p-1 rounded-2xl gap-1 w-full sm:w-auto">
        <button 
          @click="activeTab = 'current'"
          class="flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
          :class="activeTab === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-sparkles mr-1.5 text-xs"></i>當月零用金收支明細
        </button>
        <button 
          @click="activeTab = 'history'"
          class="flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
          :class="activeTab === 'history' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          <i class="pi pi-history mr-1.5 text-xs"></i>每月零用金歷史紀錄
        </button>
      </div>
    </div>

    <div class="max-w-5xl mx-auto">
      <KeepAlive>
        <PocketMoneyCurrent v-if="activeTab === 'current'" />
        <PocketMoneyHistory v-else-if="activeTab === 'history'" />
      </KeepAlive>
    </div>
  </div>
</template>
