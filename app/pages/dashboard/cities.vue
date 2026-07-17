<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / CITIES</span>
        <h1>城市管理</h1>
        <p class="void-dash-desc">输入城市名或地图选点，自动回填坐标与省份等信息</p>
      </div>
      <button class="admin-button" @click="openCreate">新增城市</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>城市</th>
            <th>编码</th>
            <th>省份</th>
            <th>点位</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="city in cities" :key="city.id">
            <td>#{{ city.id }}</td>
            <td>
              <strong>{{ city.name }}</strong>
            </td>
            <td>{{ city.code }}</td>
            <td>{{ city.province }}</td>
            <td>{{ city.pointCount }}</td>
            <td>
              <span class="status-dot" :class="city.status">{{
                statusText[city.status]
              }}</span>
            </td>
            <td>
              <button class="admin-link" @click="openEdit(city)">地图编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog
      v-model="visible"
      width="min(1180px, calc(100vw - 64px))"
      top="3vh"
      :z-index="5200"
      append-to-body
      destroy-on-close
      :show-close="false"
      class="city-dialog"
      modal-class="city-dialog-overlay"
    >
      <template #header>
        <div class="city-dialog-head">
          <div class="city-dialog-head__identity">
            <span>{{ editingId ? "CITY EDITOR" : "NEW CITY" }}</span>
            <div>
              <h2>{{ editingId ? "编辑城市" : "新增城市" }}</h2>
              <p>输入城市名称即可解析省份与坐标，也可在地图上微调中心位置。</p>
            </div>
          </div>
          <div class="city-dialog-head__position">
            <span>CITY CENTER</span>
            <strong
              >{{ Number(form.longitude).toFixed(4) }} /
              {{ Number(form.latitude).toFixed(4) }}</strong
            >
          </div>
          <button
            class="city-dialog-close"
            type="button"
            aria-label="关闭弹窗"
            @click="visible = false"
          >
            <LucideIcon name="x" :size="18" />
          </button>
        </div>
      </template>

      <div class="city-editor">
        <section class="city-editor__map-card">
          <div class="map-card__meta">
            <span><i />地图选城市</span>
            <strong>{{ form.province || "待解析省份" }}</strong>
          </div>
          <ClientOnly>
            <XingjianPointMap
              ref="mapRef"
              v-if="visible"
              v-model="mapValue"
              :editable="true"
              :show-radius="false"
              editor-label="城市中心"
              height="100%"
              @place-change="handlePlaceChange"
            />
            <template #fallback>
              <div class="map-placeholder">地图加载中...</div>
            </template>
          </ClientOnly>
        </section>

        <el-form class="city-editor__form" label-position="top">
          <section class="editor-section">
            <div class="editor-section__head">
              <span>01 / BASIC INFO</span>
              <p>城市基本信息</p>
            </div>
            <div class="form-grid form-grid--2">
              <el-form-item label="城市名称">
                <el-input
                  v-model="form.name"
                  clearable
                  placeholder="输入城市名，如杭州、上海"
                  @input="onNameInput"
                  @keyup.enter="resolveCityByName"
                >
                  <template #append>
                    <el-button
                      :loading="nameResolving"
                      @click="resolveCityByName"
                      >解析</el-button
                    >
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="城市编码">
                <el-input
                  v-model="form.code"
                  placeholder="唯一英文编码，如 shanghai"
                />
              </el-form-item>
              <el-form-item label="省份">
                <el-input
                  v-model="form.province"
                  placeholder="输入城市名后自动回填"
                />
              </el-form-item>
              <el-form-item label="发布状态">
                <el-select v-model="form.status">
                  <el-option label="已发布" value="published" />
                  <el-option label="草稿" value="draft" />
                  <el-option label="停用" value="disabled" />
                </el-select>
              </el-form-item>
            </div>
          </section>

          <section class="editor-section">
            <div class="editor-section__head">
              <span>02 / COORDINATES</span>
              <p>中心坐标（名称解析 / 地图选点同步）</p>
            </div>
            <div class="coordinate-values">
              <label>
                <span>LONGITUDE</span>
                <strong>{{ Number(form.longitude).toFixed(6) }}</strong>
              </label>
              <label>
                <span>LATITUDE</span>
                <strong>{{ Number(form.latitude).toFixed(6) }}</strong>
              </label>
            </div>
            <p v-if="resolvedAddress" class="resolved-address">
              {{ resolvedAddress }}
            </p>
          </section>

          <section class="editor-section editor-section--copy">
            <div class="editor-section__head">
              <span>03 / DESCRIPTION</span>
              <p>城市介绍</p>
            </div>
            <el-form-item label="城市介绍">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="用一句话说明这座城市值得探索的理由"
              />
            </el-form-item>
          </section>
        </el-form>
      </div>

      <template #footer>
        <div class="city-dialog-footer">
          <div class="city-dialog-footer__hint">
            <span class="sync-dot" />
            输入城市名或地图选点，坐标与省份实时同步
          </div>
          <div class="city-dialog-footer__actions">
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="save"
              >保存城市</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { XingjianMapPlace } from "~/composables/useAmap";

