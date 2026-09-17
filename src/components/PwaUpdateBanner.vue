<script setup lang="ts">
import { usePwa } from '../shared/usePwa'

const { needRefresh, applyUpdate } = usePwa()
</script>

<template>
  <!-- 偵測到新版本時提示重新載入，避免使用者停留在舊的快取版本 -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="needRefresh"
      class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-80 z-[60] bg-white border border-slate-100 shadow-lg rounded-2xl p-4 flex items-center gap-3"
    >
      <i class="pi pi-sync text-indigo-600 text-lg shrink-0"></i>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-800">有新版本可用</p>
        <p class="text-xs text-slate-400">重新載入即可取得最新功能</p>
      </div>
      <button
        class="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
        v-ripple
        @click="applyUpdate"
      >
        更新
      </button>
    </div>
  </Transition>
</template>
