<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / POINTS</span>
        <h1>点位管理</h1>
        <p class="void-dash-desc">通过地图选点并直观维护打卡围栏、坐标与积分规则</p>
      </div>
      <div class="header-actions">
        <NuxtLink class="admin-button admin-button--ghost" to="/dashboard/map">地图总览</NuxtLink>
        <button class="admin-button" @click="openCreate">新增点位</button>
      </div>
    </div>
    <div class="admin-filter">
      <el-select v-model="filterCity" clearable placeholder="全部城市" @change="load">
        <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
      </el-select>
      <span>共 {{ points.length }} 个点位</span>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>城市</th><th>点位</th><th>地址</th><th>奖励</th><th>半径</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="point in points" :key="point.id">
            <td>#{{ point.id }}</td>
            <td>{{ point.cityName }}</td>
            <td><strong>{{ point.name }}</strong><small>{{ point.code }}</small></td>
            <td>{{ point.address }}</td>
            <td class="highlight">+{{ point.pointsReward }}</td>
            <td>{{ point.checkinRadius }}m</td>
            <td>{{ statusText[point.status] }}</td>
            <td><button class="admin-link" @click="openEdit(point)">地图编辑</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog
      v-model="visible"
      width="min(1260px, calc(100vw - 64px))"
      top="3vh"
      :z-index="5200"
      append-to-body
      destroy-on-close
      :show-close="false"
      class="point-dialog"
      modal-class="point-dialog-overlay"
    >
      <template #header>
        <div class="point-dialog-head">
          <div class="point-dialog-head__identity">
            <span>{{ editingId ? 'POINT EDITOR' : 'NEW LOCATION' }}</span>
            <div>
              <h2>{{ editingId ? '编辑城市点位' : '新增城市点位' }}</h2>
              <p>在地图中确定中心坐标，并为这个位置配置可验证的打卡围栏。</p>
            </div>
          </div>
          <div class="point-dialog-head__position">
            <span>GEOFENCE CENTER</span>
            <strong>{{ Number(form.longitude).toFixed(4) }} / {{ Number(form.latitude).toFixed(4) }}</strong>
          </div>
          <button class="point-dialog-close" type="button" aria-label="关闭弹窗" @click="visible = false">
            <LucideIcon name="x" :size="18" />
          </button>
        </div>
      </template>

      <div class="point-editor">
        <section class="point-editor__map-card">
          <div class="map-card__meta">
            <span><i />地图选点</span>
            <strong>{{ form.checkinRadius }} M</strong>
          </div>
          <ClientOnly>
            <XingjianPointMap
              v-if="visible"
              v-model="mapValue"
              :points="mapContextPoints"
              :editable="true"
              height="100%"
              @address-change="handleAddressChange"
            />
            <template #fallback><div class="map-placeholder">地图加载中...</div></template>
          </ClientOnly>
        </section>

        <el-form class="point-editor__form" label-position="top">
          <section class="editor-section editor-section--basic">
            <div class="editor-section__head">
              <span>01 / BASIC INFO</span>
              <p>点位基本信息</p>
            </div>
            <div class="form-grid form-grid--2 point-basic-grid">
              <el-form-item label="点位名称"><el-input v-model="form.name" placeholder="例如：武康大楼" /></el-form-item>
              <el-form-item label="点位编码"><el-input v-model="form.code" placeholder="唯一英文编码" /></el-form-item>
              <el-form-item label="所属城市">
                <el-select v-model="form.cityId" @change="handleCityChange">
                  <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="点位状态">
                <el-select v-model="form.status">
                  <el-option label="已发布" value="published" />
                  <el-option label="草稿" value="draft" />
                  <el-option label="停用" value="disabled" />
                </el-select>
              </el-form-item>
              <el-form-item label="点位分类"><el-input v-model="form.category" /></el-form-item>
              <el-form-item label="积分奖励"><el-input-number v-model="form.pointsReward" :min="0" /></el-form-item>
            </div>
          </section>

          <section class="editor-section editor-section--geofence">
            <div class="geofence-head">
              <div>
                <span>02 / GEOFENCE</span>
                <p>有效打卡半径</p>
              </div>
              <strong>{{ form.checkinRadius }}<small>m</small></strong>
            </div>
            <el-slider v-model="form.checkinRadius" :min="50" :max="3000" :step="10" />
            <div class="coordinate-values">
              <label><span>LONGITUDE</span><strong>{{ Number(form.longitude).toFixed(6) }}</strong></label>
              <label><span>LATITUDE</span><strong>{{ Number(form.latitude).toFixed(6) }}</strong></label>
            </div>
          </section>

          <section class="editor-section editor-section--copy">
            <div class="editor-section__head">
              <span>03 / LOCATION COPY</span>
              <p>地址与点位介绍</p>
            </div>
            <el-form-item label="详细地址"><el-input v-model="form.address" placeholder="地图选点后自动解析，也可手动修正" /></el-form-item>
            <el-form-item label="点位介绍"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="用一句话说明这个位置值得探索的原因" /></el-form-item>
          </section>
        </el-form>
      </div>

      <template #footer>
        <div class="point-dialog-footer">
          <div class="point-dialog-footer__hint">
            <span class="sync-dot" />
            地图坐标、围栏半径与表单实时同步
          </div>
          <div class="point-dialog-footer__actions">
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="save">保存点位</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const cities = ref<any[]>([])
const points = ref<any[]>([])
const settings = reactive({ radius: 500, points: 10 })
const filterCity = ref<number | undefined>()
const visible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const statusText: Record<string, string> = { published: '已发布', draft: '草稿', disabled: '停用' }

