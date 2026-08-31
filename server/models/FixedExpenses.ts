import mongoose, { Schema, Document } from 'mongoose'

export interface IFixedExpenses extends Document {
  monthly: Array<{ id: string; name: string; amount: number }>
  annual: Array<{ id: string; name: string; amount: number; month: number }>
  autoDeductSettings: { enabled: boolean; accountName: string; deductDay: number }
  paymentLogs: Array<{ id: string; month: string; itemType: string; itemId: string; name: string; amount: number; paidAt: number }>
}

const FixedExpensesSchema = new Schema<IFixedExpenses>({
  monthly: [{
    id: String,
    name: String,
    amount: Number
  }],
  annual: [{
    id: String,
    name: String,
    amount: Number,
    month: Number
  }],
  autoDeductSettings: {
    enabled: { type: Boolean, default: true },
    accountName: { type: String, default: '主要扣款帳戶' },
    deductDay: { type: Number, default: 5 }
  },
  paymentLogs: [{
    id: String,
    month: String,
    itemType: String,
    itemId: String,
    name: String,
    amount: Number,
    paidAt: Number
  }]
}, { timestamps: true })

export const FixedExpensesModel = mongoose.models.FixedExpenses || mongoose.model<IFixedExpenses>('FixedExpenses', FixedExpensesSchema)
