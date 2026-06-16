<template>
  <div class="section-band">
    <section class="grid-3">
      <div class="metric-tile">
        <span>待确认</span>
        <strong>{{ stats.pending }}</strong>
      </div>
      <div class="metric-tile">
        <span>已确认</span>
        <strong>{{ stats.confirmed }}</strong>
      </div>
      <div class="metric-tile">
        <span>已完成</span>
        <strong>{{ stats.completed }}</strong>
      </div>
    </section>

    <section v-if="bookingStore.list.length" class="list-stack">
      <article v-for="booking in bookingStore.list" :key="booking.id" class="booking-row">
        <div>
          <h3>{{ booking.course?.title || `课程 #${booking.courseId}` }}</h3>
          <p>{{ formatDateTime(booking.scheduleTime) }} · {{ booking.note || '无备注' }}</p>
          <p v-if="auth.isCoach && booking.status === BookingStatus.COMPLETED && bookingPlanMap.get(booking.id)" class="plan-link">
            <el-link type="primary" :icon="FileText" @click="openPlanDialog(booking)">已制定训练计划 · 点击查看/编辑</el-link>
          </p>
        </div>
        <BookingStatusBadge :status="booking.status" />
        <div class="toolbar">
          <el-tooltip content="取消预约" placement="top">
            <el-button v-if="canCancel(booking.status)" :icon="XCircle" circle @click="bookingStore.setStatus(booking.id, BookingStatus.CANCELLED)" />
          </el-tooltip>
          <el-tooltip content="完成打卡" placement="top">
            <el-button v-if="canComplete(booking.status)" type="primary" :icon="CheckCircle2" circle @click="bookingStore.setStatus(booking.id, BookingStatus.COMPLETED)" />
          </el-tooltip>
          <el-tooltip v-if="auth.isCoach && booking.status === BookingStatus.COMPLETED" :content="bookingPlanMap.get(booking.id) ? '编辑训练计划' : '制定训练计划'" placement="top">
            <el-button type="success" :icon="Dumbbell" circle @click="openPlanDialog(booking)" />
          </el-tooltip>
        </div>
      </article>
    </section>
    <EmptyState v-else title="还没有预约" description="预约课程后会在这里跟踪确认和打卡状态" />

    <TrainingPlanDialog
      v-model="planDialogVisible"
      :booking-id="activeBookingId"
      :existing-plan="activePlan"
      @saved="onPlanSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { CheckCircle2, Dumbbell, FileText, XCircle } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import BookingStatusBadge from '@/components/common/BookingStatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TrainingPlanDialog from '@/components/common/TrainingPlanDialog.vue'
import { BookingActionVisibleMatrix, BookingStatus, type BookingStatusValue } from '@/constants/booking'
import { useBookingStats } from '@/hooks/useBookingStats'
import { useBookingStore } from '@/stores/bookingStore'
import { useTrainingPlanStore } from '@/stores/trainingPlanStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDateTime } from '@/utils/dateFormat'
import type { Booking, TrainingPlan } from '@/types/domain'

const auth = useAuthStore()
const bookingStore = useBookingStore()
const planStore = useTrainingPlanStore()
const { stats } = useBookingStats()

const planDialogVisible = ref(false)
const activeBookingId = ref<number | null>(null)
const activePlan = ref<TrainingPlan | null>(null)
const bookingPlanMap = reactive(new Map<number, TrainingPlan | null>())

const canCancel = (status: BookingStatusValue) => BookingActionVisibleMatrix[status].includes('cancel')
const canComplete = (status: BookingStatusValue) => BookingActionVisibleMatrix[status].includes('complete')

async function openPlanDialog(booking: Booking) {
  activeBookingId.value = booking.id
  if (bookingPlanMap.has(booking.id)) {
    activePlan.value = bookingPlanMap.get(booking.id) || null
  } else {
    try {
      activePlan.value = await planStore.loadByBookingId(booking.id)
      bookingPlanMap.set(booking.id, activePlan.value)
    } catch {
      activePlan.value = null
      bookingPlanMap.set(booking.id, null)
    }
  }
  planDialogVisible.value = true
}

function onPlanSaved(plan: TrainingPlan) {
  bookingPlanMap.set(plan.bookingId, plan)
  ElMessage.success('训练计划已保存')
}

async function loadExistingPlans() {
  if (!auth.isCoach) return
  const completed = bookingStore.list.filter(b => b.status === BookingStatus.COMPLETED)
  for (const booking of completed) {
    try {
      const plan = await planStore.loadByBookingId(booking.id)
      bookingPlanMap.set(booking.id, plan)
    } catch {
      bookingPlanMap.set(booking.id, null)
    }
  }
}

onMounted(async () => {
  await bookingStore.loadBookings()
  await loadExistingPlans()
})
</script>

<style scoped>
.plan-link {
  margin-top: 4px;
}
</style>
