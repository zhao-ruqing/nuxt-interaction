<template>
  <div class="audit-diff">
    <div class="diff-header">
      <div class="diff-col-head diff-col-before">
        <span class="diff-badge diff-badge-before">−</span>
        变更前
      </div>
      <div class="diff-col-head diff-col-after">
        <span class="diff-badge diff-badge-after">+</span>
        变更后
      </div>
    </div>

    <div v-if="rows.length === 0" class="diff-empty">暂无对比数据</div>

    <div v-else class="diff-body">
      <div
        v-for="row in rows"
        :key="row.key"
        class="diff-row"
        :class="`diff-row--${row.status}`"
      >
        <div class="diff-field">{{ row.label }}</div>
        <div class="diff-cols">
          <div class="diff-cell diff-cell-before">
            <span v-if="row.before" class="diff-value">{{ row.before }}</span>
            <span v-else class="diff-placeholder">—</span>
          </div>
          <div class="diff-cell diff-cell-after">
            <span v-if="row.after" class="diff-value">{{ row.after }}</span>
            <span v-else class="diff-placeholder">—</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="changedCount > 0" class="diff-summary">
      共 {{ rows.length }} 个字段，<b>{{ changedCount }}</b> 处变更
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildAuditDiff } from '~/utils/auditDiff'

const props = defineProps<{
  metadata: Record<string, unknown> | null
}>()

const rows = computed(() => buildAuditDiff(props.metadata))
const changedCount = computed(() =>
  rows.value.filter(r => r.status !== 'unchanged').length,
)
</script>

<style scoped lang="scss">
.audit-diff {
  border: 1px solid $border;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.diff-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid $border;
  background: #fafafa;
}

.diff-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: $text;

  &:first-child {
    border-right: 1px solid $border;
  }
}

.diff-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.diff-badge-before {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
}

.diff-badge-after {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
}

.diff-body {
  max-height: 480px;
  overflow-y: auto;
}

.diff-row {
  border-bottom: 1px solid $border;

  &:last-child {
    border-bottom: none;
  }
}

.diff-field {
  padding: 6px 14px 4px;
  font-size: 11px;
  font-weight: 600;
  color: $text-muted;
  background: #fafafa;
  border-bottom: 1px dashed $border;
  font-family: ui-monospace, 'Cascadia Code', monospace;
}

.diff-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.diff-cell {
  padding: 8px 14px;
  min-height: 36px;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
  border-right: 1px solid $border;

  &:last-child {
    border-right: none;
  }
}

.diff-value {
  color: $text;
}

.diff-placeholder {
  color: $text-muted;
}

.diff-row--unchanged {
  .diff-cell-before,
  .diff-cell-after {
    background: #fff;
  }
}

.diff-row--changed {
  .diff-cell-before {
    background: rgba(245, 108, 108, 0.08);
  }

  .diff-cell-after {
    background: rgba(103, 194, 58, 0.08);
  }

  .diff-value {
    font-weight: 500;
  }
}

.diff-row--added {
  .diff-cell-before {
    background: #fafafa;
  }

  .diff-cell-after {
    background: rgba(103, 194, 58, 0.1);
  }
}

.diff-row--removed {
  .diff-cell-before {
    background: rgba(245, 108, 108, 0.1);
  }

  .diff-cell-after {
    background: #fafafa;
  }
}

.diff-empty {
  padding: 32px;
  text-align: center;
  color: $text-muted;
  font-size: 13px;
}

.diff-summary {
  padding: 8px 14px;
  font-size: 12px;
  color: $text-secondary;
  background: #fafafa;
  border-top: 1px solid $border;

  b {
    color: #e6a23c;
    font-weight: 600;
  }
}
</style>
