<template>
  <div
    class="xj-map-shell"
    :class="{ 'is-editable': editable }"
    :style="{ height }"
  >
    <div ref="containerRef" class="xj-map-canvas" />
    <div v-if="loading" class="xj-map-state">地图加载中...</div>
    <div v-else-if="errorMessage" class="xj-map-state xj-map-state--error">
      {{ errorMessage }}
    </div>

    <div v-if="editable && !loading && !errorMessage" class="xj-map-tip">
      <span class="xj-map-tip__dot" />{{ tipText }}
    </div>

    <div v-if="selectedPoint && !editable" class="xj-map-summary">
      <span class="xj-map-summary__eyebrow">SELECTED GEOFENCE</span>
      <strong>{{ selectedPoint.name }}</strong>
      <div class="xj-map-summary__row">
        <span>围栏 {{ selectedPoint.checkinRadius }} m</span>
        <span v-if="currentLocation"
          >距离 {{ formatMapDistance(selectedDistance) }}</span
        >
      </div>
      <div v-if="currentLocation" class="xj-map-status" :class="statusClass">
        <span class="xj-map-status__dot" />{{ statusText }}
      </div>
    </div>

    <div class="xj-map-legend">
      <span v-if="points.length"><i class="legend-dot legend-dot--point" />点位</span>
      <span v-if="currentLocation"><i class="legend-dot legend-dot--me" />我的位置</span>
      <span v-if="editable"><i class="legend-dot legend-dot--point" />{{ editorLabel }}</span>
      <span v-if="showRadius"><i class="legend-ring" />围栏范围</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  XingjianMapLocation,
  XingjianMapPlace,
  XingjianMapPoint,
} from "~/composables/useAmap";
import { parseAmapRegeocode } from "~/composables/useAmap";

interface EditableValue {
  longitude: number;
  latitude: number;
  radius: number;
}

const props = withDefaults(
  defineProps<{
    points?: XingjianMapPoint[];
    selectedPointId?: number | null;
    currentLocation?: XingjianMapLocation | null;
    editable?: boolean;
    /** 是否绘制围栏圆，城市选点时可关闭 */
    showRadius?: boolean;
    /** 可编辑标记文案 */
    editorLabel?: string;
    modelValue?: EditableValue | null;
    height?: string;
    maxAccuracy?: number;
    autoFit?: boolean;
  }>(),
  {
    points: () => [],
    selectedPointId: null,
    currentLocation: null,
    editable: false,
    showRadius: true,
    editorLabel: "围栏中心",
    modelValue: null,
    height: "520px",
    maxAccuracy: 100,
    autoFit: true,
  },
);

