<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSalaryAllocation } from '../salary-allocation/useSalaryAllocation'
import { useFixedExpenses } from '../fixed-expenses/useFixedExpenses'
import type { SalaryAllocation } from '../salary-allocation/interfaces'
import { fetchApi } from '../../shared/api'

const { allocationsHistory } = useSalaryAllocation()
const { largeExpenses, addAccumulatedAmount } = useFixedExpenses()

// 排序選單：預設依月份降冪排序 (新月份在前)
const sortOrder = ref<'desc' | 'asc'>('desc')

const sortedHistory = computed(() => {
  return [...allocationsHistory.value].sort((a, b) => {
    const yearA = new Date(a.payday).getFullYear()
    const yearB = new Date(b.payday).getFullYear()
    const absA = yearA * 12 + Number(a.month)
    const absB = yearB * 12 + Number(b.month)
    return sortOrder.value === 'desc' ? absB - absA : absA - absB
  })
})

// 展開固定費用細項狀態
const expandedItems = ref<Record<string, boolean>>({})

const toggleExpand = (id: string) => {
  expandedItems.value[id] = !expandedItems.value[id]
}

// 計算單筆紀錄的淨額
const calculateNetAmount = (record: SalaryAllocation) => {
  const income = Number(record.income || 0)
  const prev = Number(record.previousBalance || 0)
  const fixed = Number(record.fixedExpenses || 0)
  const emergency = Number(record.emergencyFund || 0)
  const inv = Number(record.investment || 0)
  const cons = Number(record.consumerFund || 0)
  const allow = Number(record.allowance || 0)
  return (income + prev) - (fixed + emergency + inv + cons + allow)
}

// 編輯 Modal 狀態
const isEditModalOpen = ref(false)
const editingDraft = ref<SalaryAllocation | null>(null)

const openEditModal = (record: SalaryAllocation) => {
  editingDraft.value = JSON.parse(JSON.stringify(record))
  if (!editingDraft.value!.allowance) editingDraft.value!.allowance = 0
  if (!editingDraft.value!.fixedExpensesSnapshot) editingDraft.value!.fixedExpensesSnapshot = []
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  editingDraft.value = null
}

// 歷史編輯視窗中細項金額變更時，自動更新固定費用總和
const updateEditFixedExpenses = () => {
  if (editingDraft.value && editingDraft.value.fixedExpensesSnapshot) {
    const sum = editingDraft.value.fixedExpensesSnapshot.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
    editingDraft.value.fixedExpenses = sum
  }
}

// 儲存編輯後的歷史紀錄
const handleSaveEdit = async () => {
  if (!editingDraft.value) return
  const updatedData = editingDraft.value
  const index = allocationsHistory.value.findIndex(a => a.id === updatedData.id)
  
  if (index !== -1) {
    const oldRecord = allocationsHistory.value[index]
    
    // 更新細項快照與大額支出累計金額連動
    if (updatedData.fixedExpensesSnapshot && oldRecord.fixedExpensesSnapshot) {
      updatedData.fixedExpensesSnapshot.forEach(newItem => {
        if (newItem.linkedLargeExpenseId) {
          const oldItem = oldRecord.fixedExpensesSnapshot?.find(o => o.linkedLargeExpenseId === newItem.linkedLargeExpenseId)
          const diff = Number(newItem.amount || 0) - Number(oldItem?.amount || 0)
          if (diff !== 0) {
            // 大額支出的累計跟著變動更新
            addAccumulatedAmount(newItem.linkedLargeExpenseId, diff)
          }
        }
      })
    }

    updatedData.updatedAt = Date.now()
    allocationsHistory.value[index] = updatedData
    
    // 同步寫入 LocalStorage 與 MongoDB Atlas
    localStorage.setItem('finance_salary_allocation', JSON.stringify(allocationsHistory.value))
    await fetchApi('/api/salary-allocation', {
      method: 'POST',
      body: JSON.stringify(allocationsHistory.value)
    })
  }

  closeEditModal()
}