const emptyForm = () => ({
  cityId: cities.value[0]?.id || 0,
  name: '',
  code: '',
  category: 'landmark',
  address: '',
  description: '',
  longitude: Number(cities.value[0]?.longitude || 121.473701),
  latitude: Number(cities.value[0]?.latitude || 31.230416),
  checkinRadius: settings.radius,
  pointsReward: settings.points,
  status: 'published',
})
const form = reactive(emptyForm())
const mapValue = computed({
  get: () => ({ longitude: Number(form.longitude), latitude: Number(form.latitude), radius: Number(form.checkinRadius) }),
  set: (value) => {
    form.longitude = value.longitude
    form.latitude = value.latitude
    form.checkinRadius = value.radius
  },
})
const mapContextPoints = computed(() => points.value.filter(point => point.id !== editingId.value))

async function loadCities() {
  const [cityResponse, settingResponse] = await Promise.all([
    $fetch<any>('/api/admin/cities'),
    $fetch<any>('/api/admin/settings'),
  ])
  cities.value = cityResponse.data
  const map = Object.fromEntries(settingResponse.data.map((item: any) => [item.key, item.value]))
  settings.radius = Number(map.default_checkin_radius || 500)
  settings.points = Number(map.default_checkin_points || 10)
}

async function load() {
  const response = await $fetch<any>('/api/admin/points', { query: { cityId: filterCity.value } })
  points.value = response.data
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  visible.value = true
}

function openEdit(point: any) {
  editingId.value = point.id
  Object.assign(form, point)
  visible.value = true
}

function handleCityChange(cityId: number) {
  if (editingId.value) return
  const city = cities.value.find(item => item.id === cityId)
  if (!city) return
  form.longitude = Number(city.longitude)
  form.latitude = Number(city.latitude)
}

function handleAddressChange(address: string) {
  form.address = address
}

