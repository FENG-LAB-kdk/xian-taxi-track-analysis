import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { TrackPoint } from '@/mock/trackData'

interface MapWithDestroyed extends MapLibreMap {
  _destroyed?: boolean
}

export interface FilterCondition {
  plateNumber: string
  customPlateNumber: string
  startTime: string
  endTime: string
  simplifyEnabled: boolean
  simplifyThreshold: number
  spatialBbox: [number, number, number, number] | null
}

export interface LayerIds {
  trackLine: string
  trackPoint: string
  animationCar: string
  selectionBox: string
}

export const useMapStore = defineStore('map', () => {
  const mapInstance = ref<MapWithDestroyed | null>(null)
  const isMapReady = ref(false)
  const currentTrackPoints = ref<TrackPoint[]>([])
  const filteredPointCount = ref(0)
  const isPlaying = ref(false)
  const playbackSpeed = ref(1)
  const playbackTimer = ref<number | null>(null)

  const filterCondition = ref<FilterCondition>({
    plateNumber: '',
    customPlateNumber: '',
    startTime: '',
    endTime: '',
    simplifyEnabled: false,
    simplifyThreshold: 0.001,
    spatialBbox: null
  })

  const LAYER_IDS: LayerIds = {
    trackLine: 'track-line-layer',
    trackPoint: 'track-point-layer',
    animationCar: 'animation-car-layer',
    selectionBox: 'selection-box-layer'
  }

  const DATA_SOURCE_IDS = {
    trackLine: 'track-line-source',
    trackPoint: 'track-point-source',
    animationCar: 'animation-car-source',
    selectionBox: 'selection-box-source'
  }

  const activePlateNumber = computed(() => {
    return filterCondition.value.customPlateNumber || filterCondition.value.plateNumber
  })

  function setMapInstance(map: MapLibreMap): void {
    mapInstance.value = map as MapWithDestroyed
    isMapReady.value = true
  }

  function clearMapInstance(): void {
    if (mapInstance.value) {
      mapInstance.value = null
      isMapReady.value = false
    }
  }

  function updateFilterCondition(updates: Partial<FilterCondition>): void {
    filterCondition.value = { ...filterCondition.value, ...updates }
  }

  function resetFilterCondition(): void {
    filterCondition.value = {
      plateNumber: '',
      customPlateNumber: '',
      startTime: '',
      endTime: '',
      simplifyEnabled: false,
      simplifyThreshold: 0.001,
      spatialBbox: null
    }
  }

  function setCurrentTrackPoints(points: TrackPoint[]): void {
    currentTrackPoints.value = points
    filteredPointCount.value = points.length
  }

  function setIsPlaying(playing: boolean): void {
    isPlaying.value = playing
  }

  function setPlaybackSpeed(speed: number): void {
    playbackSpeed.value = speed
  }

  function setPlaybackTimer(timer: number | null): void {
    playbackTimer.value = timer
  }

  function clearPlaybackTimer(): void {
    if (playbackTimer.value) {
      window.clearInterval(playbackTimer.value)
      playbackTimer.value = null
    }
  }

  function checkMapValid(): boolean {
    return (
      mapInstance.value !== null &&
      !mapInstance.value._destroyed
    )
  }

  return {
    mapInstance,
    isMapReady,
    currentTrackPoints,
    filteredPointCount,
    isPlaying,
    playbackSpeed,
    playbackTimer,
    filterCondition,
    LAYER_IDS,
    DATA_SOURCE_IDS,
    activePlateNumber,
    setMapInstance,
    clearMapInstance,
    updateFilterCondition,
    resetFilterCondition,
    setCurrentTrackPoints,
    setIsPlaying,
    setPlaybackSpeed,
    setPlaybackTimer,
    clearPlaybackTimer,
    checkMapValid
  }
})
