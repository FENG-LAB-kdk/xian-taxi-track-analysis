<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { type Map as MapLibreMap, type PointLike } from 'maplibre-gl'
import { useMap } from '@/composables/useMap'
import { useMapStore } from '@/store/mapStore'
import { allPlateNumbers as rawPlateNumbers, vehicleTracks, filterTrackByTime, type TrackPoint } from '@/mock/trackData'
import { wgs84ToGcj02 } from '@/utils/coordTransform'
import { simplifyTrack } from '@/utils/trackSimplify'
import MapControl from '@/components/MapControl.vue'

const router = useRouter()
const mapStore = useMapStore()
const { getMap, isMapValid, clearAllLayers, addGeoJSONSource, disableDragPan, enableDragPan } = useMap()

const mapContainerId = 'track-analysis-map'
const ALL_PLATES = '__all__'
const plateNumber = ref('')
const allPlateNumbers = ref<string[]>([ALL_PLATES, ...rawPlateNumbers])
const customPlateNumber = ref('')
const startTime = ref('')
const endTime = ref('')
const simplifyEnabled = ref(false)
const simplifyThreshold = ref(0.001)
const isPlaying = ref(false)
const playbackSpeed = ref(1)
const pointCount = ref(0)
const selectionBox = ref<[number, number][] | null>(null)
const isSelecting = ref(false)
const selectStart = ref<[number, number] | null>(null)
const currentPlaybackIndex = ref(0)
const playbackTimer = ref<number | null>(null)
const filteredPoints = ref<TrackPoint[]>([])
const simplifiedCoords = ref<[number, number][]>([])

function goHome() {
  router.push('/')
}

function handlePlateChange(val: string) {
  plateNumber.value = val
  customPlateNumber.value = ''
}

function handleCustomPlateChange(val: string) {
  customPlateNumber.value = val
  plateNumber.value = ''
}

function resetFilters() {
  plateNumber.value = ''
  customPlateNumber.value = ''
  startTime.value = ''
  endTime.value = ''
  simplifyEnabled.value = false
  simplifyThreshold.value = 0.001
  selectionBox.value = null
  stopPlayback()
  clearAllLayers()
  pointCount.value = 0
  filteredPoints.value = []
  simplifiedCoords.value = []
}

function transformPointsToCoords(points: TrackPoint[]): [number, number][] {
  return points.map(p => {
    const gcj = wgs84ToGcj02(p.lng, p.lat)
    return [gcj.lng, gcj.lat]
  })
}

function executeFilter() {
  stopPlayback()
  clearAllLayers()

  const activePlate = customPlateNumber.value || plateNumber.value
  if (!activePlate) {
    return
  }

  let points: TrackPoint[]
  if (activePlate === ALL_PLATES) {
    points = vehicleTracks.flatMap(v => v.points)
  } else {
    const vehicle = vehicleTracks.find(v => v.plateNumber === activePlate)
    points = vehicle ? vehicle.points : []
  }

  if (startTime.value && endTime.value) {
    points = filterTrackByTime(points, startTime.value, endTime.value)
  }

  if (selectionBox.value && selectionBox.value.length === 2) {
    const [start, end] = selectionBox.value
    const minLng = Math.min(start[0], end[0])
    const maxLng = Math.max(start[0], end[0])
    const minLat = Math.min(start[1], end[1])
    const maxLat = Math.max(start[1], end[1])
    points = points.filter(p => {
      const gcj = wgs84ToGcj02(p.lng, p.lat)
      return gcj.lng >= minLng && gcj.lng <= maxLng && gcj.lat >= minLat && gcj.lat <= maxLat
    })
  }

  filteredPoints.value = points
  pointCount.value = points.length

  const coords = transformPointsToCoords(points)
  if (simplifyEnabled.value && coords.length >= 6) {
    simplifiedCoords.value = simplifyTrack(coords, simplifyThreshold.value)
  } else {
    simplifiedCoords.value = coords
  }

  renderTrack()
}

