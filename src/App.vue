<script setup lang="ts">
import { ref, computed } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import PwaUpdateBanner from './components/PwaUpdateBanner.vue'
import { tabs } from './app/navigation'
import type { Tab } from './types'

const activeTabId = ref<string>(tabs[0].id)
const collapsed = ref(false)
const mobileOpen = ref(false)

const currentComponent = computed(() => {
  const tab = tabs.find(t => t.id === activeTabId.value)
  return tab ? tab.component : null
})

const currentTabName = computed(() => {
  const tab = tabs.find(t => t.id === activeTabId.value)
  return tab ? tab.label : 'Finance Tracker'
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex">
    
    <!-- 側邊欄 -->
    <AppSidebar 
      :tabs="tabs" 
      v-model="activeTabId" 
      v-model:collapsed="collapsed"
      v-model:mobileOpen="mobileOpen"
    />

    <!-- 右側主內容區塊 -->
    <div 
      class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
      :class="collapsed ? 'md:ml-20' : 'md:ml-64'"
    >
      
      <!-- 手機版專屬頂部列 (包含漢堡選單) -->
      <header class="md:hidden h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30 flex items-center px-4 shrink-0">
        <button 
          class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 transition-colors mr-3"
          @click="mobileOpen = true"
          v-ripple
        >
          <i class="pi pi-bars text-xl"></i>
        </button>
        <span class="font-bold text-slate-800 text-lg">{{ currentTabName }}</span>
      </header>

      <!-- 主要內容切換區 -->
      <main class="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <KeepAlive>
          <component :is="currentComponent" />
        </KeepAlive>
      </main>

    </div>

    <!-- 新版本提示 -->
    <PwaUpdateBanner />
  </div>
</template>

<style scoped>
</style>
