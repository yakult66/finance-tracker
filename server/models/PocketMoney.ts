import mongoose, { Schema, Document } from 'mongoose'

export interface IPocketMoneyTransaction {
  id: string
  type: 'income' | 'expense'
  category: '餐費' | '交通' | '遠程交通' | '旅遊' | '娛樂' | '其他'
  name: string
  amount: number
  date: string
  createdAt: number
}

export interface IPocketMoney extends Document {
  id: string
  year: number
  month: number
  allocatedAllowance: number
  transactions: IPocketMoneyTransaction[]
}

const PocketMoneyTransactionSchema = new Schema<IPocketMoneyTransaction>({
  id: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, enum: ['餐費', '交通', '遠程交通', '旅遊', '娛樂', '其他'], required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() }
})

const PocketMoneySchema = new Schema<IPocketMoney>({
  id: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  allocatedAllowance: { type: Number, default: 0 },
  transactions: [PocketMoneyTransactionSchema]
}, { timestamps: true })

export const PocketMoneyModel = mongoose.models.PocketMoney || mongoose.model<IPocketMoney>('PocketMoney', PocketMoneySchema)