function renderTrack() {
  if (!isMapValid()) return
  const map = getMap()
  if (!map) return

  if (simplifiedCoords.value.length === 0) {
    return
  }

  if (simplifiedCoords.value.length === 1) {
    renderSinglePoint(map, simplifiedCoords.value[0])
  } else {
    renderTrackLine(map, simplifiedCoords.value)
  }
}

function renderTrackLine(map: MapLibreMap, coords: [number, number][]) {
  const lineGeoJSON: GeoJSON.GeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  }

  addGeoJSONSource(mapStore.DATA_SOURCE_IDS.trackLine, lineGeoJSON)

  if (map.getLayer(mapStore.LAYER_IDS.trackLine)) {
    map.removeLayer(mapStore.LAYER_IDS.trackLine)
  }

  map.addLayer({
    id: mapStore.LAYER_IDS.trackLine,
    type: 'line',
    source: mapStore.DATA_SOURCE_IDS.trackLine,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#1890ff',
      'line-width': 4,
      'line-opacity': 0.8
    }
  })

  const pointGeoJSON: GeoJSON.GeoJSON = {
    type: 'FeatureCollection',
    features: coords.map((coord, index) => ({
      type: 'Feature',
      properties: { index },
      geometry: {
        type: 'Point',
        coordinates: coord
      }
    }))
  }

  addGeoJSONSource(mapStore.DATA_SOURCE_IDS.trackPoint, pointGeoJSON)

  if (map.getLayer(mapStore.LAYER_IDS.trackPoint)) {
    map.removeLayer(mapStore.LAYER_IDS.trackPoint)
  }

  map.addLayer({
    id: mapStore.LAYER_IDS.trackPoint,
    type: 'circle',
    source: mapStore.DATA_SOURCE_IDS.trackPoint,
    paint: {
      'circle-radius': 4,
      'circle-color': '#1890ff',
      'circle-opacity': 0.6
    }
  })
}

function renderSinglePoint(map: MapLibreMap, coord: [number, number]) {
  const pointGeoJSON: GeoJSON.GeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: coord
    }
  }

  addGeoJSONSource(mapStore.DATA_SOURCE_IDS.trackPoint, pointGeoJSON)

  if (map.getLayer(mapStore.LAYER_IDS.trackPoint)) {
    map.removeLayer(mapStore.LAYER_IDS.trackPoint)
  }

  map.addLayer({
    id: mapStore.LAYER_IDS.trackPoint,
    type: 'circle',
    source: mapStore.DATA_SOURCE_IDS.trackPoint,
    paint: {
      'circle-radius': 10,
      'circle-color': '#1890ff',
      'circle-opacity': 0.9
    }
  })
}

function renderSelectionBox(map: MapLibreMap, start: [number, number], end: [number, number]) {
  const polygonCoords: [number, number][] = [
    [start[0], start[1]],
    [end[0], start[1]],
    [end[0], end[1]],
    [start[0], end[1]],
    [start[0], start[1]]
  ]

  const boxGeoJSON: GeoJSON.GeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [polygonCoords]
    }
  }

  addGeoJSONSource(mapStore.DATA_SOURCE_IDS.selectionBox, boxGeoJSON)

  if (map.getLayer(mapStore.LAYER_IDS.selectionBox)) {
    map.removeLayer(mapStore.LAYER_IDS.selectionBox)
  }

  map.addLayer({
    id: mapStore.LAYER_IDS.selectionBox,
    type: 'fill',
    source: mapStore.DATA_SOURCE_IDS.selectionBox,
    paint: {
      'fill-color': '#1890ff',
      'fill-opacity': 0.2,
      'fill-outline-color': '#1890ff'
    }
  })
}

function removeSelectionBox() {
  if (!isMapValid()) return
  const map = getMap()
  if (!map) return

  if (map.getLayer(mapStore.LAYER_IDS.selectionBox)) {
    map.removeLayer(mapStore.LAYER_IDS.selectionBox)
  }
  if (map.getSource(mapStore.DATA_SOURCE_IDS.selectionBox)) {
    map.removeSource(mapStore.DATA_SOURCE_IDS.selectionBox)
  }
}