definePageMeta({ layout: "dashboard" });

const { geocodeCityByName } = useAmap();
const cities = ref<any[]>([]);
const visible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const resolvedAddress = ref("");
const nameResolving = ref(false);
const mapRef = ref<{ focusLocation?: (lng: number, lat: number, zoom?: number) => void } | null>(null);
const lastGeocodedName = ref("");
const statusText: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  disabled: "停用",
};

let nameGeocodeTimer: ReturnType<typeof setTimeout> | null = null;

/** 创建空白城市表单 */
const emptyForm = () => ({
  name: "",
  code: "",
  province: "",
  description: "",
  longitude: 121.473701,
  latitude: 31.230416,
  status: "published",
  sortOrder: 0,
});

const form = reactive(emptyForm());

/** 地图绑定值：城市仅需中心点，半径仅作地图组件占位 */
const mapValue = computed({
  get: () => ({
    longitude: Number(form.longitude),
    latitude: Number(form.latitude),
    radius: 8000,
  }),
  set: (value) => {
    form.longitude = value.longitude;
    form.latitude = value.latitude;
  },
});

/** 加载城市列表 */
async function load() {
  const response = await $fetch<any>("/api/admin/cities");
  cities.value = response.data;
}

/** 重置名称解析相关状态 */
function resetNameGeocodeState() {
  if (nameGeocodeTimer) clearTimeout(nameGeocodeTimer);
  nameGeocodeTimer = null;
  lastGeocodedName.value = "";
  nameResolving.value = false;
  resolvedAddress.value = "";
}

/** 打开新增城市弹窗 */
function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm());
  resetNameGeocodeState();
  visible.value = true;
}

/** 打开编辑城市弹窗 */
function openEdit(city: any) {
  editingId.value = city.id;
  Object.assign(form, city);
  resetNameGeocodeState();
  lastGeocodedName.value = String(city.name || "").trim();
  visible.value = true;
}

/** 城市名称输入后防抖触发地理编码 */
function onNameInput() {
  if (nameGeocodeTimer) clearTimeout(nameGeocodeTimer);
  nameGeocodeTimer = setTimeout(() => {
    void resolveCityByName();
  }, 550);
}

/** 按城市名称解析省份与经纬度，并同步地图中心 */
async function resolveCityByName() {
  const keyword = form.name.trim();
  if (keyword.length < 2) return;
  if (keyword === lastGeocodedName.value) return;

  nameResolving.value = true;
  try {
    const result = await geocodeCityByName(keyword);
    // 输入已变化则丢弃过期结果
    if (form.name.trim() !== keyword) return;
    if (!result) {
      ElMessage.warning("未找到该城市，请换个名称或在地图上选点");
      return;
    }

    lastGeocodedName.value = keyword;
    if (result.province) form.province = result.province;
    form.longitude = result.longitude;
    form.latitude = result.latitude;
    resolvedAddress.value = result.address;
    await nextTick();
    mapRef.value?.focusLocation?.(result.longitude, result.latitude, 11);
  } catch (error: any) {
    ElMessage.error(error?.message || "城市解析失败");
  } finally {
    nameResolving.value = false;
  }
}

/** 地图逆地理回填省份等可解析字段（不覆盖用户已输入的城市名） */
function handlePlaceChange(place: XingjianMapPlace) {
  resolvedAddress.value = place.address;
  if (place.province) form.province = place.province;
  // 仅在名称为空时用地图结果补全，避免覆盖手动输入
  if (place.city && !form.name.trim()) {
    form.name = place.city;
    lastGeocodedName.value = place.city;
  }
}

