import { Router } from 'express'
import { bookingRoutes } from './bookingRoutes'
import { bodyMetricRoutes } from './bodyMetricRoutes'
import { courseRoutes } from './courseRoutes'
import { trainingPlanRoutes } from './trainingPlanRoutes'
import { userRoutes } from './userRoutes'

export const apiRoutes = Router()

apiRoutes.use(userRoutes)
apiRoutes.use(courseRoutes)
apiRoutes.use(bookingRoutes)
apiRoutes.use(bodyMetricRoutes)
apiRoutes.use(trainingPlanRoutes)

