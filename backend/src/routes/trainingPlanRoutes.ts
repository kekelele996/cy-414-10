import { Router } from 'express'
import { UserRole } from '../constants/user'
import { trainingPlanController } from '../controllers/trainingPlanController'
import { auth } from '../middlewares/auth'
import { generalRateLimiter } from '../middlewares/rateLimiter'
import { roleCheck } from '../middlewares/roleCheck'
import { asyncHandler } from '../utils/asyncHandler'

export const trainingPlanRoutes = Router()

trainingPlanRoutes.post(
  '/training-plans',
  auth,
  roleCheck([UserRole.COACH, UserRole.ADMIN]),
  generalRateLimiter,
  asyncHandler(trainingPlanController.create)
)
trainingPlanRoutes.patch(
  '/training-plans/:id',
  auth,
  roleCheck([UserRole.COACH, UserRole.ADMIN]),
  generalRateLimiter,
  asyncHandler(trainingPlanController.update)
)
trainingPlanRoutes.get(
  '/training-plans/booking/:bookingId',
  auth,
  generalRateLimiter,
  asyncHandler(trainingPlanController.getByBookingId)
)
trainingPlanRoutes.get(
  '/training-plans/current',
  auth,
  roleCheck([UserRole.STUDENT, UserRole.ADMIN]),
  generalRateLimiter,
  asyncHandler(trainingPlanController.getCurrentPlan)
)
trainingPlanRoutes.get(
  '/training-plans/coach',
  auth,
  roleCheck([UserRole.COACH, UserRole.ADMIN]),
  generalRateLimiter,
  asyncHandler(trainingPlanController.listByCoach)
)
