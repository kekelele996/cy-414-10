import type { Response } from 'express'
import { ErrorCodes } from '../constants/errorCodes'
import { UserRole } from '../constants/user'
import { trainingPlanCreateSchema, trainingPlanUpdateSchema } from '../models/TrainingPlan'
import { trainingPlanService } from '../services/trainingPlanService'
import { AppError } from '../utils/AppError'
import { logger } from '../utils/logger'
import type { AuthedRequest } from '../types/auth'

export const trainingPlanController = {
  async create(req: AuthedRequest, res: Response) {
    try {
      const payload = trainingPlanCreateSchema.parse(req.body)
      const role = req.user?.role || UserRole.COACH
      res.status(201).json(await trainingPlanService.create(req.user?.id || 0, role, payload))
    } catch (error) {
      logger.error('TRAINING_PLAN_CREATE_ERROR', { coachId: req.user?.id || 0, role: req.user?.role || UserRole.COACH })
      throw error instanceof AppError ? error : new AppError('TrainingPlan create failed: invalid payload', 400, ErrorCodes.TRAINING_PLAN_INVALID, 'TrainingPlan', 'payload', req.user?.role || UserRole.COACH)
    }
  },

  async update(req: AuthedRequest, res: Response) {
    try {
      const payload = trainingPlanUpdateSchema.parse(req.body)
      const role = req.user?.role || UserRole.COACH
      res.json(await trainingPlanService.update(Number(req.params.id), req.user?.id || 0, role, payload))
    } catch (error) {
      logger.error('TRAINING_PLAN_UPDATE_ERROR', { planId: req.params.id, coachId: req.user?.id || 0, role: req.user?.role || UserRole.COACH })
      throw error instanceof AppError ? error : new AppError(`TrainingPlan[id=${req.params.id}] update failed: invalid payload`, 400, ErrorCodes.TRAINING_PLAN_INVALID, 'TrainingPlan', 'payload', req.user?.role || UserRole.COACH)
    }
  },

  async getByBookingId(req: AuthedRequest, res: Response) {
    const role = req.user?.role || UserRole.STUDENT
    const result = await trainingPlanService.getByBookingId(Number(req.params.bookingId), req.user?.id || 0, role)
    if (!result) {
      return res.status(404).json(null)
    }
    res.json(result)
  },

  async getCurrentPlan(req: AuthedRequest, res: Response) {
    const role = req.user?.role || UserRole.STUDENT
    const result = await trainingPlanService.getCurrentPlan(req.user?.id || 0, role)
    if (!result) {
      return res.status(404).json(null)
    }
    res.json(result)
  },

  async listByCoach(req: AuthedRequest, res: Response) {
    const role = req.user?.role || UserRole.COACH
    res.json(await trainingPlanService.listByCoach(req.user?.id || 0, role))
  }
}
