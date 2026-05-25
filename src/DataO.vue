<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

// Template refs for ECharts containers
const particlesRef = ref(null)
const baseIdRef = ref(null)
const questionIdRef = ref(null)
const publicityIdRef = ref(null)
const threeTasksIdRef = ref(null)
const departmentIdRef = ref(null)
const coverageIdRef = ref(null)
const contentIdRef = ref(null)
const publicNumIdRef = ref(null)
const yearsNumIdRef = ref(null)

// Data refs for counter displays
const daysData = ref(0)
const weekData = ref(0)
const monthData = ref(0)
const someThing = ref(0)
const policyData = ref(0)
const counterValues = ref([0, 0, 0, 0, 0, 0])

// Middle section data (5 items matching original)
const middleListData = ref([
  { name: '测试11', value: 300 },
  { name: '测试22', value: 500 },
  { name: '测试33', value: 400 },
  { name: '测试44', value: 350 },
  { name: '测试55', value: 363 },
])

// Number display for center (5 digits in original)
const centerNums = ref([0, 0, 0, 0, 0])

// Store all chart instances for cleanup
let chartInstances = []
let timerIds = []

// Simple number animation for scalar ref (with swing easing like original)
function animateNumber(targetRef, targetValue, duration = 2500) {
  const start = targetRef.value || 0
  const startTime = performance.now()
  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    // swing easing: easeInOutQuad (similar to jQuery swing)
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    targetRef.value = Math.round(start + (targetValue - start) * ease)
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

// Animate a specific index in an array ref (with swing easing)
// Supports both plain number arrays and object arrays with 'value' property
function animateArrayValue(targetRef, index, targetValue, duration = 2500) {
  const currentVal = targetRef.value[index]
  const isObject = typeof currentVal === 'object' && currentVal !== null && 'value' in currentVal
  const start = isObject ? (currentVal.value || 0) : (currentVal || 0)
  const startTime = performance.now()
  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    const newValue = Math.round(start + (targetValue - start) * ease)
    if (isObject) {
      targetRef.value[index].value = newValue
    } else {
      targetRef.value[index] = newValue
    }
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

// Animate center numbers (5 digits)
function animateCenterNumbers() {
  const targetStr = '66666'
  const duration = 2500
  const startTime = performance.now()

  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

    for (let g = 0; g < 5; g++) {
      const targetDigit = parseInt(targetStr[g])
      const currentDigit = Math.round(targetDigit * ease)
      centerNums.value[g] = currentDigit
    }

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

// Animate all counter values (equivalent to numInit)
function animateAllCounters() {
  // Reset and animate top-left counter values
  counterValues.value = [0, 0, 0, 0, 0, 0]
  animateArrayValue(counterValues, 1, 300)
  animateArrayValue(counterValues, 2, 500)
  animateArrayValue(counterValues, 3, 400)
  animateArrayValue(counterValues, 4, 350)
  animateArrayValue(counterValues, 5, 363)

  // Reset and animate top-right data
  daysData.value = 0
  weekData.value = 0
  monthData.value = 0
  someThing.value = 0
  policyData.value = 0
  animateNumber(daysData, 304)
  animateNumber(weekData, 2044)
  animateNumber(monthData, 909)
  animateNumber(someThing, 980)
  animateNumber(policyData, 200)

  // Animate center numbers
  animateCenterNumbers()

  // Reset and animate middle list values
  const targets = [300, 500, 400, 350, 363]
  middleListData.value = middleListData.value.map((item, i) => ({
    ...item,
    value: 0
  }))
  // Use setTimeout to ensure Vue has processed the reset before starting animation
  setTimeout(() => {
    targets.forEach((target, i) => {
      animateArrayValue(middleListData, i, target)
    })
  }, 50)
}

// Base info horizontal bar chart
function initBaseChart() {
  const chart = echarts.init(baseIdRef.value)
  chartInstances.push(chart)

  const charts = [
    { name: '测试1', num: 200 },
    { name: '测试2', num: 300 },
    { name: '测试3', num: 400 },
    { name: '测试4', num: 500 },
    { name: '测试5', num: 300 },
  ]
  const color = ['rgba(100,255,249', 'rgba(100,255,249', 'rgba(100,255,249', 'rgba(100,255,249', 'rgba(100,255,249']

  const lineY = []
  for (let i = 0; i < charts.length; i++) {
    let x = i
    if (x > color.length - 1) x = color.length - 1
    lineY.push({
      name: charts[i].name,
      color: color[x] + ')',
      value: charts[i].num,
      itemStyle: {
        normal: {
          show: true,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: color[x] + ', 0.3)' },
            { offset: 1, color: color[x] + ', 1)' },
          ], false),
          barBorderRadius: 10,
        },
        emphasis: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    })
  }

  const option = {
    title: { show: false },
    grid: { top: '10%', left: '30%', right: '20%', bottom: '3%' },
    color: color,
    yAxis: [
      {
        type: 'category', inverse: true,
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { show: false, inside: false },
        data: charts.name,
      },
      {
        type: 'category', inverse: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: {
          show: true, inside: false,
          textStyle: { color: '#38E1E1', fontSize: '8' },
          formatter: (_val, index) => `${charts[index].num}`,
        },
        splitArea: { show: false }, splitLine: { show: false },
        data: charts,
      },
    ],
    xAxis: {
      axisTick: { show: false }, axisLine: { show: false },
      splitLine: { show: false }, axisLabel: { show: false },
    },
    series: [{
      name: '', type: 'bar', zlevel: 2, barWidth: '5px',
      data: lineY, animationDuration: 1500,
      label: {
        normal: {
          color: 'white', show: true, position: [-65, -2],
          textStyle: { fontSize: 8 },
          formatter: (a) => a.name,
        },
      },
    }],
    animationEasing: 'cubicOut',
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 40000)
  timerIds.push(tid)
}

// Question feedback pie chart
function initQuestionChart() {
  const chart = echarts.init(questionIdRef.value)
  chartInstances.push(chart)

  const datas = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 }, { name: '测试66', value: 800 },
  ]
  const option = {
    title: { left: 'center' },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    color: ['#2E8CFF', '#FD9133', '#37D2D4', '#19CA88', '#858FF8'],
    legend: {
      itemWidth: 11, itemHeight: 11, orient: 'vertical',
      top: '15%', x: '50%', data: datas,
      textStyle: { color: '#fff', fontSize: 8 },
    },
    series: [{
      name: '问题反馈', type: 'pie', radius: '75%',
      center: ['20%', '50%'], animationDuration: 2500, data: datas,
      label: { normal: { position: 'inner', show: false } },
    }],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 8000)
  timerIds.push(tid)
}

