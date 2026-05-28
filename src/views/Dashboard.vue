<template>
  <div class="irradiation-dashboard">
    <!-- 星空背景 -->
    <canvas ref="starCanvasRef"></canvas>

    <!-- Header -->
    <header class="hd">
      <div class="hd-side">
        <div class="live-dot">
          <div class="dot"></div>
          实时监测中
        </div>
      </div>
      <div class="hd-center">
        <div class="hd-title">辐照企业大数据监管平台</div>
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

        <!-- 中间：自动化输送线 v2 -->
        <div class="conveyor-v2">
          <span class="cv2-corner cv2-tl"></span>
          <span class="cv2-corner cv2-tr"></span>
          <span class="cv2-corner cv2-bl"></span>
          <span class="cv2-corner cv2-br"></span>
          <!-- 顶部标题 -->
          <div class="cv2-header">
            <div class="cv2-header-left">
              <span class="cv2-live-dot"></span>
              <span class="cv2-title">自动化输送线</span>
              <span class="cv2-sep">·</span>
              <span class="cv2-subtitle">实时流程</span>
            </div>
            <div class="cv2-header-right">
              <span class="cv2-tag cv2-tag-cyan"><span class="cv2-tag-dot"></span>当前物料批次</span>
              <span class="cv2-tag cv2-tag-dim">B2605-441</span>
            </div>
          </div>
          <!-- SVG 流程 -->
          <div class="cv2-params-bar">
            <div class="cv2-param-item">
              <span class="cv2-param-label">剂量</span>
              <span class="cv2-param-value">25</span>
              <span class="cv2-param-unit">kGy</span>
            </div>
            <div class="cv2-param-divider"></div>
            <div class="cv2-param-item">
              <span class="cv2-param-label">速度</span>
              <span class="cv2-param-value">3.2</span>
              <span class="cv2-param-unit">m/min</span>
            </div>
            <div class="cv2-param-divider"></div>
            <div class="cv2-param-item">
              <span class="cv2-param-label">高压</span>
              <span class="cv2-param-value">10.0</span>
              <span class="cv2-param-unit">MeV</span>
            </div>
            <div class="cv2-param-divider"></div>
            <div class="cv2-param-item">
              <span class="cv2-param-label">束流</span>
              <span class="cv2-param-value">12.5</span>
              <span class="cv2-param-unit">mA</span>
            </div>
            <div class="cv2-param-status-badge">
              <span class="cv2-param-status-dot"></span>
              运行中
            </div>
          </div>
          <div class="cv2-svg-wrap">
            <svg class="cv2-svg" viewBox="0 0 620 148" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="cv2arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                  <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="#00e5ff"/>
                </marker>
                <filter id="cv2glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="b1"/>
                  <feGaussianBlur stdDeviation="9" result="b2"/>
                  <feMerge>
                    <feMergeNode in="b2"/>
                    <feMergeNode in="b1"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="cv2soft" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="b"/>
                  <feMerge>
                    <feMergeNode in="b"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <radialGradient id="cv2irrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.2"/>
                  <stop offset="55%" stop-color="#0066bb" stop-opacity="0.07"/>
                  <stop offset="100%" stop-color="#002244" stop-opacity="0.02"/>
                </radialGradient>
                <linearGradient id="cv2scanbeam" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
                  <stop offset="40%" stop-color="#00e5ff" stop-opacity="0.55"/>
                  <stop offset="50%" stop-color="#ffffff" stop-opacity="0.75"/>
                  <stop offset="60%" stop-color="#00e5ff" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="cv2rail" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.08"/>
                  <stop offset="25%" stop-color="#00e5ff" stop-opacity="0.55"/>
                  <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.9"/>
                  <stop offset="75%" stop-color="#00e5ff" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#00e5ff" stop-opacity="0.08"/>
                </linearGradient>
                <clipPath id="cv2clip">
                  <rect x="204" y="24" width="206" height="120" rx="10"/>
                </clipPath>
              </defs>

              <!-- 背景点阵 -->
              <g opacity="0.055">
                <line x1="0" y1="37" x2="620" y2="37" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="0" y1="74" x2="620" y2="74" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="0" y1="111" x2="620" y2="111" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="103" y1="0" x2="103" y2="148" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="204" y1="0" x2="204" y2="148" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="307" y1="0" x2="307" y2="148" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="410" y1="0" x2="410" y2="148" stroke="#00e5ff" stroke-width="0.6"/>
                <line x1="517" y1="0" x2="517" y2="148" stroke="#00e5ff" stroke-width="0.6"/>
              </g>

              <!-- ══ 主传送轨道 ══ -->
              <rect x="8" y="82" width="604" height="16" rx="8" fill="rgba(0,0,0,0.5)"/>
              <rect x="8" y="80" width="604" height="16" rx="8" fill="rgba(0,18,38,0.85)" stroke="rgba(0,229,255,0.28)"
                    stroke-width="1.2"/>
              <rect x="8" y="80" width="604" height="4" rx="3" fill="url(#cv2rail)" opacity="0.55"/>
              <rect x="8" y="92" width="604" height="4" rx="3" fill="rgba(0,229,255,0.04)"/>
              <!-- 精细滚轴 -->
              <g fill="rgba(0,229,255,0.4)">
                <rect x="18" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="34" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="50" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="66" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="82" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="113" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="129" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="145" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="161" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="177" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="193" y="81" width="2.5" height="14" rx="1.2"/>
              </g>
              <g fill="rgba(0,229,255,0.55)">
                <rect x="218" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="234" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="250" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="266" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="282" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="298" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="314" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="330" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="346" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="362" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="378" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="394" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="404" y="81" width="2.5" height="14" rx="1.2"/>
              </g>
              <g fill="rgba(0,229,255,0.4)">
                <rect x="424" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="440" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="456" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="472" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="488" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="525" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="541" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="557" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="573" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="589" y="81" width="2.5" height="14" rx="1.2"/>
                <rect x="605" y="81" width="2.5" height="14" rx="1.2"/>
              </g>
              <!-- 流动虚线 -->
              <line x1="8" y1="88" x2="612" y2="88" stroke="#00e5ff" stroke-width="1.2" stroke-dasharray="9 6"
                    opacity="0.38">
                <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="0.65s" repeatCount="indefinite"/>
              </line>

              <!-- ══ 进货缓存区 ══ -->
              <rect x="10" y="42" width="93" height="94" rx="8" fill="rgba(0,180,255,0.04)"
                    stroke="rgba(26,240,255,0.22)" stroke-width="1"/>
              <line x1="10" y1="50" x2="103" y2="50" stroke="rgba(26,240,255,0.4)" stroke-width="0.8"/>
              <rect x="10" y="42" width="93" height="94" rx="8" fill="none" stroke="#1af0ff" stroke-width="1.3"
                    stroke-dasharray="5 4" opacity="0.18">
                <animate attributeName="opacity" values="0.18;0.52;0.18" dur="3.1s" repeatCount="indefinite"/>
              </rect>
              <rect x="18" y="28" width="70" height="16" rx="3" fill="rgba(0,8,24,0.9)" stroke="rgba(26,240,255,0.45)"
                    stroke-width="0.8"/>
              <text x="53" y="40" text-anchor="middle" font-size="8.5" fill="#1af0ff" font-weight="700"
                    letter-spacing="1.2">进货缓存
              </text>
              <text x="56" y="121" text-anchor="middle" font-size="9.5" fill="rgba(26,240,255,0.85)" font-weight="600">
                缓存区
              </text>
              <text x="56" y="134" text-anchor="middle" font-size="9" fill="rgba(26,240,255,0.6)" font-weight="500">{{
                  zoneCounts[0]
                }}
              </text>

              <!-- ══ 入射检区 ══ -->
              <rect x="108" y="42" width="90" height="94" rx="8" fill="rgba(0,255,160,0.04)"
                    stroke="rgba(0,255,160,0.18)" stroke-width="1"/>
              <line x1="108" y1="50" x2="198" y2="50" stroke="rgba(0,255,160,0.32)" stroke-width="0.8"/>
              <rect x="108" y="42" width="90" height="94" rx="8" fill="none" stroke="#00ffa0" stroke-width="1.2"
                    stroke-dasharray="4 3" opacity="0.16">
                <animate attributeName="opacity" values="0.16;0.48;0.16" dur="2.7s" repeatCount="indefinite"/>
              </rect>
              <rect x="119" y="28" width="60" height="16" rx="3" fill="rgba(0,8,20,0.9)" stroke="rgba(0,255,160,0.4)"
                    stroke-width="0.8"/>
              <text x="149" y="40" text-anchor="middle" font-size="8.5" fill="#00ffa0" font-weight="700"
                    letter-spacing="1.2">入射检
              </text>
              <text x="153" y="121" text-anchor="middle" font-size="9.5" fill="rgba(0,255,160,0.85)" font-weight="600">
                检测中
              </text>
              <text x="153" y="134" text-anchor="middle" font-size="9" fill="rgba(0,255,160,0.6)" font-weight="500">{{
                  zoneCounts[1]
                }}
              </text>

              <!-- ══ 辐照核心区 ══ -->
              <!-- 背景光晕层 -->
              <rect x="200" y="20" width="214" height="126" rx="12" fill="rgba(0,229,255,0.04)" filter="url(#cv2glow)"/>
              <!-- 主容器 -->
              <rect x="204" y="24" width="206" height="118" rx="10" fill="url(#cv2irrad)" stroke="#00e5ff"
                    stroke-width="2.5" filter="url(#cv2soft)"/>
              <!-- 内边框 -->
              <rect x="209" y="29" width="196" height="108" rx="7" fill="none" stroke="rgba(0,229,255,0.28)"
                    stroke-width="0.8"/>
              <!-- 流动边框 -->
              <rect x="204" y="24" width="206" height="118" rx="10" fill="none" stroke="#00e5ff" stroke-width="1.5"
                    stroke-dasharray="14 7" opacity="0.55">
                <animate attributeName="stroke-dashoffset" from="0" to="-42" dur="1.4s" repeatCount="indefinite"/>
              </rect>
              <!-- 扫描光束（加宽加亮） -->
              <rect x="209" y="24" width="196" height="6" fill="url(#cv2scanbeam)" opacity="0.8"
                    clip-path="url(#cv2clip)">
                <animate attributeName="y" values="24;142;24" dur="2.2s" repeatCount="indefinite"/>
              </rect>

              <!-- 扩散波纹层 1（核心脉冲） -->
              <circle cx="307" cy="83" r="10" fill="none" stroke="#00e5ff" stroke-width="2.5" opacity="0">
                <animate attributeName="r" values="10;58" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <!-- 扩散波纹层 2 -->
              <circle cx="307" cy="83" r="10" fill="none" stroke="#7fff00" stroke-width="1.8" opacity="0">
                <animate attributeName="r" values="10;54" dur="2.2s" begin="0.7s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0" dur="2.2s" begin="0.7s" repeatCount="indefinite"/>
              </circle>
              <!-- 扩散波纹层 3 -->
              <circle cx="307" cy="83" r="10" fill="none" stroke="#00e5ff" stroke-width="1.2" opacity="0">
                <animate attributeName="r" values="10;48" dur="1.8s" begin="1.4s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0" dur="1.8s" begin="1.4s" repeatCount="indefinite"/>
              </circle>
              <!-- 扩散波纹层 4（大外环） -->
              <circle cx="307" cy="83" r="10" fill="none" stroke="rgba(127,255,0,0.5)" stroke-width="1" opacity="0">
                <animate attributeName="r" values="10;65" dur="2.8s" begin="0.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.35;0" dur="2.8s" begin="0.3s" repeatCount="indefinite"/>
              </circle>

              <!-- 辐射粒子喷射效果 -->
              <g opacity="0.6">
                <circle r="1.5" fill="#7fff00">
                  <animateMotion path="M307,83 L307,83" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="307" cy="83" r="0" fill="#7fff00" opacity="0">
                  <animate attributeName="cx" values="307;257;307" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="83;50;83" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="0;2.5;0" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.8;0;0" dur="1.8s" repeatCount="indefinite"/>
                </circle>
                <circle cx="307" cy="83" r="0" fill="#00e5ff" opacity="0">
                  <animate attributeName="cx" values="307;357;307" dur="2.1s" begin="0.6s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="83;110;83" dur="2.1s" begin="0.6s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="0;2;0" dur="2.1s" begin="0.6s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;0;0" dur="2.1s" begin="0.6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="307" cy="83" r="0" fill="#7fff00" opacity="0">
                  <animate attributeName="cx" values="307;242;307" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="83;95;83" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="0;2.2;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="307" cy="83" r="0" fill="#fff" opacity="0">
                  <animate attributeName="cx" values="307;372;307" dur="1.6s" begin="0.3s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="83;60;83" dur="1.6s" begin="0.3s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="0;1.8;0" dur="1.6s" begin="0.3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.9;0;0" dur="1.6s" begin="0.3s" repeatCount="indefinite"/>
                </circle>
              </g>

              <!-- 中心辐射光环 -->
              <circle cx="307" cy="83" r="14" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0.7">
                <animate attributeName="r" values="14;18;14" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="307" cy="83" r="6" fill="rgba(127,255,0,0.3)" stroke="none">
                <animate attributeName="r" values="6;12;6" dur="0.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.8s" repeatCount="indefinite"/>
              </circle>

              <!-- 顶部运行标签 -->
              <rect x="242" y="25" width="130" height="17" rx="4" fill="rgba(0,229,255,0.16)"
                    stroke="rgba(0,229,255,0.7)" stroke-width="0.8"/>
              <circle cx="253" cy="33.5" r="3.2" fill="#00ffaa">
                <animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite"/>
              </circle>
              <text x="292" y="37.5" text-anchor="middle" font-size="9" fill="#00e5ff" font-weight="700"
                    letter-spacing="1.5" filter="url(#cv2soft)">▶ 辐照处理中
              </text>
              <!-- 中心文字 -->
              <text x="307" y="62" text-anchor="middle" font-size="14" font-weight="800" fill="rgba(0,229,255,0.95)"
                    letter-spacing="1" filter="url(#cv2soft)">辐照中
              </text>
              <!-- ══ 出射检区 ══ -->
              <rect x="416" y="42" width="90" height="94" rx="8" fill="rgba(0,255,160,0.04)"
                    stroke="rgba(0,255,160,0.18)" stroke-width="1"/>
              <line x1="416" y1="50" x2="506" y2="50" stroke="rgba(0,255,160,0.32)" stroke-width="0.8"/>
              <rect x="416" y="42" width="90" height="94" rx="8" fill="none" stroke="#00ffa0" stroke-width="1.2"
                    stroke-dasharray="4 3" opacity="0.16">
                <animate attributeName="opacity" values="0.16;0.48;0.16" dur="2.7s" begin="0.9s"
                         repeatCount="indefinite"/>
              </rect>
              <rect x="427" y="28" width="60" height="16" rx="3" fill="rgba(0,8,20,0.9)" stroke="rgba(0,255,160,0.4)"
                    stroke-width="0.8"/>
              <text x="457" y="40" text-anchor="middle" font-size="8.5" fill="#00ffa0" font-weight="700"
                    letter-spacing="1.2">出射检
              </text>
              <text x="461" y="121" text-anchor="middle" font-size="9.5" fill="rgba(0,255,160,0.85)" font-weight="600">
                检测中
              </text>
              <text x="461" y="134" text-anchor="middle" font-size="9" fill="rgba(0,255,160,0.6)" font-weight="500">{{
                  zoneCounts[2]
                }}
              </text>

              <!-- ══ 成品仓区 ══ -->
              <rect x="513" y="42" width="99" height="94" rx="8" fill="rgba(160,100,255,0.04)"
                    stroke="rgba(180,120,255,0.2)" stroke-width="1"/>
              <line x1="513" y1="50" x2="612" y2="50" stroke="rgba(180,120,255,0.3)" stroke-width="0.8"/>
              <rect x="513" y="42" width="99" height="94" rx="8" fill="none" stroke="#cc99ff" stroke-width="1.3"
                    stroke-dasharray="6 4" opacity="0.18">
                <animate attributeName="opacity" values="0.18;0.55;0.18" dur="3.4s" begin="1.8s"
                         repeatCount="indefinite"/>
              </rect>
              <rect x="524" y="28" width="60" height="16" rx="3" fill="rgba(8,5,28,0.9)" stroke="rgba(180,120,255,0.42)"
                    stroke-width="0.8"/>
              <text x="554" y="40" text-anchor="middle" font-size="8.5" fill="#cc99ff" font-weight="700"
                    letter-spacing="1.2">成品仓
              </text>
              <text x="562" y="121" text-anchor="middle" font-size="9.5" fill="rgba(180,120,255,0.85)" font-weight="600">
                入库中
              </text>
              <text x="562" y="134" text-anchor="middle" font-size="9" fill="rgba(180,120,255,0.6)" font-weight="500">{{
                  zoneCounts[3]
                }}
              </text>

              <!-- 货位 & 流动货物 -->
              <g ref="cargoGroupRef"></g>
              <g ref="movingCargoRef"></g>

              <!-- 区间箭头 -->
              <line x1="103" y1="88" x2="107" y2="88" stroke="#00e5ff" stroke-width="2.2" marker-end="url(#cv2arr)"
                    filter="url(#cv2soft)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.3s" repeatCount="indefinite"/>
              </line>
              <line x1="198" y1="88" x2="202" y2="88" stroke="#00e5ff" stroke-width="2.2" marker-end="url(#cv2arr)"
                    filter="url(#cv2soft)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.3s" begin="0.43s" repeatCount="indefinite"/>
              </line>
              <line x1="410" y1="88" x2="414" y2="88" stroke="#00e5ff" stroke-width="2.2" marker-end="url(#cv2arr)"
                    filter="url(#cv2soft)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.3s" begin="0.26s" repeatCount="indefinite"/>
              </line>
              <line x1="506" y1="88" x2="510" y2="88" stroke="#00e5ff" stroke-width="2.2" marker-end="url(#cv2arr)"
                    filter="url(#cv2soft)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.3s" begin="0.7s" repeatCount="indefinite"/>
              </line>
            </svg>
          </div>
          <!-- 底部：剂量率-速度匹配曲线 + 工艺异常预警 -->
          <div class="cv2-dose-bar" :class="{ 'anomaly-warning': anomalyActive, 'under-dose': anomalyActive && anomalyInfo?.cls === 'under' }">
            <div class="cv2-dose-inline">
              <!-- 左侧：实时数值面板 -->
              <div class="cv2-dose-metrics">
                <div class="cv2-metric-row">
                  <span class="cv2-metric-label">束流/源强</span>
                  <span class="cv2-metric-val" :class="{ 'anomaly': anomalyDoseRate }">{{ currentDoseRate }}%</span>
                </div>
                <div class="cv2-metric-row">
                  <span class="cv2-metric-label">传送速度</span>
                  <span class="cv2-metric-val" :class="{ 'anomaly': anomalySpeed }">{{ currentSpeed }}%</span>
                </div>
                <div class="cv2-metric-status" :class="matchStatus.cls">{{ matchStatus.text }}</div>
              </div>
              <!-- 中间：双曲线图 -->
              <div class="cv2-dose-chart-wrap">
                <canvas ref="doseSpeedChartRef"></canvas>
              </div>
              <!-- 右侧：预警指示器 -->
              <div class="cv2-anomaly-indicator" :class="anomalyInfo?.cls || 'ok'" v-if="anomalyActive && anomalyInfo">
                <div class="cv2-anomaly-icon">{{ anomalyInfo.cls === 'over' ? '☢' : '⚠' }}</div>
                <div class="cv2-anomaly-text" :class="anomalyInfo.cls">{{ anomalyInfo.risk }}</div>
                <div class="cv2-anomaly-sub">{{ anomalyInfo.desc }}</div>
              </div>
              <div class="cv2-anomaly-indicator ok" v-else>
                <div class="cv2-anomaly-icon">✓</div>
                <div class="cv2-anomaly-text">工艺匹配正常</div>
                <div class="cv2-anomaly-sub">剂量均匀</div>
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

      <!-- ⑤ 剂量异常处置看板 -->
      <div class="dose-disp-row">
        <!-- 左侧：统计摘要 -->
        <div class="tech-border dose-disp-stats">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="dose-disp-title">
            <span class="dose-disp-title-icon">☢</span>
            <span>剂量异常处置看板</span>
            <span class="dose-disp-badge">本月</span>
          </div>
          <div class="dose-disp-stat-list">
            <div v-for="stat in doseDispStats" :key="stat.key" class="dose-disp-stat-item">
              <div class="dose-disp-stat-left">
                <span class="dose-disp-stat-dot" :style="{ background: stat.color }"></span>
                <span class="dose-disp-stat-label">{{ stat.label }}</span>
              </div>
              <div class="dose-disp-stat-right">
                <span class="dose-disp-stat-val">{{ stat.value }}</span>
                <span class="dose-disp-stat-trend" :style="{ color: stat.trendColor }">{{ stat.trend }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：处置占比环形图 -->
        <div class="tech-border dose-disp-chart">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="dose-disp-title">处置方式占比</div>
          <div class="dose-disp-chart-wrap">
            <canvas ref="doseDispChartRef"></canvas>
          </div>
        </div>

        <!-- 右侧：最近处置记录 -->
        <div class="tech-border dose-disp-events">
          <i class="corner-bl"></i><i class="corner-br"></i>
          <div class="dose-disp-title">最近处置记录</div>
          <div class="dose-disp-event-list">
            <div v-for="evt in doseDispEvents" :key="evt.id" class="dose-disp-event-item" :class="evt.result">
              <div class="dose-disp-event-row1">
                <span class="dose-disp-event-batch">{{ evt.batch }}</span>
                <span class="dose-disp-event-result" :class="evt.result">{{ evt.resultLabel }}</span>
              </div>
              <div class="dose-disp-event-row2">
                <span class="dose-disp-event-desc">{{ evt.desc }}</span>
              </div>
            </div>
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
import {ref, reactive, computed, onMounted, onUnmounted, nextTick} from 'vue'
import Chart from 'chart.js/auto'

/* ─── 工具函数 ─── */
function pad(n) {
  return String(n).padStart(2, '0')
}

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
  {
    id: 'D001',
    time: '07:15',
    type: 'critical',
    level: '严重',
    desc: 'Co-60 #1 批次 B2605-438 实测剂量 26.42 kGy，超上限 5.68%',
    device: 'Co-60 #1',
    acked: false
  },
  {
    id: 'D002',
    time: '09:32',
    type: 'warn',
    level: '警告',
    desc: 'EB-1 批次 B2605-445 剂量偏低 23.1 kGy，低于下限 7.6%',
    device: 'EB-1',
    acked: false
  },
])
const deviceAlerts = reactive([
  {
    id: 'V001',
    time: '08:42',
    type: 'warn',
    level: '警告',
    desc: 'EB-1 加速器预防性维护窗口启动，计划停机 4h',
    device: 'EB-1',
    acked: false
  },
  {
    id: 'V002',
    time: '10:05',
    type: 'critical',
    level: '严重',
    desc: '辐照室温度传感器 T-03 读数漂移 ±0.8℃，超阈值',
    device: 'T-03',
    acked: false
  },
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

/* ─── 剂量异常处置看板 ─── */
const doseDispStats = reactive([
  {
    key: 'total',
    label: '偏移批次数',
    value: '12',
    trend: '▸ +3 vs 上月',
    trendColor: 'var(--orange)',
    color: '#ff3366'
  },
  {
    key: 'remedy',
    label: '补救再辐照',
    value: '8 (67%)',
    trend: '▸ 已恢复 7 批',
    trendColor: 'var(--green)',
    color: '#00ffaa'
  },
  {
    key: 'reject',
    label: '判定不合格',
    value: '3 (25%)',
    trend: '▸ 已隔离销毁',
    trendColor: 'var(--red)',
    color: '#ff3366'
  },
  {
    key: 'conditional',
    label: '有条件放行',
    value: '1 (8%)',
    trend: '▸ 偏差报告已签',
    trendColor: 'var(--orange)',
    color: '#ffaa33'
  },
])

const doseDispEvents = reactive([
  {
    id: 1,
    batch: 'B2605-441',
    result: 'remedy',
    resultLabel: '再辐照',
    desc: '剂量偏低 23.1kGy → 补充至 25kGy，复检合格'
  },
  {id: 2, batch: 'B2605-438', result: 'reject', resultLabel: '不合格', desc: '剂量超标 26.4kGy，材料变色降解，已报废'},
  {
    id: 3,
    batch: 'B2605-433',
    result: 'conditional',
    resultLabel: '有条件放行',
    desc: '剂量偏高 26.1kGy，产品检测正常，偏差报告签批'
  },
  {id: 4, batch: 'B2605-429', result: 'remedy', resultLabel: '再辐照', desc: '剂量偏低 22.8kGy → 补充至目标，复检合格'},
  {id: 5, batch: 'B2605-421', result: 'reject', resultLabel: '不合格', desc: '剂量严重超标 27.2kGy，包装变形，已报废'},
])

/* ─── 剂量率-速度匹配曲线数据 ─── */
const doseSpeedChartRef = ref(null)
let doseSpeedChart = null

const MAX_DATA_POINTS = 50
const doseRateHistory = reactive(Array(MAX_DATA_POINTS).fill(100))
const speedHistory = reactive(Array(MAX_DATA_POINTS).fill(100))
const currentDoseRate = ref(100)
const currentSpeed = ref(100)
const anomalyType = ref(null) // null | 'speed-down' | 'speed-up' | 'dose-down' | 'dose-up'
const anomalyDoseRate = ref(false)
const anomalySpeed = ref(false)
const anomalyActive = computed(() => anomalyType.value !== null)

const anomalyInfo = computed(() => {
  const map = {
    'speed-down': { risk: '过辐照风险', desc: '速度下降 · 剂量稳定', cls: 'over' },
    'speed-up': { risk: '欠辐照风险', desc: '速度上升 · 剂量稳定', cls: 'under' },
    'dose-down': { risk: '欠辐照风险', desc: '速度稳定 · 剂量下降', cls: 'under' },
    'dose-up': { risk: '过辐照风险', desc: '速度稳定 · 剂量上升', cls: 'over' },
  }
  return anomalyType.value ? map[anomalyType.value] : null
})

const matchStatus = computed(() => {
  if (anomalyActive.value) {
    return { text: '异常 · 匹配失衡', cls: 'status-anomaly' }
  }
  const variance = Math.abs(currentDoseRate.value - currentSpeed.value)
  if (variance < 3) return { text: '匹配优秀', cls: 'status-good' }
  if (variance < 8) return { text: '匹配正常', cls: 'status-ok' }
  return { text: '匹配偏差', cls: 'status-warn' }
})
function updateDoseSpeedData() {
  // Shift history
  for (let i = 0; i < MAX_DATA_POINTS - 1; i++) {
    doseRateHistory[i] = doseRateHistory[i + 1]
    speedHistory[i] = speedHistory[i + 1]
  }

  // Generate new values with small random variations
  let newDoseRate = 100 + (Math.random() - 0.5) * 4
  let newSpeed = 100 + (Math.random() - 0.5) * 3

  // Occasionally simulate anomaly
  const anomalyChance = 0.12 // ~12% chance per tick → 平均 8-10 秒触发一次
  if (Math.random() < anomalyChance) {
    const scenario = Math.random()
    if (scenario < 0.25) {
      // 速度下降，剂量稳定 → 过辐照
      newSpeed = 55 + Math.random() * 15
      newDoseRate = 98 + Math.random() * 4
    } else if (scenario < 0.5) {
      // 速度上升，剂量稳定 → 欠辐照
      newSpeed = 115 + Math.random() * 5
      newDoseRate = 98 + Math.random() * 4
    } else if (scenario < 0.75) {
      // 剂量下降，速度稳定 → 欠辐照
      newDoseRate = 55 + Math.random() * 15
      newSpeed = 98 + Math.random() * 4
    } else {
      // 剂量上升，速度稳定 → 过辐照
      newDoseRate = 115 + Math.random() * 8
      newSpeed = 98 + Math.random() * 4
    }
  }

  // Clamp values
  newDoseRate = Math.max(50, Math.min(130, newDoseRate))
  newSpeed = Math.max(30, Math.min(120, newSpeed))

  doseRateHistory[MAX_DATA_POINTS - 1] = parseFloat(newDoseRate.toFixed(1))
  speedHistory[MAX_DATA_POINTS - 1] = parseFloat(newSpeed.toFixed(1))
  currentDoseRate.value = doseRateHistory[MAX_DATA_POINTS - 1]
  currentSpeed.value = speedHistory[MAX_DATA_POINTS - 1]

  // Anomaly detection: four scenarios
  const prevIdx = MAX_DATA_POINTS - 3
  const speedDelta = speedHistory[MAX_DATA_POINTS - 1] - speedHistory[prevIdx]
  const doseRateDelta = doseRateHistory[MAX_DATA_POINTS - 1] - doseRateHistory[prevIdx]
  const speedAbsDelta = Math.abs(speedDelta)
  const doseRateAbsDelta = Math.abs(doseRateDelta)

  if (speedDelta < -10 && doseRateAbsDelta < 8) {
    // 速度下降 · 剂量稳定 → 过辐照风险
    anomalyType.value = 'speed-down'
    anomalySpeed.value = true
    anomalyDoseRate.value = false
  } else if (speedDelta > 10 && doseRateAbsDelta < 8) {
    // 速度上升 · 剂量稳定 → 欠辐照风险
    anomalyType.value = 'speed-up'
    anomalySpeed.value = true
    anomalyDoseRate.value = false
  } else if (doseRateDelta < -10 && speedAbsDelta < 8) {
    // 剂量下降 · 速度稳定 → 欠辐照风险
    anomalyType.value = 'dose-down'
    anomalyDoseRate.value = true
    anomalySpeed.value = false
  } else if (doseRateDelta > 10 && speedAbsDelta < 8) {
    // 剂量上升 · 速度稳定 → 过辐照风险
    anomalyType.value = 'dose-up'
    anomalyDoseRate.value = true
    anomalySpeed.value = false
  } else if (speedHistory[MAX_DATA_POINTS - 1] > 75 && speedHistory[MAX_DATA_POINTS - 1] < 115
      && doseRateHistory[MAX_DATA_POINTS - 1] > 85 && doseRateHistory[MAX_DATA_POINTS - 1] < 115) {
    // Recovery condition: both values back to normal range
    anomalyType.value = null
    anomalySpeed.value = false
    anomalyDoseRate.value = false
  }

  // Update chart
  if (doseSpeedChart) {
    doseSpeedChart.data.datasets[0].data = [...doseRateHistory]
    doseSpeedChart.data.datasets[1].data = [...speedHistory]
    doseSpeedChart.update('none')
  }
}

/* ─── KPI 卡片 ─── */
const kpiCards = reactive([
  {
    key: 'prod',
    cls: 'c1',
    label: '今日产量',
    icon: '📦',
    value: '4,287',
    unit: '件',
    trend: '↑ 8.3% 较昨日',
    trendColor: 'green'
  },
  {
    key: 'util',
    cls: 'c2',
    label: '设备利用率',
    icon: '⚙',
    value: '87.6',
    unit: '%',
    trend: '↑ 2.1% 较昨日',
    trendColor: 'green'
  },
  {
    key: 'pass',
    cls: 'c3',
    label: '批次合格率',
    icon: '✓',
    value: '99.2',
    unit: '%',
    trend: '↓ 0.3% 较昨日',
    trendColor: 'orange'
  },
  {
    key: 'tat',
    cls: 'c4',
    label: '平均周转时效',
    icon: '⏱',
    value: '18.4',
    unit: 'h',
    trend: '↓ 1.2h 优于目标',
    trendColor: 'green'
  },
  {
    key: 'rev',
    cls: 'c5',
    label: '本月营收',
    icon: '💰',
    value: '1,824',
    unit: '万元',
    trend: '↑ 12.5% 较上月',
    trendColor: 'green'
  },
])

/* ─── 合规倒计时 ─── */
const complianceItems = reactive([
  {label: '剂量验证', deadline: new Date('2026-06-01T09:00:00'), cycleDesc: '每季度'},
  {label: '源执照到期', deadline: new Date('2026-06-15T00:00:00'), cycleDesc: '5年周期'},
  {label: '环保检查', deadline: new Date('2026-08-20T00:00:00'), cycleDesc: '每年'},
  {label: '个人剂量监测', deadline: new Date('2026-05-28T09:00:00'), cycleDesc: '每月'},
  {label: '应急演练', deadline: new Date('2026-12-10T00:00:00'), cycleDesc: '每年'},
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
let doseTimer = null

/* ─── 输送线动画 ─── */
const cargoGroupRef = ref(null)
const zoneCounts = ref(['', '', '', ''])

const zones = [
  {x: 10, y: 55, w: 93, count: 8, color: '#1af0ff', cntIdx: 0},    // 进货缓存
  {x: 108, y: 55, w: 90, count: 3, color: '#00ffa0', cntIdx: 1},   // 入射检
  {x: 204, y: 47, w: 212, count: 6, color: '#00e5ff', cntIdx: null, active: true}, // 辐照区
  {x: 416, y: 55, w: 90, count: 2, color: '#00ffa0', cntIdx: 2},   // 出射检
  {x: 513, y: 55, w: 99, count: 11, color: '#cc99ff', cntIdx: 3},  // 成品仓
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
      const bw = z.active ? 24 : 20, bh = 18, gap = 5
      const gw = cols * (bw + gap) - gap
      const bx = z.x + (z.w - gw) / 2 + col * (bw + gap)
      const by = 58 + row * (bh + 4)

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const zoneColors = ['#3ecfff', '#36e8a0', '#36e8a0', '#c49bff']
      const zoneColor = z.active ? '#00dcff' : (zoneColors[z.cntIdx] || '#3ecfff')

      // 底层光晕（活跃状态）
      if (z.active) {
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        glow.setAttribute('x', bx - 2)
        glow.setAttribute('y', by - 2)
        glow.setAttribute('width', bw + 4)
        glow.setAttribute('height', bh + 7)
        glow.setAttribute('rx', '3')
        glow.setAttribute('fill', 'rgba(0,220,255,0.10)')
        glow.setAttribute('filter', 'url(#glow)')
        group.appendChild(glow)
      }

      // ═══ 托盘（底部扁矩形 — 更明显的木质感）═══
      const pallet = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      pallet.setAttribute('x', bx - 1)
      pallet.setAttribute('y', by + bh - 3)
      pallet.setAttribute('width', bw + 2)
      pallet.setAttribute('height', 4)
      pallet.setAttribute('rx', '1.5')
      pallet.setAttribute('fill', z.active ? 'rgba(0,200,230,0.55)' : `${zoneColor}40`)
      pallet.setAttribute('stroke', z.active ? 'rgba(0,220,255,0.5)' : `${zoneColor}50`)
      pallet.setAttribute('stroke-width', '0.5')
      group.appendChild(pallet)
      // 托盘底部横档
      const palletBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      palletBar.setAttribute('x', bx + 3)
      palletBar.setAttribute('y', by + bh - 2)
      palletBar.setAttribute('width', bw - 4)
      palletBar.setAttribute('height', 1.5)
      palletBar.setAttribute('rx', '0.5')
      palletBar.setAttribute('fill', z.active ? 'rgba(0,180,220,0.3)' : `${zoneColor}18`)
      group.appendChild(palletBar)

      // ═══ 货物箱体（主矩形，带圆角）═══
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      box.setAttribute('x', bx + 1)
      box.setAttribute('y', by)
      box.setAttribute('width', bw - 2)
      box.setAttribute('height', bh - 3)
      box.setAttribute('rx', '2')
      if (z.active) {
        box.setAttribute('fill', 'rgba(0,220,255,0.22)')
        box.setAttribute('stroke', '#00dcff')
        box.setAttribute('stroke-width', '1.2')
      } else {
        box.setAttribute('fill', `${zoneColor}20`)
        box.setAttribute('stroke', `${zoneColor}60`)
        box.setAttribute('stroke-width', '0.8')
      }
      group.appendChild(box)

      // ═══ 箱体顶部高光（立体感）═══
      const topLight = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      topLight.setAttribute('x', bx + 3)
      topLight.setAttribute('y', by + 1)
      topLight.setAttribute('width', bw - 6)
      topLight.setAttribute('height', 2.5)
      topLight.setAttribute('rx', '1')
      topLight.setAttribute('fill', z.active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)')
      group.appendChild(topLight)

      // ═══ 箱体侧面阴影线（立体感）═══
      const sideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      sideLine.setAttribute('x1', bx + bw - 3)
      sideLine.setAttribute('y1', by + 4)
      sideLine.setAttribute('x2', bx + bw - 3)
      sideLine.setAttribute('y2', by + bh - 6)
      sideLine.setAttribute('stroke', z.active ? 'rgba(0,220,255,0.25)' : `${zoneColor}25`)
      sideLine.setAttribute('stroke-width', '0.8')
      group.appendChild(sideLine)

      // ═══ 货物标签/条码示意（箱体正面小横线）═══
      const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      label1.setAttribute('x', bx + 4)
      label1.setAttribute('y', by + 6)
      label1.setAttribute('width', bw - 8)
      label1.setAttribute('height', 1.8)
      label1.setAttribute('rx', '0.5')
      label1.setAttribute('fill', z.active ? 'rgba(0,220,255,0.35)' : `${zoneColor}35`)
      group.appendChild(label1)

      const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      label2.setAttribute('x', bx + 4)
      label2.setAttribute('y', by + 9.5)
      label2.setAttribute('width', (bw - 8) * 0.6)
      label2.setAttribute('height', 1.2)
      label2.setAttribute('rx', '0.5')
      label2.setAttribute('fill', z.active ? 'rgba(0,220,255,0.2)' : `${zoneColor}22`)
      group.appendChild(label2)

      // ═══ 状态指示灯（左上角小圆点）═══
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', bx + 4)
      dot.setAttribute('cy', by + 3.5)
      dot.setAttribute('r', '1.5')
      if (z.active) {
        dot.setAttribute('fill', '#00ffaa')
        dot.setAttribute('filter', 'url(#pulseGlow)')
      } else {
        dot.setAttribute('fill', zoneColor)
        dot.setAttribute('opacity', '0.6')
      }
      group.appendChild(dot)

      // 活跃状态添加呼吸动画
      if (z.active) {
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate')
        anim.setAttribute('attributeName', 'opacity')
        anim.setAttribute('values', '0.7;1;0.7')
        anim.setAttribute('dur', `${1.2 + i * 0.15}s`)
        anim.setAttribute('repeatCount', 'indefinite')
        box.appendChild(anim)
      }

      g.appendChild(group)
    }
    if (z.cntIdx !== null) {
      zoneCounts.value[z.cntIdx] = `${z.count} 货位`
    }
  })
}

let cargoTimer = null

/* ─── 输送带流动货物动画 ─── */
const movingCargoRef = ref(null)
let movingItems = []
let moveAnimId = null

// 轨道区域定义（x坐标范围 + 统一色彩体系）— 与轨道底板 x=14, width=572 对齐
const trackZones = [
  {name: '进货缓存', x1: 10, x2: 103, color: '#1af0ff'},
  {name: '入射检', x1: 108, x2: 198, color: '#00ffa0'},
  {name: '辐照区', x1: 204, x2: 416, color: '#00e5ff'},
  {name: '出射检', x1: 416, x2: 506, color: '#00ffa0'},
  {name: '成品仓', x1: 513, x2: 612, color: '#cc99ff'},
]

function createMovingCargo() {
  const g = movingCargoRef.value
  if (!g) return

  // 从起始区域色系随机选色（不再用橙色 #ffaa33）
  const colors = ['#3ecfff', '#36e8a0', '#c49bff', '#5ee8c0']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const id = 'mc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.setAttribute('id', id)

  // 托盘（比箱体宽一圈）
  const pallet = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  pallet.setAttribute('x', -13)
  pallet.setAttribute('y', 7)
  pallet.setAttribute('width', 26)
  pallet.setAttribute('height', 3.5)
  pallet.setAttribute('rx', '1.5')
  pallet.setAttribute('fill', color + '50')
  pallet.setAttribute('stroke', color + '40')
  pallet.setAttribute('stroke-width', '0.5')
  group.appendChild(pallet)
  // 托盘底部横档
  const palletBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  palletBar.setAttribute('x', -9)
  palletBar.setAttribute('y', 8.5)
  palletBar.setAttribute('width', 18)
  palletBar.setAttribute('height', 1.2)
  palletBar.setAttribute('rx', '0.5')
  palletBar.setAttribute('fill', color + '20')
  group.appendChild(palletBar)

  // 箱体（主矩形）
  const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  box.setAttribute('x', -10)
  box.setAttribute('y', -7)
  box.setAttribute('width', 20)
  box.setAttribute('height', 14)
  box.setAttribute('rx', '2')
  box.setAttribute('fill', color + '25')
  box.setAttribute('stroke', color + '90')
  box.setAttribute('stroke-width', '0.8')
  group.appendChild(box)

  // 顶部高光
  const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  highlight.setAttribute('x', -8)
  highlight.setAttribute('y', -6)
  highlight.setAttribute('width', 16)
  highlight.setAttribute('height', 2.5)
  highlight.setAttribute('rx', '1')
  highlight.setAttribute('fill', 'rgba(255,255,255,0.12)')
  group.appendChild(highlight)

  // 标签线1
  const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  label1.setAttribute('x', -7)
  label1.setAttribute('y', -1)
  label1.setAttribute('width', 14)
  label1.setAttribute('height', 1.8)
  label1.setAttribute('rx', '0.5')
  label1.setAttribute('fill', color + '40')
  group.appendChild(label1)

  // 标签线2
  const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  label2.setAttribute('x', -7)
  label2.setAttribute('y', 2.5)
  label2.setAttribute('width', 8)
  label2.setAttribute('height', 1.2)
  label2.setAttribute('rx', '0.5')
  label2.setAttribute('fill', color + '28')
  group.appendChild(label2)

  // 状态灯
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  dot.setAttribute('cx', 7)
  dot.setAttribute('cy', -4)
  dot.setAttribute('r', '1.3')
  dot.setAttribute('fill', '#00ffaa')
  dot.setAttribute('opacity', '0.7')
  group.appendChild(dot)

  g.appendChild(group)

  movingItems.push({
    id,
    el: group,
    x: 10,
    y: 88,
    speed: 0.8 + Math.random() * 0.6,
    color,
  })
}

function updateMovingCargo() {
  const g = movingCargoRef.value
  if (!g) return

  // 每隔一段时间生成新货物
  if (Math.random() < 0.015 && movingItems.length < 8) {
    createMovingCargo()
  }

  // 更新每个流动货物的位置
  for (let i = movingItems.length - 1; i >= 0; i--) {
    const item = movingItems[i]
    item.x += item.speed

    // 根据位置计算Y轴轻微波动（模拟轨道震动）
    const wave = Math.sin(item.x * 0.05) * 1.5
    item.y = 88 + wave

    // 更新DOM位置
    item.el.setAttribute('transform', `translate(${item.x}, ${item.y})`)

    // 判断当前所在区域，改变颜色（平滑过渡）
    const zone = trackZones.find(z => item.x >= z.x1 && item.x <= z.x2)
    if (zone && zone.color !== item.color) {
      item.color = zone.color
      // 更新箱体颜色
      const rects = item.el.querySelectorAll('rect')
      const box = rects[2] // 第3个rect是箱体
      if (box) {
        box.setAttribute('fill', zone.color + '25')
        box.setAttribute('stroke', zone.color + '90')
      }
      const pallet = rects[0] // 第1个rect是托盘
      if (pallet) {
        pallet.setAttribute('fill', zone.color + '50')
        pallet.setAttribute('stroke', zone.color + '40')
      }
      const palletBar = rects[1] // 第2个rect是横档
      if (palletBar) palletBar.setAttribute('fill', zone.color + '20')
      const label1 = rects[4] // 第5个rect是标签1
      if (label1) label1.setAttribute('fill', zone.color + '40')
      const label2 = rects[5] // 第6个rect是标签2
      if (label2) label2.setAttribute('fill', zone.color + '28')
    }

    // 到达终点（轨道右边界 586 + 货物半宽），移除
    if (item.x > 622) {
      g.removeChild(item.el)
      movingItems.splice(i, 1)
    }
  }

  moveAnimId = requestAnimationFrame(updateMovingCargo)
}

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
const doseDispChartRef = ref(null)
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
      labels: Array.from({length: 20}, (_, i) => `B${String(i + 1).padStart(2, '0')}`),
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
        {
          label: '目标均值',
          data: Array(20).fill(target),
          borderColor: '#00ffaa',
          borderWidth: 1,
          borderDash: [4, 3],
          pointRadius: 0
        },
        {
          label: '控制限',
          data: Array(20).fill(upperLimit),
          borderColor: 'rgba(255,51,102,0.4)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0
        },
        {
          label: '控制限',
          data: Array(20).fill(lowerLimit),
          borderColor: 'rgba(255,51,102,0.4)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {legend: {display: false}},
      scales: {x: {ticks: {font: {size: 9}}}, y: {min: 23, max: 27, ticks: {font: {size: 9}}}},
    },
  }))

  // 月度产量
  chartInstances.push(new Chart(prodChartRef.value, {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [
        {
          label: '实际产量',
          data: [3200, 3500, 3100, 3800, 4100, 3950, 4200, 4050, 4300, 4100, 4500, 4287],
          backgroundColor: 'rgba(0,220,255,0.5)',
          borderColor: '#00dcff',
          borderWidth: 1
        },
        {
          label: '计划产量',
          data: [3500, 3500, 3500, 4000, 4000, 4000, 4500, 4500, 4500, 4500, 4500, 5000],
          backgroundColor: 'rgba(0,255,170,0.15)',
          borderColor: '#00ffaa',
          borderWidth: 1
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {legend: {display: false}},
      scales: {x: {ticks: {font: {size: 9}}}, y: {ticks: {font: {size: 9}}}},
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
      plugins: {legend: {position: 'right', labels: {font: {size: 9}, boxWidth: 10}}},
      cutout: '60%',
    },
  }))

  // 剂量异常处置占比
  chartInstances.push(new Chart(doseDispChartRef.value, {
    type: 'doughnut',
    data: {
      labels: ['补救再辐照', '判定不合格', '有条件放行'],
      datasets: [{
        data: [8, 3, 1],
        backgroundColor: ['rgba(0,255,170,0.5)', 'rgba(255,51,102,0.5)', 'rgba(255,170,51,0.5)'],
        borderColor: ['#00ffaa', '#ff3366', '#ffaa33'],
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {legend: {position: 'bottom', labels: {font: {size: 9}, color: '#3a6a8a', boxWidth: 8, padding: 12}}},
      cutout: '55%',
    },
  }))

  // 剂量率-速度匹配曲线
  initDoseSpeedChart()
}

function initDoseSpeedChart() {
  if (!doseSpeedChartRef.value) return

  const labels = Array.from({length: MAX_DATA_POINTS}, (_, i) => {
    const seconds = ((MAX_DATA_POINTS - 1 - i) * 0.5).toFixed(1)
    return `-${seconds}s`
  })

  doseSpeedChart = new Chart(doseSpeedChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '束流/源强',
          data: [...doseRateHistory],
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.05)',
          borderWidth: 1.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
        },
        {
          label: '传送速度',
          data: [...speedHistory],
          borderColor: '#7fff00',
          backgroundColor: 'rgba(127, 255, 0, 0.05)',
          borderWidth: 1.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            font: { size: 10 },
            boxWidth: 10,
            usePointStyle: true,
            pointStyle: 'line',
            generateLabels: (chart) => {
              const ds = chart.data.datasets
              return ds.map((d, i) => ({
                text: d.label,
                fillStyle: d.borderColor,
                strokeStyle: d.borderColor,
                hidden: chart.getDatasetMeta(i).hidden,
                datasetIndex: i,
                fontColor: d.borderColor,
                pointStyle: 'line',
              }))
            },
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 5, 18, 0.9)',
          titleColor: '#00e5ff',
          bodyColor: '#e4f4ff',
          borderColor: 'rgba(0, 229, 255, 0.2)',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            font: { size: 8 },
            color: '#2a5870',
            maxRotation: 0,
            callback: function(val, idx) {
              // 显示刻度: -25s, -15s, -10s, 0s（去掉 -20s）
              const seconds = (MAX_DATA_POINTS - 1 - idx) * 0.5
              if (seconds === 25 || seconds === 15 || seconds === 10 || seconds === 0) return `-${seconds}s`
              return ''
            }
          }
        },
        y: {
          min: 40,
          max: 130,
          ticks: {
            font: { size: 8 },
            color: '#2a5870',
            stepSize: 20,
            callback: (v) => v + '%'
          },
          grid: {
            color: 'rgba(0, 220, 255, 0.04)',
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  })

  chartInstances.push(doseSpeedChart)
}

