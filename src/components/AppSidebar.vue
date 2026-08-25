<script setup lang="ts">
import { computed } from 'vue'
import type { Tab } from '../types'

const props = defineProps<{
  tabs: Tab[]
  modelValue: string
  collapsed: boolean
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'update:collapsed', value: boolean): void
  (e: 'update:mobileOpen', value: boolean): void
}>()

const toggleCollapse = () => {
  emit('update:collapsed', !props.collapsed)
}

const closeMobile = () => {
  emit('update:mobileOpen', false)
}

const handleTabClick = (id: string) => {
  emit('update:modelValue', id)
  closeMobile()
}
</script>

<template>
  <!-- 手機版背景遮罩 -->
  <div 
    v-if="mobileOpen" 
    class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
    @click="closeMobile"
  ></div>

  <!-- Sidebar 主體 -->
  <aside 
    class="fixed top-0 left-0 h-screen bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0"
    :class="[
      collapsed ? 'w-20' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <!-- 頂部 Logo 與收闔按鈕 -->
    <div class="h-16 flex items-center justify-between px-4 shrink-0 border-b border-slate-50">
      <div class="flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <span 
          class="text-lg font-bold text-slate-800 transition-opacity duration-300"
          :class="collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'"
        >
          客家人守財
        </span>
      </div>

      <button 
        class="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        @click="toggleCollapse"
      >
        <i class="pi" :class="collapsed ? 'pi-angle-right' : 'pi-angle-left'"></i>
      </button>

      <!-- 手機版專屬：關閉按鈕 -->
      <button 
        class="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 bg-slate-50 shrink-0"
        @click="closeMobile"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- 導覽清單 -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="w-full flex items-center gap-3 rounded-xl transition-all duration-200 overflow-hidden whitespace-nowrap group relative"
        :class="[
          modelValue === tab.id 
            ? 'bg-indigo-50 text-indigo-700 font-semibold' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          collapsed ? 'justify-center p-3' : 'px-4 py-3'
        ]"
        v-ripple
        @click="handleTabClick(tab.id)"
      >
        <!-- 狀態指示條 (選中時) -->
        <div 
          v-if="modelValue === tab.id"
          class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full transition-all"
        ></div>

        <i 
          class="pi text-lg shrink-0 transition-transform duration-200"
          :class="[
            tab.icon,
            modelValue === tab.id && collapsed ? 'scale-110' : ''
          ]"
        ></i>
        <span 
          class="text-sm tracking-wide transition-opacity duration-300"
          :class="collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'"
        >
          {{ tab.label }}
        </span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
/* 自訂捲軸樣式 (隱藏或美化) */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #f1f5f9;
  border-radius: 4px;
}
</style>
