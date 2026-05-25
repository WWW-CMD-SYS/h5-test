<template>
  <div class="irradiation-dashboard">
    <!-- 星空背景 -->
    <canvas ref="starCanvasRef"></canvas>

    <!-- Header -->
    <header class="hd">
      <div class="hd-side">
        <div class="live-dot"><div class="dot"></div>实时监测中</div>
      </div>
      <div class="hd-center">
        <div class="hd-title">辐照企业数据总览</div>
        <div class="hd-subtitle">IRRADIATION ENTERPRISE INTELLIGENCE PLATFORM</div>
      </div>
      <div class="hd-side">
        <span class="clock">{{ clock }}</span>
      </div>
    </header>

    <!-- Main -->
    <main class="main">

      <!-- ① 顶部：剂量报警 + 输送线 + 设备报警 -->
      <div class="top-row">
        <!-- 左侧：剂量偏移报警 -->
        <div class="tech-border alert-panel">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="alert-panel-header">
            <div class="alert-panel-icon dose">☢</div>
            <span class="alert-panel-title">剂量偏移报警</span>
            <span class="alert-panel-badge dose">未确认 {{ doseUnackedCount }} 条</span>
          </div>
          <div class="alert-list">
            <template v-if="doseUnacked.length > 0">
              <div v-for="a in doseUnacked" :key="a.id" class="alert-item" :class="a.type">
                <span class="alert-item-time">{{ a.time }}</span>
                <span class="alert-item-level" :class="a.type">{{ a.level }}</span>
                <span class="alert-item-desc">{{ a.desc }}</span>
                <span class="alert-item-device">{{ a.device }}</span>
                <span><button class="alert-item-ack" @click="ackAlert(a.id)">确认</button></span>
              </div>
            </template>
            <div v-else style="padding:20px;text-align:center;color:var(--text-3);font-size:11px">
              暂无未确认剂量偏移报警 · 系统正常
            </div>
          </div>
        </div>

        <!-- 中间：自动化输送线 -->
        <div class="tech-border conveyor-panel">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="conveyor-panel-header">
            <span class="conveyor-panel-title">⟐ 自动化输送线 · 实时流程</span>
            <span class="conveyor-panel-sub">Co-60 #1 · 批次 B2605-441 · 25 kGy</span>
          </div>
          <div class="conveyor-panel-body">
            <div class="conveyor-panel-svg-wrap">
              <svg class="conveyor-svg" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#00dcff44"/>
                  </marker>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <!-- 主轨道 -->
                <line x1="30" y1="80" x2="570" y2="80" stroke="#00dcff18" stroke-width="20" stroke-linecap="round"/>
                <line x1="30" y1="80" x2="570" y2="80" stroke="#00dcff0c" stroke-width="26" stroke-linecap="round"/>

                <!-- 区域 -->
                <rect x="18" y="44" width="80" height="72" rx="6" fill="rgba(0,220,255,0.04)" stroke="rgba(0,220,255,0.15)" stroke-width="1"/>
                <text x="58" y="38" text-anchor="middle" font-size="9" fill="#3a6a8a">进货缓存</text>

                <rect x="110" y="44" width="80" height="72" rx="6" fill="rgba(0,255,170,0.03)" stroke="rgba(0,255,170,0.12)" stroke-width="1"/>
                <text x="150" y="38" text-anchor="middle" font-size="9" fill="#3a6a8a">入射检</text>

                <!-- 辐照区高亮 -->
                <rect x="206" y="28" width="188" height="104" rx="8" fill="rgba(0,220,255,0.06)" stroke="#00dcff" stroke-width="1.5" stroke-dasharray="4 3" filter="url(#glow)"/>
                <text x="300" y="20" text-anchor="middle" font-size="9" fill="#00dcff" filter="url(#glow)">▷ 辐照处理中</text>

                <rect x="406" y="44" width="80" height="72" rx="6" fill="rgba(0,255,170,0.03)" stroke="rgba(0,255,170,0.12)" stroke-width="1"/>
                <text x="446" y="38" text-anchor="middle" font-size="9" fill="#3a6a8a">出射检</text>

                <rect x="498" y="44" width="80" height="72" rx="6" fill="rgba(170,102,255,0.03)" stroke="rgba(170,102,255,0.12)" stroke-width="1"/>
                <text x="538" y="38" text-anchor="middle" font-size="9" fill="#3a6a8a">成品仓</text>

                <!-- 货位 -->
                <g ref="cargoGroupRef"></g>

                <!-- 标签 -->
                <text x="58"  y="88" text-anchor="middle" font-size="10" fill="#6ab0d0">缓存区</text>
                <text x="150" y="88" text-anchor="middle" font-size="10" fill="#6ab0d0">检测中</text>
                <text x="300" y="92" text-anchor="middle" font-size="12" font-weight="500" fill="#00dcff" filter="url(#glow)">辐照中</text>
                <text x="300" y="108" text-anchor="middle" font-size="10" fill="#00dcff88">剂量: 25 kGy</text>
                <text x="446" y="88" text-anchor="middle" font-size="10" fill="#6ab0d0">检测中</text>
                <text x="538" y="88" text-anchor="middle" font-size="10" fill="#aa66ff">入库中</text>

                <!-- 箭头 -->
                <line x1="100" y1="80" x2="108" y2="80" stroke="#00dcff33" stroke-width="1.5" marker-end="url(#arr)"/>
                <line x1="192" y1="80" x2="200" y2="80" stroke="#00dcff33" stroke-width="1.5" marker-end="url(#arr)"/>
                <line x1="396" y1="80" x2="404" y2="80" stroke="#00dcff33" stroke-width="1.5" marker-end="url(#arr)"/>
                <line x1="488" y1="80" x2="496" y2="80" stroke="#00dcff33" stroke-width="1.5" marker-end="url(#arr)"/>

                <!-- 计数 -->
                <text x="58"  y="110" text-anchor="middle" font-size="9" fill="#3a6a8a">{{ zoneCounts[0] }}</text>
                <text x="150" y="110" text-anchor="middle" font-size="9" fill="#3a6a8a">{{ zoneCounts[1] }}</text>
                <text x="446" y="110" text-anchor="middle" font-size="9" fill="#3a6a8a">{{ zoneCounts[2] }}</text>
                <text x="538" y="110" text-anchor="middle" font-size="9" fill="#6a5fa8">{{ zoneCounts[3] }}</text>
              </svg>
            </div>
            <div class="conveyor-panel-progress">
              <div class="progress-item">
                <div class="progress-label"><span>已辐照</span><span>312/400</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:78%;background:var(--cyan)"></div></div>
              </div>
              <div class="progress-item">
                <div class="progress-label"><span>在线时长</span><span>6.4/8h</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:80%;background:var(--green)"></div></div>
              </div>
              <div class="progress-item">
                <div class="progress-label"><span>今日目标</span><span>4287/5000</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:86%;background:var(--green)"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：设备异常报警 -->
        <div class="tech-border alert-panel">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="alert-panel-header">
            <div class="alert-panel-icon device">⚡</div>
            <span class="alert-panel-title">设备异常报警</span>
            <span class="alert-panel-badge device">未确认 {{ deviceUnackedCount }} 条</span>
          </div>
          <div class="alert-list">
            <template v-if="deviceUnacked.length > 0">
              <div v-for="a in deviceUnacked" :key="a.id" class="alert-item" :class="a.type">
                <span class="alert-item-time">{{ a.time }}</span>
                <span class="alert-item-level" :class="a.type">{{ a.level }}</span>
                <span class="alert-item-desc">{{ a.desc }}</span>
                <span class="alert-item-device">{{ a.device }}</span>
                <span><button class="alert-item-ack" @click="ackAlert(a.id)">确认</button></span>
              </div>
            </template>
            <div v-else style="padding:20px;text-align:center;color:var(--text-3);font-size:11px">
              暂无未确认设备异常报警 · 系统正常
            </div>
          </div>
        </div>
      </div>

      <!-- ② 关键指标 KPI 横排 -->
      <div class="kpi-row">
        <div v-for="kpi in kpiCards" :key="kpi.key" class="kpi-card" :class="kpi.cls">
          <div class="kpi-card-top">
            <span class="kpi-card-label">{{ kpi.label }}</span>
            <div class="kpi-card-icon">{{ kpi.icon }}</div>
          </div>
          <div>
            <span class="kpi-card-val">{{ kpi.value }}</span>
            <span class="kpi-card-unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-card-trend" :style="{ color: `var(--${kpi.trendColor})` }">{{ kpi.trend }}</div>
        </div>
      </div>

      <!-- ③ 数据分析横排 -->
      <div class="chart-row">
        <div class="tech-border chart-row-card">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="chart-row-title">剂量稳定性分布</div>
          <div class="chart-row-wrap">
            <canvas ref="doseChartRef"></canvas>
          </div>
        </div>
        <div class="tech-border chart-row-card">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="chart-row-title">月度产量趋势</div>
          <div class="chart-row-wrap">
            <canvas ref="prodChartRef"></canvas>
          </div>
        </div>
        <div class="tech-border chart-row-card">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="chart-row-title">设备利用率</div>
          <div class="chart-row-wrap">
            <canvas ref="utilChartRef"></canvas>
          </div>
        </div>
      </div>

      <!-- ④ 底部：法律法规合规倒计时 -->
      <div class="tech-border compliance-footer">
        <i class="corner-bl"></i><i class="corner-br"></i>
        <div class="comp-footer-inner">
          <div class="comp-footer-header">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:3px;height:12px;background:var(--red);border-radius:2px"></div>
              <span style="font-size:12px;color:var(--cyan);letter-spacing:1px">法律法规合规倒计时</span>
            </div>
            <span style="font-size:10px;color:var(--text-3)">⚠ 临近到期项自动高亮</span>
          </div>
          <div class="compliance-banner">
            <div v-for="item in complianceDisplay" :key="item.label" class="comp-item" :class="item.urgency">
              <div class="comp-item-label">{{ item.label }}</div>
              <div class="comp-item-cd" :class="item.urgency">{{ item.cd }}</div>
              <div class="comp-item-deadline">{{ item.deadlineStr }} · {{ item.cycleDesc }}</div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="footer-bar">
      <span>辐照企业数据总览 v3.0 · 数据仅供内部参考</span>
      <span>刷新间隔: 30s · 安全等级: 内部</span>
      <span>最后更新：{{ fullTime }}</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
