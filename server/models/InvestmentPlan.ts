import mongoose, { Schema, Document } from 'mongoose'

export interface IInvestmentTransaction {
  id: string
  type: 'deposit' | 'expense'
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface IInvestmentPlan extends Document {
  id: string
  targetAmount: number
  transactions: IInvestmentTransaction[]
  createdAt?: number
  updatedAt?: number
}

const InvestmentTransactionSchema = new Schema<IInvestmentTransaction>({
  id: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'expense'], required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() }
})

const InvestmentPlanSchema = new Schema<IInvestmentPlan>({
  id: { type: String, required: true, unique: true },
  targetAmount: { type: Number, default: 0 },
  transactions: [InvestmentTransactionSchema]
}, { timestamps: true })

export const InvestmentPlanModel = mongoose.models.InvestmentPlan || mongoose.model<IInvestmentPlan>('InvestmentPlan', InvestmentPlanSchema)
