/**
 * 物流坐标中转服务（内存存储 + SSE 实时推送）
 *
 * 小程序 → POST /api/location → 内存存储 → SSE 推送 → 高德地图 H5
 *
 * 启动：node server/location-server.cjs
 * 端口：3001
 */

const http = require('http')

// ====================== 内存存储 ======================
// key: deviceId, value: { lng, lat, speed, heading, deviceId, updateTime }
const locationStore = new Map()
const MAX_AGE = 10 * 60 * 1000 // 坐标过期时间：10分钟

// SSE 客户端连接池：deviceId → Set<ServerResponse>
const sseClients = new Map()

/** 向指定 deviceId 的所有 SSE 客户端广播位置数据 */
function sseBroadcast(deviceId, record) {
  const clients = sseClients.get(deviceId)
  if (!clients || clients.size === 0) return
  const msg = `data: ${JSON.stringify({ type: 'location', data: record })}\n\n`
  for (const res of clients) {
    try { res.write(msg) } catch { /* 客户端已断开，close 事件会清理 */ }
  }
}

// ====================== CORS 头 ======================
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// ====================== JSON 解析 ======================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

// ====================== 工具函数 ======================
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// 清理过期数据
function cleanExpired() {
  const now = Date.now()
  for (const [key, val] of locationStore) {
    if (now - val.updateTime > MAX_AGE) {
      locationStore.delete(key)
    }
  }
}
setInterval(cleanExpired, 60 * 1000)

// ====================== 路由处理 ======================
const server = http.createServer(async (req, res) => {
  setCors(res)

  // 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  // ============ POST /api/location — 上报坐标 ============
  if (pathname === '/api/location' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { lng, lat, speed = 0, heading = 0, deviceId = 'default' } = body

      // 参数校验
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return sendJSON(res, 400, { code: -1, message: '缺少 lng / lat 参数' })
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return sendJSON(res, 400, { code: -1, message: '坐标超出有效范围' })
      }

      const record = {
        lng,
        lat,
        speed: Number(speed),
        heading: Number(heading),
        deviceId,
        updateTime: Date.now()
      }
      // 以 deviceId 为 key 存入内存 Map，后续 GET 请求可通过 deviceId 查询最新坐标
      locationStore.set(deviceId, record)

      console.log(`[上报] device=${deviceId} lng=${lng} lat=${lat} speed=${speed} heading=${heading}`)
      sseBroadcast(deviceId, record) // 实时推送给在线 H5 客户端
      sendJSON(res, 200, { code: 0, message: 'ok', data: record })
    } catch (e) {
      sendJSON(res, 400, { code: -1, message: e.message })
    }
    return
  }

  // ============ GET /api/location — 查询最新坐标 ============
  if (pathname === '/api/location' && req.method === 'GET') {
    const deviceId = url.searchParams.get('deviceId') || 'default'
    const record = locationStore.get(deviceId)

    if (!record) {
      return sendJSON(res, 200, { code: 0, message: '暂无坐标数据', data: null })
    }

    // 检查是否过期
    if (Date.now() - record.updateTime > MAX_AGE) {
      locationStore.delete(deviceId)
      return sendJSON(res, 200, { code: 0, message: '坐标已过期', data: null })
    }

    sendJSON(res, 200, { code: 0, message: 'ok', data: record })
    return
  }

  // ============ GET /api/location/stream — SSE 实时推送 ============
  if (pathname === '/api/location/stream' && req.method === 'GET') {
    const deviceId = url.searchParams.get('deviceId') || 'default'

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })

    // 注册到连接池
    if (!sseClients.has(deviceId)) {
      sseClients.set(deviceId, new Set())
    }
    sseClients.get(deviceId).add(res)
    console.log(`[SSE] 客户端已连接, deviceId=${deviceId}, 在线=${sseClients.get(deviceId).size}`)

    // 立即推送当前缓存的最新坐标（可选，让页面立即显示）
    const cached = locationStore.get(deviceId)
    if (cached && (Date.now() - cached.updateTime <= MAX_AGE)) {
      res.write(`data: ${JSON.stringify({ type: 'location', data: cached })}\n\n`)
    }

    // 客户端断开时清理
    req.on('close', () => {
      const clients = sseClients.get(deviceId)
      if (clients) {
        clients.delete(res)
        if (clients.size === 0) sseClients.delete(deviceId)
        console.log(`[SSE] 客户端断开, deviceId=${deviceId}, 在线=${clients.size}`)
      }
    })

    return
  }

  // ============ GET /api/locations — 查询所有在线设备 ============
  if (pathname === '/api/locations' && req.method === 'GET') {
    cleanExpired()
    const devices = []
    for (const [key, val] of locationStore) {
      devices.push(val)
    }
    sendJSON(res, 200, { code: 0, message: 'ok', data: devices })
    return
  }

  // ============ GET /api/health — 健康检查 ============
  if (pathname === '/api/health') {
    sendJSON(res, 200, { code: 0, message: 'ok', online: locationStore.size })
    return
  }

  // 404
  sendJSON(res, 404, { code: -1, message: 'Not Found' })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`🚚 物流坐标中转服务已启动: http://localhost:${PORT}`)
  console.log(`   上报坐标: POST http://localhost:${PORT}/api/location`)
  console.log(`   查询坐标: GET  http://localhost:${PORT}/api/location?deviceId=default`)
  console.log(`   实时推送: GET  http://localhost:${PORT}/api/location/stream?deviceId=default`)
  console.log(`   全部设备: GET  http://localhost:${PORT}/api/locations`)
})