/* ─── 工具函数 ─── */
function pad(n) { return String(n).padStart(2, '0') }

/* ─── 时钟 ─── */
const clock = ref('--:--:--')
const fullTime = ref('')
let clockTimer = null

function tick() {
  const d = new Date()
  const hms = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  clock.value = hms
  fullTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hms}`
}

/* ─── 警报数据 ─── */
const doseAlerts = reactive([
  { id: 'D001', time: '07:15', type: 'critical', level: '严重', desc: 'Co-60 #1 批次 B2605-438 实测剂量 26.42 kGy，超上限 5.68%', device: 'Co-60 #1', acked: false },
  { id: 'D002', time: '09:32', type: 'warn', level: '警告', desc: 'EB-1 批次 B2605-445 剂量偏低 23.1 kGy，低于下限 7.6%', device: 'EB-1', acked: false },
])
const deviceAlerts = reactive([
  { id: 'V001', time: '08:42', type: 'warn', level: '警告', desc: 'EB-1 加速器预防性维护窗口启动，计划停机 4h', device: 'EB-1', acked: false },
  { id: 'V002', time: '10:05', type: 'critical', level: '严重', desc: '辐照室温度传感器 T-03 读数漂移 ±0.8℃，超阈值', device: 'T-03', acked: false },
])

const doseUnacked = computed(() => doseAlerts.filter(a => !a.acked))
const deviceUnacked = computed(() => deviceAlerts.filter(a => !a.acked))
const doseUnackedCount = computed(() => doseUnacked.value.length)
const deviceUnackedCount = computed(() => deviceUnacked.value.length)

function ackAlert(id) {
  const all = [...doseAlerts, ...deviceAlerts]
  const found = all.find(a => a.id === id)
  if (found) found.acked = true
}

/* ─── KPI 卡片 ─── */
const kpiCards = reactive([
  { key: 'prod', cls: 'c1', label: '今日产量', icon: '📦', value: '4,287', unit: '件', trend: '↑ 8.3% 较昨日', trendColor: 'green' },
  { key: 'util', cls: 'c2', label: '设备利用率', icon: '⚙', value: '87.6', unit: '%', trend: '↑ 2.1% 较昨日', trendColor: 'green' },
  { key: 'pass', cls: 'c3', label: '批次合格率', icon: '✓', value: '99.2', unit: '%', trend: '↓ 0.3% 较昨日', trendColor: 'orange' },
  { key: 'tat', cls: 'c4', label: '平均周转时效', icon: '⏱', value: '18.4', unit: 'h', trend: '↓ 1.2h 优于目标', trendColor: 'green' },
  { key: 'rev', cls: 'c5', label: '本月营收', icon: '💰', value: '1,824', unit: '万元', trend: '↑ 12.5% 较上月', trendColor: 'green' },
])

/* ─── 合规倒计时 ─── */
const complianceItems = reactive([
  { label: '剂量验证', deadline: new Date('2026-06-01T09:00:00'), cycleDesc: '每季度' },
  { label: '源执照到期', deadline: new Date('2026-06-15T00:00:00'), cycleDesc: '5年周期' },
  { label: '环保检查', deadline: new Date('2026-08-20T00:00:00'), cycleDesc: '每年' },
  { label: '个人剂量监测', deadline: new Date('2026-05-28T09:00:00'), cycleDesc: '每月' },
  { label: '应急演练', deadline: new Date('2026-12-10T00:00:00'), cycleDesc: '每年' },
])

function getUrgency(deadline) {
  const days = (deadline - new Date()) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'warning'
  return 'safe'
}

function formatCD(deadline) {
  const diff = deadline - new Date()
  if (diff <= 0) return '已过期'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 30) return `${days}天`
  if (days > 0) return `${days}天${hours}时`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}时${mins}分`
}

