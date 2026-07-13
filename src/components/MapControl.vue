<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { NavigationControl, FullscreenControl } from 'maplibre-gl'
import { useMap } from '@/composables/useMap'

const props = defineProps<{
  containerId: string
  center?: [number, number]
  zoom?: number
}>()

const emit = defineEmits<{
  (e: 'mapReady'): void
}>()

const mapContainerRef = ref<HTMLElement | null>(null)
const { initMap, getMap, isMapValid, clearAllLayers } = useMap()

onMounted(() => {
  nextTick(() => {
    if (!mapContainerRef.value) return

    const options = {
      center: props.center || [108.94, 34.27],
      zoom: props.zoom || 11
    }

    const map = initMap(props.containerId, options)
    if (map) {
      map.addControl(new NavigationControl(), 'top-right')
      map.addControl(new FullscreenControl(), 'top-right')
      emit('mapReady')
    }
  })
})

onUnmounted(() => {
  clearAllLayers()
})

watch(
  () => props.center,
  (newCenter) => {
    if (newCenter && isMapValid()) {
      const map = getMap()
      map?.setCenter(newCenter)
    }
  }
)

watch(
  () => props.zoom,
  (newZoom) => {
    if (newZoom !== undefined && isMapValid()) {
      const map = getMap()
      map?.setZoom(newZoom)
    }
  }
)

defineExpose({
  getMap,
  isMapValid,
  clearAllLayers
})
</script>

<template>
  <div
    :id="containerId"
    ref="mapContainerRef"
    class="map-container"
  ></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
