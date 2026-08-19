import type { Component } from 'vue'

// ────────────── Fixed Expense ──────────────

export interface FixedItem {
  id: string
  name: string
  amount: number
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
  | { id: string; name: string; amount: number; source: 'monthly' }
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
  [key: string]: unknown
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
