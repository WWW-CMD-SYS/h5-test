<template>
  <div class="logistics-page">
    <div class="map-wrapper">
      <!-- 地图容器 -->
      <div id="container"></div>

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
                @click="handleFocusNode(idx)"
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

    <!-- 测距工具按钮 -->
    <button class="ranging-btn" :class="{ active: rangingActive }" @click="toggleRanging">
      <span class="ranging-icon">📏</span>
      {{ rangingActive ? '测距中...' : '测距' }}
    </button>

    <!-- 地图加载遮罩 -->
    <div class="loading-overlay" v-if="loading">
      <div class="loading-spinner"></div>
      <p>地图加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

let AMap = null
let map   = null
let rangingTool = null
/** 节点状态文案。 */
function statusText(status) {
  const MAP = { done: '已完成', active: '进行中', pending: '待处理' }
  return MAP[status] || '未知'
}

/** 计算两点直线距离，单位：公里。 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R    = 6371 // 地球平均半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 经纬度是否合法。 */
function isValidCoordinate(lng, lat) {
  return Number.isFinite(lng) && Number.isFinite(lat) &&
      lng >= -180 && lng <= 180 &&
      lat >= -90 && lat <= 90
}

/** 补齐并规范化节点坐标。 */
function normalizePosition(pos, idx = 0) {
  return {
    ...pos,
    lng: Number(pos.lng),
    lat: Number(pos.lat),
    title: pos.title || `节点 ${idx + 1}`,
    type: pos.type || 'checkpoint',
    status: pos.status || 'pending'
  }
}