// Publicity (ring) pie chart
function initPublicityChart() {
  const chart = echarts.init(publicityIdRef.value)
  chartInstances.push(chart)

  const data = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 }, { name: '测试66', value: 800 },
  ]
  const option = {
    color: ['#38EB70', '#F7E16C', '#0EFCFF', '#FD9133', '#4D92F2'],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    legend: {
      itemWidth: 12, itemHeight: 12, orient: 'vertical',
      top: '5%', bottom: '50%', x: '45%',
      textStyle: { color: '#fff', fontSize: 8 }, data: data,
    },
    series: [
      {
        radius: ['70%', '90%'], center: ['25%', '50%'], type: 'pie',
        label: { normal: { position: 'inner', show: false } },
        name: 'XX公开数量', data: data,
      },
      {
        radius: ['50%', '55%'], center: ['25%', '50%'], type: 'pie',
        label: { normal: { show: false }, emphasis: { show: false } },
        labelLine: { normal: { show: false }, emphasis: { show: false } },
        animation: false, tooltip: { show: false },
        data: [{ value: 1, itemStyle: { color: 'rgba(250,250,250,0.3)' } }],
      },
    ],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 6000)
  timerIds.push(tid)
}

// Three tasks (rose) pie chart
function initThreeTasksChart() {
  const chart = echarts.init(threeTasksIdRef.value)
  chartInstances.push(chart)

  // Note: centerNums animation is now handled by animateAllCounters()

  const dataArr = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 }, { name: '测试66', value: 800 },
  ]
  // Note: counterValues animation is now handled by animateAllCounters()

  const option = {
    color: ['#38EB70', '#2E8CFF', '#0EFCFF', '#858FF8', '#FD9133', '#F7E270'],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    legend: {
      itemWidth: 15, itemHeight: 15, orient: 'vertical',
      top: '10%', bottom: '50%', x: '50%',
      textStyle: { color: '#fff', fontSize: 8 }, data: dataArr,
    },
    series: {
      name: '三务公开数量', type: 'pie', animationDuration: 1500,
      radius: ['70%', '90%'], center: ['25%', '50%'], roseType: 'radius',
      label: { normal: { position: 'inner', show: false } },
      data: dataArr,
    },
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 4000)
  timerIds.push(tid)
}

// Department pie chart
function initDepartmentChart() {
  const chart = echarts.init(departmentIdRef.value)
  chartInstances.push(chart)

  const dataArr = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 },
  ]
  // Update middle section names only (values are animated by animateAllCounters)
  for (let j = 0; j < dataArr.length; j++) {
    if (middleListData.value[j]) {
      middleListData.value[j].name = dataArr[j].name
    }
  }

  const option = {
    color: ['#FD9133', '#47F6A2', '#37D2D4', '#3493FF'],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
    legend: {
      itemWidth: 15, itemHeight: 15, orient: 'vertical',
      top: '30%', bottom: '50%', x: '5%',
      textStyle: { color: '#fff', fontSize: 8 }, data: dataArr,
    },
    series: [
      {
        name: 'XXXX公开占比', type: 'pie', radius: ['50%', '70%'],
        center: ['78%', '52%'],
        labelLine: {
          normal: {
            length: 12,
            lineStyle: { type: 'solid', color: '#0EFCFF' },
          },
        },
        label: {
          normal: {
            formatter: (params) => params.name,
            borderWidth: 0, borderRadius: 4, padding: [0, 0],
            height: 20, fontSize: 8, align: 'center', color: '#0EFCFF',
          },
        },
        data: dataArr,
      },
      {
        color: '#0EFCFF', type: 'pie', radius: ['55', '56'],
        center: ['78%', '52%'], data: [100], label: { show: false },
      },
      {
        type: 'pie', radius: ['25', '26'], center: ['78%', '52%'],
        data: [100], label: { show: false },
      },
    ],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 12000)
  timerIds.push(tid)
}

// Coverage radar chart
function initCoverageChart() {
  const chart = echarts.init(coverageIdRef.value)
  chartInstances.push(chart)

  const resArr = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 }, { name: '测试66', value: 800 },
  ]
  const indicatorArr = []
  const numArr = []
  for (let i = 0; i < resArr.length; i++) {
    indicatorArr.push({ name: resArr[i].name, max: 900 })
    numArr.push(resArr[i].value)
  }

  const option = {
    legend: {
      show: true, icon: 'circle', bottom: 30, center: 0,
      itemWidth: 14, itemHeight: 14, itemGap: 21, orient: 'horizontal',
      data: ['a', 'b'],
      textStyle: { fontSize: '70%', color: '#0EFCFF' },
    },
    radar: {
      radius: '70%', triggerEvent: true, nameGap: '2',
      name: {
        textStyle: { color: '#39DCF4', fontSize: '10', padding: [10, 10] },
      },
      indicator: indicatorArr,
      splitArea: { areaStyle: { color: 'rgba(255,255,255,0)' } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.2)' } },
      splitLine: { lineStyle: { width: 1, color: 'rgba(255,255,255,.2)' } },
    },
    series: [{
      name: 'XXX区域占比', type: 'radar', animationDuration: 2000,
      areaStyle: {
        normal: {
          color: { type: 'linear', opacity: 1, x: 0, y: 0, x2: 0, y2: 1, color: '#2EEFAD' },
        },
      },
      symbolSize: 0,
      lineStyle: { normal: { width: 0 } },
      data: [{ value: numArr }],
    }],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 10000)
  timerIds.push(tid)
}

