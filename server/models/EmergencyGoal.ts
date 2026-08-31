import mongoose, { Schema, Document } from 'mongoose'

export interface IEmergencyGoal extends Document {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  depositPlans: Array<{
    id: string
    amount: number
    isActive: boolean
    isLocked: boolean
    createdAt: number
  }>
  transactions: Array<{
    id: string
    type: 'deposit' | 'expense'
    name: string
    amount: number
    date: string
    createdAt: number
  }>
  lastProcessedMonth?: string
  createdAt: number
  updatedAt: number
}

const EmergencyGoalSchema = new Schema<IEmergencyGoal>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  depositPlans: [{
    id: String,
    amount: Number,
    isActive: Boolean,
    isLocked: Boolean,
    createdAt: Number
  }],
  transactions: [{
    id: String,
    type: { type: String, enum: ['deposit', 'expense'] },
    name: String,
    amount: Number,
    date: String,
    createdAt: Number
  }],
  lastProcessedMonth: String,
  createdAt: Number,
  updatedAt: Number
}, { timestamps: true })

export const EmergencyGoalModel = mongoose.models.EmergencyGoal || mongoose.model<IEmergencyGoal>('EmergencyGoal', EmergencyGoalSchema)