/** 从 URL 读取节点数据：优先 data，其次 points。 */
function parseRouteQuery(positionsRef) {
  const params  = new URLSearchParams(window.location.search)
  const dataStr = params.get('data')

  if (dataStr) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dataStr))
      const validPositions = Array.isArray(parsed)
          ? parsed
              .map(normalizePosition)
              .filter(pos => isValidCoordinate(pos.lng, pos.lat))
          : []
      if (validPositions.length) positionsRef.value = validPositions
    } catch {
      console.warn('[parseRouteQuery] data 参数解析失败，使用默认节点数据')
    }
    return
  }

  const pointsStr = params.get('points')
  if (pointsStr) {
    const segs = pointsStr
        .split(';')
        .map(pt => pt.split(',').map(Number))
        .filter(([lng, lat]) => isValidCoordinate(lng, lat))
    if (!segs.length) return

    positionsRef.value = segs.map((pt, idx) => {
      const [lng, lat] = pt
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

/** 生成节点图钉里的小图标。 */
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

/** 生成地图节点标记内容。 */
function createMarkerContent(pos, idx) {
  const COLOR_MAP = {
    warehouse:  { fill: '#E74C3C', stroke: '#C0392B', label: '仓库' },
    checkpoint: { fill: '#3498DB', stroke: '#2471A3', label: '中转' },
    delivery:   { fill: '#27AE60', stroke: '#1E8449', label: '配送' }
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
        <path d="M18 3C11.925 3 7 7.925 7 14c0 7.5 11 21 11 21s11-13.5 11-21c0-6.075-4.925-11-11-11z"
          fill="url(#pin-grad-${idx})" stroke="${c.stroke}" stroke-width="0.5"/>
        <circle cx="18" cy="14" r="8" fill="#fff" opacity="0.95"/>
        ${getMarkerIcon(pos.type)}
        <circle cx="18" cy="36" r="3" fill="${statusColor}" stroke="#fff" stroke-width="1.5"/>
      </svg>
      <div style="
        margin-top:-4px;padding:2px 6px;border-radius:8px;
        background:${c.fill};color:#fff;font-size:10px;font-weight:600;
        line-height:1.2;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);
      ">${c.label}${idx + 1}</div>
    </div>
  `
}

/** 生成实时车辆标记内容。 */
function buildVehicleContent(heading, speed) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
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
            <linearGradient id="vCargo" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#FF9030"/>
              <stop offset="40%"  stop-color="#FF6500"/>
              <stop offset="100%" stop-color="#D94C00"/>
            </linearGradient>
            <linearGradient id="vCargoTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#FFD080"/>
              <stop offset="100%" stop-color="#FFB050"/>
            </linearGradient>
            <linearGradient id="vCab" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#BF4200"/>
              <stop offset="50%"  stop-color="#D85500"/>
              <stop offset="100%" stop-color="#AF3500"/>
            </linearGradient>
            <linearGradient id="vCabTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#FF8020"/>
              <stop offset="100%" stop-color="#C84000"/>
            </linearGradient>
            <linearGradient id="vGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#C4ECFF"/>
              <stop offset="100%" stop-color="#52B0DC"/>
            </linearGradient>
          </defs>

          <ellipse cx="22" cy="91" rx="18" ry="4.5" fill="#000" opacity="0.13"/>

          <rect x="4.5"  y="8"  width="5"   height="9"  rx="2.5" fill="#181818"/>
          <rect x="5.5"  y="9"  width="3"   height="7"  rx="1.5" fill="#3A3A3A"/>
          <rect x="34.5" y="8"  width="5"   height="9"  rx="2.5" fill="#181818"/>
          <rect x="35.5" y="9"  width="3"   height="7"  rx="1.5" fill="#3A3A3A"/>
          <rect x="2"    y="40" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="3"    y="41" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <rect x="36"   y="40" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="37"   y="41" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <rect x="2"    y="60" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="3"    y="61" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>
          <rect x="36"   y="60" width="6"   height="11" rx="2.8" fill="#181818"/>
          <rect x="37"   y="61" width="4"   height="9"  rx="1.8" fill="#3A3A3A"/>

          <rect x="5" y="22" width="34" height="66" rx="3" fill="url(#vCargo)"/>
          <rect x="6.5" y="23" width="31" height="14" rx="2" fill="url(#vCargoTop)" opacity="0.9"/>
          <line x1="6"  y1="24" x2="6"  y2="85" stroke="#FFB040" stroke-width="0.7" opacity="0.45"/>
          <line x1="38" y1="24" x2="38" y2="85" stroke="#9A3400" stroke-width="0.7" opacity="0.45"/>
          <rect x="5.5" y="33.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="33"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="47.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="47"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="61.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="61"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <rect x="5.5" y="73.5" width="33" height="2"   rx="1"   fill="#B84000" opacity="0.28"/>
          <rect x="5.5" y="73"   width="33" height="0.8" rx="0.4" fill="#FFD090" opacity="0.22"/>
          <line x1="22" y1="24" x2="22" y2="84" stroke="#8C3000" stroke-width="0.9" opacity="0.38"/>
          <rect x="5.5"  y="23"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="6.2"  y="23.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="34"   y="23"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="34.7" y="23.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="5.5"  y="80"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="6.2"  y="80.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="34"   y="80"   width="4.5" height="4.5" rx="1"   fill="#7A2800" opacity="0.58"/>
          <rect x="34.7" y="80.7" width="3"   height="3"   rx="0.5" fill="#FF8833" opacity="0.32"/>
          <rect x="5.5"  y="84.5" width="33"  height="3"   rx="1.5" fill="#7A2800"  opacity="0.62"/>
          <rect x="6"    y="83"   width="4"    height="2.5" rx="1"   fill="#FF3300"  opacity="0.85"/>
          <rect x="6.4"  y="83.3" width="3.2"  height="1.5" rx="0.5" fill="#FF8888"  opacity="0.55"/>
          <rect x="34"   y="83"   width="4"    height="2.5" rx="1"   fill="#FF3300"  opacity="0.85"/>
          <rect x="34.4" y="83.3" width="3.2"  height="1.5" rx="0.5" fill="#FF8888"  opacity="0.55"/>
          <rect x="5"  y="20" width="4" height="2.5" rx="0.8" fill="#6A2200" opacity="0.42"/>
          <rect x="35" y="20" width="4" height="2.5" rx="0.8" fill="#6A2200" opacity="0.42"/>
          <path d="M 11 22 L 11 13 Q 11 5 17 3 L 27 3 Q 33 5 33 13 L 33 22 Z" fill="url(#vCab)"/>
          <path d="M 12 21 L 12 13.5 Q 12.5 6.5 17.5 4.5 L 26.5 4.5 Q 31.5 6.5 32 13.5 L 32 21 Z" fill="url(#vCabTop)" opacity="0.78"/>
          <path d="M 15 13 Q 15 7.5 22 6.5 Q 29 7.5 29 13 L 29 17.5 Q 29 20 22 20.5 Q 15 20 15 17.5 Z" fill="url(#vGlass)" opacity="0.93"/>
          <line x1="22" y1="7"  x2="22" y2="20" stroke="#3A88B0" stroke-width="0.7" opacity="0.48"/>
          <path d="M 16.5 10 Q 22 8 27.5 10 L 27 12 Q 22 10 16.8 12 Z" fill="#fff" opacity="0.28"/>
          <rect x="12"   y="3.5" width="4.5" height="2.5" rx="1.2" fill="#FFFACC" stroke="#D8A800" stroke-width="0.4"/>
          <rect x="12.5" y="3.8" width="3.5" height="1.5" rx="0.5" fill="#fff"    opacity="0.65"/>
          <rect x="27.5" y="3.5" width="4.5" height="2.5" rx="1.2" fill="#FFFACC" stroke="#D8A800" stroke-width="0.4"/>
          <rect x="28"   y="3.8" width="3.5" height="1.5" rx="0.5" fill="#fff"    opacity="0.65"/>
          <rect x="11.5" y="2"   width="21"  height="2"   rx="1"   fill="#7A2200" opacity="0.78"/>
          <rect x="12"   y="2.2" width="20"  height="0.7" rx="0.3" fill="#FF7733" opacity="0.45"/>
          <rect x="7.5" y="11" width="3.5" height="4.5" rx="1.5" fill="#B03800" opacity="0.85"/>
          <rect x="33"  y="11" width="3.5" height="4.5" rx="1.5" fill="#B03800" opacity="0.85"/>
          <rect x="11"   y="13" width="2.5" height="6" rx="1.2" fill="url(#vGlass)" opacity="0.80"/>
          <rect x="30.5" y="13" width="2.5" height="6" rx="1.2" fill="url(#vGlass)" opacity="0.80"/>
          <rect x="17" y="21" width="10" height="1.5" rx="0.7" fill="#FF9022" opacity="0.52"/>
        </svg>
      </div>
    </div>
  `
}

const loading        = ref(true)
const panelCollapsed = ref(false)
const rangingActive   = ref(false)

const positions = ref([
  { lng: 116.506191, lat: 39.784916, title: '北京大兴仓库', address: '大兴区亦庄经济开发区', type: 'warehouse', status: 'done' }
])
parseRouteQuery(positions)

const completedPercent = ref(0)

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

// ── 实时追踪 ──
const realtimeServer   = ref('http://wxjsun.com:3001')
const realtimeDeviceId = ref('truck-001')

let markers          = []
let polylines        = []
let routeInfoWindow  = null

let eventSource      = null
let vehicleMarker    = null
let latestVehicleData = null
let realtimeInfoWindow = null


/**
 * 初始化高德地图。
 * 注意：key 与 securityJsCode 建议改为从环境变量或后端配置读取。
 */
function initMap() {
  window._AMapSecurityConfig = {
    securityJsCode: '「你申请的安全密钥」',
  }

  return AMapLoader.load({
    key: '4a010dae89d18d6f94920fa8705bd913',
    version: '2.0',
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.MoveAnimation', 'AMap.ControlBar', 'AMap.RangingTool']
  })
      .then((amap) => {
        AMap = amap
        map = new AMap.Map('container', {
          rotateEnable: true,
          pitchEnable: true,
          zoom: 5,
          pitch: 50,
          rotation: -15,
          viewMode: '3D',
          zooms: [2, 20],
          center: [116.397428, 39.90923]
        })

        map.addControl(new AMap.Scale())
        map.addControl(new AMap.ControlBar({ position: { right: '10px', top: '10px' } }))
        map.addControl(new AMap.ToolBar({ position: { right: '40px', top: '110px' } }))

        // 创建测距工具：支持在地图上点击绘制测距线段，实时显示两点间的实际距离
        loading.value = false
        return { map, AMap }
      })
      .catch((e) => {
        console.error('[Map] 初始化失败:', e)
        loading.value = false
        throw e
      })
}

/** 销毁地图实例。 */
function destroyMap() {
  if (map) {
    map.destroy()
    map = null
  }
}

/** 让所有节点进入可视区域。 */
function fitBounds() {
  if (!map || positions.value.length < 2) return
  const lngs = positions.value.map(p => p.lng)
  const lats = positions.value.map(p => p.lat)
  map.setBounds(
      new AMap.Bounds([Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]),
      false,
      [60, 60, 60, 60]
  )
  map.setPitch(50)
  map.setRotation(-15)
}

/** 聚焦到指定节点。 */
function focusNode(pos) {
  if (!map || !pos) return
  map.setZoomAndCenter(17, [pos.lng, pos.lat])
  map.setPitch(60)
  map.setRotation(0)
}

/** 清除节点标记。 */
function clearMarkers() {
  markers.forEach(m => m.setMap(null))
  markers = []
}

/** 渲染节点标记。 */
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

/** 清除路线折线。 */
function clearPolylines() {
  polylines.forEach(p => p.setMap(null))
  polylines = []
}

/** 按节点状态渲染完成路线和规划路线。 */
function renderRoute() {
  clearPolylines()
  if (positions.value.length < 2) return

  const coords    = positions.value.map(p => [p.lng, p.lat])
  const activeIdx = positions.value.findIndex(p => p.status === 'active')
  const doneEnd   = activeIdx >= 0 ? activeIdx + 1 : coords.length

  if (doneEnd > 1) {
    const doneLine = new AMap.Polyline({
      path: coords.slice(0, doneEnd), strokeColor: '#27ae60', strokeWeight: 4,
      strokeOpacity: 0.8, lineJoin: 'round', isOutline: true, outlineColor: '#1e8449'
    })
    polylines.push(doneLine)
    map.add(doneLine)
  }

  if (doneEnd < coords.length) {
    const plannedLine = new AMap.Polyline({
      path: coords.slice(doneEnd - 1), strokeColor: '#95a5a6', strokeWeight: 4,
      strokeOpacity: 0.5, lineJoin: 'round', strokeStyle: 'dashed',
      strokeDasharray: [10, 6], isOutline: true, outlineColor: '#7f8c8d'
    })
    polylines.push(plannedLine)
    map.add(plannedLine)
  }

  completedPercent.value = Math.round((doneEnd - 1) / (coords.length - 1) * 100)
}

/** 打开节点信息窗口。 */
function showInfoWindow(pos, idx) {
  if (routeInfoWindow) routeInfoWindow.setMap(null)

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
  routeInfoWindow = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -45) })
  routeInfoWindow.open(map, [pos.lng, pos.lat])
}