/* ─── 生命周期 ─── */
onMounted(() => {
  // 时钟
  tick()
  clockTimer = setInterval(tick, 800)

  // 合规倒计时刷新（每分钟）
  complianceTimer = setInterval(() => {
    // computed 自动重算，无需手动触发
  }, 60000)

  // 实时剂量率-速度匹配数据更新
  doseTimer = setInterval(() => {
    updateDoseSpeedData()
  }, 500)

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
    // 启动流动货物动画
    updateMovingCargo()
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
  if (doseTimer) clearInterval(doseTimer)
  if (cargoTimer) clearInterval(cargoTimer)

  // 取消流动货物动画
  if (moveAnimId) cancelAnimationFrame(moveAnimId)

  // 取消星空动画
  if (starAnimId) cancelAnimationFrame(starAnimId)
  window.removeEventListener('resize', resizeStars)

  // 销毁图表
  chartInstances.forEach(c => c.destroy())
  chartInstances = []
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.irradiation-dashboard {
  --bg-main: #020617;
  --bg-panel: rgba(4, 16, 42, 0.75);
  --bg-card: rgba(8, 24, 54, 0.65);
  --border: rgba(0, 229, 255, 0.18);
  --border-hi: rgba(0, 229, 255, 0.5);
  --text-1: #e4f4ff;
  --text-2: #5ca8c8;
  --text-3: #2a5870;
  --cyan: #00e5ff;
  --green: #7fff00;
  --orange: #ff9933;
  --red: #ff3355;
  --purple: #9966ff;
  --yellow: #ffdd44;
  --font: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --glass: rgba(4, 16, 42, 0.65);
  --glass-border: rgba(0, 229, 255, 0.12);

  min-height: 100vh;
  background: radial-gradient(ellipse 60% 50% at 50% 0%, #0a1a35 0%, #020617 60%, #010514 100%);
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 220, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 220, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1;
  pointer-events: none;
}

/* ─── 星空背景 ─── */
.irradiation-dashboard > canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ─── 科技边框装饰 ─── */
.tech-border {
  position: relative;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.tech-border::before, .tech-border::after,
.tech-border :deep(.corner-bl), .tech-border :deep(.corner-br) {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--cyan);
  border-style: solid;
  pointer-events: none;
}

.tech-border::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.tech-border::after {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.tech-border :deep(.corner-bl) {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.tech-border :deep(.corner-br) {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

/* ─── 顶部发光标题栏 ─── */
.hd {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: linear-gradient(180deg, rgba(0, 20, 50, 0.98) 0%, rgba(0, 10, 30, 0.9) 100%);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  flex-shrink: 0;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.hd::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.8), #00e5ff, rgba(0, 229, 255, 0.8), transparent);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.6), 0 0 30px rgba(0, 229, 255, 0.2);
}

.hd-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.hd-title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 5px;
  color: var(--cyan);
  text-shadow: 0 0 25px rgba(0, 229, 255, 0.5), 0 0 50px rgba(0, 229, 255, 0.15);
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
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green), 0 0 16px rgba(127, 255, 0, 0.4);
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1
  }
  50% {
    opacity: .25
  }
}

/* ─── 主布局 ─── */
.main {
  position: relative;
  z-index: 5;
  flex: 1;
  padding: 10px 14px;
  display: grid;
  grid-template-rows: auto auto auto auto auto;
  gap: 20px;
}

/* ─── KPI 横排行 ─── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  min-height: 0;
}

.kpi-card {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  min-height: 0;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.kpi-card:hover {
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.06);
}

.kpi-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.kpi-card.c1::after {
  background: linear-gradient(90deg, var(--cyan), transparent);
}

.kpi-card.c2::after {
  background: linear-gradient(90deg, var(--green), transparent);
}

.kpi-card.c3::after {
  background: linear-gradient(90deg, var(--orange), transparent);
}

.kpi-card.c4::after {
  background: linear-gradient(90deg, var(--purple), transparent);
}

.kpi-card.c5::after {
  background: linear-gradient(90deg, var(--yellow), transparent);
}

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
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.kpi-card.c1 .kpi-card-icon {
  background: rgba(0, 220, 255, 0.1);
  color: var(--cyan);
}

.kpi-card.c2 .kpi-card-icon {
  background: rgba(0, 255, 170, 0.1);
  color: var(--green);
}

.kpi-card.c3 .kpi-card-icon {
  background: rgba(255, 170, 51, 0.1);
  color: var(--orange);
}

.kpi-card.c4 .kpi-card-icon {
  background: rgba(170, 102, 255, 0.1);
  color: var(--purple);
}

.kpi-card.c5 .kpi-card-icon {
  background: rgba(255, 221, 68, 0.1);
  color: var(--yellow);
}

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
  gap: 10px;
  height: 380px;
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
  border-bottom: 1px solid rgba(0, 220, 255, 0.1);
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
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 220, 255, 0.08);
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
  background: var(--glass);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
}

.alert-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 220, 255, 0.1);
}

.alert-panel-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.alert-panel-icon.dose {
  background: rgba(255, 51, 102, 0.15);
}

.alert-panel-icon.device {
  background: rgba(255, 170, 51, 0.15);
}

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
  border-color: rgba(255, 51, 102, 0.4);
  background: rgba(255, 51, 102, 0.08);
}

.alert-panel-badge.device {
  color: var(--orange);
  border-color: rgba(255, 170, 51, 0.4);
  background: rgba(255, 170, 51, 0.08);
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
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 11px;
  border-left: 2px solid transparent;
  transition: background .2s;
}

.alert-item:hover {
  background: rgba(0, 220, 255, 0.05);
}

.alert-item.critical {
  border-left-color: var(--red);
}

.alert-item.warn {
  border-left-color: var(--orange);
}

.alert-item-time {
  color: var(--text-3);
  font-size: 10px;
}

.alert-item-level {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  text-align: center;
}

.alert-item-level.critical {
  color: var(--red);
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.3);
}

.alert-item-level.warn {
  color: var(--orange);
  background: rgba(255, 170, 51, 0.1);
  border: 1px solid rgba(255, 170, 51, 0.3);
}

.alert-item-desc {
  color: var(--text-2);
  line-height: 1.4;
}

.alert-item-device {
  color: var(--text-3);
}

.alert-item-ack {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid rgba(0, 220, 255, 0.3);
  background: none;
  color: var(--text-2);
  cursor: pointer;
  transition: all .15s;
}

.alert-item-ack:hover {
  background: rgba(0, 220, 255, 0.1);
  color: var(--cyan);
  border-color: var(--cyan);
}

/* ─── 数据分析横排行 ─── */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  min-height: 0;
  height: 160px;
}

.chart-row-card {
  padding: 10px 12px;
  background: var(--glass);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-row-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 6px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.chart-row-title::before,
.chart-row-title::after {
  content: '';
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.35));
}