function playTrack() {
  if (simplifiedCoords.value.length < 2) return

  if (isPlaying.value) {
    stopPlayback()
    return
  }

  isPlaying.value = true
  currentPlaybackIndex.value = 0
  updateAnimationCar()

  playbackTimer.value = window.setInterval(() => {
    if (currentPlaybackIndex.value >= simplifiedCoords.value.length - 1) {
      stopPlayback()
      return
    }
    currentPlaybackIndex.value++
    updateAnimationCar()
  }, 200 / playbackSpeed.value)
}

function updateAnimationCar() {
  if (!isMapValid()) return
  const map = getMap()
  if (!map) return

  const coord = simplifiedCoords.value[currentPlaybackIndex.value]
  if (!coord) return

  const carGeoJSON: GeoJSON.GeoJSON = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: coord
    }
  }

  addGeoJSONSource(mapStore.DATA_SOURCE_IDS.animationCar, carGeoJSON)

  if (map.getLayer(mapStore.LAYER_IDS.animationCar)) {
    map.removeLayer(mapStore.LAYER_IDS.animationCar)
  }

  map.addLayer({
    id: mapStore.LAYER_IDS.animationCar,
    type: 'circle',
    source: mapStore.DATA_SOURCE_IDS.animationCar,
    paint: {
      'circle-radius': 12,
      'circle-color': '#ff4d4f',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2
    }
  })
}

function stopPlayback() {
  isPlaying.value = false
  if (playbackTimer.value) {
    window.clearInterval(playbackTimer.value)
    playbackTimer.value = null
  }

  if (isMapValid()) {
    const map = getMap()
    if (map?.getLayer(mapStore.LAYER_IDS.animationCar)) {
      map.removeLayer(mapStore.LAYER_IDS.animationCar)
    }
    if (map?.getSource(mapStore.DATA_SOURCE_IDS.animationCar)) {
      map.removeSource(mapStore.DATA_SOURCE_IDS.animationCar)
    }
  }
}

function handleMapClick(event: { type: string }) {
  if (event.type === 'click' && !isSelecting.value) {
    removeSelectionBox()
    selectionBox.value = null
  }
}

function handleMapMouseDown(event: { point: PointLike; lngLat: { lng: number; lat: number } }) {
  isSelecting.value = true
  selectStart.value = [event.lngLat.lng, event.lngLat.lat]
  disableDragPan()
}

function handleMapMouseMove(event: { lngLat: { lng: number; lat: number } }) {
  if (!isSelecting.value || !selectStart.value) return

  const map = getMap()
  if (!map) return

  const currentEnd: [number, number] = [event.lngLat.lng, event.lngLat.lat]
  renderSelectionBox(map, selectStart.value, currentEnd)
}

function handleMapMouseUp(event: { lngLat: { lng: number; lat: number } }) {
  if (!isSelecting.value || !selectStart.value) return

  isSelecting.value = false
  selectionBox.value = [
    selectStart.value,
    [event.lngLat.lng, event.lngLat.lat]
  ]
  selectStart.value = null
  enableDragPan()
}

function initMapEvents() {
  const map = getMap()
  if (!map) return

  map.on('mousedown', handleMapMouseDown)
  map.on('mousemove', handleMapMouseMove)
  map.on('mouseup', handleMapMouseUp)
  map.on('click', handleMapClick)
  map.on('mouseleave', () => {
    if (isSelecting.value) {
      isSelecting.value = false
      selectStart.value = null
      removeSelectionBox()
      enableDragPan()
    }
  })
}

function removeMapEvents() {
  const map = getMap()
  if (!map) return

  map.off('mousedown', handleMapMouseDown)
  map.off('mousemove', handleMapMouseMove)
  map.off('mouseup', handleMapMouseUp)
  map.off('click', handleMapClick)
}

watch(simplifyThreshold, () => {
  if (filteredPoints.value.length > 0) {
    executeFilter()
  }
})

