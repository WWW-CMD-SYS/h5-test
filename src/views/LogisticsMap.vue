<template>
  <div class="logistics-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-title">物流地图</div>
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="startPlayback" :disabled="isPlaying">
          <span class="btn-icon">▶</span> 轨迹回放
        </button>
        <button class="btn" @click="pausePlayback" :disabled="!isPlaying">
          <span class="btn-icon">⏸</span> 暂停
        </button>
        <button class="btn" @click="resetPlayback">
          <span class="btn-icon">↺</span> 重置
        </button>
        <button class="btn" @click="fitBounds">
          <span class="btn-icon">⊞</span> 适合视野
        </button>
      </div>
    </div>

    <div class="map-wrapper">
      <!-- 地图容器，ref 交由高德 SDK 接管 -->
      <div ref="mapContainer" class="map-container"></div>

      <!-- 右侧信息面板（可折叠） -->
      <div class="info-panel" :class="{ collapsed: panelCollapsed }">
        <div class="panel-toggle" @click="panelCollapsed = !panelCollapsed">
          {{ panelCollapsed ? '◀' : '▶' }}
        </div>
        <div class="panel-content" v-show="!panelCollapsed">
          <h3>物流节点</h3>

          <!-- 路线统计概览 -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-value">{{ positions.length }}</span>
              <span class="stat-label">节点总数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ routeDistance }}km</span>
              <span class="stat-label">规划里程</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ completedPercent }}%</span>
              <span class="stat-label">完成进度</span>
            </div>
          </div>

          <!-- 节点列表，点击可聚焦地图到该节点 -->
          <div class="node-list">
            <div
                v-for="(pos, idx) in positions"
                :key="idx"
                class="node-item"
                :class="{ active: currentIndex === idx, visited: playbackVisited.has(idx) }"
                @click="focusNode(idx)"
            >
              <div class="node-dot" :class="pos.type">
                <span v-if="pos.type === 'warehouse'">仓</span>
                <span v-else-if="pos.type === 'checkpoint'">中</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="node-info">
                <div class="node-name">{{ pos.title }}</div>
                <div class="node-addr">{{ pos.address || '' }}</div>
              </div>
              <div class="node-status" :class="pos.status">
                {{ statusText(pos.status) }}
              </div>
            </div>
          </div>

          <!-- 图例说明 -->
          <div class="legend">
            <h4>图例</h4>
            <div class="legend-item">
              <span class="legend-dot warehouse-dot"></span> 仓库
            </div>
            <div class="legend-item">
              <span class="legend-dot checkpoint-dot"></span> 中转站
            </div>
            <div class="legend-item">
              <span class="legend-line done-line"></span> 已完成路线
            </div>
            <div class="legend-item">
              <span class="legend-line planned-line"></span> 规划路线
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 地图加载遮罩 -->
    <div class="loading-overlay" v-if="loading">
      <div class="loading-spinner"></div>
      <p>地图加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

// ─────────────────────────────────────────────
// 响应式状态
// ─────────────────────────────────────────────

const mapContainer  = ref(null)   // 地图挂载的 DOM 元素
const loading       = ref(true)   // 初始化加载状态
const panelCollapsed = ref(false) // 右侧面板折叠状态
const isPlaying     = ref(false)  // 轨迹回放是否进行中
const completedPercent = ref(0)   // 回放/路线完成进度（0~100）
const currentIndex  = ref(-1)     // 当前回放到的节点索引（-1 表示未开始）

// ─────────────────────────────────────────────
// 实时追踪配置
// 数据流：小程序 wx.getLocation(gcj02) → POST /api/location
//         → 中转服务（腾讯云）→ GET /api/location → 高德地图渲染
// ─────────────────────────────────────────────

const realtimeServer   = ref('http://wxjsun.com:3001') // 坐标中转服务地址（域名指向腾讯云服务器）
const realtimeDeviceId = ref('truck-001')                  // 设备 ID，对应小程序上报的 deviceId
let   realtimeTimer    = null                              // 轮询定时器句柄

// ─────────────────────────────────────────────
// 物流节点数据
//
// 支持两种外部传入方式（详见 parseRouteQuery）：
//   1. ?data=JSON   — 完整 positions 数组
//   2. ?points=lng,lat;lng,lat;...  — 仅坐标，自动补全类型/状态
//
// 节点字段说明：
//   type:   warehouse（仓库）| checkpoint（中转站）| delivery（配送点）
//   status: done（已到达）| active（进行中）| pending（待到达）
// ─────────────────────────────────────────────

const positions = ref([
  {
    lng: 116.506191,
    lat: 39.784916,
    title: '北京大兴仓库',
    address: '大兴区亦庄经济开发区',
    type: 'warehouse',
    status: 'done'
  },
])

