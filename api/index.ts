import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import mongoose, { Schema, Document } from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

// === 1. Salary Allocation Schema & Model ===
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

// === 2. Fixed Expenses Schema & Model ===
export interface IFixedExpenses extends Document {
  monthly: Array<{ id: string; name: string; amount: number }>
  annual: Array<{ id: string; name: string; amount: number; month: number }>
  autoDeductSettings: { enabled: boolean; accountName: string; deductDay: number }
  paymentLogs: Array<{ id: string; month: string; itemType: string; itemId: string; name: string; amount: number; paidAt: number }>
}

const FixedExpensesSchema = new Schema<IFixedExpenses>({
  monthly: [{ id: String, name: String, amount: Number }],
  annual: [{ id: String, name: String, amount: Number, month: Number }],
  autoDeductSettings: {
    enabled: { type: Boolean, default: true },
    accountName: { type: String, default: '主要扣款帳戶' },
    deductDay: { type: Number, default: 5 }
  },
  paymentLogs: [{
    id: String, month: String, itemType: String, itemId: String, name: String, amount: Number, paidAt: Number
  }]
}, { timestamps: true })

export const FixedExpensesModel = mongoose.models.FixedExpenses || mongoose.model<IFixedExpenses>('FixedExpenses', FixedExpensesSchema)

// === 3. Emergency Goal Schema & Model ===
export interface IEmergencyGoal extends Document {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  depositPlans: Array<{ id: string; amount: number; isActive: boolean; isLocked: boolean; createdAt: number }>
  transactions: Array<{ id: string; type: 'deposit' | 'expense'; name: string; amount: number; date: string; createdAt: number }>
  lastProcessedMonth?: string
  createdAt: number
  updatedAt: number
}

const EmergencyGoalSchema = new Schema<IEmergencyGoal>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  depositPlans: [{ id: String, amount: Number, isActive: Boolean, isLocked: Boolean, createdAt: Number }],
  transactions: [{ id: String, type: { type: String, enum: ['deposit', 'expense'] }, name: String, amount: Number, date: String, createdAt: Number }],
  lastProcessedMonth: String,
  createdAt: Number,
  updatedAt: Number
}, { timestamps: true })

export const EmergencyGoalModel = mongoose.models.EmergencyGoal || mongoose.model<IEmergencyGoal>('EmergencyGoal', EmergencyGoalSchema)

// === 4. Pocket Money Schema & Model ===
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

// === Express App & DB Connection ===
export const app = express()

app.use(cors())
app.use(express.json())

let isConnected = false
export const connectDb = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return
  const uri = process.env.MONGODB_URI || ''
  if (!uri || uri.includes('<db_password>')) {
    console.warn('⚠️ MONGODB_URI 未設定或包含 <db_password>')
    return
  }
  try {
    await mongoose.connect(uri)
    isConnected = true
    console.log('✅ 成功連線至 MongoDB Atlas 雲端資料庫！')
  } catch (err: any) {
    console.error('❌ MongoDB Atlas 連線失敗:', err.message)
    throw err
  }
}

// === Routes ===
app.get('/api/health', async (req, res) => {
  await connectDb()
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  })
})

app.get('/api/salary-allocation', async (req, res) => {
  try {
    await connectDb()
    const records = await SalaryAllocationModel.find({}).lean()
    res.json(records)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/salary-allocation', async (req, res) => {
  try {
    await connectDb()
    const data = req.body
    if (Array.isArray(data)) {
      await SalaryAllocationModel.deleteMany({})
      const saved = data.length > 0 ? await SalaryAllocationModel.insertMany(data) : []
      return res.json(saved)
    } else {
      const updated = await SalaryAllocationModel.findOneAndUpdate(
        { id: data.id },
        data,
        { upsert: true, returnDocument: 'after' }
      )
      return res.json(updated)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/fixed-expenses', async (req, res) => {
  try {
    await connectDb()
    let data = await FixedExpensesModel.findOne({}).lean()
    if (!data) {
      data = {
        monthly: [],
        annual: [],
        autoDeductSettings: { enabled: true, accountName: '主要扣款帳戶', deductDay: 5 },
        paymentLogs: []
      } as any
    }
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/fixed-expenses', async (req, res) => {
  try {
    await connectDb()
    const data = req.body
    const saved = await FixedExpensesModel.findOneAndUpdate(
      {},
      {
        monthly: data.monthly || [],
        annual: data.annual || [],
        autoDeductSettings: data.autoDeductSettings,
        paymentLogs: data.paymentLogs
      },
      { upsert: true, returnDocument: 'after' }
    )
    res.json(saved)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/emergency-fund', async (req, res) => {
  try {
    await connectDb()
    const goals = await EmergencyGoalModel.find({}).lean()
    res.json(goals)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/emergency-fund', async (req, res) => {
  try {
    await connectDb()
    const goals = req.body
    if (Array.isArray(goals)) {
      await EmergencyGoalModel.deleteMany({})
      const saved = goals.length > 0 ? await EmergencyGoalModel.insertMany(goals) : []
      return res.json(saved)
    } else {
      const updated = await EmergencyGoalModel.findOneAndUpdate(
        { id: goals.id },
        goals,
        { upsert: true, returnDocument: 'after' }
      )
      return res.json(updated)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// === 4. 零用金 Pocket Money API ===
app.get('/api/pocket-money', async (req, res) => {
  try {
    await connectDb()
    const records = await PocketMoneyModel.find({}).lean()
    res.json(records)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/pocket-money', async (req, res) => {
  try {
    await connectDb()
    const records = req.body
    if (Array.isArray(records)) {
      await PocketMoneyModel.deleteMany({})
      const saved = records.length > 0 ? await PocketMoneyModel.insertMany(records) : []
      return res.json(saved)
    } else {
      const updated = await PocketMoneyModel.findOneAndUpdate(
        { id: records.id },
        records,
        { upsert: true, returnDocument: 'after' }
      )
      return res.json(updated)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Vercel Serverless Function Default Export Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDb()
    return app(req, res)
  } catch (err: any) {
    console.error('❌ Vercel Serverless Function Error:', err)
    return res.status(500).json({
      error: 'Serverless Error',
      message: err.message || String(err)
    })
  }
}
