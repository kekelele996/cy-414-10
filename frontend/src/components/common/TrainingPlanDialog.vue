<template>
  <el-dialog
    v-model="visible"
    :title="existingPlan ? '编辑阶段训练计划' : '制定阶段训练计划'"
    width="min(720px, 95vw)"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form :model="form" label-position="top" class="plan-form">
      <el-form-item label="阶段名称">
        <el-input v-model="form.stageName" placeholder="例如：第一阶段 - 基础力量" maxlength="120" show-word-limit />
      </el-form-item>

      <el-form-item label="整体说明 / 备注">
        <el-input v-model="form.overallNote" type="textarea" :rows="3" placeholder="给学员的整体训练建议和注意事项" maxlength="2000" show-word-limit />
      </el-form-item>

      <div class="section-title-inline">
        <span>训练动作</span>
        <el-button size="small" type="primary" :icon="Plus" @click="addItem">添加动作</el-button>
      </div>

      <div class="items-list">
        <div v-for="(item, idx) in form.items" :key="idx" class="item-card">
          <div class="item-header">
            <strong>动作 {{ idx + 1 }}</strong>
            <el-button size="small" text type="danger" :icon="Trash2" @click="removeItem(idx)" :disabled="form.items.length <= 1">删除</el-button>
          </div>
          <div class="item-grid">
            <el-form-item label="动作名称" required>
              <el-input v-model="item.exerciseName" placeholder="例如：杠铃深蹲" maxlength="120" />
            </el-form-item>
            <el-form-item label="组数">
              <el-input v-model="item.sets" placeholder="例如：4组" maxlength="60" />
            </el-form-item>
            <el-form-item label="次数 / 重量">
              <el-input v-model="item.reps" placeholder="例如：8-12次 / 60kg" maxlength="60" />
            </el-form-item>
            <el-form-item label="动作备注">
              <el-input v-model="item.note" placeholder="注意事项、节奏要求等" maxlength="500" />
            </el-form-item>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :icon="Save" :loading="submitting" @click="handleSubmit">保存计划</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Save, Trash2 } from '@lucide/vue'
import { useTrainingPlanStore } from '@/stores/trainingPlanStore'
import type { TrainingPlan, TrainingPlanItemInput } from '@/types/domain'

const props = defineProps<{
  modelValue: boolean
  bookingId: number | null
  existingPlan: TrainingPlan | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [plan: TrainingPlan]
}>()

const store = useTrainingPlanStore()
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

interface FormState {
  stageName: string
  overallNote: string
  items: TrainingPlanItemInput[]
}

const form = reactive<FormState>({
  stageName: '',
  overallNote: '',
  items: [{ exerciseName: '', sets: '', reps: '', note: '', sortOrder: 0 }]
})

watch(() => props.existingPlan, (plan) => {
  if (plan) {
    form.stageName = plan.stageName || ''
    form.overallNote = plan.overallNote || ''
    form.items = plan.items.length
      ? plan.items.map(item => ({
          exerciseName: item.exerciseName,
          sets: item.sets || '',
          reps: item.reps || '',
          note: item.note || '',
          sortOrder: item.sortOrder
        }))
      : [{ exerciseName: '', sets: '', reps: '', note: '', sortOrder: 0 }]
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.stageName = ''
  form.overallNote = ''
  form.items = [{ exerciseName: '', sets: '', reps: '', note: '', sortOrder: 0 }]
}

function addItem() {
  form.items.push({ exerciseName: '', sets: '', reps: '', note: '', sortOrder: form.items.length })
}

function removeItem(idx: number) {
  if (form.items.length <= 1) return
  form.items.splice(idx, 1)
  form.items.forEach((item, i) => { item.sortOrder = i })
}

function validate(): string | null {
  for (let i = 0; i < form.items.length; i++) {
    if (!form.items[i].exerciseName.trim()) {
      return `第 ${i + 1} 个动作的动作名称不能为空`
    }
  }
  return null
}

async function handleSubmit() {
  const err = validate()
  if (err) {
    ElMessage.warning(err)
    return
  }
  if (!props.bookingId) {
    ElMessage.error('预约信息缺失')
    return
  }

  const items = form.items.map((item, i) => ({
    exerciseName: item.exerciseName.trim(),
    sets: item.sets?.trim() || undefined,
    reps: item.reps?.trim() || undefined,
    note: item.note?.trim() || undefined,
    sortOrder: i
  }))

  try {
    submitting.value = true
    let plan: TrainingPlan
    if (props.existingPlan) {
      plan = await store.updatePlan(props.existingPlan.id, form.stageName.trim() || undefined, form.overallNote.trim() || undefined, items)
      ElMessage.success('训练计划已更新')
    } else {
      plan = await store.createPlan(props.bookingId, form.stageName.trim() || undefined, form.overallNote.trim() || undefined, items)
      ElMessage.success('训练计划已保存')
    }
    emit('saved', plan)
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败，请重试')
  } finally {
    submitting.value = false
  }
}

function handleClosed() {
  if (!props.existingPlan) {
    resetForm()
  }
}
</script>

<style scoped>
.plan-form {
  display: grid;
  gap: 12px;
}

.section-title-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 4px;
  font-weight: 700;
  color: var(--ink);
}

.items-list {
  display: grid;
  gap: 12px;
}

.item-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.item-grid .el-form-item {
  margin-bottom: 10px;
}

@media (max-width: 620px) {
  .item-grid {
    grid-template-columns: 1fr;
  }
}
</style>
