import { persistedList, nextId } from '../../shared/storage'
import { useCashFlow } from '../cash-flow/useCashFlow'
import type { AllowanceItem, AllowanceItemInput, AllowanceItemPatch } from '../../types'

// 這個 feature 擁有零用金支出項目。額度不自己存，
// 而是向 cash-flow 要該月紀錄算出來的剩餘餘額。

const ALLOWANCE_KEY = 'finance_allowance_items'

const allowanceItems = persistedList<AllowanceItem>(ALLOWANCE_KEY)

const { findByMonth } = useCashFlow()

function itemsOf(month: string): AllowanceItem[] {
  return allowanceItems.value.filter((i) => i.month === month)
}

function spent(month: string): number {
  return itemsOf(month).reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
}

// 該月現金流算出的剩餘零用金，就是可花的預算
function budget(month: string): number {
  const record = findByMonth(month)
  return record ? Number(record.balance) || 0 : 0
}

function left(month: string): number {
  return budget(month) - spent(month)
}

function addItem({ month, name, amount, date }: AllowanceItemInput): AllowanceItem {
  const item: AllowanceItem = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    month,
    name: String(name || '').trim() || '未命名支出',
    amount: Number(amount) || 0,
    date: date || ''
  }
  allowanceItems.value.unshift(item)
  return item
}

function updateItem(id: string, patch: AllowanceItemPatch): void {
  const item = allowanceItems.value.find((i) => i.id === id)
  if (!item) return
  if (patch.name !== undefined) item.name = patch.name
  if (patch.amount !== undefined) item.amount = Number(patch.amount) || 0
  if (patch.date !== undefined) item.date = patch.date
}

function normalizeItem(id: string): void {
  const item = allowanceItems.value.find((i) => i.id === id)
  if (!item) return
  item.name = String(item.name ?? '').trim() || '未命名支出'
  item.amount = Number(item.amount) || 0
}

function removeItem(id: string): void {
  const index = allowanceItems.value.findIndex((i) => i.id === id)
  if (index !== -1) allowanceItems.value.splice(index, 1)
}

export function useAllowance() {
  return {
    allowanceItems,
    itemsOf,
    spent,
    budget,
    left,
    addItem,
    updateItem,
    normalizeItem,
    removeItem
  }
}
