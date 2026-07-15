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
      :title="editingId ? '编辑点位与围栏' : '新增地图点位'"
      width="1180px"
      top="5vh"
      destroy-on-close
      class="point-dialog"
    >
      <div class="point-editor">
        <section class="point-editor__map">
          <ClientOnly>
            <XingjianPointMap
              v-if="visible"
              v-model="mapValue"
              :points="mapContextPoints"
              :editable="true"
              height="650px"
              @address-change="handleAddressChange"
            />
            <template #fallback><div class="map-placeholder">地图加载中...</div></template>
          </ClientOnly>
        </section>

        <el-form class="point-editor__form" label-position="top">
          <div class="editor-intro">
            <span>MAP PICKER</span>
            <p>点击地图或拖动中心标记调整坐标，修改半径时地图围栏会同步变化。</p>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="所属城市">
              <el-select v-model="form.cityId" @change="handleCityChange">
                <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="点位状态">
              <el-select v-model="form.status">
                <el-option label="已发布" value="published" /><el-option label="草稿" value="draft" /><el-option label="停用" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item label="点位名称"><el-input v-model="form.name" /></el-form-item>
            <el-form-item label="点位编码"><el-input v-model="form.code" /></el-form-item>
            <el-form-item label="分类"><el-input v-model="form.category" /></el-form-item>
            <el-form-item label="积分奖励"><el-input-number v-model="form.pointsReward" :min="0" /></el-form-item>
          </div>

          <div class="coordinate-box">
            <div class="coordinate-box__title"><span>GEOFENCE</span><b>{{ form.checkinRadius }}m</b></div>
            <el-slider v-model="form.checkinRadius" :min="50" :max="3000" :step="10" show-input />
            <div class="coordinate-values">
              <label>经度<strong>{{ Number(form.longitude).toFixed(6) }}</strong></label>
              <label>纬度<strong>{{ Number(form.latitude).toFixed(6) }}</strong></label>
            </div>
          </div>

          <el-form-item label="详细地址"><el-input v-model="form.address" placeholder="地图选点后会自动解析地址，也可手动修改" /></el-form-item>
          <el-form-item label="点位介绍"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存点位与围栏</el-button>
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
.header-actions { display: flex; gap: 10px; }.admin-button--ghost { color: var(--void-text); background: transparent; border: 1px solid var(--void-border); text-decoration: none; }
.point-editor { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(360px, .8fr); gap: 20px; }
.point-editor__map { min-width: 0; }.point-editor__form { max-height: 650px; overflow-y: auto; padding: 0 8px 0 2px; }
.map-placeholder { height: 650px; display: grid; place-items: center; border: 1px solid var(--void-border); color: var(--void-muted); }
.editor-intro { margin-bottom: 18px; padding: 14px; border: 1px solid rgba(244,255,88,.18); background: rgba(244,255,88,.035); }
.editor-intro span { color: #f4ff58; font: 10px var(--void-mono); letter-spacing: .12em; }.editor-intro p { margin: 8px 0 0; color: var(--void-muted); font-size: 12px; line-height: 1.6; }
.coordinate-box { margin-bottom: 18px; padding: 16px; border: 1px solid var(--void-border); background: rgba(255,255,255,.02); }
.coordinate-box__title { display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--void-muted); font: 10px var(--void-mono); letter-spacing: .1em; }.coordinate-box__title b { color: #f4ff58; font-size: 14px; }
.coordinate-values { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }.coordinate-values label { color: var(--void-muted); font-size: 10px; }.coordinate-values strong { display: block; margin-top: 5px; color: var(--void-text); font: 13px var(--void-mono); }
:deep(.point-dialog .el-dialog__body) { padding: 12px 20px; }
</style>