// 车辆当前位置（实时轮询更新，null 表示无有效坐标，不渲染车辆标记）
const vehiclePos = ref(null)

// ─────────────────────────────────────────────
// 高德地图对象（非响应式，直接持有引用）
// ─────────────────────────────────────────────

let AMap             = null  // 高德 JS API 命名空间
let map              = null  // 地图实例
let markers          = []    // 节点 Marker 列表
let polylines        = []    // 路线折线列表
let vehicleMarker    = null  // 车辆 Marker（唯一）
let vehicleInfoWindow = null // 信息弹窗（复用同一实例，打开新窗前先关旧窗）
let playbackTimer    = null  // 轨迹回放的步进定时器

// 回放过程中已访问的节点索引集合（用于侧边栏节点变灰）
const playbackVisited = ref(new Set())

// ─────────────────────────────────────────────
// 计算属性
// ─────────────────────────────────────────────

/** 按 Haversine 公式累加所有相邻节点间距离，单位 km，结果取整 */
const routeDistance = computed(() => {
  if (positions.value.length < 2) return 0
  let dist = 0
  for (let i = 1; i < positions.value.length; i++) {
    const p1 = positions.value[i - 1]
    const p2 = positions.value[i]
    dist += haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng)
  }
  return Math.round(dist)
})

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

/** 将节点状态值转换为中文显示文本 */
function statusText(status) {
  const MAP = { done: '已完成', active: '进行中', pending: '待处理' }
  return MAP[status] || '未知'
}

/**
 * Haversine 大圆距离公式
 * @param {number} lat1/lon1 - 起点纬经度（十进制度）
 * @param {number} lat2/lon2 - 终点纬经度（十进制度）
 * @returns {number} 距离，单位 km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────
// 生命周期
// ─────────────────────────────────────────────

onMounted(async () => {
  try {
    parseRouteQuery()  // 优先从 URL query 覆盖默认节点数据

    AMap = await AMapLoader.load({
      key: '4a010dae89d18d6f94920fa8705bd913', // ⚠️ 替换为你的高德地图 Key
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.MoveAnimation', 'AMap.ControlBar']
    })

    // 初始化高德地图实例。
    map = new AMap.Map(mapContainer.value, {
      rotateEnable: true,   // 允许用户旋转地图
      pitchEnable: true,    // 允许用户倾斜视角（配合 3D 模式可看到建筑立体效果）
      zoom: 5,              // 初始缩放级别（1-20，值越大越精细；5 可覆盖省级范围）
      pitch: 50,            // 初始俯仰角 0-83°，50° 呈现明显的倾斜鸟瞰感
      rotation: -15,        // 初始旋转角，负值表示逆时针微转，增强立体透视
      viewMode: '3D',       // 3D 模式：建筑物有立体高度，标注以 billboard 方式始终面向镜头
      zooms: [2, 20],       // 限制缩放范围 [最小级别, 最大级别]，防止过度缩放到无效层级
      center: [116.397428, 39.90923]  // 初始中心点 [经度, 纬度]，默认定位到北京
    })

    map.addControl(new AMap.Scale())

    // 3D 视角控件 — 右上角（旋转/倾斜环）
    map.addControl(new AMap.ControlBar({
      position: { right: '10px', top: '10px' }
    }))

    // 工具条 — 右下角，避免与 ControlBar 重叠
    map.addControl(new AMap.ToolBar({
      position: { right: '40px', top: '110px' }
    }))

    renderMarkers()  // 渲染节点大头针
    renderRoute()    // 渲染已完成/规划路线折线

    setTimeout(fitBounds, 500) // 等地图瓦片加载稳定后再自适应视野

    startRealtimePolling() // 启动实时坐标轮询（每 3 秒）

    loading.value = false
  } catch (err) {
    console.error('地图初始化失败:', err)
    loading.value = false
  }
})

onBeforeUnmount(() => {
  // 组件卸载时清理所有异步资源，防止内存泄漏
  stopPlayback()
  stopRealtimePolling()
  if (map) {
    map.destroy()
    map = null
  }
})

// ─────────────────────────────────────────────
// URL Query 解析
// ─────────────────────────────────────────────

/**
 * 从 URL query 读取节点数据，支持两种格式：
 *   ?data=<URLEncoded JSON>        完整 positions 数组，字段与 positions ref 一致
 *   ?points=lng,lat;lng,lat;...    纯坐标串，自动将首节点设为 warehouse，末节点为 delivery
 * 若两个参数都存在，优先使用 data；均不存在则保留默认节点。
 */