const complianceDisplay = computed(() =>
  complianceItems.map(item => ({
    label: item.label,
    urgency: getUrgency(item.deadline),
    cd: formatCD(item.deadline),
    deadlineStr: `${item.deadline.getFullYear()}-${pad(item.deadline.getMonth() + 1)}-${pad(item.deadline.getDate())}`,
    cycleDesc: item.cycleDesc,
  }))
)

let complianceTimer = null

/* ─── 输送线动画 ─── */
const cargoGroupRef = ref(null)
const zoneCounts = ref(['', '', '', ''])

const zones = [
  { x: 22, y: 60, w: 72, count: 8, color: '#00dcff', cntIdx: 0 },
  { x: 114, y: 60, w: 72, count: 3, color: '#00ffaa', cntIdx: 1 },
  { x: 210, y: 55, w: 180, count: 6, color: '#00dcff', cntIdx: null, active: true },
  { x: 410, y: 60, w: 72, count: 2, color: '#00ffaa', cntIdx: 2 },
  { x: 502, y: 60, w: 72, count: 11, color: '#aa66ff', cntIdx: 3 },
]

function drawCargo() {
  const g = cargoGroupRef.value
  if (!g) return
  // 清空子元素
  while (g.firstChild) g.removeChild(g.firstChild)

  zones.forEach(z => {
    const n = Math.min(z.count, 6)
    for (let i = 0; i < n; i++) {
      const cols = z.active ? 3 : 2
      const col = i % cols, row = Math.floor(i / cols)
      const bw = z.active ? 18 : 16, bh = 16, gap = 4
      const gw = cols * (bw + gap) - gap
      const bx = z.x + (z.w - gw) / 2 + col * (bw + gap)
      const by = 67 + row * (bh + 4)
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', bx)
      rect.setAttribute('y', by)
      rect.setAttribute('width', bw)
      rect.setAttribute('height', bh)
      rect.setAttribute('rx', '2')
      rect.setAttribute('fill', z.active ? 'rgba(0,220,255,0.25)' : 'rgba(255,255,255,0.05)')
      rect.setAttribute('stroke', z.active ? '#00dcff' : 'rgba(255,255,255,0.1)')
      rect.setAttribute('stroke-width', '1')
      if (z.active) rect.style.animation = `glow ${1.5 + i * 0.2}s ease-in-out infinite alternate`
      g.appendChild(rect)
    }
    if (z.cntIdx !== null) {
      zoneCounts.value[z.cntIdx] = `${z.count} 货位`
    }
  })
}