watch(playbackSpeed, () => {
  if (isPlaying.value) {
    stopPlayback()
    playTrack()
  }
})

function onMapReady() {
  setTimeout(() => {
    initMapEvents()
    plateNumber.value = ALL_PLATES
    executeFilter()
  }, 300)
}

onMounted(() => {
  setTimeout(() => {
    initMapEvents()
  }, 500)
})

onUnmounted(() => {
  stopPlayback()
  removeMapEvents()
  clearAllLayers()
})
</script>

<template>
  <div class="track-analysis-container">
    <header class="header">
      <div class="header-left">
        <el-button
          type="link"
          @click="goHome"
          class="back-btn"
        >
          ← 返回首页
        </el-button>
        <h1 class="title">轨迹多维可视化分析</h1>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-row">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="车牌选择">
            <el-select
              v-model="plateNumber"
              placeholder="请选择车牌"
              @change="handlePlateChange"
              :disabled="!!customPlateNumber"
              style="width: 140px"
            >
              <el-option
                v-for="plate in allPlateNumbers"
                :key="plate"
                :label="plate === '__all__' ? '全部车辆' : plate"
                :value="plate"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="手动输入">
            <el-input
              v-model="customPlateNumber"
              placeholder="手动输入车牌"
              @input="handleCustomPlateChange"
              :disabled="!!plateNumber"
              style="width: 140px"
            />
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="startTime"
              type="datetime"
              placeholder="开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="-">
            <el-date-picker
              v-model="endTime"
              type="datetime"
              placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="轨迹抽稀">
            <el-switch
              v-model="simplifyEnabled"
              active-text="开启"
              inactive-text="关闭"
            />
          </el-form-item>

          <el-form-item label="抽稀阈值">
            <el-slider
              v-model="simplifyThreshold"
              :min="0.0001"
              :max="0.01"
              :step="0.0001"
              :disabled="!simplifyEnabled"
              style="width: 160px"
            />
            <span class="threshold-value">{{ simplifyThreshold.toFixed(4) }}</span>
          </el-form-item>

          <div class="button-group">
            <el-button
              type="default"
              @click="resetFilters"
            >
              重置筛选
            </el-button>
            <el-button
              type="primary"
              @click="executeFilter"
            >
              执行筛选
            </el-button>
            <el-button
              :type="isPlaying ? 'danger' : 'success'"
              @click="playTrack"
              :disabled="simplifiedCoords.length < 2"
            >
              {{ isPlaying ? '停止播放' : '播放轨迹' }}
            </el-button>
          </div>
        </el-form>
      </div>

      <div class="hint-row">
        <span class="hint-text">
          💡 拖拽地图矩形框选空间范围 | 当前GPS采样点总数：<strong>{{ pointCount }}</strong>
        </span>
        <div v-if="isPlaying" class="playback-control">
          <span>倍速：</span>
          <el-button
            v-for="speed in [0.5, 1, 2, 4]"
            :key="speed"
            :type="playbackSpeed === speed ? 'primary' : 'default'"
            size="small"
            @click="playbackSpeed = speed"
          >
            {{ speed }}x
          </el-button>
        </div>
      </div>
    </div>

    <div class="map-container">
      <MapControl :container-id="mapContainerId" @map-ready="onMapReady" />
    </div>
  </div>
</template>

<style scoped>
.track-analysis-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: white;
  font-size: 14px;
  padding: 0;
  height: auto;
  background: transparent !important;
  border: none !important;
  text-decoration: none;
}

.back-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: transparent !important;
  text-decoration: none;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.filter-bar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-form {
  flex: 1;
  display: flex;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.threshold-value {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
  min-width: 60px;
  display: inline-block;
}

.hint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e8e8e8;
}

.hint-text {
  font-size: 13px;
  color: #888;
}

.hint-text strong {
  color: #1890ff;
}

.playback-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playback-control span {
  font-size: 13px;
  color: #666;
}

.map-container {
  flex: 1;
  width: 100%;
  position: relative;
}
</style>