function parseRouteQuery() {
  const params  = new URLSearchParams(window.location.search)
  const dataStr = params.get('data')

  if (dataStr) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dataStr))
      if (Array.isArray(parsed)) positions.value = parsed
    } catch {
      console.warn('[parseRouteQuery] data 参数解析失败，使用默认节点数据')
    }
    return
  }

  const pointsStr = params.get('points')
  if (pointsStr) {
    const segs = pointsStr.split(';').filter(Boolean)
    positions.value = segs.map((pt, idx) => {
      const [lng, lat] = pt.split(',').map(Number)
      const isFirst = idx === 0
      const isLast  = idx === segs.length - 1
      return {
        lng, lat,
        title:  `节点 ${idx + 1}`,
        type:   isFirst ? 'warehouse' : isLast ? 'delivery' : 'checkpoint',
        status: isFirst ? 'done' : 'pending'
      }
    })
  }
}

// ─────────────────────────────────────────────
// 地图渲染 — 节点标记
// ─────────────────────────────────────────────

/**
 * 清空并重新渲染所有节点 Marker。
 * 每个 Marker 点击后弹出信息窗口（showInfoWindow）。
 */
function renderMarkers() {
  clearMarkers()
  positions.value.forEach((pos, idx) => {
    const marker = new AMap.Marker({
      position: [pos.lng, pos.lat],
      content:  createMarkerContent(pos, idx),
      offset:   new AMap.Pixel(-18, -44),
      zIndex:   100 + idx
    })
    marker.on('click', () => showInfoWindow(pos, idx))
    markers.push(marker)
    map.add(marker)
  })
}

/** 移除所有节点 Marker */
function clearMarkers() {
  markers.forEach(m => m.setMap(null))
  markers = []
}

/**
 * 生成节点大头针的 HTML 内容字符串。
 * 针体颜色按 type 区分，针尖下方的状态小圆点颜色按 status 区分。
 */
function createMarkerContent(pos, idx) {
  const COLOR_MAP = {
    warehouse:  { fill: '#E74C3C', stroke: '#C0392B', label: '仓库' },
    checkpoint: { fill: '#3498DB', stroke: '#2471A3', label: '中转' },
    delivery:   { fill: '#27AE60', stroke: '#1E8449', label: '配送' },
    vehicle:    { fill: '#F39C12', stroke: '#D68910', label: '车辆' }
  }
  const c = COLOR_MAP[pos.type] || COLOR_MAP.checkpoint

  const STATUS_COLOR = { done: '#27AE60', active: '#F39C12', pending: '#95a5a6' }
  const statusColor  = STATUS_COLOR[pos.status] || '#95a5a6'

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <svg width="36" height="44" viewBox="0 0 36 44" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">
        <defs>
          <linearGradient id="pin-grad-${idx}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stop-color="${c.fill}"   stop-opacity="0.95"/>
            <stop offset="100%" stop-color="${c.stroke}" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <!-- 针体 -->
        <path d="M18 3C11.925 3 7 7.925 7 14c0 7.5 11 21 11 21s11-13.5 11-21c0-6.075-4.925-11-11-11z"
          fill="url(#pin-grad-${idx})" stroke="${c.stroke}" stroke-width="0.5"/>
        <!-- 内圈白底 -->
        <circle cx="18" cy="14" r="8" fill="#fff" opacity="0.95"/>
        <!-- 节点类型图标 -->
        ${getMarkerIcon(pos.type)}
        <!-- 底部状态点 -->
        <circle cx="18" cy="36" r="3" fill="${statusColor}" stroke="#fff" stroke-width="1.5"/>
      </svg>
      <!-- 类型 + 序号标签 -->
      <div style="
        margin-top:-4px;padding:2px 6px;border-radius:8px;
        background:${c.fill};color:#fff;font-size:10px;font-weight:600;
        line-height:1.2;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);
      ">${c.label}${idx + 1}</div>
    </div>
  `
}

/**
 * 返回节点大头针内圈的 SVG 图标路径（内嵌在 36×44 viewBox 中）。
 * warehouse：建筑轮廓；checkpoint：包裹+勾；delivery：旗帜；默认：圆点
 */
function getMarkerIcon(type) {
  const fill = '#333'
  switch (type) {
    case 'warehouse':
      return `<path d="M12 20v-3h4v3h3v-5l-1-7-1-1H13l-1 1-1 7v5h3zM16 9h2v2h-2V9z"
                fill="${fill}" transform="translate(2,0) scale(0.65)"/>`
    case 'checkpoint':
      return `<rect x="12" y="8" width="12" height="10" rx="1.5" fill="none"
                stroke="${fill}" stroke-width="1.8" transform="scale(0.8) translate(4,1)"/>
              <path d="M15 14l2 2 4-4" fill="none" stroke="${fill}" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" transform="scale(0.8) translate(2,0)"/>`
    case 'delivery':
      return `<path d="M10 20V6l8 4-8 4" fill="${fill}" transform="translate(3,2) scale(0.65)"/>
              <line x1="12" y1="20" x2="12" y2="22" stroke="${fill}" stroke-width="1.8" stroke-linecap="round"/>`
    default:
      return `<circle cx="18" cy="14" r="4" fill="${fill}" opacity="0.6"/>`
  }
}