/** 关闭节点信息窗口。 */
function closeInfoWindow() {
  if (routeInfoWindow) {
    routeInfoWindow.setMap(null)
    routeInfoWindow = null
  }
}

/** 打开实时车辆信息窗口。 */
function openVehicleInfoWindow(lng, lat, { speed }) {
  if (realtimeInfoWindow) realtimeInfoWindow.setMap(null)
  const content = `
    <div style="padding:8px 12px;min-width:160px;">
      <strong>实时追踪车辆</strong><br/>
      <span style="color:#666;">设备：${realtimeDeviceId.value}</span><br/>
      <span style="color:#f39c12;">当前时速：${speed ?? '--'}km/h</span><br/>
    </div>
  `
  realtimeInfoWindow = new AMap.InfoWindow({ content, offset: new AMap.Pixel(0, -45) })
  realtimeInfoWindow.open(map, [lng, lat])
}

/** 关闭实时车辆信息窗口。 */
function closeVehicleInfoWindow() {
  if (realtimeInfoWindow) {
    realtimeInfoWindow.setMap(null)
    realtimeInfoWindow = null
  }
}

/** 更新实时车辆位置和朝向。 */
function updateVehicleMarker({ lng, lat, heading, speed }) {
  if (!map || !isValidCoordinate(lng, lat)) return
  latestVehicleData = { lng, lat, speed }

  if (!vehicleMarker) {
    vehicleMarker = new AMap.Marker({
      position: [lng, lat],
      content:  buildVehicleContent(heading, speed),
      offset:   new AMap.Pixel(-22, -112),
      zIndex:   200
    })
    vehicleMarker.on('click', () => {
      if (!latestVehicleData) return
      openVehicleInfoWindow(latestVehicleData.lng, latestVehicleData.lat, latestVehicleData)
    })
    map.add(vehicleMarker)
    map.setCenter([lng, lat])
    return
  }

  vehicleMarker.moveTo([lng, lat], { duration: 2000, autoRotation: true })
  vehicleMarker.setContent(buildVehicleContent(heading, speed))
}

