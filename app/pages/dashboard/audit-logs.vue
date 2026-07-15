<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <h2>操作日志</h2>
        <p class="void-dash-desc">
          记录商品、地图点位等管理操作，便于追溯与审计
        </p>
      </div>
    </div>

    <div class="void-dash-filter">
      <div class="void-dash-filter__left">
        <el-select
          v-model="filterResourceType"
          placeholder="全部模块"
          clearable
          style="width: 140px"
          @change="handleResourceTypeChange"
        >
          <el-option
            v-for="group in actionRegistry"
            :key="group.group"
            :label="group.label"
            :value="group.group"
          />
        </el-select>
        <el-select
          v-model="filterAction"
          placeholder="全部操作"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="item in actionOptions"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="搜索操作人、描述、资源 ID"
          clearable
          :prefix-icon="Search"
          style="width: 260px"
          @keyup.enter="fetchLogs"
          @clear="fetchLogs"
        />
        <el-input
          v-model="startDate"
          type="date"
          placeholder="开始日期"
          clearable
          style="width: 150px"
        />
        <el-input
          v-model="endDate"
          type="date"
          placeholder="结束日期"
          clearable
          style="width: 150px"
        />
        <el-button type="primary" :loading="loading" @click="fetchLogs">
          查询
        </el-button>
      </div>
      <span class="void-dash-filter__total">
        共 <b>{{ total }}</b> 条记录
      </span>
    </div>

    <div class="void-dash-table-wrap">
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        border
        height="100%"
        class="audit-table"
      >
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column label="操作类型" width="160">
          <template #default="{ row }">
            <el-tag
              :type="getActionTagType(row.action)"
              size="small"
              effect="plain"
            >
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="操作内容"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column prop="resourceId" label="资源 ID" width="100" />
        <el-table-column label="详情" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!row.metadata"
              @click="openDetail(row as AuditLog)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="void-dash-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="fetchLogs"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog
      v-model="detailVisible"
      :title="detailTitle"
      :width="detailMode === 'diff' ? '920px' : '640px'"
      destroy-on-close
      align-center
      class="audit-detail-dialog"
    >
      <AuditLogDiff v-if="detailMode === 'diff'" :metadata="detailMetadata" />
      <pre v-else class="detail-json">{{ detailJson }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@lucide/vue";
import type {
  ActionRegistryGroup,
  AuditLog,
  AuditLogListResponse,
} from "~/types/auditLog";
import { canShowDiff } from "~/utils/auditDiff";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const loading = ref(false);
const logs = ref<AuditLog[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref("");
const filterResourceType = ref("");
const filterAction = ref("");
const startDate = ref("");
const endDate = ref("");
const actionRegistry = ref<ActionRegistryGroup[]>([]);

const detailVisible = ref(false);
const detailJson = ref("");
const detailMetadata = ref<Record<string, unknown> | null>(null);
const detailMode = ref<"diff" | "json">("diff");
const detailTitle = ref("变更详情");

const actionOptions = computed(() => {
  if (!filterResourceType.value) {
    return actionRegistry.value.flatMap((g) =>
      g.actions.map((a) => ({ ...a, label: `${g.label} · ${a.label}` })),
    );
  }
  const group = actionRegistry.value.find(
    (g) => g.group === filterResourceType.value,
  );
  return group?.actions ?? [];
});

function handleResourceTypeChange() {
  filterAction.value = "";
}

function handleSizeChange() {
  page.value = 1;
  fetchLogs();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { hour12: false });
}

function getActionLabel(action: string) {
  for (const group of actionRegistry.value) {
    const found = group.actions.find((a) => a.key === action);
    if (found) return `${group.label} · ${found.label}`;
  }
  return action;
}

function getActionTagType(
  action: string,
): "success" | "warning" | "danger" | "info" {
  if (action.endsWith(".create")) return "success";
  if (action.endsWith(".update")) return "warning";
  if (action.endsWith(".delete")) return "danger";
  return "info";
}

function openDetail(row: AuditLog) {
  detailMetadata.value = row.metadata;
  if (canShowDiff(row.metadata)) {
    detailMode.value = "diff";
    detailTitle.value = row.action.endsWith(".create")
      ? "新增详情"
      : row.action.endsWith(".delete")
        ? "删除详情"
        : "变更对比";
  } else {
    detailMode.value = "json";
    detailTitle.value = "原始数据";
    detailJson.value = JSON.stringify(row.metadata, null, 2);
  }
  detailVisible.value = true;
}

async function fetchLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("page", String(page.value));
    params.set("pageSize", String(pageSize.value));
    if (filterAction.value) params.set("action", filterAction.value);
    else if (filterResourceType.value)
      params.set("resourceType", filterResourceType.value);
    if (keyword.value.trim()) params.set("keyword", keyword.value.trim());
    if (startDate.value) params.set("startDate", startDate.value);
    if (endDate.value) params.set("endDate", endDate.value);

    const res = await $fetch<AuditLogListResponse>(
      `/api/audit-logs?${params.toString()}`,
    );
    if (res.success && res.data) {
      logs.value = res.data.list;
      total.value = res.data.total;
      actionRegistry.value = res.data.actionRegistry;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(fetchLogs);
</script>

<style scoped lang="scss">
.audit-table {
  width: 100%;
}

.detail-json {
  margin: 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
  font-family: var(--void-mono);
  font-size: 12px;
  line-height: 1.6;
  max-height: 480px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--void-text);
}
</style>