.chart-row-title::after {
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.35), transparent);
}

.chart-row-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ─── 合规倒计时底部栏 ─── */
.compliance-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  min-height: 0;
  border-color: rgba(255, 51, 85, 0.15) !important;
  background: linear-gradient(180deg, rgba(255, 51, 85, 0.04) 0%, rgba(0, 10, 25, 0.7) 100%) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: 8px;
}

.compliance-footer::before,
.compliance-footer::after {
  border-color: rgba(255, 51, 102, 0.4) !important;
}

.compliance-footer :deep(.corner-bl),
.compliance-footer :deep(.corner-br) {
  border-color: rgba(255, 51, 102, 0.4) !important;
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
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.comp-item.urgent {
  border-color: rgba(255, 51, 102, 0.4);
}

.comp-item.warning {
  border-color: rgba(255, 170, 51, 0.35);
}

.comp-item.safe {
  border-color: rgba(0, 255, 170, 0.2);
}

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

.comp-item-cd.urgent {
  color: var(--red);
}

.comp-item-cd.warning {
  color: var(--orange);
}

.comp-item-cd.safe {
  color: var(--green);
}

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
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.progress-label span:last-child {
  color: var(--text-2);
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width .6s;
}

/* ─── 剂量异常处置看板 ─── */
.dose-disp-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 10px;
  min-height: 0;
  height: 160px;
}

