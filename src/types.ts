import type { Component } from 'vue'

// ────────────── Fixed Expense ──────────────

export interface FixedItem {
  id: string
  name: string
  amount: number
  systemId?: string // 用於標示此為系統連動產生的項目 (例如緊急備用金)
}

export interface AnnualItem {
  id: string
  name: string
  amount: number
  dueDate: string
  monthly: number
}

export interface BreakdownItem {
  name: string
  amount: number
}

// FixedRow 是 fixedItems 與 annualItems 合併顯示用的衍生型別
export type FixedRow =
  | { id: string; name: string; amount: number; source: 'monthly'; systemId?: string }
  | { id: string; name: string; amount: number; source: 'annual'; dueDate: string; yearly: number }

// ────────────── Cash Flow ──────────────

export interface CashFlowRecord {
  id: string
  createdAt: string | null
  month: string
  income: number
  fixedExpense: number
  fixedBreakdown: BreakdownItem[]
  saving: number
  emergencyFund: number
  otherFund: number
  balance: number
}

export interface CashFlowForm {
  month: string
  income: number | string
  saving: number | string
  emergencyFund: number | string
  otherFund: number | string
}

// ────────────── Allowance ──────────────

export interface AllowanceItem {
  id: string
  createdAt: string
  month: string
  name: string
  amount: number
  date: string
}

export interface AllowanceItemInput {
  month: string
  name?: string | number
  amount?: number | string
  date?: string
}

export interface AllowanceItemPatch {
  name?: string
  amount?: number | string
  date?: string
}

// ────────────── First Goal / Plan ──────────────

export interface Plan {
  id: string
  createdAt: string
  goal: number
  monthlyPlan: number
  totalAssets: number
  remaining: number
  months: number | null
  targetDateLabel: string
}

// ────────────── Emergency Fund ──────────────

export interface EmergencyFundItem {
  id: string
  name: string
  amount: number
  isEnabled: boolean
}

export interface TransactionRecord {
  id: string
  date: string
  description: string
  amount: number
  type: 'in' | 'out'
}

// ────────────── Navigation ──────────────

export interface Tab {
  id: string
  label: string
  shortLabel: string
  icon: string
  component: Component
}

// ────────────── History ──────────────

export type HistoryEntry =
  | (CashFlowRecord & { kind: 'cashflow' })
  | (Plan & { kind: 'plan' })