// ─────────────────────────────────────────────
// 地图渲染 — 路线折线
// ─────────────────────────────────────────────

/**
 * 根据节点状态绘制路线：
 *   - 已完成段（实线绿色）：第 0 个节点 → 当前 active 节点
 *   - 规划段（虚线灰色）：active 节点 → 终点
 * 同时更新 completedPercent。
 */
function renderRoute() {
  clearPolylines()
  if (positions.value.length < 2) return

  const coords    = positions.value.map(p => [p.lng, p.lat])
  const activeIdx = positions.value.findIndex(p => p.status === 'active')
  // 若无 active 节点，认为全段已完成
  const doneEnd   = activeIdx >= 0 ? activeIdx + 1 : coords.length

  if (doneEnd > 1) {
    const doneLine = new AMap.Polyline({
      path:         coords.slice(0, doneEnd),
      strokeColor:  '#27ae60',
      strokeWeight: 4,
      strokeOpacity: 0.8,
      lineJoin:     'round',
      isOutline:    true,
      outlineColor: '#1e8449'
    })
    polylines.push(doneLine)
    map.add(doneLine)
  }

  if (doneEnd < coords.length) {
    const plannedLine = new AMap.Polyline({
      path:           coords.slice(doneEnd - 1),
      strokeColor:    '#95a5a6',
      strokeWeight:   4,
      strokeOpacity:  0.5,
      lineJoin:       'round',
      strokeStyle:    'dashed',
      strokeDasharray: [10, 6],
      isOutline:      true,
      outlineColor:   '#7f8c8d'
    })
    polylines.push(plannedLine)
    map.add(plannedLine)
  }

  completedPercent.value = Math.round((doneEnd - 1) / (coords.length - 1) * 100)
}

/** 移除所有路线折线 */
function clearPolylines() {
  polylines.forEach(p => p.setMap(null))
  polylines = []
}

// ─────────────────────────────────────────────
// 地图渲染 — 车辆标记
// ─────────────────────────────────────────────

/**
 * 打开车辆信息弹窗（关闭当前已打开的弹窗后再新建）。
 * @param {number} lng/lat - 弹窗定位坐标
 * @param {object} info    - { speed } 显示在弹窗中的运行信息
 */
function openVehicleInfoWindow(lng, lat, { speed }) {
  if (vehicleInfoWindow) vehicleInfoWindow.setMap(null)
  const content = `
    <div style="padding:8px 12px;min-width:160px;">
      <strong>实时追踪车辆</strong><br/>
      <span style="color:#666;">设备：${realtimeDeviceId.value}</span><br/>
      <span style="color:#f39c12;">当前时速：${speed ?? '--'}km/h</span><br/>
    </div>
  `
  vehicleInfoWindow = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -45) })
  vehicleInfoWindow.open(map, [lng, lat])
}

// ─────────────────────────────────────────────
// 信息弹窗 — 节点
// ─────────────────────────────────────────────

/**
 * 点击节点 Marker 时弹出节点详情窗口。
 * 显示节点名称、状态徽章、地址、坐标、在路线中的位置序号。
 */
function showInfoWindow(pos, idx) {
  if (vehicleInfoWindow) vehicleInfoWindow.setMap(null)

  const total    = positions.value.length
  const progress = idx === 0 ? '出发' : idx === total - 1 ? '终点' : `第 ${idx} 站 / 共 ${total - 1} 站`

  const BADGE = {
    done:    '<span style="background:#27ae60;color:white;padding:2px 8px;border-radius:10px;font-size:12px;">✓ 已到达</span>',
    active:  '<span style="background:#f39c12;color:white;padding:2px 8px;border-radius:10px;font-size:12px;">● 进行中</span>',
    pending: '<span style="background:#95a5a6;color:white;padding:2px 8px;border-radius:10px;font-size:12px;">○ 待到达</span>'
  }

  const content = `
    <div style="padding:10px 14px;min-width:200px;font-size:13px;">
      <strong style="font-size:15px;">${pos.title}</strong>&nbsp;${BADGE[pos.status] || ''}
      <div style="color:#888;margin-top:4px;">${pos.address || ''}</div>
      <div style="color:#666;margin-top:4px;">坐标：${pos.lng.toFixed(6)}, ${pos.lat.toFixed(6)}</div>
      <div style="color:#3498db;margin-top:4px;">${progress}</div>
    </div>
  `
  vehicleInfoWindow = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -45) })
  vehicleInfoWindow.open(map, [pos.lng, pos.lat])
}