let cargoTimer = null

/* ─── 星空背景 ─── */
const starCanvasRef = ref(null)
let stars = []
let starAnimId = null

function resizeStars() {
  const canvas = starCanvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  stars = []
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    })
  }
}

function drawStars() {
  const canvas = starCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  stars.forEach(s => {
    s.a += s.speed
    const opacity = 0.3 + Math.sin(s.a) * 0.3
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 220, 255, ${opacity})`
    ctx.fill()
  })
  starAnimId = requestAnimationFrame(drawStars)
}

/* ─── 图表 ─── */
const doseChartRef = ref(null)
const prodChartRef = ref(null)
const utilChartRef = ref(null)
let chartInstances = []

function initCharts() {
  Chart.defaults.color = '#3a6a8a'
  Chart.defaults.borderColor = 'rgba(0,220,255,0.06)'

  // 剂量稳定性
  const target = 25, upperLimit = 26.25, lowerLimit = 23.75
  const doseData = [24.8, 25.1, 25.3, 24.9, 25.5, 24.7, 25.0, 25.2, 24.6, 26.4, 25.1, 24.9, 25.3, 25.0, 24.8, 25.4, 25.1, 24.7, 25.2, 25.0]

  chartInstances.push(new Chart(doseChartRef.value, {
    type: 'line',
    data: {
      labels: Array.from({ length: 20 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`),
      datasets: [
        {
          label: '实测剂量',
          data: doseData,
          borderColor: '#00dcff',
          backgroundColor: 'rgba(0,220,255,0.08)',
          borderWidth: 1.5, fill: true, tension: 0.35,
          pointRadius: (ctx) => doseData[ctx.dataIndex] > upperLimit || doseData[ctx.dataIndex] < lowerLimit ? 4 : 2,
          pointBackgroundColor: (ctx) => doseData[ctx.dataIndex] > upperLimit || doseData[ctx.dataIndex] < lowerLimit ? '#ff3366' : '#00dcff',
        },
        { label: '目标均值', data: Array(20).fill(target), borderColor: '#00ffaa', borderWidth: 1, borderDash: [4, 3], pointRadius: 0 },
        { label: '控制限', data: Array(20).fill(upperLimit), borderColor: 'rgba(255,51,102,0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0 },
        { label: '控制限', data: Array(20).fill(lowerLimit), borderColor: 'rgba(255,51,102,0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { font: { size: 9 } } }, y: { min: 23, max: 27, ticks: { font: { size: 9 } } } },
    },
  }))

  // 月度产量
  chartInstances.push(new Chart(prodChartRef.value, {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [
        { label: '实际产量', data: [3200, 3500, 3100, 3800, 4100, 3950, 4200, 4050, 4300, 4100, 4500, 4287], backgroundColor: 'rgba(0,220,255,0.5)', borderColor: '#00dcff', borderWidth: 1 },
        { label: '计划产量', data: [3500, 3500, 3500, 4000, 4000, 4000, 4500, 4500, 4500, 4500, 4500, 5000], backgroundColor: 'rgba(0,255,170,0.15)', borderColor: '#00ffaa', borderWidth: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } },
    },
  }))

  // 设备利用率
  chartInstances.push(new Chart(utilChartRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Co-60 #1', 'Co-60 #2', 'EB-1', 'EB-2', 'X-ray #1', 'X-ray #2'],
      datasets: [{
        data: [92, 88, 76, 82, 65, 70],
        backgroundColor: ['#00dcff', '#00ffaa', '#ffaa33', '#ff3366', '#aa66ff', '#ffdd44'],
        borderColor: 'transparent',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { font: { size: 9 }, boxWidth: 10 } } },
      cutout: '60%',
    },
  }))
}

