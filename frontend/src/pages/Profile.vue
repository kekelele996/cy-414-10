<template>
  <div class="section-band profile-container">
    <section class="panel profile-panel">
      <AvatarUploader v-model="form.avatar" :nickname="form.nickname" />

      <el-form label-position="top" class="profile-form">
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" disabled>
            <el-option v-for="(label, value) in UserRoleLabel" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-input v-model="form.gender" />
        </el-form-item>
        <el-form-item label="身高 cm">
          <el-input-number v-model="form.height" :min="120" :max="230" />
        </el-form-item>
        <el-form-item label="体重 kg">
          <el-input-number v-model="form.weight" :min="30" :max="200" :step="0.1" />
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" :icon="Save" @click="save">保存资料</el-button>
        <el-button :icon="LogIn" @click="auth.login()">演示登录</el-button>
      </div>
    </section>

    <section v-if="auth.role === UserRole.STUDENT || auth.role === UserRole.ADMIN" class="panel plan-panel">
      <div class="section-title">
        <h2><Dumbbell class="icon-inline" /> 当前训练计划</h2>
        <span v-if="planStore.currentPlan">更新于 {{ formatDateTime(planStore.currentPlan.updatedAt) }}</span>
      </div>

      <div v-if="planStore.currentPlan" class="plan-content">
        <div v-if="planStore.currentPlan.stageName" class="stage-name">
          <strong>阶段：</strong>{{ planStore.currentPlan.stageName }}
        </div>

        <div v-if="planStore.currentPlan.coach" class="coach-info">
          <CoachAvatar :coach="planStore.currentPlan.coach" />
        </div>

        <div v-if="planStore.currentPlan.booking" class="booking-info">
          <span class="eyebrow">关联课程</span>
          <p>{{ planStore.currentPlan.booking.course?.title }} · {{ formatDateTime(planStore.currentPlan.booking.scheduleTime) }}</p>
        </div>

        <div v-if="planStore.currentPlan.overallNote" class="overall-note">
          <strong>训练说明：</strong>
          <p>{{ planStore.currentPlan.overallNote }}</p>
        </div>

        <div class="items-section">
          <h3>训练动作</h3>
          <div class="items-grid">
            <div v-for="(item, idx) in planStore.currentPlan.items" :key="item.id" class="item-card">
              <div class="item-number">{{ idx + 1 }}</div>
              <div class="item-body">
                <div class="item-name">{{ item.exerciseName }}</div>
                <div class="item-meta">
                  <span v-if="item.sets" class="meta-tag">{{ item.sets }}</span>
                  <span v-if="item.reps" class="meta-tag">{{ item.reps }}</span>
                </div>
                <p v-if="item.note" class="item-note">{{ item.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmptyState v-else title="暂无训练计划" description="完成与教练的预约后，教练会为你制定专属训练计划">
        <template #image>
          <Dumbbell class="empty-icon" />
        </template>
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { Dumbbell, LogIn, Save } from '@lucide/vue'
import AvatarUploader from '@/components/common/AvatarUploader.vue'
import CoachAvatar from '@/components/common/CoachAvatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { UserRole, UserRoleLabel } from '@/constants/user'
import { useAuthStore } from '@/stores/authStore'
import { useTrainingPlanStore } from '@/stores/trainingPlanStore'
import { userApi } from '@/api/user'
import { formatDateTime } from '@/utils/dateFormat'

const auth = useAuthStore()
const planStore = useTrainingPlanStore()

const form = reactive({
  nickname: '',
  phone: '',
  avatar: '',
  role: auth.role,
  gender: '',
  height: 168,
  weight: 58
})

watchEffect(() => {
  if (!auth.user) return
  form.nickname = auth.user.nickname
  form.phone = auth.user.phone
  form.avatar = auth.user.avatar || ''
  form.role = auth.user.role
  form.gender = auth.user.gender || ''
  form.height = auth.user.height || 168
  form.weight = auth.user.weight || 58
})

async function save() {
  try {
    auth.user = await userApi.updateMe(form)
  } catch {
    if (auth.user) {
      auth.user = { ...auth.user, ...form }
    }
  }
  ElMessage.success('个人资料已保存')
}

onMounted(async () => {
  if (auth.role === UserRole.STUDENT || auth.role === UserRole.ADMIN) {
    await planStore.loadCurrentPlan()
  }
})
</script>

<style scoped>
.profile-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

@media (min-width: 1024px) {
  .profile-container {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    align-items: start;
  }
}

.profile-panel {
  display: grid;
  gap: 24px;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.plan-panel {
  display: grid;
  gap: 16px;
}

.icon-inline {
  width: 20px;
  height: 20px;
  margin-right: 6px;
  vertical-align: -4px;
  color: var(--green);
}

.stage-name {
  font-size: 16px;
  padding: 10px 14px;
  background: var(--green-weak);
  border-radius: 8px;
  color: var(--green);
}

.coach-info {
  display: inline-flex;
}

.booking-info {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.booking-info p {
  margin: 4px 0 0;
  font-weight: 600;
}

.overall-note {
  padding: 12px 14px;
  background: var(--surface-soft);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
}

.overall-note p {
  margin: 6px 0 0;
  line-height: 1.7;
  color: var(--muted);
  white-space: pre-wrap;
}

.items-section h3 {
  margin: 8px 0 12px;
  font-size: 16px;
}

.items-grid {
  display: grid;
  gap: 12px;
}

.item-card {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.item-number {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--green-weak);
  color: var(--green);
  font-weight: 900;
  font-size: 18px;
}

.item-body {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.item-name {
  font-weight: 700;
  font-size: 16px;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.item-note {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--line);
}

@media (max-width: 620px) {
  .profile-form {
    grid-template-columns: 1fr;
  }
}
</style>
