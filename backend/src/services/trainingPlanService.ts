import { prisma } from '../config/database'
import { BookingStatus } from '../constants/booking'
import { ErrorCodes } from '../constants/errorCodes'
import { UserRole } from '../constants/user'
import { trainingPlanCreateSchema, trainingPlanUpdateSchema } from '../models/TrainingPlan'
import type { TrainingPlanDto, TrainingPlanItemDto } from '../types/domain'
import { AppError } from '../utils/AppError'
import { logger } from '../utils/logger'
import type { z } from 'zod'

function toTrainingPlanItemDto(item: any): TrainingPlanItemDto {
  return {
    id: item.id,
    exerciseName: item.exerciseName,
    sets: item.sets,
    reps: item.reps,
    note: item.note,
    sortOrder: item.sortOrder
  }
}

function toTrainingPlanDto(plan: any): TrainingPlanDto {
  return {
    id: plan.id,
    bookingId: plan.bookingId,
    coachId: plan.coachId,
    userId: plan.userId,
    stageName: plan.stageName,
    overallNote: plan.overallNote,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items: plan.items ? plan.items.map(toTrainingPlanItemDto) : [],
    coach: plan.coach
      ? {
          id: plan.coach.id,
          nickname: plan.coach.nickname,
          avatar: plan.coach.avatar,
          role: plan.coach.role
        }
      : undefined,
    booking: plan.booking
      ? {
          id: plan.booking.id,
          userId: plan.booking.userId,
          courseId: plan.booking.courseId,
          scheduleTime: plan.booking.scheduleTime,
          status: plan.booking.status,
          note: plan.booking.note,
          course: plan.booking.course
            ? {
                id: plan.booking.course.id,
                coachId: plan.booking.course.coachId,
                title: plan.booking.course.title,
                description: plan.booking.course.description,
                duration: plan.booking.course.duration,
                price: Number(plan.booking.course.price),
                maxCapacity: plan.booking.course.maxCapacity,
                schedule: Array.isArray(plan.booking.course.schedule) ? plan.booking.course.schedule : [],
                status: plan.booking.course.status
              }
            : undefined
        }
      : undefined
  }
}

export const trainingPlanService = {
  async create(coachId: number, role: string, payload: z.infer<typeof trainingPlanCreateSchema>) {
    logger.info('TRAINING_PLAN_CREATE_START', { coachId, bookingId: payload.bookingId })

    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { course: true }
    })
    if (!booking) {
      throw new AppError(`TrainingPlan[booking_id=${payload.bookingId}] create failed: Booking not found role=${role}`, 404, ErrorCodes.BOOKING_NOT_FOUND, 'TrainingPlan', 'booking_id', role)
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppError(`TrainingPlan[booking_id=${payload.bookingId}] create failed: Booking not completed role=${role}`, 409, ErrorCodes.BOOKING_NOT_COMPLETED, 'TrainingPlan', 'booking.status', role)
    }

    if (role === UserRole.COACH && booking.course.coachId !== coachId) {
      throw new AppError(`TrainingPlan[booking_id=${payload.bookingId}] create failed: Coach not match role=${role}`, 403, ErrorCodes.TRAINING_PLAN_COACH_REQUIRED, 'TrainingPlan', 'booking.course.coach_id', role)
    }

    const existing = await prisma.trainingPlan.findUnique({ where: { bookingId: payload.bookingId } })
    if (existing) {
      return this.update(existing.id, coachId, role, {
        stageName: payload.stageName,
        overallNote: payload.overallNote,
        items: payload.items
      })
    }

    const plan = await prisma.trainingPlan.create({
      data: {
        bookingId: payload.bookingId,
        coachId,
        userId: booking.userId,
        stageName: payload.stageName,
        overallNote: payload.overallNote,
        items: {
          create: payload.items.map((item, idx) => ({
            exerciseName: item.exerciseName,
            sets: item.sets,
            reps: item.reps,
            note: item.note,
            sortOrder: item.sortOrder ?? idx
          }))
        }
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        coach: true,
        booking: { include: { course: true } }
      }
    })

    logger.info('TRAINING_PLAN_CREATE_SUCCESS', { id: plan.id })
    return toTrainingPlanDto(plan)
  },

  async update(planId: number, coachId: number, role: string, payload: z.infer<typeof trainingPlanUpdateSchema>) {
    logger.info('TRAINING_PLAN_UPDATE_START', { planId, coachId })

    const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      throw new AppError(`TrainingPlan[id=${planId}] update failed: not found role=${role}`, 404, ErrorCodes.TRAINING_PLAN_NOT_FOUND, 'TrainingPlan', 'id', role)
    }

    if (role === UserRole.COACH && plan.coachId !== coachId) {
      throw new AppError(`TrainingPlan[id=${planId}] update failed: Coach not match role=${role}`, 403, ErrorCodes.TRAINING_PLAN_COACH_REQUIRED, 'TrainingPlan', 'coach_id', role)
    }

    const updated = await prisma.trainingPlan.update({
      where: { id: planId },
      data: {
        stageName: payload.stageName,
        overallNote: payload.overallNote,
        items: {
          deleteMany: {},
          create: payload.items.map((item, idx) => ({
            exerciseName: item.exerciseName,
            sets: item.sets,
            reps: item.reps,
            note: item.note,
            sortOrder: item.sortOrder ?? idx
          }))
        }
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        coach: true,
        booking: { include: { course: true } }
      }
    })

    logger.info('TRAINING_PLAN_UPDATE_SUCCESS', { id: updated.id })
    return toTrainingPlanDto(updated)
  },

  async getByBookingId(bookingId: number, userId: number, role: string) {
    logger.info('TRAINING_PLAN_GET_BY_BOOKING', { bookingId, userId, role })

    const plan = await prisma.trainingPlan.findUnique({
      where: { bookingId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        coach: true,
        booking: { include: { course: true } }
      }
    })

    if (!plan) {
      return null
    }

    if (role === UserRole.STUDENT && plan.userId !== userId) {
      throw new AppError(`TrainingPlan[booking_id=${bookingId}] access denied: user not match role=${role}`, 403, ErrorCodes.TRAINING_PLAN_NOT_FOUND, 'TrainingPlan', 'user_id', role)
    }
    if (role === UserRole.COACH && plan.coachId !== userId) {
      throw new AppError(`TrainingPlan[booking_id=${bookingId}] access denied: coach not match role=${role}`, 403, ErrorCodes.TRAINING_PLAN_COACH_REQUIRED, 'TrainingPlan', 'coach_id', role)
    }

    return toTrainingPlanDto(plan)
  },

  async getCurrentPlan(userId: number, role: string) {
    logger.info('TRAINING_PLAN_GET_CURRENT', { userId, role })

    if (role !== UserRole.STUDENT && role !== UserRole.ADMIN) {
      return null
    }

    const where = role === UserRole.ADMIN ? {} : { userId }
    const plans = await prisma.trainingPlan.findMany({
      where,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        coach: true,
        booking: { include: { course: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    if (!plans.length) {
      return null
    }

    return toTrainingPlanDto(plans[0])
  },

  async listByCoach(coachId: number, role: string) {
    logger.info('TRAINING_PLAN_LIST_BY_COACH', { coachId, role })

    if (role !== UserRole.COACH && role !== UserRole.ADMIN) {
      return []
    }

    const where = role === UserRole.ADMIN ? {} : { coachId }
    const plans = await prisma.trainingPlan.findMany({
      where,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        coach: true,
        booking: { include: { course: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return plans.map(toTrainingPlanDto)
  }
}