// Years number stacked bar chart
function initYearsNumChart() {
  const chart = echarts.init(yearsNumIdRef.value)
  chartInstances.push(chart)

  const resArr = [
    { name: '测试11', value: 30 }, { name: '测试22', value: 50 },
    { name: '测试33', value: 40 }, { name: '测试44', value: 35 },
    { name: '测试55', value: 36 }, { name: '测试66', value: 80 },
  ]
  const nameArr = []
  const caiArr = [], cunArr = [], danArr = [], junArr = [], zhenArr = []
  for (let i = 0; i < resArr.length; i++) {
    nameArr.push(resArr[i].name)
    caiArr.push(resArr[i].value)
    cunArr.push(resArr[i].value)
    danArr.push(resArr[i].value)
    junArr.push(resArr[i].value)
    zhenArr.push(resArr[i].value)
  }

  const spNum = 5, _max = 100
  const y_data = nameArr.reverse()
  const _data1 = caiArr.reverse()
  const _data2 = cunArr.reverse()
  const _data3 = danArr.reverse()
  const _data4 = junArr.reverse()
  const _data5 = zhenArr.reverse()

  const fomatter_fn = (v) => (v.value / _max * 100).toFixed(0)
  const _label = {
    normal: {
      show: true, position: 'inside', formatter: fomatter_fn,
      textStyle: { color: '#fff', fontSize: 8 },
    },
  }

  const option = {
    grid: { containLabel: true, left: 0, top: 0, right: 0, bottom: 0 },
    tooltip: {
      show: true, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1,
      textStyle: { color: '#3c3c3c', fontSize: 16 },
      extraCssText: 'box-shadow: 0 0 5px rgba(0, 0, 0, 0.1)',
    },
    xAxis: {
      splitNumber: spNum, interval: _max / spNum, max: _max,
      axisLabel: {
        show: false,
        formatter: (v) => {
          const _v = (v / _max * 100).toFixed(0)
          return _v == 0 ? _v : _v + '%'
        },
      },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: [
      {
        data: y_data,
        axisLabel: { fontSize: 8, color: 'rgba(255,255,255,.7)' },
        axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
      },
      { show: false, data: y_data, axisLine: { show: false } },
    ],
    series: [
      { type: 'bar', name: '财务', stack: '2', label: _label, legendHoverLink: false, barWidth: 7, itemStyle: { normal: { color: '#FD9133' }, emphasis: { color: '#FD9133' } }, data: _data1 },
      { type: 'bar', name: '村务', stack: '2', legendHoverLink: false, barWidth: 20, label: _label, itemStyle: { normal: { color: '#2E8CFF' }, emphasis: { color: '#2E8CFF' } }, data: _data2 },
      { type: 'bar', stack: '2', name: '党务', legendHoverLink: false, barWidth: 20, label: _label, itemStyle: { normal: { color: '#37D2D4' }, emphasis: { color: '#37D2D4' } }, data: _data3 },
      { type: 'bar', stack: '2', name: '居务', legendHoverLink: false, barWidth: 20, label: _label, itemStyle: { normal: { color: '#19CA88' }, emphasis: { color: '#19CA88' } }, data: _data4 },
      { type: 'bar', stack: '2', name: '政务', legendHoverLink: false, barWidth: 20, label: _label, itemStyle: { normal: { color: '#0EFCFF' }, emphasis: { color: '#0EFCFF' } }, data: _data5 },
    ],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 120000)
  timerIds.push(tid)
}

// Content grouped bar chart
function initContentChart() {
  const chart = echarts.init(contentIdRef.value)
  chartInstances.push(chart)

  const resArr = [
    { name: '测试11', value: 30 }, { name: '测试22', value: 50 },
    { name: '测试55', value: 33 }, { name: '测试66', value: 80 },
  ]
  const nameArr = []
  const caiArr = [], cunArr = [], danArr = [], junArr = [], zhenArr = []
  for (let i = 0; i < resArr.length; i++) {
    nameArr.push(resArr[i].name)
    caiArr.push(resArr[i].value)
    cunArr.push(resArr[i].value)
    danArr.push(resArr[i].value)
    junArr.push(resArr[i].value)
    zhenArr.push(resArr[i].value)
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      x: '35%', y: '0%', data: ['财务', '村务', '党务', '居务', '政务'],
      textStyle: { color: '#fff', fontSize: 8 },
      itemWidth: 10, itemHeight: 10,
    },
    calculable: true,
    xAxis: [{
      type: 'category', data: nameArr,
      axisLabel: { interval: 0, textStyle: { fontSize: 8, color: 'rgba(255,255,255,.7)' } },
      axisTick: { show: false }, axisLine: { show: false },
    }],
    yAxis: [
      {
        type: 'value', scale: true, name: '单位：%',
        nameTextStyle: { color: 'rgba(255,255,255,.7)', fontSize: 8 },
        max: 100, min: 0, boundaryGap: [0.2, 0.2],
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { textStyle: { color: 'rgba(255,255,255,.8)', fontSize: 8 } },
        splitLine: { show: true, lineStyle: { color: ['#fff'], opacity: 0.2 } },
      },
      {
        type: 'value', scale: true, show: false, max: 1, min: 0, boundaryGap: [0.2, 0.2],
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { textStyle: { color: 'rgba(255,255,255,.2)' } },
        splitLine: { show: true, lineStyle: { color: ['#fff'], opacity: 0.2 } },
      },
    ],
    color: ['#0EFCFF', '#FD9133'],
    grid: { left: '5%', right: '1%', top: '25%', bottom: '15%' },
    series: [
      { barWidth: '10%', name: '财务', type: 'bar', data: caiArr },
      { animationDuration: 2500, barWidth: '20%', name: '村务', type: 'bar', data: cunArr },
      { animationDuration: 2500, barWidth: '20%', name: '党务', type: 'bar', data: danArr },
      { animationDuration: 2500, barWidth: '20%', name: '居务', type: 'bar', data: junArr },
      { animationDuration: 2500, barWidth: '20%', name: '政务', type: 'bar', data: zhenArr },
    ],
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 90000)
  timerIds.push(tid)
}

