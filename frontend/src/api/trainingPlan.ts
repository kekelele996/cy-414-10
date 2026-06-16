import { request } from '@/utils/request'
import type { TrainingPlan, TrainingPlanItemInput } from '@/types/domain'

export const trainingPlanApi = {
  create(payload: { bookingId: number; stageName?: string; overallNote?: string; items: TrainingPlanItemInput[] }) {
    return request.post<unknown, TrainingPlan>('/training-plans', payload)
  },
  update(id: number, payload: { stageName?: string; overallNote?: string; items: TrainingPlanItemInput[] }) {
    return request.patch<unknown, TrainingPlan>(`/training-plans/${id}`, payload)
  },
  getByBookingId(bookingId: number) {
    return request.get<unknown, TrainingPlan | null>(`/training-plans/booking/${bookingId}`)
  },
  getCurrentPlan() {
    return request.get<unknown, TrainingPlan | null>('/training-plans/current')
  },
  listByCoach() {
    return request.get<unknown, TrainingPlan[]>('/training-plans/coach')
  }
}