const emit = defineEmits<{
  selectPoint: [point: XingjianMapPoint];
  "update:modelValue": [value: EditableValue];
  addressChange: [address: string];
  /** 逆地理完整地点信息，用于自动回填省市等字段 */
  placeChange: [place: XingjianMapPlace];
  ready: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const { loadAmap } = useAmap();
const { isDark } = useXingjianTheme();

let AMapRef: any = null;
let map: any = null;
let geocoder: any = null;
let pointOverlays: any[] = [];
let currentMarker: any = null;
let accuracyCircle: any = null;
let editorMarker: any = null;
let editorCircle: any = null;
let reverseGeocodeTimer: ReturnType<typeof setTimeout> | null = null;

const selectedPoint = computed(() => {
  if (!props.points.length) return null;
  if (props.selectedPointId === null || props.selectedPointId === undefined) {
    return props.points.length === 1 ? props.points[0] : null;
  }
  return (
    props.points.find((point) => point.id === props.selectedPointId) || null
  );
});

const selectedDistance = computed(() => {
  if (!props.currentLocation || !selectedPoint.value) return null;
  return calculateMapDistance(props.currentLocation, selectedPoint.value);
});

const accuracyInsufficient = computed(
  () => Number(props.currentLocation?.accuracy || 0) > props.maxAccuracy,
);
const isInside = computed(() => {
  if (selectedDistance.value === null || !selectedPoint.value) return false;
  return selectedDistance.value <= Number(selectedPoint.value.checkinRadius);
});
const statusText = computed(() => {
  if (accuracyInsufficient.value)
    return `定位误差 ${Math.round(props.currentLocation?.accuracy || 0)} m，精度不足`;
  return isInside.value ? "已进入打卡围栏" : "当前位于打卡围栏外";
});
const statusClass = computed(() => ({
  "is-inside": isInside.value && !accuracyInsufficient.value,
  "is-outside": !isInside.value && !accuracyInsufficient.value,
  "is-warning": accuracyInsufficient.value,
}));

const tipText = computed(() =>
  props.showRadius
    ? "点击地图或拖动中心点设置坐标"
    : "点击地图或拖动标记选择城市中心",
);

function validCoordinate(longitude: number, latitude: number) {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function pointMarkerContent(point: XingjianMapPoint, selected: boolean) {
  const name = String(point.name || "").replace(/[<>&"']/g, "");
  return `<div class="amap-xj-marker ${selected ? "is-selected" : ""}"><span></span><b>${name}</b></div>`;
}

function editorMarkerContent() {
  const label = String(props.editorLabel || "围栏中心").replace(/[<>&"']/g, "");
  return `<div class="amap-xj-editor"><span></span><b>${label}</b></div>`;
}

function clearPointOverlays() {
  pointOverlays.forEach((overlay) => overlay.setMap?.(null));
  pointOverlays = [];
}

function renderPoints(shouldFit = props.autoFit) {
  if (!map || !AMapRef) return;
  clearPointOverlays();

  props.points.forEach((point) => {
    const longitude = Number(point.longitude);
    const latitude = Number(point.latitude);
    if (!validCoordinate(longitude, latitude)) return;
    const selected = point.id === selectedPoint.value?.id;
    const circle = new AMapRef.Circle({
      center: [longitude, latitude],
      radius: Math.max(1, Number(point.checkinRadius) || 1),
      strokeColor: selected ? "#f4ff58" : "#52d6ff",
      strokeWeight: selected ? 3 : 1.5,
      strokeOpacity: selected ? 0.95 : 0.55,
      strokeStyle: selected ? "solid" : "dashed",
      fillColor: selected ? "#f4ff58" : "#36b8dc",
      fillOpacity: selected ? 0.14 : 0.07,
      zIndex: selected ? 30 : 10,
    });
    const marker = new AMapRef.Marker({
      position: [longitude, latitude],
      content: pointMarkerContent(point, selected),
      offset: new AMapRef.Pixel(-14, -14),
      zIndex: selected ? 120 : 100,
      title: point.name,
    });
    marker.on("click", () => emit("selectPoint", point));
    pointOverlays.push(circle, marker);
    map.add([circle, marker]);
  });

  if (shouldFit) fitMapView();
}

function renderCurrentLocation(shouldFit = false) {
  currentMarker?.setMap?.(null);
  accuracyCircle?.setMap?.(null);
  currentMarker = null;
  accuracyCircle = null;
  if (!map || !AMapRef || !props.currentLocation) return;

  const { longitude, latitude } = props.currentLocation;
  if (!validCoordinate(Number(longitude), Number(latitude))) return;
  accuracyCircle = new AMapRef.Circle({
    center: [longitude, latitude],
    radius: Math.max(5, Number(props.currentLocation.accuracy) || 5),
    strokeColor: "#ff57d2",
    strokeWeight: 1.5,
    strokeOpacity: 0.8,
    fillColor: "#ff57d2",
    fillOpacity: 0.1,
    zIndex: 45,
  });
  currentMarker = new AMapRef.Marker({
    position: [longitude, latitude],
    content: '<div class="amap-xj-current"><span></span><b>我的位置</b></div>',
    offset: new AMapRef.Pixel(-9, -9),
    zIndex: 150,
    title: "我的位置",
  });
  map.add([accuracyCircle, currentMarker]);
  if (shouldFit) fitMapView();
}

function emitEditorValue(
  longitude: number,
  latitude: number,
  reverseAddress = true,
) {
  const value = {
    longitude: Number(longitude.toFixed(6)),
    latitude: Number(latitude.toFixed(6)),
    radius: Math.max(1, Number(props.modelValue?.radius) || 500),
  };
  emit("update:modelValue", value);
  if (reverseAddress) scheduleReverseGeocode(longitude, latitude);
}

function renderEditor(shouldFit = false) {
  if (!map || !AMapRef || !props.editable || !props.modelValue) return;
  const longitude = Number(props.modelValue.longitude);
  const latitude = Number(props.modelValue.latitude);
  if (!validCoordinate(longitude, latitude)) return;

  if (props.showRadius) {
    if (!editorCircle) {
      editorCircle = new AMapRef.Circle({
        center: [longitude, latitude],
        radius: Math.max(1, Number(props.modelValue.radius) || 500),
        strokeColor: "#f4ff58",
        strokeWeight: 3,
        strokeOpacity: 0.95,
        fillColor: "#f4ff58",
        fillOpacity: 0.15,
        zIndex: 60,
      });
      map.add(editorCircle);
    } else {
      editorCircle.setCenter([longitude, latitude]);
      editorCircle.setRadius(
        Math.max(1, Number(props.modelValue.radius) || 500),
      );
    }
  } else if (editorCircle) {
    editorCircle.setMap?.(null);
    editorCircle = null;
  }

  if (!editorMarker) {
    editorMarker = new AMapRef.Marker({
      position: [longitude, latitude],
      content: editorMarkerContent(),
      offset: new AMapRef.Pixel(-14, -14),
      draggable: true,
      cursor: "move",
      zIndex: 180,
    });
    editorMarker.on("dragging", (event: any) => {
      const position = event.lnglat || editorMarker.getPosition();
      editorCircle?.setCenter(position);
    });
    editorMarker.on("dragend", (event: any) => {
      const position = event.lnglat || editorMarker.getPosition();
      emitEditorValue(position.getLng(), position.getLat());
    });
    map.add(editorMarker);
  } else {
    editorMarker.setPosition([longitude, latitude]);
    editorMarker.setContent(editorMarkerContent());
  }

  if (shouldFit) {
    map.setCenter([longitude, latitude]);
    if (editorCircle) {
      map.setFitView([editorCircle], false, [80, 80, 80, 80], 18);
    } else {
      map.setZoomAndCenter(11, [longitude, latitude], true);
    }
  }
}

function scheduleReverseGeocode(longitude: number, latitude: number) {
  if (!geocoder) return;
  if (reverseGeocodeTimer) clearTimeout(reverseGeocodeTimer);
  reverseGeocodeTimer = setTimeout(() => {
    geocoder.getAddress(
      [longitude, latitude],
      (status: string, result: any) => {
        if (status !== "complete" || !result?.regeocode) return;
        const place = parseAmapRegeocode(result.regeocode);
        if (place.address) emit("addressChange", place.address);
        emit("placeChange", place);
      },
    );
  }, 280);
}

function fitMapView() {
  if (!map) return;
  const overlays = [
    ...pointOverlays,
    ...(currentMarker ? [currentMarker, accuracyCircle] : []),
    ...(editorCircle ? [editorCircle, editorMarker] : []),
  ].filter(Boolean);
  if (overlays.length) map.setFitView(overlays, false, [70, 70, 70, 70], 17);
}

function focusSelectedPoint() {
  const point = selectedPoint.value;
  if (!map || !point) return;
  map.setZoomAndCenter(
    16,
    [Number(point.longitude), Number(point.latitude)],
    true,
  );
}

/** 将地图定位到指定坐标（名称解析后跳转城市中心） */
function focusLocation(longitude: number, latitude: number, zoom = 11) {
  if (!map || !validCoordinate(longitude, latitude)) return;
  map.setZoomAndCenter(zoom, [longitude, latitude], true);
  renderEditor(false);
}

defineExpose({ fitMapView, focusSelectedPoint, focusLocation });

onMounted(async () => {
  try {
    AMapRef = await loadAmap();
    if (!containerRef.value) return;
    const fallback = props.modelValue
      ? [Number(props.modelValue.longitude), Number(props.modelValue.latitude)]
      : [121.473701, 31.230416];
    map = new AMapRef.Map(containerRef.value, {
      zoom: 13,
      center: fallback,
      viewMode: "2D",
      mapStyle: isDark.value
        ? "amap://styles/darkblue"
        : "amap://styles/whitesmoke",
      showLabel: true,
    });
    map.addControl(
      new AMapRef.ToolBar({ position: { right: "16px", top: "72px" } }),
    );
    map.addControl(new AMapRef.Scale());
    geocoder = new AMapRef.Geocoder();
    map.on("click", (event: any) => {
      if (!props.editable) return;
      emitEditorValue(event.lnglat.getLng(), event.lnglat.getLat());
    });
    renderPoints(false);
    renderCurrentLocation(false);
    renderEditor(props.editable);
    if (props.autoFit && !props.editable) fitMapView();
    loading.value = false;
    emit("ready");
  } catch (error: any) {
    loading.value = false;
    errorMessage.value = `地图加载失败：${error?.message || "未知错误"}`;
  }
});

watch(isDark, (dark) =>
  map?.setMapStyle?.(
    dark ? "amap://styles/darkblue" : "amap://styles/whitesmoke",
  ),
);
watch(
  () => props.points,
  () => renderPoints(true),
  { deep: true },
);
watch(
  () => props.selectedPointId,
  () => {
    renderPoints(false);
    if (!props.editable) focusSelectedPoint();
  },
);
watch(
  () => props.currentLocation,
  () => renderCurrentLocation(true),
  { deep: true },
);
watch(
  () => props.modelValue,
  () => renderEditor(false),
  { deep: true },
);

onUnmounted(() => {
  if (reverseGeocodeTimer) clearTimeout(reverseGeocodeTimer);
  map?.destroy?.();
  map = null;
});
</script>

<style scoped lang="scss">
.xj-map-shell {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--xj-bg-elevated);
}

.xj-map-canvas {
  width: 100%;
  height: 100%;
}

.xj-map-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.6);
  background: var(--xj-bg-elevated);
  z-index: 20;
}
.xj-map-state--error {
  color: #ff8a8a;
}

.xj-map-tip,
.xj-map-legend,
.xj-map-summary {
  position: absolute;
  z-index: 15;
  color: rgba(255, 255, 255, 0.78);
  background: color-mix(in srgb, var(--xj-bg-elevated) 88%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(16px);
}

.xj-map-tip {
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  font: 12px var(--void-mono, monospace);
}
.xj-map-tip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f4ff58;
  box-shadow: 0 0 12px #f4ff58;
}

.xj-map-summary {
  top: 16px;
  left: 16px;
  width: min(300px, calc(100% - 32px));
  padding: 16px;
}
.xj-map-summary__eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #f4ff58;
  font: 10px var(--void-mono, monospace);
  letter-spacing: 0.12em;
}
.xj-map-summary strong {
  display: block;
  font-size: 18px;
  color: #fff;
}
.xj-map-summary__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 9px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.xj-map-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}
.xj-map-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.xj-map-status.is-inside {
  color: #baff6a;
}
.xj-map-status.is-inside .xj-map-status__dot {
  background: #baff6a;
  box-shadow: 0 0 10px #baff6a;
}
.xj-map-status.is-outside {
  color: #ff8585;
}
.xj-map-status.is-outside .xj-map-status__dot {
  background: #ff6262;
}
.xj-map-status.is-warning {
  color: #ffc85c;
}
.xj-map-status.is-warning .xj-map-status__dot {
  background: #ffc85c;
}

.xj-map-legend {
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 12px;
  font-size: 11px;
}
.xj-map-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.legend-dot--point {
  background: #f4ff58;
}
.legend-dot--me {
  background: #ff57d2;
}
.legend-ring {
  width: 12px;
  height: 12px;
  display: inline-block;
  border: 1px solid #52d6ff;
  border-radius: 50%;
  background: rgba(82, 214, 255, 0.12);
}

:deep(.amap-xj-marker),
:deep(.amap-xj-editor),
:deep(.amap-xj-current) {
  position: relative;
  white-space: nowrap;
  color: #fff;
  font: 11px var(--void-mono, monospace);
}
:deep(.amap-xj-marker > span),
:deep(.amap-xj-editor > span),
:deep(.amap-xj-current > span) {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: #52d6ff;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.5);
}
:deep(.amap-xj-marker > b),
:deep(.amap-xj-editor > b),
:deep(.amap-xj-current > b) {
  position: absolute;
  left: 34px;
  top: 5px;
  padding: 3px 7px;
  background: color-mix(in srgb, var(--xj-bg-elevated) 86%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 500;
}
:deep(.amap-xj-marker.is-selected > span),
:deep(.amap-xj-editor > span) {
  background: #f4ff58;
}
:deep(.amap-xj-marker.is-selected > b),
:deep(.amap-xj-editor > b) {
  color: #f4ff58;
}
:deep(.amap-xj-current > span) {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: none;
  background: #ff57d2;
  border-width: 3px;
  box-shadow:
    0 0 0 7px rgba(255, 87, 210, 0.18),
    0 0 18px #ff57d2;
}
:deep(.amap-xj-current > b) {
  left: 25px;
  top: -1px;
  color: #ff9fe6;
}
:deep(.amap-logo),
:deep(.amap-copyright) {
  opacity: 0.55;
}
</style>