.dose-disp-stats,
.dose-disp-chart,
.dose-disp-events {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--glass);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
}

.dose-disp-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dose-disp-title-icon {
  font-size: 12px;
  color: var(--red);
}

.dose-disp-badge {
  margin-left: auto;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
  color: var(--cyan);
  border: 1px solid rgba(0, 220, 255, 0.3);
  background: rgba(0, 220, 255, 0.06);
}

.dose-disp-stat-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.dose-disp-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.dose-disp-stat-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dose-disp-stat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dose-disp-stat-label {
  font-size: 11px;
  color: var(--text-2);
}

.dose-disp-stat-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dose-disp-stat-val {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.dose-disp-stat-trend {
  font-size: 9px;
}

.dose-disp-chart-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dose-disp-event-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dose-disp-event-list::-webkit-scrollbar {
  width: 3px;
}

.dose-disp-event-list::-webkit-scrollbar-track {
  background: transparent;
}

.dose-disp-event-list::-webkit-scrollbar-thumb {
  background: rgba(0, 220, 255, 0.12);
  border-radius: 2px;
}

.dose-disp-event-item {
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 2px solid transparent;
}

.dose-disp-event-item.remedy {
  border-left-color: #00ffaa;
}

.dose-disp-event-item.reject {
  border-left-color: #ff3366;
}

.dose-disp-event-item.conditional {
  border-left-color: #ffaa33;
}

.dose-disp-event-row1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.dose-disp-event-batch {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-1);
}

