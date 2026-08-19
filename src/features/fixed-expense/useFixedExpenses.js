import { computed } from 'vue'
import { persistedRef, persistedList, nextId } from '../../shared/storage.js'

// 這個 feature 是固定支出的唯一擁有者：每月固定項目與年度重大費用。
// 其它 feature 只透過下面回傳的介面讀取，不直接碰 localStorage。

const FIXED_ITEMS_KEY = 'finance_fixed_items'
const ANNUAL_ITEMS_KEY = 'finance_annual_items'

// 第一次使用時，用舊版固定費用的預設值 6000 開一筆，行為才不會突然變成 0
const SEED_FIXED_ITEMS = [{ id: nextId(), name: '固定費用', amount: 6000 }]

// 繳款日只留月/日，舊資料的 YYYY-MM-DD 砍掉年份
export function normalizeDue(value) {
  if (!value) return ''
  const parts = String(value).split('-')
  if (parts.length < 2) return ''
  const [m, d] = parts.slice(-2)
  return `${String(Number(m) || 1).padStart(2, '0')}-${String(Number(d) || 1).padStart(2, '0')}`
}

// 沒指定每月預留時，就把年度金額平均到 12 個月
export const suggestMonthly = (amount) => Math.ceil((Number(amount) || 0) / 12)

// fallback 用 null 才分得出「沒存過」和「存過但清空了」：前者才給種子資料
const fixedItems = persistedRef(FIXED_ITEMS_KEY, null, {
  revive: (stored) => (Array.isArray(stored) ? stored : SEED_FIXED_ITEMS),
  immediate: true
})

const annualItems = persistedList(ANNUAL_ITEMS_KEY, {
  revive: (list) => list.map((i) => ({ ...i, dueDate: normalizeDue(i.dueDate) }))
})

const monthlyFixedTotal = computed(() =>
  fixedItems.value.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
)

const annualMonthlyTotal = computed(() =>
  annualItems.value.reduce((acc, cur) => acc + (Number(cur.monthly) || 0), 0)
)

const annualYearlyTotal = computed(() =>
  annualItems.value.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
)

// 對外的單一數字：月現金流的「固定費用」就是這個
const fixedExpenseTotal = computed(
  () => monthlyFixedTotal.value + annualMonthlyTotal.value
)

// 固定項目清單會一併列出年度費用，但它們的值仍以 annualItems 為準，
// 用衍生的方式併進來就不會有兩份資料對不上的問題。
const fixedRows = computed(() => [
  ...fixedItems.value.map((i) => ({
    id: i.id,
    name: i.name,
    amount: i.amount,
    source: 'monthly'
  })),
  ...annualItems.value.map((i) => ({
    id: i.id,
    name: i.name,
    amount: i.monthly,
    source: 'annual',
    dueDate: i.dueDate,
    yearly: i.amount
  }))
])

// 存進月紀錄用的組成明細快照
function breakdownSnapshot() {
  return [
    ...fixedItems.value.map((i) => ({
      name: i.name,
      amount: Number(i.amount) || 0
    })),
    ...annualItems.value.map((i) => ({
      name: `${i.name}（年度攤提）`,
      amount: Number(i.monthly) || 0
    }))
  ]
}

function addFixedItem({ name, amount }) {
  const item = {
    id: nextId(),
    name: String(name || '').trim() || '未命名項目',
    amount: Number(amount) || 0
  }
  fixedItems.value.push(item)
  return item
}

// 輸入中不動使用者打的內容，離開欄位才由 normalize 補預設值
function updateFixedItem(id, patch) {
  const item = fixedItems.value.find((i) => i.id === id)
  if (!item) return
  if (patch.name !== undefined) item.name = patch.name
  if (patch.amount !== undefined) item.amount = patch.amount
}

function normalizeFixedItem(id) {
  const item = fixedItems.value.find((i) => i.id === id)
  if (!item) return
  item.name = String(item.name ?? '').trim() || '未命名項目'
  item.amount = Number(item.amount) || 0
}

function removeFixedItem(id) {
  const index = fixedItems.value.findIndex((i) => i.id === id)
  if (index !== -1) fixedItems.value.splice(index, 1)
}

function addAnnualItem({ name, amount, dueDate, monthly }) {
  const yearly = Number(amount) || 0
  const item = {
    id: nextId(),
    name: String(name || '').trim() || '未命名項目',
    amount: yearly,
    dueDate: normalizeDue(dueDate),
    monthly:
      monthly === undefined || monthly === null || monthly === ''
        ? suggestMonthly(yearly)
        : Number(monthly) || 0
  }
  annualItems.value.push(item)
  return item
}

function updateAnnualItem(id, patch) {
  const item = annualItems.value.find((i) => i.id === id)
  if (!item) return
  if (patch.name !== undefined) item.name = patch.name
  if (patch.amount !== undefined) item.amount = patch.amount
  if (patch.dueDate !== undefined) item.dueDate = normalizeDue(patch.dueDate)
  if (patch.monthly !== undefined) item.monthly = patch.monthly
}

function normalizeAnnualItem(id) {
  const item = annualItems.value.find((i) => i.id === id)
  if (!item) return
  item.name = String(item.name ?? '').trim() || '未命名項目'
  item.amount = Number(item.amount) || 0
  item.monthly = Number(item.monthly) || 0
}

function removeAnnualItem(id) {
  const index = annualItems.value.findIndex((i) => i.id === id)
  if (index !== -1) annualItems.value.splice(index, 1)
}

export function useFixedExpenses() {
  return {
    fixedItems,
    annualItems,
    fixedRows,
    fixedExpenseTotal,
    monthlyFixedTotal,
    annualMonthlyTotal,
    annualYearlyTotal,
    breakdownSnapshot,
    addFixedItem,
    updateFixedItem,
    normalizeFixedItem,
    removeFixedItem,
    addAnnualItem,
    updateAnnualItem,
    normalizeAnnualItem,
    removeAnnualItem,
    suggestMonthly,
    normalizeDue
  }
}