/** 移除实时车辆标记。 */
function removeVehicleMarker() {
  if (vehicleMarker) {
    vehicleMarker.setMap(null)
    vehicleMarker = null
  }
  latestVehicleData = null
}

/** 建立 SSE 连接，接收车辆实时位置。 */
function startSSEConnection() {
  if (eventSource) return
  const url = `${realtimeServer.value}/api/location/stream?deviceId=${realtimeDeviceId.value}`
  console.log('[SSE] 正在连接:', url)
  eventSource = new EventSource(url)

  eventSource.onopen = () => console.log('[SSE] 连接已建立')

  eventSource.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg.type === 'location' && msg.data) {
        const { lng, lat, speed, heading = 0 } = msg.data
        updateVehicleMarker({ lng, lat, speed, heading })
      }
    } catch (err) {
      console.error('[SSE] 消息解析失败:', err)
    }
  }

  eventSource.onerror = () => {
    console.warn('[SSE] 连接异常，EventSource 将自动重连...')
  }
}

/** 关闭 SSE 连接并移除车辆标记。 */
function stopSSEConnection() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
    console.log('[SSE] 连接已关闭')
  }
  removeVehicleMarker()
}

/** 聚焦节点列表选中的节点。 */
function handleFocusNode(idx) { focusNode(positions.value[idx]) }