// Public num bar chart
function initPublicNumChart() {
  const chart = echarts.init(publicNumIdRef.value)
  chartInstances.push(chart)

  const resArr = [
    { name: '测试11', value: 300 }, { name: '测试22', value: 500 },
    { name: '测试33', value: 400 }, { name: '测试44', value: 350 },
    { name: '测试55', value: 363 }, { name: '测试66', value: 800 },
  ]
  const xunArr = [], jingArr = [], dateArr = []
  for (let i = 0; i < resArr.length; i++) {
    xunArr.push(resArr[i].value)
    jingArr.push(resArr[i].value)
    dateArr.push(resArr[i].name)
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      x: '35%', y: '0%', data: ['巡察', '警示'],
      textStyle: { color: '#fff', fontSize: 8 },
      itemWidth: 10, itemHeight: 10,
    },
    calculable: true,
    xAxis: [{
      type: 'category', data: dateArr,
      axisLabel: { interval: 0, textStyle: { fontSize: 8, color: 'rgba(255,255,255,.7)' } },
      axisTick: { show: false }, axisLine: { show: false },
    }],
    yAxis: [
      {
        type: 'value', scale: true, name: '单位：%',
        nameTextStyle: { color: 'rgba(255,255,255,.7)', fontSize: 8 },
        max: 1000, min: 0, boundaryGap: [0.2, 0.2],
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { textStyle: { color: 'rgba(255,255,255,.8)', fontSize: 8 } },
        splitLine: { show: true, lineStyle: { color: ['#fff'], opacity: 0.2 } },
      },
      {
        type: 'value', scale: true, show: false, max: 1, min: 0, boundaryGap: [0.2, 0.2],
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { textStyle: { color: 'rgba(255,255,255,.2)' } },
        splitLine: { show: true, lineStyle: { color: ['#fff'], opacity: 0.2 } },
      },
    ],
    color: ['#2E8CFF', '#38EB70'],
    grid: { left: '5%', right: '1%', top: '25%', bottom: '15%' },
    series: [
      { animationDuration: 2500, barWidth: '20%', name: '巡察', type: 'bar', data: xunArr },
      { barWidth: '20%', name: '警示', type: 'bar', data: jingArr },
    ],
    animationEasing: 'cubicOut',
  }
  chart.setOption(option)
  const tid = setInterval(() => { chart.clear(); chart.setOption(option) }, 60000)
  timerIds.push(tid)
}