.dose-disp-event-result {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
}

.dose-disp-event-result.remedy {
  color: #00ffaa;
  background: rgba(0, 255, 170, 0.08);
  border: 1px solid rgba(0, 255, 170, 0.25);
}

.dose-disp-event-result.reject {
  color: #ff3366;
  background: rgba(255, 51, 102, 0.08);
  border: 1px solid rgba(255, 51, 102, 0.25);
}

.dose-disp-event-result.conditional {
  color: #ffaa33;
  background: rgba(255, 170, 51, 0.08);
  border: 1px solid rgba(255, 170, 51, 0.25);
}

.dose-disp-event-desc {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.3;
}

/* ─── 底部 ─── */
.footer-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: rgba(0, 8, 22, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(0, 229, 255, 0.15);
  font-size: 10px;
  color: var(--text-3);
  flex-shrink: 0;
}

/* ─── 滚动条 ─── */
.alert-list::-webkit-scrollbar {
  width: 4px;
}

.alert-list::-webkit-scrollbar-track {
  background: transparent;
}

.alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 220, 255, 0.15);
  border-radius: 2px;
}

.alert-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 220, 255, 0.3);
}

/* ─── 动画 ─── */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
}

@keyframes glow {
  from {
    fill: rgba(0, 220, 255, 0.15);
  }
  to {
    fill: rgba(0, 220, 255, 0.4);
  }
}