async function save() {
  if (!form.name.trim() || !form.code.trim() || !form.address.trim()) {
    ElMessage.warning('请填写点位名称、编码和详细地址')
    return
  }
  saving.value = true
  try {
    await $fetch(editingId.value ? `/api/admin/points/${editingId.value}` : '/api/admin/points', {
      method: editingId.value ? 'PUT' : 'POST',
      body: form,
    })
    ElMessage.success('点位与围栏保存成功')
    visible.value = false
    await load()
  } catch (error: any) {
    ElMessage.error(error?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

await loadCities()
await load()

onMounted(() => {
  if (route.query.create === '1') openCreate()
  const editId = Number(route.query.edit)
  if (editId) {
    const point = points.value.find(item => item.id === editId)
    if (point) openEdit(point)
  }
  if (route.query.create || route.query.edit) router.replace({ query: {} })
})
</script>

<style scoped lang="scss">
@use '@/styles/xingjian-admin.scss' as *;

.header-actions { display: flex; gap: 10px; }
.admin-button--ghost { color: var(--void-text); background: transparent; border: 1px solid var(--void-border); text-decoration: none; }

.point-dialog-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 42px;
  align-items: center;
  gap: 26px;
}
.point-dialog-head__identity { display: flex; align-items: center; gap: 18px; min-width: 0; }
.point-dialog-head__identity > span {
  padding: 7px 9px;
  color: var(--xj-accent);
  border: 1px solid var(--xj-border-strong);
  background: var(--xj-accent-soft);
  font: 9px var(--void-mono);
  letter-spacing: .12em;
  white-space: nowrap;
}
.point-dialog-head h2 { margin: 0; color: var(--xj-text); font-size: 21px; letter-spacing: -.02em; }
.point-dialog-head p { margin: 4px 0 0; color: var(--xj-muted); font-size: 11px; }
.point-dialog-head__position { text-align: right; }
.point-dialog-head__position span { display: block; margin-bottom: 5px; color: var(--xj-faint); font: 9px var(--void-mono); letter-spacing: .1em; }
.point-dialog-head__position strong { color: var(--xj-text-soft); font: 11px var(--void-mono); }
.point-dialog-close {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--xj-muted);
  border: 1px solid var(--xj-border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: .2s ease;
}
.point-dialog-close:hover { color: var(--xj-accent); border-color: var(--xj-border-strong); background: var(--xj-accent-soft); transform: rotate(6deg); }

.point-editor {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(430px, .8fr);
  gap: 16px;
  height: min(548px, calc(100vh - 184px));
  min-width: 0;
  overflow: hidden;
}
.point-editor__map-card {
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--xj-border);
  background: var(--xj-bg-elevated);
}
.point-editor__map-card :deep(.xj-map-shell) { border: 0; }
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
.map-card__meta span { display: flex; align-items: center; gap: 7px; }
.map-card__meta i { width: 6px; height: 6px; border-radius: 50%; background: var(--xj-accent-solid); box-shadow: 0 0 10px var(--xj-accent); }
.map-card__meta strong { color: var(--xj-accent); font-size: 11px; }
.map-placeholder { height: 100%; display: grid; place-items: center; color: var(--xj-muted); }

.point-editor__form {
  min-width: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 10px;
  overflow: hidden;
}
.editor-section {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--xj-border);
  background: var(--xj-surface);
}
.editor-section__head,
.geofence-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
.editor-section__head span,
.geofence-head span { color: var(--xj-accent); font: 9px var(--void-mono); letter-spacing: .11em; }
.editor-section__head p,
.geofence-head p { margin: 0; color: var(--xj-muted); font-size: 10px; }
.point-basic-grid { gap: 0 10px; }

.geofence-head > div { display: flex; align-items: baseline; gap: 10px; }
.geofence-head strong { color: var(--xj-text); font: 24px var(--void-mono); line-height: 1; }
.geofence-head small { margin-left: 3px; color: var(--xj-muted); font-size: 10px; }
.coordinate-values { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.coordinate-values label { display: flex; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px solid var(--xj-border); }
.coordinate-values span { color: var(--xj-faint); font: 8px var(--void-mono); letter-spacing: .08em; }
.coordinate-values strong { color: var(--xj-text-soft); font: 10px var(--void-mono); }
.editor-section--copy { display: flex; flex-direction: column; }
.editor-section--copy .editor-section__head { margin-bottom: 7px; }

.point-editor__form :deep(.el-form-item) { margin-bottom: 8px; }
.point-editor__form :deep(.el-form-item__label) { height: auto; padding-bottom: 4px; line-height: 1.15; }
.point-editor__form :deep(.el-input__wrapper),
.point-editor__form :deep(.el-select__wrapper),
.point-editor__form :deep(.el-input-number) { min-height: 32px; }
.point-editor__form :deep(.el-slider) { margin: 0 4px; }
.point-editor__form :deep(.el-textarea__inner) { min-height: 52px !important; resize: none; }

.point-dialog-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.point-dialog-footer__hint { display: flex; align-items: center; gap: 8px; color: var(--xj-muted); font-size: 10px; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--xj-success); box-shadow: 0 0 10px color-mix(in srgb, var(--xj-success) 65%, transparent); }
.point-dialog-footer__actions { display: flex; gap: 8px; }

:global(.point-dialog-overlay) { z-index: 5200 !important; overflow: hidden; }
:global(.point-dialog) { max-height: calc(100vh - 6vh); overflow: hidden; border-radius: 16px !important; }
:global(.point-dialog .el-dialog__header) { padding: 15px 18px; margin: 0; border-bottom: 1px solid var(--xj-border); }
:global(.point-dialog .el-dialog__body) { padding: 14px 16px; overflow: hidden; }
:global(.point-dialog .el-dialog__footer) { padding: 11px 16px; border-top: 1px solid var(--xj-border); }
</style>
