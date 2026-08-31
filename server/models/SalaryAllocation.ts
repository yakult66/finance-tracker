import mongoose, { Schema, Document } from 'mongoose'

export interface ISalaryAllocation extends Document {
  id: string
  month: number
  payday: string
  income: number
  investment: number
  consumerFund: number
  allowance: number
  fixedExpenses: number
  emergencyFund: number
  previousBalance: number
  fixedExpensesSnapshot?: Array<{
    id?: string
    name: string
    amount: number
    linkedLargeExpenseId?: string
  }>
}

const SalaryAllocationSchema = new Schema<ISalaryAllocation>({
  id: { type: String, required: true, unique: true },
  month: { type: Number, required: true },
  payday: { type: String, required: true },
  income: { type: Number, default: 0 },
  investment: { type: Number, default: 0 },
  consumerFund: { type: Number, default: 0 },
  allowance: { type: Number, default: 0 },
  fixedExpenses: { type: Number, default: 0 },
  emergencyFund: { type: Number, default: 0 },
  previousBalance: { type: Number, default: 0 },
  fixedExpensesSnapshot: [{
    id: String,
    name: String,
    amount: Number,
    linkedLargeExpenseId: String
  }]
}, { timestamps: true })

export const SalaryAllocationModel = mongoose.models.SalaryAllocation || mongoose.model<ISalaryAllocation>('SalaryAllocation', SalaryAllocationSchema)