/* ═══════════════════════════════════════════
   输送线 v2 — 极致科技感重设计 v3
═══════════════════════════════════════════ */
.conveyor-v2 {
  position: relative;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  background:
      linear-gradient(180deg,
      rgba(0, 4, 16, 0.98) 0%,
      rgba(0, 10, 28, 0.96) 50%,
      rgba(0, 6, 20, 0.98) 100%);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 0;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
      0 0 0 1px rgba(0, 229, 255, 0.06) inset,
      0 0 40px rgba(0, 229, 255, 0.08),
      0 0 80px rgba(0, 100, 200, 0.06),
      0 4px 24px rgba(0, 0, 0, 0.6);
}

/* 全局网格纹理背景 */
.conveyor-v2::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0, 229, 255, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 30% 40% at 8% 50%, rgba(0, 229, 255, 0.04) 0%, transparent 55%),
      radial-gradient(ellipse 25% 35% at 92% 50%, rgba(160, 80, 255, 0.03) 0%, transparent 50%),
      repeating-linear-gradient(
          0deg,
          transparent,
          transparent 22px,
          rgba(0, 229, 255, 0.018) 22px,
          rgba(0, 229, 255, 0.018) 23px
      ),
      repeating-linear-gradient(
          90deg,
          transparent,
          transparent 22px,
          rgba(0, 229, 255, 0.012) 22px,
          rgba(0, 229, 255, 0.012) 23px
      );
  pointer-events: none;
  border-radius: 0;
  z-index: 0;
}

