import mongoose, { Schema, Document } from 'mongoose'

export interface IEntertainmentTransaction {
  id: string
  type: 'deposit' | 'expense'
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface IEntertainmentFund extends Document {
  id: string
  targetAmount?: number
  transactions: IEntertainmentTransaction[]
  createdAt?: number
  updatedAt?: number
}

const EntertainmentTransactionSchema = new Schema<IEntertainmentTransaction>({
  id: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'expense'], required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() }
})

const EntertainmentFundSchema = new Schema<IEntertainmentFund>({
  id: { type: String, required: true, unique: true },
  targetAmount: { type: Number, default: 0 },
  transactions: [EntertainmentTransactionSchema]
}, { timestamps: true })

export const EntertainmentFundModel = mongoose.models.EntertainmentFund || mongoose.model<IEntertainmentFund>('EntertainmentFund', EntertainmentFundSchema)