// 刪除歷史紀錄
const deleteRecord = async (id?: string) => {
  if (!id) return
  if (!confirm('確定要刪除此筆歷史紀錄嗎？')) return

  allocationsHistory.value = allocationsHistory.value.filter(a => a.id !== id)
  localStorage.setItem('finance_salary_allocation', JSON.stringify(allocationsHistory.value))
  await fetchApi('/api/salary-allocation', {
    method: 'POST',
    body: JSON.stringify(allocationsHistory.value)
  })
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- 頂部概覽 -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i class="pi pi-history text-indigo-500"></i>
          薪資分配歷史紀錄與快照
        </h2>
        <p class="text-xs text-slate-500 mt-1">獨立檢視與編輯過去各月份的薪資分配、固定項目細項金額與大額支出連動。</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- 排序開關 -->
        <button 
          @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
          class="px-3 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs font-semibold text-slate-600 transition-colors flex items-center gap-1.5"
        >
          <i class="pi" :class="sortOrder === 'desc' ? 'pi-sort-amount-down' : 'pi-sort-amount-up'"></i>
          {{ sortOrder === 'desc' ? '最新月份在前' : '最舊月份在前' }}
        </button>

        <div class="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-center">
          <div class="text-xs text-slate-400 font-medium">總紀錄月數</div>
          <div class="text-lg font-bold text-indigo-600">{{ sortedHistory.length }} 個月</div>
        </div>
      </div>
    </div>

    <!-- 無紀錄提示 -->
    <div v-if="sortedHistory.length === 0" class="bg-white rounded-3xl border border-slate-100 p-12 text-center">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        <i class="pi pi-inbox"></i>
      </div>
      <h3 class="text-base font-bold text-slate-700">尚無歷史紀錄</h3>
      <p class="text-xs text-slate-400 mt-1">前往「薪資分配」頁籤完成首次儲存後，紀錄即會顯示於此。</p>
    </div>

    <!-- 歷史紀錄列表 (按月份排序) -->
    <div v-else class="space-y-4">
      <div 
        v-for="record in sortedHistory" 
        :key="record.id || `${record.payday}-${record.month}`"
        class="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="bg-indigo-50 text-indigo-600 font-bold px-3.5 py-1.5 rounded-xl text-sm">
              {{ new Date(record.payday).getFullYear() }} 年 {{ record.month }} 月
            </div>
            <div class="text-xs text-slate-400 flex items-center gap-1">
              <i class="pi pi-calendar text-[11px]"></i> 發薪日：{{ record.payday }}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="openEditModal(record)"
              class="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <i class="pi pi-pencil"></i> 編輯歷史紀錄與細項
            </button>
            <button 
              @click="deleteRecord(record.id)"
              class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>

        <!-- 數據卡片區域 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-4 text-center">
          <div class="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/50">
            <div class="text-[11px] text-emerald-600 font-medium mb-0.5">薪資收入</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.income || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-amber-50/60 p-3 rounded-2xl border border-amber-100/50">
            <div class="text-[11px] text-amber-600 font-medium mb-0.5">投資規劃</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.investment || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-purple-50/60 p-3 rounded-2xl border border-purple-100/50">
            <div class="text-[11px] text-purple-600 font-medium mb-0.5">消費基金</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.consumerFund || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100/50">
            <div class="text-[11px] text-indigo-600 font-medium mb-0.5">零用金</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.allowance || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-rose-50/60 p-3 rounded-2xl border border-rose-100/50">
            <div class="text-[11px] text-rose-600 font-medium mb-0.5">固定支出</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.fixedExpenses || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/50">
            <div class="text-[11px] text-blue-600 font-medium mb-0.5">緊急備用金</div>
            <div class="text-sm font-bold text-slate-800">${{ (record.emergencyFund || 0).toLocaleString() }}</div>
          </div>

          <div class="bg-slate-100/80 p-3 rounded-2xl border border-slate-200/60 col-span-2 sm:col-span-1">
            <div class="text-[11px] text-slate-500 font-medium mb-0.5">本月淨額</div>
            <div 
              class="text-sm font-extrabold"
              :class="calculateNetAmount(record) >= 0 ? 'text-emerald-600' : 'text-rose-600'"
            >
              ${{ calculateNetAmount(record).toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- 固定支出細項快照展開 -->
        <div v-if="record.fixedExpensesSnapshot && record.fixedExpensesSnapshot.length > 0" class="mt-4 pt-3 border-t border-slate-100">
          <button 
            @click="toggleExpand(record.id || `${record.payday}`)"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 focus:outline-none"
          >
            <i class="pi text-[10px]" :class="expandedItems[record.id || `${record.payday}`] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            {{ expandedItems[record.id || `${record.payday}`] ? '收起固定支出細項' : `檢視當月固定支出細項快照 (${record.fixedExpensesSnapshot.length} 項)` }}
          </button>

          <div v-if="expandedItems[record.id || `${record.payday}`]" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3 bg-slate-50 p-3 rounded-2xl">
            <div 
              v-for="item in record.fixedExpensesSnapshot" 
              :key="item.id || item.name"
              class="bg-white px-3 py-2 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <span class="text-slate-600 font-medium truncate">{{ item.name }}</span>
              <span class="text-slate-800 font-bold">${{ (item.amount || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 客製化歷史紀錄編輯 Modal 彈窗 -->
    <div v-if="isEditModalOpen && editingDraft" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
        
        <div class="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i class="pi pi-sliders-h text-indigo-500"></i>
              客製編輯 {{ editingDraft.month }} 月歷史紀錄與細項快照
            </h3>
            <p class="text-xs text-slate-400 mt-1">修改紀錄金額或固定細項快照，大額支出累計將自動連動更新。</p>
          </div>
          <button @click="closeEditModal" class="text-slate-400 hover:text-slate-600 text-lg p-1">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- 編輯表單欄位 -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-600">薪資收入</label>
              <input type="number" v-model="editingDraft.income" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-600">投資規劃</label>
              <input type="number" v-model="editingDraft.investment" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-600">消費基金</label>
              <input type="number" v-model="editingDraft.consumerFund" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-600">零用金</label>
              <input type="number" v-model="editingDraft.allowance" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-600">緊急備用金</label>
              <input type="number" v-model="editingDraft.emergencyFund" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            </div>
          </div>

          <!-- 固定費用細項編輯快照區 -->
          <div v-if="editingDraft.fixedExpensesSnapshot && editingDraft.fixedExpensesSnapshot.length > 0" class="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">當月固定項目細項快照 (修改金額自動算入總計與大額連動)</span>
              <span class="text-xs font-bold text-rose-500">固定總計: ${{ editingDraft.fixedExpenses.toLocaleString() }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div 
                v-for="item in editingDraft.fixedExpensesSnapshot" 
                :key="item.id || item.name"
                class="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
              >
                <span class="text-slate-700 font-medium truncate max-w-35">{{ item.name }}</span>
                <div class="relative w-28">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input 
                    type="number" 
                    v-model="item.amount"
                    @input="updateEditFixedExpenses"
                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-right rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 計算後的淨額 preview -->
          <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <span class="text-sm font-semibold text-indigo-900">試算淨額</span>
            <span 
              class="text-xl font-extrabold"
              :class="calculateNetAmount(editingDraft) >= 0 ? 'text-emerald-600' : 'text-rose-600'"
            >
              ${{ calculateNetAmount(editingDraft).toLocaleString() }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button @click="closeEditModal" class="px-5 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
            取消
          </button>
          <button @click="handleSaveEdit" class="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            儲存歷史變更
          </button>
        </div>

      </div>
    </div>

  </div>
</template>