<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppNav from './app/AppNav.vue'
import { tabs } from './app/navigation'
import type { Tab } from './types'

const TAB_KEY = 'finance_active_tab'
const COLLAPSED_KEY = 'finance_nav_collapsed'

const stored = localStorage.getItem(TAB_KEY)
const activeTab = ref<string>(tabs.some((t: Tab) => t.id === stored) ? (stored as string) : tabs[0].id)
const collapsed = ref(localStorage.getItem(COLLAPSED_KEY) === '1')

watch(activeTab, (v: string) => localStorage.setItem(TAB_KEY, v))
watch(collapsed, (v: boolean) => localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'))

const current = computed<Tab>(() => tabs.find((t: Tab) => t.id === activeTab.value) as Tab)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <AppNav v-model="activeTab" v-model:collapsed="collapsed" :tabs="tabs" />

    <main
      class="transition-[padding] duration-200 ease-out"
      :class="collapsed ? 'md:pl-16' : 'md:pl-56'"
    >
      <div class="max-w-md mx-auto p-4 pb-24 md:pb-8 space-y-4">
        <header class="flex justify-between items-center py-2">
          <h1 class="text-xl font-bold text-slate-900">
            {{ current.icon }} {{ current.label }}
          </h1>
          <span
            class="text-emerald-600 shrink-0"
            title="資料已自動儲存"
            aria-label="資料已自動儲存"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
          </span>
        </header>

        <KeepAlive>
          <component :is="current.component" />
        </KeepAlive>
      </div>
    </main>
  </div>
</template>
