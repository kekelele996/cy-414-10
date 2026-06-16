import { z } from 'zod'

export const trainingPlanItemSchema = z.object({
  exerciseName: z.string().min(1, '动作名称不能为空').max(120),
  sets: z.string().max(60).optional(),
  reps: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  sortOrder: z.number().int().nonnegative().default(0)
})

export const trainingPlanCreateSchema = z.object({
  bookingId: z.number().int().positive(),
  stageName: z.string().max(120).optional(),
  overallNote: z.string().max(2000).optional(),
  items: z.array(trainingPlanItemSchema).min(1, '至少需要一个训练动作')
})

export const trainingPlanUpdateSchema = z.object({
  stageName: z.string().max(120).optional(),
  overallNote: z.string().max(2000).optional(),
  items: z.array(trainingPlanItemSchema).min(1, '至少需要一个训练动作')
})