/* ─── 生命周期 ─── */
onMounted(() => {
  // 时钟
  tick()
  clockTimer = setInterval(tick, 1000)

  // 合规倒计时刷新（每分钟）
  complianceTimer = setInterval(() => {
    // computed 自动重算，无需手动触发
  }, 60000)

  // 星空背景
  resizeStars()
  drawStars()
  window.addEventListener('resize', resizeStars)

  // 输送线动画
  nextTick(() => {
    drawCargo()
    cargoTimer = setInterval(() => {
      zones[0].count = 6 + Math.floor(Math.random() * 4)
      zones[1].count = 2 + Math.floor(Math.random() * 3)
      zones[3].count = 1 + Math.floor(Math.random() * 3)
      zones[4].count = 8 + Math.floor(Math.random() * 5)
      drawCargo()
    }, 3000)
  })

  // 图表
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  // 清除定时器
  if (clockTimer) clearInterval(clockTimer)
  if (complianceTimer) clearInterval(complianceTimer)
  if (cargoTimer) clearInterval(cargoTimer)

  // 取消星空动画
  if (starAnimId) cancelAnimationFrame(starAnimId)
  window.removeEventListener('resize', resizeStars)

  // 销毁图表
  chartInstances.forEach(c => c.destroy())
  chartInstances = []
})
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.irradiation-dashboard {
  --bg-main: #020617;
  --bg-panel: rgba(8, 20, 50, 0.7);
  --bg-card: rgba(10, 30, 70, 0.6);
  --border: rgba(0, 220, 255, 0.25);
  --border-hi: rgba(0, 220, 255, 0.6);
  --text-1: #e0f7ff;
  --text-2: #6ab0d0;
  --text-3: #3a6a8a;
  --cyan: #00dcff;
  --green: #00ffaa;
  --orange: #ffaa33;
  --red: #ff3366;
  --purple: #aa66ff;
  --yellow: #ffdd44;
  --font: 'PingFang SC','Microsoft YaHei',system-ui,sans-serif;

  height: 100vh;
  overflow: hidden;
  background: var(--bg-main);
  color: var(--text-1);
  font-family: var(--font);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ─── 网格背景 ─── */
.irradiation-dashboard::before {
  content: '';
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-image:
    linear-gradient(rgba(0,220,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,220,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1;
  pointer-events: none;
}

/* ─── 星空背景 ─── */
.irradiation-dashboard > canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ─── 科技边框装饰 ─── */
.tech-border {
  position: relative;
  border: 1px solid var(--border);
  background: var(--bg-panel);
}
.tech-border::before, .tech-border::after,
.tech-border :deep(.corner-bl), .tech-border :deep(.corner-br) {
  content: '';
  position: absolute;
  width: 8px; height: 8px;
  border-color: var(--cyan);
  border-style: solid;
  pointer-events: none;
}
.tech-border::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.tech-border::after { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
.tech-border :deep(.corner-bl) { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
.tech-border :deep(.corner-br) { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

/* ─── 顶部发光标题栏 ─── */
.hd {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: linear-gradient(180deg, rgba(0,30,60,0.95) 0%, rgba(0,15,35,0.9) 100%);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.hd::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 20%; right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  box-shadow: 0 0 10px var(--cyan);
}
.hd-center {
  position: absolute;
  left: 50%; transform: translateX(-50%);
  text-align: center;
}
.hd-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
  color: var(--cyan);
  text-shadow: 0 0 20px rgba(0,220,255,0.5);
}
.hd-subtitle {
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: 2px;
  margin-top: 2px;
}
.hd-side {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--text-2);
}
.hd-side .clock {
  font-variant-numeric: tabular-nums;
  color: var(--cyan);
  font-size: 13px;
}
.live-dot {
  display: flex; align-items: center; gap: 5px;
}
.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  animation: blink 2s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ─── 主布局 ─── */
.main {
  position: relative;
  z-index: 5;
  flex: 1;
  padding: 10px 14px;
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
}

/* ─── KPI 横排行 ─── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  min-height: 0;
}
.kpi-card {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
.kpi-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}
.kpi-card.c1::after { background: linear-gradient(90deg, var(--cyan), transparent); }
.kpi-card.c2::after { background: linear-gradient(90deg, var(--green), transparent); }
.kpi-card.c3::after { background: linear-gradient(90deg, var(--orange), transparent); }
.kpi-card.c4::after { background: linear-gradient(90deg, var(--purple), transparent); }
.kpi-card.c5::after { background: linear-gradient(90deg, var(--yellow), transparent); }
.kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kpi-card-label {
  font-size: 11px;
  color: var(--text-3);
}
.kpi-card-icon {
  width: 22px; height: 22px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
}
.kpi-card.c1 .kpi-card-icon { background: rgba(0,220,255,0.1); color: var(--cyan); }
.kpi-card.c2 .kpi-card-icon { background: rgba(0,255,170,0.1); color: var(--green); }
.kpi-card.c3 .kpi-card-icon { background: rgba(255,170,51,0.1); color: var(--orange); }
.kpi-card.c4 .kpi-card-icon { background: rgba(170,102,255,0.1); color: var(--purple); }
.kpi-card.c5 .kpi-card-icon { background: rgba(255,221,68,0.1); color: var(--yellow); }
.kpi-card-val {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.kpi-card-unit {
  font-size: 12px;
  color: var(--text-2);
  margin-left: 3px;
}
.kpi-card-trend {
  font-size: 10px;
}

/* ─── 顶部区域：左报警 + 中输送线 + 右报警 ─── */
.top-row {
  display: grid;
  grid-template-columns: 1fr 1.8fr 1fr;
  gap: 8px;
  height: 200px;
  min-height: 0;
}

/* ─── 中间输送线面板 ─── */
.conveyor-panel {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conveyor-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,220,255,0.1);
}
.conveyor-panel-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 6px;
}
.conveyor-panel-sub {
  font-size: 10px;
  color: var(--text-3);
}
.conveyor-panel-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.conveyor-panel-svg-wrap {
  flex: 1;
  min-height: 0;
  background: rgba(0,0,0,0.15);
  border: 1px solid rgba(0,220,255,0.08);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.conveyor-panel-svg-wrap .conveyor-svg {
  width: 100%;
  height: 100%;
  max-height: none;
}
.conveyor-panel-progress {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.conveyor-panel-progress .progress-item {
  padding: 4px 8px;
}
.alert-panel {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}
.alert-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,220,255,0.1);
}
.alert-panel-icon {
  width: 24px; height: 24px;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}
.alert-panel-icon.dose { background: rgba(255,51,102,0.15); }
.alert-panel-icon.device { background: rgba(255,170,51,0.15); }
.alert-panel-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}
.alert-panel-badge {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid transparent;
}
.alert-panel-badge.dose {
  color: var(--red);
  border-color: rgba(255,51,102,0.4);
  background: rgba(255,51,102,0.08);
}
.alert-panel-badge.device {
  color: var(--orange);
  border-color: rgba(255,170,51,0.4);
  background: rgba(255,170,51,0.08);
}

.alert-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alert-item {
  display: grid;
  grid-template-columns: 50px 70px 1fr 80px 70px;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
  font-size: 11px;
  border-left: 2px solid transparent;
  transition: background .2s;
}
.alert-item:hover { background: rgba(0,220,255,0.05); }
.alert-item.critical { border-left-color: var(--red); }
.alert-item.warn { border-left-color: var(--orange); }
.alert-item-time { color: var(--text-3); font-size: 10px; }
.alert-item-level {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  text-align: center;
}
.alert-item-level.critical {
  color: var(--red);
  background: rgba(255,51,102,0.1);
  border: 1px solid rgba(255,51,102,0.3);
}
.alert-item-level.warn {
  color: var(--orange);
  background: rgba(255,170,51,0.1);
  border: 1px solid rgba(255,170,51,0.3);
}
.alert-item-desc { color: var(--text-2); line-height: 1.4; }
.alert-item-device { color: var(--text-3); }
.alert-item-ack {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid rgba(0,220,255,0.3);
  background: none;
  color: var(--text-2);
  cursor: pointer;
  transition: all .15s;
}
.alert-item-ack:hover {
  background: rgba(0,220,255,0.1);
  color: var(--cyan);
  border-color: var(--cyan);
}

/* ─── 数据分析横排行 ─── */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  min-height: 0;
  height: 160px;
}
.chart-row-card {
  padding: 8px 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.chart-row-title {
  font-size: 11px;
  color: var(--text-2);
  margin-bottom: 4px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
}
.chart-row-title::before,
.chart-row-title::after {
  content: '';
  width: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,220,255,0.3));
}
.chart-row-title::after {
  background: linear-gradient(90deg, rgba(0,220,255,0.3), transparent);
}
.chart-row-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ─── 合规倒计时底部栏 ─── */
.compliance-footer {
  flex-shrink: 0;
  padding: 8px 14px;
  min-height: 0;
  border-color: rgba(255,51,102,0.15) !important;
  background: linear-gradient(180deg, rgba(255,51,102,0.03) 0%, rgba(0,10,25,0.6) 100%) !important;
}
.compliance-footer::before,
.compliance-footer::after {
  border-color: rgba(255,51,102,0.4) !important;
}
.compliance-footer :deep(.corner-bl),
.compliance-footer :deep(.corner-br) {
  border-color: rgba(255,51,102,0.4) !important;
}
.comp-footer-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.comp-footer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 合规横幅 */
.compliance-banner {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.comp-item {
  text-align: center;
  padding: 6px 4px;
  border-radius: 4px;
  background: rgba(0,0,0,0.2);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
}
.comp-item.urgent { border-color: rgba(255,51,102,0.4); }
.comp-item.warning { border-color: rgba(255,170,51,0.35); }
.comp-item.safe { border-color: rgba(0,255,170,0.2); }
.comp-item-label {
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 4px;
}
.comp-item-cd {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.comp-item-cd.urgent { color: var(--red); }
.comp-item-cd.warning { color: var(--orange); }
.comp-item-cd.safe { color: var(--green); }
.comp-item-deadline {
  font-size: 9px;
  color: var(--text-3);
  margin-top: 2px;
}

/* 底部进度（保留通用） */
.progress-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.progress-item {
  padding: 8px 10px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 4px;
}
.progress-label span:last-child { color: var(--text-2); }
.progress-bar {
  height: 3px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width .6s;
}

/* ─── 底部 ─── */
.footer-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  background: rgba(0,10,25,0.9);
  border-top: 1px solid var(--border);
  font-size: 10px;
  color: var(--text-3);
  flex-shrink: 0;
}

/* ─── 滚动条 ─── */
.alert-list::-webkit-scrollbar { width: 4px; }
.alert-list::-webkit-scrollbar-track { background: transparent; }
.alert-list::-webkit-scrollbar-thumb { background: rgba(0,220,255,0.15); border-radius: 2px; }
.alert-list::-webkit-scrollbar-thumb:hover { background: rgba(0,220,255,0.3); }

/* ─── 动画 ─── */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes glow {
  from { fill: rgba(0,220,255,0.15); }
  to { fill: rgba(0,220,255,0.4); }
}
</style>