/* 顶部光晕扫描线 */
.conveyor-v2::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
  transparent 0%,
  rgba(0, 229, 255, 0.0) 5%,
  rgba(0, 229, 255, 0.9) 30%,
  rgba(120, 240, 255, 1) 50%,
  rgba(0, 229, 255, 0.9) 70%,
  rgba(0, 229, 255, 0.0) 95%,
  transparent 100%);
  border-radius: 1px;
}

/* 四角装饰 — 加长 L 型角标 */
.cv2-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  pointer-events: none;
  z-index: 10;
}

.cv2-tl {
  top: 2px;
  left: 2px;
  border-top: 2px solid rgba(0, 229, 255, 1);
  border-left: 2px solid rgba(0, 229, 255, 1);
  border-radius: 0;
  box-shadow: -2px -2px 8px rgba(0, 229, 255, 0.3), -1px -1px 3px rgba(0, 229, 255, 0.5);
}

.cv2-tr {
  top: 2px;
  right: 2px;
  border-top: 2px solid rgba(0, 229, 255, 1);
  border-right: 2px solid rgba(0, 229, 255, 1);
  border-radius: 0;
  box-shadow: 2px -2px 8px rgba(0, 229, 255, 0.3), 1px -1px 3px rgba(0, 229, 255, 0.5);
}

.cv2-bl {
  bottom: 2px;
  left: 2px;
  border-bottom: 2px solid rgba(0, 229, 255, 0.6);
  border-left: 2px solid rgba(0, 229, 255, 0.6);
  border-radius: 0;
  box-shadow: -1px 2px 6px rgba(0, 229, 255, 0.15);
}

.cv2-br {
  bottom: 2px;
  right: 2px;
  border-bottom: 2px solid rgba(0, 229, 255, 0.6);
  border-right: 2px solid rgba(0, 229, 255, 0.6);
  border-radius: 0;
  box-shadow: 1px 2px 6px rgba(0, 229, 255, 0.15);
}

/* 标题栏 — 独立深色条带，含底部分割线光晕 */
.cv2-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
  padding: 7px 14px 7px 14px;
  background: linear-gradient(180deg,
  rgba(0, 16, 42, 0.92) 0%,
  rgba(0, 12, 32, 0.85) 100%);
  border-bottom: 1px solid rgba(0, 229, 255, 0.18);
  flex-shrink: 0;
}

/* 标题栏底部细线光晕 */
.cv2-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg,
  transparent,
  rgba(0, 229, 255, 0.5) 30%,
  rgba(0, 229, 255, 0.7) 50%,
  rgba(0, 229, 255, 0.5) 70%,
  transparent);
  filter: blur(0.5px);
}

.cv2-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cv2-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cv2-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ffaa;
  box-shadow:
      0 0 0 2px rgba(0, 255, 170, 0.2),
      0 0 8px #00ffaa,
      0 0 18px rgba(0, 255, 170, 0.5);
  animation: cv2pulse 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes cv2pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.2), 0 0 8px #00ffaa, 0 0 18px rgba(0, 255, 170, 0.5);
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    box-shadow: 0 0 0 4px rgba(0, 255, 170, 0.08), 0 0 4px #00ffaa, 0 0 8px rgba(0, 255, 170, 0.2);
    transform: scale(0.85);
  }
}

.cv2-title {
  font-size: 13px;
  font-weight: 800;
  color: #e8f8ff;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow:
      0 0 10px rgba(0, 229, 255, 0.5),
      0 0 25px rgba(0, 229, 255, 0.2);
}

.cv2-sep {
  color: rgba(0, 229, 255, 0.25);
  font-size: 10px;
}

.cv2-subtitle {
  font-size: 10px;
  color: rgba(0, 229, 255, 0.6);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 500;
}

.cv2-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid transparent;
}

.cv2-tag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: cv2pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

.cv2-tag-cyan {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.07);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.06) inset;
}

.cv2-tag-dim {
  color: #ffd700;
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.06);
  font-weight: 700;
  letter-spacing: 1px;
}

/* ─── 参数状态条 ─── */
.cv2-params-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 14px;
  background: linear-gradient(180deg,
  rgba(0, 14, 36, 0.95) 0%,
  rgba(0, 10, 26, 0.9) 100%);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  overflow: hidden;
}

/* 参数条左侧渐变光晕 */
.cv2-params-bar::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.06), transparent);
  pointer-events: none;
}

.cv2-param-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 3px 16px 3px 0;
  flex-shrink: 0;
}

.cv2-param-label {
  font-size: 9.5px;
  color: rgba(0, 229, 255, 0.5);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.cv2-param-value {
  font-size: 18px;
  font-weight: 900;
  color: #7fff00;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  line-height: 1;
  text-shadow:
      0 0 10px rgba(127, 255, 0, 0.6),
      0 0 22px rgba(127, 255, 0, 0.2);
}

.cv2-param-unit {
  font-size: 10px;
  font-weight: 600;
  color: rgba(0, 229, 255, 0.65);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.cv2-param-divider {
  width: 1px;
  height: 22px;
  background: linear-gradient(180deg,
  transparent,
  rgba(0, 229, 255, 0.3) 50%,
  transparent);
  margin: 0 16px 0 0;
  flex-shrink: 0;
}

.cv2-param-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(0, 255, 170, 0.07);
  border: 1px solid rgba(0, 255, 170, 0.3);
  font-size: 10px;
  font-weight: 700;
  color: #00ffaa;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 255, 170, 0.4);
  flex-shrink: 0;
}

.cv2-param-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ffaa;
  box-shadow: 0 0 6px #00ffaa, 0 0 12px rgba(0, 255, 170, 0.4);
  animation: cv2pulse 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

/* SVG 容器 — 沉浸式暗舱 */
.cv2-svg-wrap {
  flex: 1;
  min-height: 0;
  background:
      radial-gradient(ellipse 60% 70% at 50% 55%, rgba(0, 229, 255, 0.04) 0%, transparent 60%),
      rgba(0, 2, 10, 0.55);
  border: none;
  border-top: 1px solid rgba(0, 229, 255, 0.08);
  border-bottom: 1px solid rgba(0, 229, 255, 0.08);
  border-radius: 0;
  padding: 4px 8px 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow:
      inset 0 0 60px rgba(0, 229, 255, 0.04),
      inset 0 1px 0 rgba(0, 229, 255, 0.06);
}

/* 细腻扫描线叠加 */
.cv2-svg-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(0, 229, 255, 0.012) 3px,
          rgba(0, 229, 255, 0.012) 4px
      );
  pointer-events: none;
  z-index: 1;
}

/* 横向流动高亮光束 */
.cv2-svg-wrap::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg,
  transparent,
  rgba(0, 229, 255, 0.022) 40%,
  rgba(0, 229, 255, 0.04) 50%,
  rgba(0, 229, 255, 0.022) 60%,
  transparent);
  animation: cv2beamSweep 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes cv2beamSweep {
  0% { left: -60%; }
  60%, 100% { left: 160%; }
}

.cv2-svg {
  width: 100%;
  height: 100%;
  max-height: none;
  position: relative;
  z-index: 3;
}

