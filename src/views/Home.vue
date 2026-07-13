<script setup lang="ts">
import { useRouter } from 'vue-router'
import MapControl from '@/components/MapControl.vue'

const router = useRouter()

function navigateToTrackAnalysis() {
  router.push('/track-analysis')
}
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="header-left">
        <h1 class="title">西安市网约车轨迹多维可视化分析系统</h1>
      </div>
      <nav class="nav">
        <el-button
          type="primary"
          size="large"
          @click="navigateToTrackAnalysis"
        >
          轨迹分析
        </el-button>
      </nav>
    </header>
    <main class="main-content">
      <div class="info-panel">
        <h2>系统简介</h2>
        <p>本系统基于Vue3 + MapLibre GL JS构建，提供西安市网约车轨迹的多维可视化分析功能。</p>
        <ul>
          <li>多条件联合筛选（车牌、时间、空间）</li>
          <li>轨迹抽稀优化显示</li>
          <li>动态动画轨迹回放</li>
          <li>坐标纠偏（WGS84 -> GCJ02）</li>
        </ul>
        <el-button
          type="success"
          size="large"
          @click="navigateToTrackAnalysis"
        >
          进入轨迹分析
        </el-button>
      </div>
      <div class="map-wrapper">
        <MapControl container-id="home-map" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
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
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-left {
  flex: 1;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.nav {
  display: flex;
  gap: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.info-panel {
  width: 320px;
  background: #fff;
  padding: 24px;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.info-panel h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f1f1f;
}

.info-panel p {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 16px;
}

.info-panel ul {
  list-style: none;
  padding: 0;
  margin-bottom: 24px;
}

.info-panel li {
  font-size: 14px;
  color: #444;
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}

.info-panel li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #52c41a;
  font-weight: bold;
}

.map-wrapper {
  flex: 1;
  height: 100%;
}
</style>
