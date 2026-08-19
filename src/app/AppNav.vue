<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true },
  collapsed: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'update:collapsed'])
</script>

<template>
  <!-- 桌機：可展開收合的側邊導覽列 -->
  <aside
    class="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white border-r border-slate-200 p-3 transition-[width] duration-200 ease-out"
    :class="collapsed ? 'md:w-16' : 'md:w-56'"
  >
    <div
      class="flex items-center gap-2 px-1 py-2 mb-2"
      :class="collapsed ? 'justify-center' : 'justify-between'"
    >
      <div v-if="!collapsed" class="min-w-0">
        <div class="text-base font-bold text-slate-900 truncate">💰 財務管家</div>
      </div>
      <button
        type="button"
        class="shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition"
        :aria-label="collapsed ? '展開' : '收合'"
        :aria-expanded="!collapsed"
        :title="collapsed ? '展開' : '收合'"
        @click="$emit('update:collapsed', !collapsed)"
      >
        <svg
          viewBox="0 0 20 20"
          class="w-5 h-5 transition-transform duration-200"
          :class="collapsed ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12.5 5 7.5 10l5 5" />
        </svg>
      </button>
    </div>

    <nav class="flex flex-col gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :aria-current="modelValue === tab.id ? 'page' : undefined"
        :title="collapsed ? tab.label : undefined"
        class="flex items-center gap-3 rounded-xl text-sm font-medium transition py-2.5"
        :class="[
          collapsed ? 'justify-center px-0' : 'px-3',
          modelValue === tab.id
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50'
        ]"
        @click="$emit('update:modelValue', tab.id)"
      >
        <span class="text-lg leading-none">{{ tab.icon }}</span>
        <span v-if="!collapsed" class="truncate">{{ tab.label }}</span>
      </button>
    </nav>
  </aside>

  <!-- 手機：底部導覽列 -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
  >
    <div class="grid" :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :aria-current="modelValue === tab.id ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-0.5 py-2.5 transition"
        :class="modelValue === tab.id ? 'text-indigo-600' : 'text-slate-400'"
        @click="$emit('update:modelValue', tab.id)"
      >
        <span class="text-xl leading-none">{{ tab.icon }}</span>
        <span class="text-[11px] font-medium">{{ tab.shortLabel }}</span>
      </button>
    </div>
  </nav>
</template>