// ─────────────────────────────────────────────
// 轨迹回放
// ─────────────────────────────────────────────

/**
 * 开始轨迹回放。
 * 从当前 active 节点的前一站出发，每 1.8 秒驱动车辆 Marker 移动一个节点，
 * 直到到达终点后自动停止。
 * 前提：positions >= 2 个节点，且 vehicleMarker 已存在。
 */
function startPlayback() {
  if (isPlaying.value || positions.value.length < 2 || !vehicleMarker) return
  isPlaying.value       = true
  playbackVisited.value = new Set()

  const activeIdx = positions.value.findIndex(p => p.status === 'active')
  let step = Math.max(0, activeIdx - 1)
  currentIndex.value = step

  function animate() {
    if (!isPlaying.value) return

    const next = positions.value[step + 1]
    if (!next) {
      // 已到达终点
      isPlaying.value = false
      playbackVisited.value.add(step)
      currentIndex.value = step
      return
    }

    playbackVisited.value.add(step)
    currentIndex.value = step

    vehicleMarker.moveTo([next.lng, next.lat], {
      duration:     1500,
      autoRotation: true,
      delay:        0
    })

    completedPercent.value = Math.round(step / (positions.value.length - 1) * 100)
    step++
    playbackTimer = setTimeout(animate, 1800)
  }

  animate()
}

/**
 * 暂停轨迹回放（保留当前步进位置，可通过 startPlayback 重新开始）。
 * 注意：暂停后 startPlayback 会从头重置，如需断点续播需另行实现。
 */
function pausePlayback() {
  isPlaying.value = false
  clearTimeout(playbackTimer)
  playbackTimer = null
}

/**
 * 内部停止回放（仅清除定时器和状态，不重置视觉位置）。
 * 供 resetPlayback 和 onBeforeUnmount 调用。
 */
function stopPlayback() {
  isPlaying.value = false
  clearTimeout(playbackTimer)
  playbackTimer = null
}

/**
 * 重置轨迹回放：停止动画，清除访问记录，将车辆标记归位到实时坐标位置，
 * 并重新渲染路线折线和进度。
 */
function resetPlayback() {
  stopPlayback()
  playbackVisited.value = new Set()
  currentIndex.value    = -1

  if (vehicleMarker && vehiclePos.value) {
    vehicleMarker.setPosition([vehiclePos.value.lng, vehiclePos.value.lat])
  }

  renderRoute()
}

// ─────────────────────────────────────────────
// 视野控制
// ─────────────────────────────────────────────

/**
 * 自适应视野：将地图缩放/平移到恰好包含所有节点的范围，四周留 60px 边距。
 * 节点少于 2 个时不执行（单点无需适配）。
 */
function fitBounds() {
  if (!map || positions.value.length < 2) return
  const lngs   = positions.value.map(p => p.lng)
  const lats   = positions.value.map(p => p.lat)
  map.setBounds(
      new AMap.Bounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
      ),
      false,
      [60, 60, 60, 60]
  )
  // setBounds 会重置 pitch/rotation，需要恢复 3D 视角
  map.setPitch(50)
  map.setRotation(-15)
}

/**
 * 聚焦到指定节点：将地图中心移动到该节点坐标，并放大到 zoom=15。
 * 由侧边栏节点列表点击触发。
 */
function focusNode(idx) {
  const pos = positions.value[idx]
  map.setZoomAndCenter(17, [pos.lng, pos.lat])
  // 保持 3D 倾斜视角，近距离查看建筑立体效果
  map.setPitch(60)
  map.setRotation(0)
}

// ─────────────────────────────────────────────
// 实时坐标轮询
// ─────────────────────────────────────────────

/** 移除车辆 Marker（无位置数据时调用） */
function removeVehicleMarker() {
  if (vehicleMarker) {
    vehicleMarker.setMap(null)
    vehicleMarker = null
  }
}

/**
 * 启动实时坐标轮询（间隔 3 秒）。
 * 成功收到坐标后调用 updateVehicleMarker 更新地图上的车辆位置；
 * 请求失败时静默忽略（避免服务未启动时刷屏报错）。
 */
function startRealtimePolling() {
  if (realtimeTimer) return

  function poll() {
    fetch(`${realtimeServer.value}/api/location?deviceId=${realtimeDeviceId.value}`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 0 && data.data) {
            const { lng, lat, speed, heading = 0 } = data.data
            vehiclePos.value = { lng, lat, heading }
            updateVehicleMarker({ lng, lat, speed, heading })
          } else {
            vehiclePos.value = null
            removeVehicleMarker()
          }
        })
        .catch(() => {
          vehiclePos.value = null
          removeVehicleMarker()
        })
        .finally(() => { realtimeTimer = setTimeout(poll, 3000) })
  }

  poll()
}

