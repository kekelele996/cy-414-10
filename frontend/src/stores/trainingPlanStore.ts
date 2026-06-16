import { defineStore } from 'pinia'
import { trainingPlanApi } from '@/api/trainingPlan'
import type { TrainingPlan, TrainingPlanItemInput } from '@/types/domain'

export const useTrainingPlanStore = defineStore('trainingPlan', {
  state: () => ({
    currentPlan: null as TrainingPlan | null,
    coachPlans: [] as TrainingPlan[],
    bookingPlanMap: new Map<number, TrainingPlan | null>()
  }),
  actions: {
    async createPlan(bookingId: number, stageName: string | undefined, overallNote: string | undefined, items: TrainingPlanItemInput[]) {
      const plan = await trainingPlanApi.create({ bookingId, stageName, overallNote, items })
      this.bookingPlanMap.set(bookingId, plan)
      const idx = this.coachPlans.findIndex(p => p.bookingId === bookingId)
      if (idx >= 0) {
        this.coachPlans[idx] = plan
      } else {
        this.coachPlans.unshift(plan)
      }
      return plan
    },
    async updatePlan(id: number, stageName: string | undefined, overallNote: string | undefined, items: TrainingPlanItemInput[]) {
      const plan = await trainingPlanApi.update(id, { stageName, overallNote, items })
      if (plan.bookingId) {
        this.bookingPlanMap.set(plan.bookingId, plan)
      }
      const idx = this.coachPlans.findIndex(p => p.id === id)
      if (idx >= 0) {
        this.coachPlans[idx] = plan
      }
      if (this.currentPlan?.id === id) {
        this.currentPlan = plan
      }
      return plan
    },
    async loadByBookingId(bookingId: number) {
      try {
        const plan = await trainingPlanApi.getByBookingId(bookingId)
        this.bookingPlanMap.set(bookingId, plan)
        return plan
      } catch {
        this.bookingPlanMap.set(bookingId, null)
        return null
      }
    },
    async loadCurrentPlan() {
      try {
        this.currentPlan = await trainingPlanApi.getCurrentPlan()
      } catch {
        this.currentPlan = null
      }
      return this.currentPlan
    },
    async loadCoachPlans() {
      try {
        this.coachPlans = await trainingPlanApi.listByCoach()
      } catch {
        this.coachPlans = []
      }
      return this.coachPlans
    }
  }
})