/** 保存城市 */
async function save() {
  if (!form.name.trim() || !form.code.trim() || !form.province.trim()) {
    ElMessage.warning("请填写城市名称、编码和省份");
    return;
  }
  saving.value = true;
  try {
    await $fetch(
      editingId.value
        ? `/api/admin/cities/${editingId.value}`
        : "/api/admin/cities",
      { method: editingId.value ? "PUT" : "POST", body: form },
    );
    ElMessage.success("保存成功");
    visible.value = false;
    await load();
  } catch (error: any) {
    ElMessage.error(error?.data?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

onBeforeUnmount(() => {
  if (nameGeocodeTimer) clearTimeout(nameGeocodeTimer);
});

await load();
</script>

<style scoped lang="scss">
@use "@/styles/xingjian-admin.scss" as *;

.city-dialog-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 42px;
  align-items: center;
  gap: 26px;
}
.city-dialog-head__identity {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}
.city-dialog-head__identity > span {
  padding: 7px 9px;
  color: var(--xj-accent);
  border: 1px solid var(--xj-border-strong);
  background: var(--xj-accent-soft);
  font: 9px var(--void-mono);
  letter-spacing: 0.12em;
  white-space: nowrap;
}
.city-dialog-head h2 {
  margin: 0;
  color: var(--xj-text);
  font-size: 21px;
  letter-spacing: -0.02em;
}
.city-dialog-head p {
  margin: 4px 0 0;
  color: var(--xj-muted);
  font-size: 11px;
}
.city-dialog-head__position {
  text-align: right;
}
.city-dialog-head__position span {
  display: block;
  margin-bottom: 5px;
  color: var(--xj-faint);
  font: 9px var(--void-mono);
  letter-spacing: 0.1em;
}
.city-dialog-head__position strong {
  color: var(--xj-text-soft);
  font: 11px var(--void-mono);
}
.city-dialog-close {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--xj-muted);
  border: 1px solid var(--xj-border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: 0.2s ease;
}
.city-dialog-close:hover {
  color: var(--xj-accent);
  border-color: var(--xj-border-strong);
  background: var(--xj-accent-soft);
  transform: rotate(6deg);
}

.city-editor {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(380px, 0.75fr);
  gap: 16px;
  height: min(548px, calc(100vh - 184px));
  min-width: 0;
  overflow: hidden;
}
.city-editor__map-card {
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--xj-border);
  background: var(--xj-bg-elevated);
}
.city-editor__map-card :deep(.xj-map-shell) {
  border: 0;
  min-height: 0;
  height: 100%;
}
.map-card__meta {
  position: absolute;
  z-index: 30;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 9px 12px;
  color: var(--xj-text-soft);
  border: 1px solid var(--xj-border);
  background: color-mix(in srgb, var(--xj-bg-elevated) 88%, transparent);
  backdrop-filter: blur(16px);
  font: 10px var(--void-mono);
}
.map-card__meta span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.map-card__meta i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--xj-accent-solid);
  box-shadow: 0 0 10px var(--xj-accent);
}
.map-card__meta strong {
  color: var(--xj-accent);
  font-size: 11px;
}
.map-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--xj-muted);
}

.city-editor__form {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}
.editor-section {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--xj-border);
  background: var(--xj-surface);
}
.editor-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.editor-section__head span {
  color: var(--xj-accent);
  font: 9px var(--void-mono);
  letter-spacing: 0.11em;
}
.editor-section__head p {
  margin: 0;
  color: var(--xj-muted);
  font-size: 10px;
}
.coordinate-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.coordinate-values label {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--xj-border);
}
.coordinate-values span {
  color: var(--xj-faint);
  font: 8px var(--void-mono);
  letter-spacing: 0.08em;
}
.coordinate-values strong {
  color: var(--xj-text-soft);
  font: 10px var(--void-mono);
}
.resolved-address {
  margin: 10px 0 0;
  color: var(--xj-muted);
  font-size: 11px;
  line-height: 1.45;
}
.editor-section--copy {
  flex: 1;
}

.city-editor__form :deep(.el-form-item) {
  margin-bottom: 8px;
}
.city-editor__form :deep(.el-form-item__label) {
  height: auto;
  padding-bottom: 4px;
  line-height: 1.15;
}
.city-editor__form :deep(.el-input__wrapper),
.city-editor__form :deep(.el-select__wrapper) {
  min-height: 32px;
}
.city-editor__form :deep(.el-textarea__inner) {
  min-height: 88px !important;
  resize: none;
}

.city-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.city-dialog-footer__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--xj-muted);
  font-size: 10px;
}
.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--xj-success);
  box-shadow: 0 0 10px
    color-mix(in srgb, var(--xj-success) 65%, transparent);
}
.city-dialog-footer__actions {
  display: flex;
  gap: 8px;
}

:global(.city-dialog-overlay) {
  z-index: 5200 !important;
  overflow: hidden;
}
:global(.city-dialog) {
  max-height: calc(100vh - 6vh);
  overflow: hidden;
  border-radius: 16px !important;
}
:global(.city-dialog .el-dialog__header) {
  padding: 15px 18px;
  margin: 0;
  border-bottom: 1px solid var(--xj-border);
}
:global(.city-dialog .el-dialog__body) {
  padding: 14px 16px;
  overflow: hidden;
}
:global(.city-dialog .el-dialog__footer) {
  padding: 11px 16px;
  border-top: 1px solid var(--xj-border);
}

@media (max-width: 960px) {
  .city-editor {
    grid-template-columns: 1fr;
    height: auto;
    max-height: calc(100vh - 184px);
    overflow: auto;
  }
  .city-editor__map-card {
    height: 320px;
  }
}
</style>