/** 停止实时坐标轮询，清除定时器 */
function stopRealtimePolling() {
  clearTimeout(realtimeTimer)
  realtimeTimer = null
}

/**
 * 更新或创建车辆 Marker。
 * 轮询有新位置数据时调用，无数据时外部调用 removeVehicleMarker 移除。
 * - 首次调用：创建 Marker，地图中心跟随。
 * - 后续调用：平滑移动 Marker（moveTo 动画 2 秒），更新图标内容；
 *   若车辆偏离当前地图中心超过 5km，则自动跟随平移。
 *
 * lng	经度（longitude）
 * lat	纬度（latitude）
 * heading	车头朝向角，0=正北，顺时针旋转
 * speed	当前时速（km/h），可为 null
 */
function updateVehicleMarker({ lng, lat, heading, speed }) {
  if (!map) return

  if (!vehicleMarker) {
    vehicleMarker = new AMap.Marker({
      position: [lng, lat],                         // 标注点坐标 [经度, 纬度]
      content:  buildVehicleContent(heading, speed),// 自定义 HTML 内容（车辆 SVG 图标 + 速度标签）
      offset:   new AMap.Pixel(-22, -112),          // 像素偏移，使图标底部尖端对准坐标点
      zIndex:   200                                 // 图层层级，越高越在上层（大于节点 marker 的 100+）
    })
    vehicleMarker.on('click', () => openVehicleInfoWindow(lng, lat, { speed, heading }))
    map.add(vehicleMarker)
    map.setCenter([lng, lat])
    return
  }

  vehicleMarker.moveTo([lng, lat], { duration: 2000, autoRotation: true })
  vehicleMarker.setContent(buildVehicleContent(heading, speed))

  // 超出中心 5km 时自动跟随
  const center   = map.getCenter()
  const distance = haversineDistance(center.lat, center.lng, lat, lng)
  if (distance > 5) {
    map.setCenter([lng, lat], false, { duration: 1000 })
  }
}

// ─────────────────────────────────────────────
// 车辆图标构建
// ─────────────────────────────────────────────

/**
 * 构建车辆 Marker 的 HTML 内容字符串 — 集装箱大货车（俯视，车头朝上/北）。
 *
 * 坐标系：heading=0 → 车头朝上（地图正北），顺时针旋转。
 * 整车 SVG 尺寸：viewBox 44×96
 *   车头区：y=3~22（高 19px），宽 22px，两侧各收窄 11px（形成 T 形肩膀）
 *   集装箱：y=22~88（高 66px），宽 34px
 *   地面阴影：y=88~96
 *
 * 集装箱细节：横向加强筋 ×4、纵向棱线、四角锁、红色尾灯、双开门缝
 *
 * @param {number} heading - 车头朝向角（0=北，90=东，180=南，270=西）
 * @param {number|null} speed - 当前时速（km/h），null 则显示"配送中"
 * @returns {string} 注入高德 Marker content 属性的 HTML 字符串
 */
