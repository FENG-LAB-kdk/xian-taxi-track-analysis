import { ref } from 'vue'
import { Map, type MapOptions, type GeoJSONSource } from 'maplibre-gl'
import { useMapStore } from '@/store/mapStore'

interface MapWithDestroyed extends Map {
  _destroyed?: boolean
}

let mapInstance: MapWithDestroyed | null = null
const isInitialized = ref(false)
let currentContainerId = ''

const DEFAULT_MAP_OPTIONS: MapOptions = {
  container: '',
  style: {
    version: 8,
    name: 'amap',
    sources: {
      'amap-tiles': {
        type: 'raster',
        tiles: [
          'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        attribution: '© 高德地图'
      }
    },
    layers: [
      {
        id: 'amap-layer',
        type: 'raster',
        source: 'amap-tiles',
        minzoom: 0,
        maxzoom: 18
      }
    ]
  },
  center: [108.94, 34.27],
  zoom: 11,
  minZoom: 8,
  maxZoom: 18
}

export function useMap() {
  const mapStore = useMapStore()

  function initMap(containerId: string, options?: Partial<MapOptions>): Map | null {
    const mapContainer = document.getElementById(containerId)
    if (!mapContainer) {
      console.error(`Map container with id "${containerId}" not found`)
      return null
    }

    if (isInitialized.value && mapInstance && !mapInstance._destroyed) {
      if (currentContainerId === containerId) {
        mapInstance.resize()
        return mapInstance
      } else {
        try {
          mapInstance.remove()
        } catch {
          // ignore
        }
        mapInstance = null
        isInitialized.value = false
      }
    }

    const mergedOptions: MapOptions = {
      ...DEFAULT_MAP_OPTIONS,
      container: mapContainer,
      ...options
    }

    try {
      mapInstance = new Map(mergedOptions) as MapWithDestroyed
      isInitialized.value = true
      currentContainerId = containerId
      mapStore.setMapInstance(mapInstance)

      mapInstance.on('load', () => {
        console.log('Map loaded successfully')
      })

      mapInstance.on('error', (error) => {
        console.error('Map error:', error)
      })

      return mapInstance
    } catch (error) {
      console.error('Failed to initialize map:', error)
      isInitialized.value = false
      return null
    }
  }

  function getMap(): Map | null {
    if (mapInstance && !mapInstance._destroyed) {
      return mapInstance
    }
    return null
  }

  function isMapValid(): boolean {
    return mapInstance !== null && !mapInstance._destroyed
  }

  function clearAllLayers(): void {
    if (!isMapValid()) return

    const layersToRemove = [
      mapStore.LAYER_IDS.trackLine,
      mapStore.LAYER_IDS.trackPoint,
      mapStore.LAYER_IDS.animationCar,
      mapStore.LAYER_IDS.selectionBox
    ]

    layersToRemove.forEach(layerId => {
      try {
        if (mapInstance?.getLayer(layerId)) {
          mapInstance.removeLayer(layerId)
        }
      } catch {
        // ignore
      }
    })

    const sourcesToRemove = [
      mapStore.DATA_SOURCE_IDS.trackLine,
      mapStore.DATA_SOURCE_IDS.trackPoint,
      mapStore.DATA_SOURCE_IDS.animationCar,
      mapStore.DATA_SOURCE_IDS.selectionBox
    ]

    sourcesToRemove.forEach(sourceId => {
      try {
        if (mapInstance?.getSource(sourceId)) {
          mapInstance.removeSource(sourceId)
        }
      } catch {
        // ignore
      }
    })
  }

  function addGeoJSONSource(
    sourceId: string,
    data: GeoJSON.GeoJSON
  ): GeoJSONSource | null {
    if (!isMapValid()) return null
    const map = mapInstance as Map

    try {
      const existingSource = map.getSource(sourceId)
      if (existingSource) {
        const layers = map.getStyle().layers || []
        layers.forEach(layer => {
          if ('source' in layer && layer.source === sourceId && map.getLayer(layer.id)) {
            map.removeLayer(layer.id)
          }
        })
        map.removeSource(sourceId)
      }
      map.addSource(sourceId, { type: 'geojson', data })
      return map.getSource(sourceId) as GeoJSONSource
    } catch {
      return null
    }
  }

  function removeSource(sourceId: string): void {
    if (!isMapValid()) return
    const map = mapInstance as Map
    try {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    } catch {
      // ignore
    }
  }

  function removeLayer(layerId: string): void {
    if (!isMapValid()) return
    const map = mapInstance as Map
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    } catch {
      // ignore
    }
  }

  function setMapContainer(containerId: string): boolean {
    const container = document.getElementById(containerId)
    if (!container || !mapInstance) return false

    try {
      mapInstance._container = container
      mapInstance.resize()
      return true
    } catch {
      return false
    }
  }

  function disableDragPan(): void {
    if (!isMapValid()) return
    const map = mapInstance as Map
    map.dragPan.disable()
  }

  function enableDragPan(): void {
    if (!isMapValid()) return
    const map = mapInstance as Map
    map.dragPan.enable()
  }

  function cleanup(): void {
    mapStore.clearPlaybackTimer()
    clearAllLayers()
    isInitialized.value = false
  }

  return {
    initMap,
    getMap,
    isMapValid,
    clearAllLayers,
    addGeoJSONSource,
    removeSource,
    removeLayer,
    setMapContainer,
    disableDragPan,
    enableDragPan,
    cleanup
  }
}