/** 切换测距工具：开启/关闭测距模式，并同步更新状态。 */
function toggleRanging() {
   // 防御：测距工具未初始化时直接返回，避免空指针错误
  if (!rangingTool) return
  if (rangingActive.value) {
    // 关闭测距模式，传入 true 表示同时清除地图上已有的测距绘制结果
    rangingTool.turnOff(true)
    rangingActive.value = false
  } else {
    // 开启测距模式，用户可在地图上点击绘制测距线段
    rangingTool.turnOn()
    rangingActive.value = true
  }
}

/** 清理地图资源和实时连接。 */
function cleanupAll() {
  clearMarkers()
  clearPolylines()
  closeInfoWindow()
  closeVehicleInfoWindow()
  if (rangingTool) {
    rangingTool.close(true)
  }
  stopSSEConnection()
}

/**
 * 组件挂载入口：按异步流水线顺序初始化地图及所有附属功能。
 * 流程：加载地图 SDK → 渲染标记/路径 → 自适应视野 → 建立实时连接。
 */
onMounted(() => {
  // 1. 异步加载高德地图 SDK 并创建地图实例
  initMap()
      .then(() => {
        // 2. 地图就绪后，依次执行：渲染节点标记、绘制路径线
        renderMarkers()
        renderRoute()
        // 3. 延迟 500ms 等待渲染帧完成，再根据节点位置自适应缩放视野
        setTimeout(fitBounds, 500)
        // 4. 开启 SSE 长连接，接收车辆实时位置推送
        startSSEConnection()
        rangingTool = new AMap.RangingTool(map, { lineWidth: 3, lineColor: '#0066ff', dashArray: [8, 4] })

      })
      // 5. 地图加载失败时静默处理，loading 状态已在 initMap 内部关闭
      .catch(() => { /* 已在 initMap 中处理 loading */ })
})

onUnmounted(() => {
  cleanupAll()
  destroyMap()
})
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

/* ── 地图区域 ── */
.map-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

#container {
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

/* ── 测距工具按钮 ── */
.ranging-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 100;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgb(255 255 255);
  color: #000;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.ranging-btn:hover {
  background: #ecf5f5cc;
}
.ranging-btn.active {
  color: #ffffff;
  background: rgb(0 102 255 / 58%);
}
.ranging-icon {
  font-size: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