function buildVehicleContent(heading, speed) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
      <!-- 速度标签（车辆上方） -->
      <div style="
        padding:2px 9px;border-radius:10px;
        background:linear-gradient(135deg,#FF7A00,#FF4500);
        color:#fff;font-size:10px;font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(255,90,0,0.55);
        letter-spacing:0.5px;
        margin-bottom:4px;
        border:1px solid rgba(255,255,255,0.22);
      ">${speed ? speed + 'km/h' : '配送中'}</div>

      <!-- 车辆 SVG（heading=0 车头朝上） -->
      <div style="
        transform:rotate(${heading}deg);
        transform-origin:center center;
        transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="44" height="96" viewBox="0 0 44 96"
             xmlns="http://www.w3.org/2000/svg"
             style="filter:drop-shadow(0 5px 12px rgba(180,60,0,0.42)) drop-shadow(0 1px 3px rgba(0,0,0,0.28));">
          <defs>
            <!-- 集装箱侧面：左亮→右暗，模拟左上方光源 -->
            <linearGradient id="vCargo" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#FF9030"/>
              <stop offset="40%"  stop-color="#FF6500"/>
              <stop offset="100%" stop-color="#D94C00"/>
            </linearGradient>
            <!-- 集装箱顶面（俯视可见区域） -->
            <linearGradient id="vCargoTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#FFD080"/>
              <stop offset="100%" stop-color="#FFB050"/>
            </linearGradient>
            <!-- 车头侧面 -->
            <linearGradient id="vCab" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#BF4200"/>
              <stop offset="50%"  stop-color="#D85500"/>
              <stop offset="100%" stop-color="#AF3500"/>
            </linearGradient>
            <!-- 车头顶面 -->
            <linearGradient id="vCabTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#FF8020"/>
              <stop offset="100%" stop-color="#C84000"/>
            </linearGradient>
            <!-- 挡风玻璃（蓝色系） -->
            <linearGradient id="vGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#C4ECFF"/>
              <stop offset="100%" stop-color="#52B0DC"/>
            </linearGradient>
          </defs>

          <!-- 地面阴影 -->
          <ellipse cx="22" cy="91" rx="18" ry="4.5" fill="#000" opacity="0.13"/>

          <!-- 车轮：3轴6轮（先绘制，让车身压住轮缘边缘） -->
          <!-- 前轴（与车头对齐） -->
          <rect x="4.5"  y="8"  width="5"   height="9"  rx="2.5" fill="#181818"/>
          <rect x="5.5"  y="9"  width="3"   height="7"  rx="1.5" fill="#3A3A3A"/>
          <rect x="34.5" y="8"  width="5"   height="9"  rx="2.5" fill="#181818"/>
          <rect x="35.5" y="9"  width="3"   height="7"  rx="1.5" fill="#3A3A3A"/>
          <!-- 中轴（集装箱前 1/3 处） -->
          <rect x="2"    y="40" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="3"    y="41" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <rect x="36"   y="40" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="37"   y="41" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <!-- 后轴（集装箱后 1/3 处） -->
          <rect x="2"    y="60" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="3"    y="61" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <rect x="36"   y="60" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="37"   y="61" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>

          <!-- 集装箱主体 -->
          <rect x="5" y="22" width="34" height="66" rx="3" fill="url(#vCargo)"/>
          <!-- 顶面高光区 -->
          <rect x="6.5" y="23" width="31" height="14" rx="2" fill="url(#vCargoTop)" opacity="0.9"/>
          <!-- 纵向棱线（左亮右暗增强立体感） -->
          <line x1="6"  y1="24" x2="6"  y2="85" stroke="#FFB040" stroke-width="0.7" opacity="0.45"/>
          <line x1="38" y1="24" x2="38" y2="85" stroke="#9A3400" stroke-width="0.7" opacity="0.45"/>
          <!-- 横向加强筋 ×4（集装箱结构特征） -->
          <rect x="5.5" y="33.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="33"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="47.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="47"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="61.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="61"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="73.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="73"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <!-- 双开门中缝 -->
          <line x1="22" y1="24" x2="22" y2="84" stroke="#8C3000" stroke-width="0.9" opacity="0.38"/>
          <!-- 四角锁（集装箱标志性角件） -->
          <rect x="5.5"  y="23"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="6.2"  y="23.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="34"   y="23"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="34.7" y="23.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="5.5"  y="80"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="6.2"  y="80.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="34"   y="80"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="34.7" y="80.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <!-- 尾部封板 + 红色尾灯 -->
          <rect x="5.5"  y="84.5" width="33"  height="3"   rx="1.5" fill="#7A2800"  opacity="0.62"/>
          <rect x="6"    y="83"   width="4"    height="2.5" rx="1"   fill="#FF3300"  opacity="0.85"/>
          <rect x="6.4"  y="83.3" width="3.2"  height="1.5" rx="0.5" fill="#FF8888"  opacity="0.55"/>
          <rect x="34"   y="83"   width="4"    height="2.5" rx="1"   fill="#FF3300"  opacity="0.85"/>
          <rect x="34.4" y="83.3" width="3.2"  height="1.5" rx="0.5" fill="#FF8888"  opacity="0.55"/>

          <!-- 集装箱与车头连接板（肩膀收窄过渡） -->
          <rect x="5"  y="20" width="4" height="2.5" rx="0.8" fill="#6A2200" opacity="0.42"/>
          <rect x="35" y="20" width="4" height="2.5" rx="0.8" fill="#6A2200" opacity="0.42"/>

          <!-- 车头主体（T 形上窄部分） -->
          <path d="M 11 22 L 11 13 Q 11 5 17 3 L 27 3 Q 33 5 33 13 L 33 22 Z"
                fill="url(#vCab)"/>
          <!-- 车头顶面亮色层 -->
          <path d="M 12 21 L 12 13.5 Q 12.5 6.5 17.5 4.5 L 26.5 4.5 Q 31.5 6.5 32 13.5 L 32 21 Z"
                fill="url(#vCabTop)" opacity="0.78"/>
          <!-- 挡风玻璃（弧形，正面居中） -->
          <path d="M 15 13 Q 15 7.5 22 6.5 Q 29 7.5 29 13 L 29 17.5 Q 29 20 22 20.5 Q 15 20 15 17.5 Z"
                fill="url(#vGlass)" opacity="0.93"/>
          <!-- 挡风玻璃中缝 -->
          <line x1="22" y1="7"  x2="22" y2="20" stroke="#3A88B0" stroke-width="0.7" opacity="0.48"/>
          <!-- 玻璃高光 -->
          <path d="M 16.5 10 Q 22 8 27.5 10 L 27 12 Q 22 10 16.8 12 Z" fill="#fff" opacity="0.28"/>
          <!-- 前大灯（左右各一） -->
          <rect x="12"   y="3.5" width="4.5" height="2.5" rx="1.2" fill="#FFFACC" stroke="#D8A800" stroke-width="0.4"/>
          <rect x="12.5" y="3.8" width="3.5" height="1.5" rx="0.5" fill="#fff"    opacity="0.65"/>
          <rect x="27.5" y="3.5" width="4.5" height="2.5" rx="1.2" fill="#FFFACC" stroke="#D8A800" stroke-width="0.4"/>
          <rect x="28"   y="3.8" width="3.5" height="1.5" rx="0.5" fill="#fff"    opacity="0.65"/>
          <!-- 前保险杠 -->
          <rect x="11.5" y="2"   width="21"  height="2"   rx="1"   fill="#7A2200" opacity="0.78"/>
          <rect x="12"   y="2.2" width="20"  height="0.7" rx="0.3" fill="#FF7733" opacity="0.45"/>
          <!-- 后视镜（车头两侧突起） -->
          <rect x="7.5" y="11" width="3.5" height="4.5" rx="1.5" fill="#B03800" opacity="0.85"/>
          <rect x="33"  y="11" width="3.5" height="4.5" rx="1.5" fill="#B03800" opacity="0.85"/>
          <!-- 车头侧窗 -->
          <rect x="11"   y="13" width="2.5" height="6" rx="1.2" fill="url(#vGlass)" opacity="0.80"/>
          <rect x="30.5" y="13" width="2.5" height="6" rx="1.2" fill="url(#vGlass)" opacity="0.80"/>
          <!-- 车头底部品牌横梁 -->
          <rect x="17" y="21" width="10" height="1.5" rx="0.7" fill="#FF9022" opacity="0.52"/>
        </svg>
      </div>
    </div>
  `
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.logistics-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

/* ── 顶部工具栏 ── */
.toolbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #1a1a2e;
  color: white;
  z-index: 100;
  flex-shrink: 0;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 14px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 6px;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.5);
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-icon { font-size: 12px; }

.btn-primary { background: #3498db; border-color: #3498db; }
.btn-primary:hover:not(:disabled) { background: #2980b9; border-color: #2980b9; }

/* ── 地图区域 ── */
.map-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.map-container {
  flex: 1;
  min-height: 0;
}

/* ── 右侧信息面板 ── */
.info-panel {
  width: 320px;
  background: white;
  box-shadow: -2px 0 12px rgba(0,0,0,0.1);
  z-index: 50;
  display: flex;
  flex-shrink: 0;
  transition: width 0.3s ease;
  position: relative;
}
.info-panel.collapsed { width: 32px; }

.panel-toggle {
  width: 32px;
  background: #ecf0f1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  transition: background 0.2s;
}
.panel-toggle:hover { background: #d5dbdb; }

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.panel-content h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

/* ── 统计概览卡片 ── */
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.stat-item {
  flex: 1;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 6px;
}
.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}
.stat-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

/* ── 节点列表 ── */
.node-list { margin-bottom: 16px; }

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid transparent;
}
.node-item:hover  { background: #f0f4f8; }
.node-item.active { background: #e8f6ff; border-color: #3498db; }
.node-item.visited { opacity: 0.5; }

.node-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}
.node-dot.warehouse  { background: #e74c3c; }
.node-dot.checkpoint { background: #3498db; }
.node-dot.delivery   { background: #27ae60; }

.node-info { flex: 1; min-width: 0; }
.node-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-addr {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  font-weight: 500;
}
.node-status.done    { background: #e8f8f0; color: #27ae60; }
.node-status.active  { background: #fef9e7; color: #f39c12; }
.node-status.pending { background: #f0f0f0; color: #999; }

/* ── 图例 ── */
.legend {
  border-top: 1px solid #ecf0f1;
  padding-top: 12px;
}
.legend h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #7f8c8d;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.warehouse-dot  { background: #e74c3c; }
.checkpoint-dot { background: #3498db; }

.legend-line {
  width: 24px;
  height: 3px;
  display: inline-block;
  border-radius: 2px;
}
.done-line    { background: #27ae60; }
.planned-line { background: transparent; border-top: 2px dashed #95a5a6; }

/* ── 加载遮罩 ── */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-overlay p {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>