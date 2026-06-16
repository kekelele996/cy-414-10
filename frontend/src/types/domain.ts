import type { BookingStatusValue } from '@/constants/booking'
import type { UserRoleValue } from '@/constants/user'

export interface User {
  id: number
  phone: string
  nickname: string
  avatar?: string | null
  role: UserRoleValue
  gender?: string | null
  height?: number | null
  weight?: number | null
  createdAt?: string
}

export interface Course {
  id: number
  coachId: number
  title: string
  description?: string | null
  duration: number
  price: number
  maxCapacity: number
  schedule: string[]
  status: string
  createdAt?: string
  coach?: Pick<User, 'id' | 'nickname' | 'avatar' | 'role'>
  reason?: string
}

export interface Booking {
  id: number
  userId: number
  courseId: number
  scheduleTime: string
  status: BookingStatusValue
  note?: string | null
  course?: Course
}

export interface BodyMetric {
  id: number
  userId: number
  weight: number
  bodyFat?: number | null
  muscle?: number | null
  bmi: number
  advice?: string
  recordDate: string
}

export interface AuthPayload {
  user: User
  token: string
}

export interface TrainingPlanItem {
  id: number
  exerciseName: string
  sets?: string | null
  reps?: string | null
  note?: string | null
  sortOrder: number
}

export interface TrainingPlanItemInput {
  exerciseName: string
  sets?: string
  reps?: string
  note?: string
  sortOrder?: number
}

export interface TrainingPlan {
  id: number
  bookingId: number
  coachId: number
  userId: number
  stageName?: string | null
  overallNote?: string | null
  createdAt: string
  updatedAt: string
  items: TrainingPlanItem[]
  coach?: Pick<User, 'id' | 'nickname' | 'avatar' | 'role'>
  booking?: Booking
}

