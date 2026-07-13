# 西安市网约车轨迹多维可视化分析系统

基于 Vue3 + TypeScript + MapLibre GL JS 构建的纯前端轨迹可视化分析系统，支持车牌筛选、时间过滤、空间框选、轨迹抽稀和动画回放等功能。

## 📋 功能特性

### 核心功能
- **多维筛选**：支持车牌选择、时间范围过滤、空间矩形框选的联合筛选
- **轨迹可视化**：实时渲染车辆GPS轨迹点和轨迹线
- **轨迹抽稀**：基于 Douglas-Peucker 算法简化轨迹，优化渲染性能
- **动画回放**：沿轨迹播放车辆行驶动画，支持速度控制
- **空间框选**：在地图上拖拽矩形框，筛选范围内的轨迹点

### 技术特性
- **纯前端架构**：无需后端，Mock数据内置
- **坐标转换**：WGS84 ↔ GCJ02 坐标系转换，适配高德地图
- **地图单例**：Pinia + 模块变量管理 MapLibre 实例，避免内存泄漏
- **响应式布局**：适配不同屏幕尺寸

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5+ | 前端框架 |
| TypeScript | 5.7+ | 类型安全 |
| Vite | 5.4+ | 构建工具 |
| Pinia | 2.3+ | 状态管理 |
| Vue Router | 4.5+ | 路由管理（Hash模式） |
| MapLibre GL JS | 5.24+ | 地图渲染引擎 |
| Element Plus | 2.9+ | UI组件库 |

## 📁 项目结构

```
src/
├── components/          # 组件
│   └── MapControl.vue   # 地图容器组件
├── composables/         # 组合式函数
│   └── useMap.ts        # 地图实例管理
├── mock/                # Mock数据
│   └── trackData.ts     # 车辆轨迹数据（10辆车，345个GPS点）
├── router/              # 路由配置
│   └── index.ts         # 路由定义
├── store/               # Pinia状态管理
│   └── mapStore.ts      # 地图状态
├── utils/               # 工具函数
│   ├── coordTransform.ts # 坐标转换（WGS84/GCJ02）
│   └── trackSimplify.ts  # 轨迹抽稀算法
├── views/               # 页面视图
│   ├── Home.vue         # 首页
│   └── TrackAnalysis.vue # 轨迹分析页面
├── App.vue              # 根组件
├── main.ts              # 入口文件
└── style.css            # 全局样式
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录

### 预览构建结果

```bash
npm run preview
```

## 🌍 部署指南

### Vercel 部署

1. **创建 GitHub 仓库**并推送代码
2. **登录 Vercel** → 添加项目 → 选择 GitHub 仓库
3. **配置构建参数**（Vercel 会自动识别）：
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **部署完成**后获得访问域名

### 配置说明

- **路由模式**：使用 Hash 模式（`createWebHashHistory`），无需服务器 rewrites 配置
- **资源路径**：`base: './'` 相对路径，适配静态托管
- **地图瓦片**：使用高德在线瓦片（`https://webrd01-03.is.autonavi.com/`）

## 🎯 使用说明

### 基本操作流程

1. **选择车牌**：从下拉框选择车辆（支持"全部车辆"）
2. **执行筛选**：点击按钮渲染轨迹
3. **时间过滤**：设置开始/结束时间，缩小轨迹范围
4. **空间框选**：在地图上按住鼠标左键拖拽矩形框，再次点击"执行筛选"
5. **轨迹抽稀**：开启抽稀开关，调整阈值简化轨迹
6. **播放轨迹**：点击"播放轨迹"查看车辆行驶动画

### 数据说明

- 内置 **10 辆**网约车的轨迹数据
- 每辆车约 **30-40 个** GPS 采样点
- 轨迹范围覆盖**西安市**市区（经纬度：108.94, 34.27）
- 数据格式：WGS84 坐标系，包含经度、纬度、时间戳、速度

## 🔧 配置文件

### vite.config.ts

```typescript
export default defineConfig({
  base: './',           // 相对资源路径
  build: {
    outDir: 'dist',     // 输出目录
    assetsDir: 'assets' // 资源子目录
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

## 📝 坐标转换

系统内置 WGS84 与 GCJ02 坐标系转换：

```typescript
// WGS84 → GCJ02（轨迹数据转地图坐标）
wgs84ToGcj02(lng: number, lat: number)

// GCJ02 → WGS84（反向转换）
gcj02ToWgs84(lng: number, lat: number)
```

## 📊 轨迹抽稀算法

使用 Douglas-Peucker 算法简化轨迹：

- 默认阈值：`0.001`（约 100 米）
- 阈值越大，保留的点越少
- 阈值越小，轨迹越精确

## 🐛 常见问题

### 地图不显示
- 检查网络连接，确认可访问高德地图 API
- 确认 `useMap.ts` 中地图样式配置正确

### 刷新页面 404
- 使用 Hash 路由模式，刷新不会 404
- 确保 `vue-router` 使用 `createWebHashHistory()`

### 轨迹点全部消失
- 检查坐标系转换是否正确
- 确认筛选条件没有过于严格

### 动画不播放
- 确保轨迹点数 ≥ 2
- 检查 `simplifiedCoords` 是否为空