// Guide list auto-scroll (replaces jCarouselLite with smooth continuous scroll)
function initGuideScroll() {
  const listEl = document.querySelector('.main_bottom_t_l_main')
  if (!listEl) return
  const listItems = listEl.querySelectorAll('li')
  if (listItems.length <= 4) return

  const itemHeight = listItems[0].offsetHeight
  const visibleCount = 4
  const totalItems = listItems.length

  // Clone items for seamless looping (like jCarouselLite)
  const ul = listEl.querySelector('ul')
  if (ul && !ul.dataset.cloned) {
    listItems.forEach(li => {
      ul.appendChild(li.cloneNode(true))
    })
    ul.dataset.cloned = 'true'
  }

  let scrollTop = 0
  const maxScroll = totalItems * itemHeight

  listEl.style.overflow = 'hidden'
  listEl.style.maxHeight = (itemHeight * visibleCount) + 'px'

  const tid = setInterval(() => {
    scrollTop += itemHeight
    if (scrollTop >= maxScroll) {
      // Instantly jump back to top without animation for seamless loop
      listEl.scrollTo({ top: 0, behavior: 'auto' })
      scrollTop = itemHeight
      // Then scroll to next position with smooth animation
      setTimeout(() => {
        listEl.scrollTo({ top: scrollTop, behavior: 'smooth' })
      }, 50)
    } else {
      listEl.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, 2000)
  timerIds.push(tid)
}

// Policy list auto-scroll (replaces jCarouselLite with smooth continuous scroll)
function initPolicyScroll() {
  const listEl = document.querySelector('.main_bottom_t_l_main2')
  if (!listEl) return
  const listItems = listEl.querySelectorAll('li')
  if (listItems.length <= 4) return

  const itemHeight = listItems[0].offsetHeight
  const visibleCount = 4
  const totalItems = listItems.length

  // Clone items for seamless looping
  const ul = listEl.querySelector('ul')
  if (ul && !ul.dataset.cloned) {
    listItems.forEach(li => {
      ul.appendChild(li.cloneNode(true))
    })
    ul.dataset.cloned = 'true'
  }

  let scrollTop = 0
  const maxScroll = totalItems * itemHeight

  listEl.style.overflow = 'hidden'
  listEl.style.maxHeight = (itemHeight * visibleCount) + 'px'

  const tid = setInterval(() => {
    scrollTop += itemHeight
    if (scrollTop >= maxScroll) {
      listEl.scrollTo({ top: 0, behavior: 'auto' })
      scrollTop = itemHeight
      setTimeout(() => {
        listEl.scrollTo({ top: scrollTop, behavior: 'smooth' })
      }, 50)
    } else {
      listEl.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, 2000)
  timerIds.push(tid)
}

// Particles.js init
function initParticles() {
  if (!particlesRef.value || typeof window === 'undefined') return
  if (typeof window.particlesJS !== 'function') {
    console.warn('particlesJS not loaded yet, retrying in 100ms...')
    setTimeout(initParticles, 100)
    return
  }
  window.particlesJS('datao-particles', {
    particles: {
      number: { value: 12, density: { enable: true, value_area: 1200 } },
      color: { value: '#ffffff' },
      shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
      opacity: { value: 0.8, random: false, anim: { enable: false } },
      size: { value: 5, random: true, anim: { enable: false } },
      line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
      move: { enable: true, speed: 6, direction: 'none', random: false, straight: false, out_mode: 'out', attract: { enable: false } },
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: {
        grab: { distance: 400, line_linked: { opacity: 1 } },
        bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
        repulse: { distance: 200 },
        push: { particles_nb: 4 },
        remove: { particles_nb: 2 },
      },
    },
    retina_detect: true,
  })
}

// Main init
function init() {
  // Animate all counter values (equivalent to numInit)
  animateAllCounters()

  initParticles()
  initBaseChart()
  initQuestionChart()
  initPublicityChart()
  initThreeTasksChart()
  initDepartmentChart()
  initGuideScroll()
  initPolicyScroll()
  initCoverageChart()
  initYearsNumChart()
  initContentChart()
  initPublicNumChart()

  // Periodic numInit equivalent - re-trigger counter animations every 6s
  const tid = setInterval(() => {
    animateAllCounters()
  }, 6000)
  timerIds.push(tid)
}

onMounted(() => {
  nextTick(() => {
    init()
    // Trigger resize after a short delay to ensure charts fit their containers
    setTimeout(() => {
      handleResize()
    }, 1000)
  })
  // Handle window resize for charts
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(c => c.dispose())
  timerIds.forEach(t => clearInterval(t))
})

function handleResize() {
  chartInstances.forEach(c => c.resize())
}
</script>

<template>
  <div id="datao-particles" ref="particlesRef" class="datao-main datao-page">
    <div class="main_con">
      <!-- Top Section -->
      <div class="main_top">
        <!-- Left Panel -->
        <div class="main_top_left">
          <div class="main_top_left_top">
            <img src="/images/main_top_left.png" />
            <div class="main_top_left_top_title">XX公开数据展示</div>
            <div class="main_top_left_top_con">
              <div class="main_top_left_top_con_list">
                <span class="main_top_left_c_l_n main_top_left_c_l_n1">{{ counterValues[1] }}</span>
                <p>党务公开</p>
              </div>
              <div class="main_top_left_top_con_list">
                <span class="main_top_left_c_l_n main_top_left_c_l_n2">{{ counterValues[2] }}</span>
                <p>政务公开</p>
              </div>
              <div class="main_top_left_top_con_list">
                <span class="main_top_left_c_l_n main_top_left_c_l_n3">{{ counterValues[3] }}</span>
                <p>财务公开</p>
              </div>
              <div class="main_top_left_top_con_left">
                <div class="main_top_left_t_c_l_left">
                  <span class="main_top_left_c_l_n main_top_left_c_l_n4">{{ counterValues[4] }}</span>
                  <p>村务公开</p>
                </div>
                <div class="main_top_left_t_c_l_right">
                  <span class="main_top_left_c_l_n main_top_left_c_l_n5">{{ counterValues[5] }}</span>
                  <p>居务公开</p>
                </div>
              </div>
              <div class="main_top_left_top_con_right main_top_left_top_con_right2">
                <div class="main_top_left_t_c_r_left">
                  <span class="main_top_left_c_l_n">0</span>
                  <p>占位公开</p>
                </div>
                <div class="main_top_left_t_c_r_right">
                  <span class="main_top_left_c_l_n">0</span>
                  <p>占位公开</p>
                </div>
              </div>
            </div>
          </div>
          <div class="main_top_left_top main_top_left_bottom">
            <img src="/images/main_top_left.png" />
            <div class="main_top_left_top_title">XX信息员添加数据展示</div>
            <div ref="baseIdRef" class="main_top_left_top_con"></div>
          </div>
        </div>

        <!-- Middle Panel -->
        <div class="main_top_middle">
          <div class="main_top_middle_top_title">
            <img class="title_bg" src="/images/title_bg.png" />
            XXXXXX服务大数据可视化监管平台
            <a class="title_web" href="" target="blank">管理系统</a>
            <a class="title_admin" href="" target="blank">web网页</a>
          </div>
          <div class="main_top_middle_num_title">XX公开数量</div>
          <div class="main_top_middle_num">
            <div class="main_top_middle_num_list">
              <img src="/images/center_num.png" />
              <p>{{ centerNums[4] }}</p>
            </div>
            <div class="main_top_middle_num_list">
              <img src="/images/center_num.png" />
              <p>{{ centerNums[3] }}</p>
            </div>
            <div class="main_top_middle_num_list">
              <img src="/images/center_num.png" />
              <p>{{ centerNums[2] }}</p>
            </div>
            <div class="main_top_middle_num_list">
              <img src="/images/center_num.png" />
              <p>{{ centerNums[1] }}</p>
            </div>
            <div class="main_top_middle_num_list">
              <img src="/images/center_num.png" />
              <p>{{ centerNums[0] }}</p>
            </div>
          </div>
          <div class="main_top_middle_bottom">
            <div class="main_top_middle_bottom_echarts">
              <img src="/images/main_top_bottom.png" />
              <div class="main_top_echarts_con">
                <div class="main_top_echarts_con_title">XX公开数量占比</div>
                <div ref="threeTasksIdRef" class="main_top_echarts_pie"></div>
              </div>
            </div>
            <div class="main_top_middle_bottom_echarts main_top_middle_bottom_echarts_right">
              <img src="/images/main_top_bottom.png" />
              <div class="main_top_echarts_con">
                <div class="main_top_echarts_con_title">XX公开数量占比</div>
                <div ref="publicityIdRef" class="main_top_echarts_pie"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel -->
        <div class="main_top_left main_top_right">
          <div class="main_top_left_top">
            <img src="/images/main_top_left.png" />
            <div class="main_top_left_top_title">XX数据展示</div>
            <div class="main_top_left_top_con">
              <div class="main_top_left_top_con_left">
                <span class="daysData">{{ daysData }}</span>
                <p>今日公开</p>
              </div>
              <div class="main_top_left_top_con_right">
                <span class="weekData">{{ weekData }}</span>
                <p>本周公开</p>
              </div>
              <div class="main_top_left_top_con_list">
                <span class="monthData">{{ monthData }}</span>
                <p>本月公开</p>
              </div>
              <div class="main_top_left_top_con_list">
                <span class="someThing">{{ someThing }}</span>
                <p>办事指南</p>
              </div>
              <div class="main_top_left_top_con_list">
                <span class="policyData">{{ policyData }}</span>
                <p>政策解读</p>
              </div>
            </div>
          </div>
          <div class="main_top_left_top main_top_left_bottom">
            <img src="/images/main_top_left.png" />
            <div class="main_top_left_top_title">XXXX数量类型占比</div>
            <div ref="questionIdRef" class="main_top_left_top_con"></div>
          </div>
        </div>
      </div>

      <!-- Middle Stats Bar -->
      <div class="main_middle">
        <div class="main_middle_list" v-for="(item, i) in middleListData" :key="i">
          <img src="/images/main_middle.png" />
          <div class="main_list_title"> {{ item.name }}</div>
          <span class="main_list_title_num">{{ item.value }}</span>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="main_bottom">
        <div class="main_bottom_top">
          <!-- Guide List -->
          <div class="main_bottom_top_list">
            <img src="/images/main_bottopm_top1.png" />
            <div class="main_bottom_t_l_title">XX指南</div>
            <div class="main_bottom_t_l_con">
              <div class="main_bottom_t_l_main">
                <ul>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_t_list_title1">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_t_list_time1">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_t_list_title2">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_t_list_time2">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_t_list_title3">更多模板请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_t_list_time3">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_t_list_title4">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_t_list_time4">2020/05/20</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Department Chart -->
          <div class="main_bottom_top_list">
            <img src="/images/main_bottopm_top2.png" />
            <div class="main_bottom_t_l_title">XXXX公开占比</div>
            <div ref="departmentIdRef" class="main_bottom_t_l_chart"></div>
          </div>

          <!-- Policy List -->
          <div class="main_bottom_top_list">
            <img src="/images/main_bottopm_top1.png" />
            <div class="main_bottom_t_l_title">政策XX</div>
            <div class="main_bottom_t_l_con">
              <div class="main_bottom_t_l_main2">
                <ul>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_polity_title1">更多模板请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_polity_time1">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_polity_title2">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_polity_time1">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_polity_title3">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_polity_time1">2020/05/20</div>
                    </div>
                  </li>
                  <li>
                    <div class="main_bottom_t_l_main_list">
                      <div class="main_bottom_t_list_title main_bottom_polity_title4">如需商用请联系：863512936</div>
                      <div class="main_bottom_t_list_time main_bottom_polity_time1">2020/05/20</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Charts Row -->
        <div class="main_bottom_bottom">
          <div class="main_bottom_b_left">
            <img src="/images/main_bottom_bottom.png" />
            <div class="main_bottom_b_title">主要关注XXXX占比</div>
            <div ref="coverageIdRef" class="main_bottom_b_con"></div>
          </div>
          <div class="main_bottom_b_middle1">
            <img src="/images/main_bootm_middle.png" />
            <div class="main_bottom_b_title">关注XXXX占比</div>
            <div ref="contentIdRef" class="main_bottom_b_con main_bottom_b_con2"></div>
          </div>
          <div class="main_bottom_b_middle2">
            <img src="/images/main_bootm_middle.png" />
            <div class="main_bottom_b_title">XXXX发布量</div>
            <div ref="publicNumIdRef" class="main_bottom_b_con main_bottom_b_con2"></div>
          </div>
          <div class="main_bottom_b_right">
            <img src="/images/main_bottom_bottom.png" />
            <div class="main_bottom_b_title">XXX公开数量</div>
            <div ref="yearsNumIdRef" class="main_bottom_b_con"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ===== Number animation styles ===== */
.daysData, .weekData, .monthData, .someThing, .policyData,
.main_top_left_c_l_n, .main_list_title_num, .main_top_middle_num_list p {
  transition: all 0.1s ease-out;
}

/* ===== Particles background ===== */
#datao-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

#datao-particles canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ===== Reset CSS (adapted from reset.css) ===== */
.datao-page {
  width: 100%;
  height: 100%;
  font-size: 12px;
  line-height: 1.5;
  font-family: \5FAE\8F6F\96C5\9ED1, \5B8B\4F53, "Hiragino Sans GB", STHeiti, "WenQuanYi Micro Hei", "Droid Sans Fallback", SimSun, sans-serif;
  position: relative;
  background: url(/images/background.jpg) no-repeat;
  background-size: cover;
  margin: 0;
  padding: 0;
}

.datao-main {
  position: relative;
  z-index: 1;
}

/* Original uses default box-sizing (content-box) */

/* Reset margins/padding only on elements that have browser defaults.
   Do NOT include div, span, a here — they have no browser defaults and
   including them with .datao-page prefix gives 0,1,1 specificity which
   overrides the layout rules (0,1,0) from index.css, breaking margins. */
.datao-page h1, .datao-page h2, .datao-page h3,
.datao-page h4, .datao-page h5, .datao-page h6, .datao-page p,
.datao-page dl, .datao-page dt, .datao-page dd, .datao-page ol,
.datao-page ul, .datao-page li, .datao-page fieldset, .datao-page form,
.datao-page label, .datao-page input, .datao-page legend, .datao-page table,
.datao-page caption, .datao-page tbody, .datao-page tfoot, .datao-page thead,
.datao-page tr, .datao-page th, .datao-page td, .datao-page textarea {
  margin: 0;
  padding: 0;
}
.datao-page div, .datao-page span {
  padding: 0;
}

.datao-page h1, .datao-page h2, .datao-page h3,
.datao-page h4, .datao-page h5, .datao-page h6 {
  font-size: 100%;
  font-weight: normal;
}

.datao-page ul, .datao-page ol {
  list-style: none;
}

.datao-page img {
  border: 0 none;
  vertical-align: top;
}

.datao-page strong, .datao-page em, .datao-page i {
  font-style: normal;
  font-weight: normal;
}

.datao-page a {
  text-decoration: none;
  color: #333;
}

.datao-page a:hover {
  text-decoration: underline;
}

/* ===== Index CSS (from index.css) ===== */
.main_con {
  position: absolute;
  width: 97%;
  height: 95%;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
.main_top {
  width: 100%;
  height: 37%;
}
.main_top_left {
  float: left;
  width: 17.3%;
  height: 100%;
}
.main_top_left_top {
  position: relative;
  width: 100%;
  height: 46%;
}
.main_top_left_bottom {
  margin-top: 4%;
}
.main_top_left_bottom_num {
  width: 100%;
}
.main_top_left_bottom_num span {
  float: left;
  display: block;
  font-size: .65vw;
}
.main_top_left_bottom_num_list {
  float: left;
  width: 8%;
  height: 1.4vw;
  line-height: 1.4vw;
  margin-left: .2vw;
  text-indent: .4vw;
  font-size: .8vw;
  color: white;
  margin-top: .2vw;
  background: #37D2D4;
}
.main_top_left_bottom_bar {
  float: left;
  width: 100%;
  height: .6vw;
  line-height: 0;
  margin-top: .6vw;
}
.main_top_left_bottom_bar span {
  position: relative;
  float: left;
  display: block;
  font-size: .65vw;
  top: -.15vw;
  -webkit-transform-origin-x: 0;
  transform: scale(0.7);
  -webkit-transform: scale(0.7);
}
.main_top_left_bottom_bar .bar_num {
  color: #0EFCFF;
  margin-left: 3%;
  -webkit-transform-origin-x: 0;
  transform: scale(0.7);
  -webkit-transform: scale(0.7);
}
.bar_father {
  float: left;
  position: relative;
  width: 75%;
  background: rgba(31,103,163,0.2);
  height: 100%;
  margin-left: 3%;
  border-radius: 90px;
}
.bar_child {
  position: absolute;
  left: 0;
  width: 0%;
  height: 100%;
  border-radius: 90px;
  transition: all 2s;
  background-image: linear-gradient(90deg, #3E94CD 0%, #56D4F1 49%, #38E1E1 99%);
}
.main_top_left_top img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_top_left_top_title {
  text-align: center;
  color: #0EFCFF;
  font-size: .75vw;
  padding-top: .2vw;
}
.main_top_left_top_con {
  width: 92%;
  height: 71%;
  margin: auto;
  margin-top: 3%;
  color: white;
  font-size: .7vw;
}
.main_top_left_top_con span {
  display: inline-block;
  margin-top: .4vw;
  text-indent: 0vw;
}
.main_top_left_top_con_left {
  float: left;
  height: 48%;
  width: 49%;
  text-align: center;
  margin-top: 1.5%;
}
.main_top_left_t_c_l_left, .main_top_left_t_c_l_right,
.main_top_left_t_c_r_right, .main_top_left_t_c_r_left {
  float: left;
  width: 48%;
  height: 100%;
  text-align: center;
  background: #FD9133;
  font-size: .7vw;
}
.main_top_left_t_c_l_right, .main_top_left_t_c_r_right {
  background: #F6D10E;
  margin-left: 4%;
}
.main_top_left_t_c_r_right {
  background: #F6580E;
}
.main_top_left_t_c_r_left {
  background: #2E8CFF;
}
.main_top_left_top_con_left .main_top_left_c_l_n {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
}
.main_top_left_top_con_left p {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main_top_left_top_con_right {
  float: right;
  height: 48%;
  width: 49%;
  text-align: center;
  margin-top: 1.5%;
}
.main_top_left_top_con_right .main_top_left_c_l_n {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main_top_left_top_con_right p {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main_top_left_top_con_right2 p {
  margin-top: -7%;
}
.main_top_left_top_con_list {
  float: left;
  height: 48%;
  width: 32%;
  text-align: center;
  margin-left: 2%;
}
.main_top_left_top_con_list .main_top_left_c_l_n {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
}
.main_top_left_top_con_list p {
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
}
.main_top_left_top_con_list:nth-child(1) {
  background: #37D2D4;
  margin-left: 0;
}
.main_top_left_top_con_list:nth-child(2) {
  background: #19CA88;
}
.main_top_left_top_con_list:nth-child(3) {
  background: #858FF8;
}
.main_top_middle {
  float: left;
  width: 63%;
  height: 100%;
  margin-left: 1.2%;
}
.main_top_middle_top_title {
  position: relative;
  width: 100%;
  text-align: center;
  font-size: 1.7vw;
  font-weight: bold;
  color: #0EFCFF;
  height: 14%;
}
.main_top_middle_top_title .title_bg {
  position: absolute;
  left: 7%;
  top: -20%;
  width: 86%;
  height: 140%;
}
.title_web {
  position: absolute;
  right: -.8%;
  top: 0;
  padding: .5% 2%;
  font-size: .7vw;
  color: #0EFCFF;
  border: 1px solid #0EFCFF;
  -webkit-transform-origin-x: 0;
  transform: scale(0.9);
  -webkit-transform: scale(0.9);
}
.title_admin {
  position: absolute;
  left: 0;
  top: 0;
  padding: .5% 2%;
  font-size: .7vw;
  color: #0EFCFF;
  border: 1px solid #0EFCFF;
  -webkit-transform-origin-x: 0;
  transform: scale(0.9);
  -webkit-transform: scale(0.9);
}
.main_top_middle_num_title {
  float: left;
  color: #0EFCFF;
  font-size: 1.5vw;
  margin-left: 13%;
  line-height: 4.5vw;
  width: 18%;
  margin-top: .5vw;
}
.main_top_middle_num {
  float: left;
  width: 55%;
  height: 23%;
  margin: .7% auto;
  margin-top: 1.5%;
}
.main_top_middle_num_list {
  position: relative;
  float: left;
  height: 100%;
  width: 12%;
  margin-left: 2.6%;
  font-size: 2vw;
  font-weight: bold;
  color: #0EFCFF;
  line-height: 240%;
}
.main_top_middle_num_list p {
  text-align: center;
}
.main_top_middle_num_list:nth-child(1) {
  margin-left: 0;
}
.main_top_middle_num_list img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_top_middle_bottom {
  float: left;
  width: 100%;
  height: 49.8%;
  margin-top: .5%;
}
.main_top_middle_bottom_echarts {
  position: relative;
  float: left;
  width: 49%;
  height: 100%;
}
.main_top_middle_bottom_echarts_right {
  float: right;
}
.main_top_middle_bottom_echarts img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_top_echarts_con {
  width: 92%;
  height: 82%;
  margin: 2% auto;
}
.main_top_echarts_con_title {
  font-size: .8vw;
  color: #0EFCFF;
}
.main_top_echarts_pie {
  width: 100%;
  height: 90%;
}
.main_top_right {
  float: right;
}
.main_top_right .main_top_left_top_con_left {
  float: left;
  height: 48%;
  width: 49%;
  background: #37D2D4;
}
.main_top_right .main_top_left_top_con_right {
  float: right;
  height: 48%;
  width: 49%;
  background: #19CA88;
}
.main_top_right .main_top_left_top_con_list {
  float: left;
  height: 48%;
  width: 32%;
  margin-left: 2%;
  margin-top: 1.5%;
}
.main_top_right .main_top_left_top_con_list:nth-child(3) {
  background: #858FF8;
  margin-left: 0;
}
.main_top_right .main_top_left_top_con_list:nth-child(4) {
  background: #2E8CFF;
}
.main_top_right .main_top_left_top_con_list:nth-child(5) {
  background: #FD9133;
}
.main_middle {
  height: 7.1%;
  width: 100%;
}
.main_middle_list {
  position: relative;
  float: left;
  width: 18.5%;
  height: 100%;
  background: rgba(11,76,151,0.10);
  margin-left: 1.875%;
  box-shadow: 1px 2px 10px 1px rgba(14,252,255,0.53), inset 5px 4px 100px 1px rgba(14,252,255,0.34);
}
.main_middle_list img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_middle_list:nth-child(1) {
  margin-left: 0;
}
.main_list_title {
  font-size: .75vw;
  color: #0EFCFF;
  text-indent: .8vw;
  padding-top: .5vw;
}
.main_middle_list span {
  display: inline-block;
  width: 100%;
  font-size: 1.4vw;
  font-weight: bold;
  color: white;
  text-align: center;
  letter-spacing: .2vw;
  margin-top: -.5vw;
}
.main_bottom {
  height: 55.9%;
  width: 100%;
}
.main_bottom_top {
  float: left;
  width: 100%;
  height: 36.5%;
  margin-top: 1.5%;
}
.main_bottom_top_list {
  position: relative;
  float: left;
  width: 32%;
  height: 100%;
  margin-left: 2%;
}
.main_bottom_top_list:nth-child(1) {
  margin-left: 0;
}
.main_bottom_top_list img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_bottom_t_l_title {
  z-index: 80;
  position: relative;
  width: 100%;
  padding-top: 1.6vw;
  font-size: .8vw;
  color: white;
  text-indent: 3.2vw;
}
.main_bottom_t_l_chart {
  z-index: 77;
  position: relative;
  width: 90%;
  height: 84%;
  margin: auto;
  margin-top: -5%;
}
.main_bottom_t_l_con {
  z-index: 77;
  position: relative;
  width: 92%;
  height: 60%;
  margin: auto;
  margin-top: 3%;
}
.main_bottom_t_l_main, .main_bottom_t_l_main2 {
  width: 100%;
}
.main_bottom_t_l_main_list {
  font-size: .7vw;
  line-height: 1.6vw;
  height: 1.6vw;
  color: white;
}
.main_bottom_t_l_main2 .main_bottom_t_l_main_list {
  font-size: .7vw;
  line-height: 1.6vw;
  height: 1.6vw;
  color: white;
}
.main_bottom_t_list_title {
  float: left;
  width: 70%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main_bottom_t_list_time {
  float: left;
  width: 30%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}
.main_bottom_bottom {
  float: left;
  width: 100%;
  height: 54%;
  margin-top: 1%;
}
.main_bottom_b_left, .main_bottom_b_right {
  position: relative;
  float: left;
  width: 17.3%;
  height: 100%;
}
.main_bottom_b_left img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_bottom_b_middle1, .main_bottom_b_middle2 {
  position: relative;
  float: left;
  width: 30%;
  height: 100%;
  margin-left: 1.8%;
}
.main_bottom_b_right {
  margin-left: 1.8%;
}
.main_bottom_b_right img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_bottom_b_middle1 img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_bottom_b_middle2 img {
  position: absolute;
  width: 100%;
  height: 100%;
}
.main_bottom_b_title {
  font-size: .8vw;
  text-align: center;
  color: #0EFCFF;
  padding-top: .3vw;
}
.main_bottom_b_con {
  width: 90%;
  height: 75%;
  margin: auto;
  margin-top: 8%;
}
.main_bottom_b_con2 {
  height: 70%;
}
</style>