/* ─── 剂量率-速度匹配曲线 + 工艺异常预警 — 升级版 ─── */
.cv2-dose-bar {
  flex-shrink: 0;
  height: 106px;   /* 固定高度 = 86px 内容 + 10px×2 padding */
  padding: 10px 14px;
  background: linear-gradient(180deg,
  rgba(0, 8, 24, 0.9) 0%,
  rgba(0, 12, 32, 0.85) 100%);
  border: none;
  border-top: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 0;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.4s ease;
}

/* 底部底边光晕线 */
.cv2-dose-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent);
}

.cv2-dose-bar.anomaly-warning {
  box-shadow:
      inset 0 0 40px rgba(255, 51, 102, 0.06),
      0 0 20px rgba(255, 51, 102, 0.1);
  animation: anomalyFlash 1s ease-in-out infinite;
}

.cv2-dose-bar.anomaly-warning.under-dose {
  box-shadow:
      inset 0 0 40px rgba(255, 170, 51, 0.06),
      0 0 20px rgba(255, 170, 51, 0.1);
  animation: anomalyFlashUnder 1s ease-in-out infinite;
}

@keyframes anomalyFlash {
  0%, 100% {
    box-shadow: inset 0 0 40px rgba(255, 51, 102, 0.06), 0 0 20px rgba(255, 51, 102, 0.1);
  }
  50% {
    box-shadow: inset 0 0 60px rgba(255, 51, 102, 0.12), 0 0 35px rgba(255, 51, 102, 0.2);
  }
}

@keyframes anomalyFlashUnder {
  0%, 100% {
    box-shadow: inset 0 0 40px rgba(255, 170, 51, 0.06), 0 0 20px rgba(255, 170, 51, 0.1);
  }
  50% {
    box-shadow: inset 0 0 60px rgba(255, 170, 51, 0.12), 0 0 35px rgba(255, 170, 51, 0.2);
  }
}

.cv2-dose-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse 50% 80% at 22% 50%, rgba(0, 229, 255, 0.04) 0%, transparent 55%),
      radial-gradient(ellipse 30% 60% at 78% 50%, rgba(0, 100, 200, 0.03) 0%, transparent 45%);
  pointer-events: none;
}

.cv2-dose-inline {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
  z-index: 1;
  height: 86px; /* 固定整体高度，防止跳动 */
}

/* 左侧：指标面板 — 固定宽高，强化数字显示 */
.cv2-dose-metrics {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  flex: 0 0 136px;  /* 固定宽度，不伸缩 */
  width: 136px;
  height: 100%;
  padding: 0 12px 0 0;
  border-right: 1px solid rgba(0, 229, 255, 0.12);
  position: relative;
}

/* 分隔线光效 */
.cv2-dose-metrics::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 12%;
  bottom: 12%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.45) 50%, transparent);
}

.cv2-metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 229, 255, 0.03);
  border: 1px solid rgba(0, 229, 255, 0.07);
  flex-shrink: 0;
  white-space: nowrap;
}

.cv2-metric-label {
  font-size: 9.5px;
  color: rgb(241 186 84 / 0.75);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.cv2-metric-val {
  font-size: 15px;
  font-weight: 800;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
  letter-spacing: 0.5px;
  min-width: 52px;  /* 固定数值宽度，防止数字跳动 */
  text-align: right;
}

.cv2-metric-val.anomaly {
  color: #ff3355;
  text-shadow: 0 0 8px rgba(255, 51, 85, 0.5);
  animation: textPulse 1s ease-in-out infinite;
}

.cv2-metric-status {
  font-size: 9px;
  padding: 3px 0;
  border-radius: 3px;
  text-align: center;
  margin-top: 1px;
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-good {
  color: #00ffaa;
  background: rgba(0, 255, 170, 0.08);
  border: 1px solid rgba(0, 255, 170, 0.3);
  text-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.status-ok {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.07);
  border: 1px solid rgba(0, 229, 255, 0.25);
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.3);
}

.status-warn {
  color: #ffaa33;
  background: rgba(255, 170, 51, 0.08);
  border: 1px solid rgba(255, 170, 51, 0.3);
  text-shadow: 0 0 6px rgba(255, 170, 51, 0.35);
}

.status-anomaly {
  color: #ff3355;
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.45);
  text-shadow: 0 0 6px rgba(255, 51, 102, 0.5);
  animation: textPulse 1s ease-in-out infinite;
}

@keyframes textPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

/* 中间：图表区域 — 固定高度，加边框装饰 */
.cv2-dose-chart-wrap {
  flex: 1;
  min-width: 0;
  height: 86px;   /* 与外层容器等高 */
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 10px;
  background: rgba(0, 2, 10, 0.4);
  border: 1px solid rgba(0, 229, 255, 0.1);
  box-shadow:
      inset 0 0 20px rgba(0, 229, 255, 0.03),
      0 0 0 1px rgba(0, 229, 255, 0.04);
}

/* 图表区域背景 */
.cv2-dose-chart-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      repeating-linear-gradient(
          90deg,
          transparent,
          transparent 18px,
          rgba(0, 229, 255, 0.04) 18px,
          rgba(0, 229, 255, 0.04) 19px
      ),
      repeating-linear-gradient(
          0deg,
          transparent,
          transparent 14px,
          rgba(0, 229, 255, 0.04) 14px,
          rgba(0, 229, 255, 0.04) 15px
      );
  border-radius: 4px;
  pointer-events: none;
  z-index: 0;
}

.cv2-dose-chart-wrap canvas {
  width: 100% !important;
  height: 100% !important;
  position: relative;
  z-index: 1;
}

/* 右侧：预警指示器 — 固定宽高状态卡片 */
.cv2-anomaly-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 110px;  /* 固定宽度 */
  width: 110px;
  height: 92px;     /* 固定高度 */
  padding: 8px 6px;
  border-left: 1px solid rgba(0, 229, 255, 0.12);
  gap: 5px;
  border-radius: 0;
  background: rgba(0, 229, 255, 0.025);
  position: relative;
  overflow: hidden;
}

.cv2-anomaly-indicator::before {
  content: '';
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.35) 50%, transparent);
}

.cv2-anomaly-indicator.ok {
  background: rgba(0, 255, 170, 0.02);
}

.cv2-anomaly-indicator.ok::before {
  background: linear-gradient(180deg, transparent, rgba(0, 255, 170, 0.25) 50%, transparent);
}

/* 过辐照风险 — 红色系：背景 + outline边框同步闪烁 */
.cv2-anomaly-indicator.over {
  background: rgba(255, 51, 85, 0.08);
  outline: 1.5px solid rgba(255, 51, 85, 0.2);
  outline-offset: -1px;
  animation: flashBgRed 0.75s ease-in-out infinite;
}

@keyframes flashBgRed {
  0%, 100% {
    background: rgba(255, 51, 85, 0.05);
    outline-color: rgba(255, 51, 85, 0.15);
    box-shadow: inset 0 0 18px rgba(255, 51, 85, 0.08);
  }
  50% {
    background: rgba(255, 51, 85, 0.26);
    outline-color: rgba(255, 51, 85, 1);
    box-shadow: inset 0 0 40px rgba(255, 51, 85, 0.35), 0 0 20px rgba(255, 51, 85, 0.4);
  }
}

.cv2-anomaly-indicator.over::before {
  background: linear-gradient(180deg, transparent, rgba(255, 51, 85, 0.7) 50%, transparent);
}

/* 欠辐照风险 — 橙色系：背景 + outline边框同步闪烁 */
.cv2-anomaly-indicator.under {
  background: rgba(255, 170, 51, 0.08);
  outline: 1.5px solid rgba(255, 170, 51, 0.2);
  outline-offset: -1px;
  animation: flashBgOrange 0.75s ease-in-out infinite;
}

@keyframes flashBgOrange {
  0%, 100% {
    background: rgba(255, 170, 51, 0.05);
    outline-color: rgba(255, 170, 51, 0.15);
    box-shadow: inset 0 0 18px rgba(255, 170, 51, 0.08);
  }
  50% {
    background: rgba(255, 170, 51, 0.26);
    outline-color: rgba(255, 170, 51, 1);
    box-shadow: inset 0 0 40px rgba(255, 170, 51, 0.35), 0 0 20px rgba(255, 170, 51, 0.4);
  }
}

.cv2-anomaly-indicator.under::before {
  background: linear-gradient(180deg, transparent, rgba(255, 170, 51, 0.7) 50%, transparent);
}

.cv2-anomaly-icon {
  font-size: 38px;
  line-height: 1;
  filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 4px currentColor);
}

.cv2-anomaly-indicator.over .cv2-anomaly-icon {
  font-size: 52px;
  animation: iconShake 0.5s ease-in-out infinite;
  color: #ff3355;
}

.cv2-anomaly-indicator.under .cv2-anomaly-icon {
  animation: iconShake 0.6s ease-in-out infinite;
  color: #ff9933;
}

.cv2-anomaly-indicator.ok .cv2-anomaly-icon {
  color: #00ffaa;
}

.cv2-anomaly-text {
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5px;
}

.cv2-anomaly-text.over {
  color: #ff3355;
  text-shadow: 0 0 6px rgba(255, 51, 85, 0.5);
}

.cv2-anomaly-text.under {
  color: #ff9933;
  text-shadow: 0 0 6px rgba(255, 153, 51, 0.5);
}

.cv2-anomaly-indicator.ok .cv2-anomaly-text {
  color: #00ffaa;
  text-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.cv2-anomaly-sub {
  font-size: 10px;
  color: rgba(160, 210, 220, 0.6);
  text-align: center;
  letter-spacing: 0.3px;
}

@keyframes iconShake {
  0%, 100% { transform: translateX(0) scale(1); }
  15% { transform: translateX(-4px) scale(1.1) rotate(-4deg); }
  35% { transform: translateX(4px) scale(0.92) rotate(3deg); }
  55% { transform: translateX(-3px) scale(1.06) rotate(-2deg); }
  75% { transform: translateX(3px) scale(0.96) rotate(2deg); }
}

</style>