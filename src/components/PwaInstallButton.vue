<script setup lang="ts">
import { usePwa } from '../shared/usePwa'

defineProps<{
  collapsed?: boolean
}>()

const { showInstallButton, showIosGuide, install } = usePwa()

// 依部署的 base path 組出圖示路徑（GitHub Pages 會帶 /finance-tracker/ 前綴）
const iconUrl = `${import.meta.env.BASE_URL}pwa-192.png`
</script>

<template>
  <!-- 安裝按鈕：已安裝或瀏覽器不支援時自動隱藏 -->
  <div v-if="showInstallButton" class="px-3 pb-4 shrink-0">
    <button
      class="w-full flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 font-semibold transition-all duration-200 hover:bg-indigo-100 overflow-hidden whitespace-nowrap"
      :class="collapsed ? 'justify-center p-3' : 'px-4 py-3'"
      :title="collapsed ? '安裝應用程式' : undefined"
      v-ripple
      @click="install"
    >
      <i class="pi pi-download text-lg shrink-0"></i>
      <span
        class="text-sm tracking-wide transition-opacity duration-300"
        :class="collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'"
      >
        安裝應用程式
      </span>
    </button>
  </div>

  <!-- iOS Safari 無安裝 API，提供手動加入主畫面教學 -->
  <Teleport to="body">
    <div
      v-if="showIosGuide"
      class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4"
      @click.self="showIosGuide = false"
    >
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <img :src="iconUrl" alt="" class="w-10 h-10 rounded-xl" />
            <div>
              <p class="font-bold text-slate-800">安裝「客家人守財」</p>
              <p class="text-xs text-slate-400">加入主畫面即可全螢幕開啟</p>
            </div>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 shrink-0"
            @click="showIosGuide = false"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <ol class="space-y-3 text-sm text-slate-600">
          <li class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span>點選 Safari 下方的分享按鈕 <i class="pi pi-upload text-indigo-600 mx-1"></i></span>
          </li>
          <li class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span>選擇「加入主畫面」</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>按右上角「新增」完成安裝</span>
          </li>
        </ol>

        <button
          class="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          v-ripple
          @click="showIosGuide = false"
        >
          我知道了
        </button>
      </div>
    </div>
  </Teleport>
</template>
