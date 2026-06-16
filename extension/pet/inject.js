// Veritas Cat v3 — Cute Desktop Pet (Chrome Extension)
// Canvas cat with eye tracking, gentle float, and reactive expressions

(function () {
  if (window.__veritasCatInjected) return
  window.__veritasCatInjected = true

  let container = null
  let isDragging = false
  let dragOffX = 0, dragOffY = 0
  let catX = 30, catY = 150
  let baseX = 30, baseY = 150
  let state = 'idle'
  let isSpeaking = false
  let frame = 0
  let mouseX = 100, mouseY = 100
  let eyeDirX = 0, eyeDirY = 0
  let floatOffset = 0
  let lastDragTime = 0

  const TIPS = [
    'Hi! I check facts for you! 🐱✨',
    'Right-click any text → "Check for Hallucinations"!',
    'Python was created in 1991, not 2010! Meow!',
    'Earth has ONE moon. Just one! 🌙',
    'Google was founded in 1998 by Larry Page & Sergey Brin!',
    'I run on Veritas AI — keeping AI honest! 🎧',
    'Select text, right-click, and I\'ll verify it!',
    '*headphone boop* Ready to check some facts?',
    'The speed of light is ~300,000 km/s! ⚡',
    'Drag me anywhere! I\'m your fact-checking buddy!',
  ]

  const REACTIONS = {
    HIGH: ['🚨 HALLUCINATION! 🚨', 'That\'s NOT right! 😿', 'Fake news detected! ❌'],
    MEDIUM: ['🧐 Hmm, suspicious...', '🤔 Better double-check this!'],
    LOW: ['✅ Looks good! ✨', '👍 All clear! Reliable!'],
  }

  // ── Build DOM ──────────────────────────────────────────────────────────

  function buildCat() {
    container = document.createElement('div')
    container.id = 'veritas-cat-container'
    container.innerHTML = `
      <div id="vcat-speech" class="vcat-hidden">
        <div id="vcat-speech-text"></div>
        <div id="vcat-speech-arrow"></div>
      </div>
      <canvas id="vcat-canvas" width="100" height="100"></canvas>
      <div id="vcat-status"><span id="vcat-emoji">🎧</span><span id="vcat-label">Ready!</span></div>
    `
    document.body.appendChild(container)

    chrome.storage.local.get(['catX', 'catY'], (r) => {
      baseX = r.catX ?? 30
      baseY = r.catY ?? 150
      catX = baseX
      catY = baseY
      container.style.left = baseX + 'px'
      container.style.top = baseY + 'px'
    })

    // Drag
    const body = container.querySelector('#vcat-canvas')
    body.addEventListener('mousedown', (e) => {
      isDragging = true
      lastDragTime = Date.now()
      const rect = container.getBoundingClientRect()
      dragOffX = e.clientX - rect.left
      dragOffY = e.clientY - rect.top
      container.style.transition = 'none'
      floatOffset = 0
    })
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!isDragging) return
      catX = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragOffX))
      catY = Math.max(0, Math.min(window.innerHeight - 150, e.clientY - dragOffY))
      container.style.left = catX + 'px'
      container.style.top = catY + 'px'
    })
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        baseX = catX
        baseY = catY
        chrome.storage.local.set({ catX: baseX, catY: baseY })
      }
    })

    // Click for tips
    body.addEventListener('click', () => say(TIPS[Math.floor(Math.random() * TIPS.length)], 4000))

    drawCat(frame)
    animate()
    setTimeout(() => say('Hi! I\'m Veritas Cat! 🐱🎧\nRight-click any text → check facts!', 5000), 1500)

    // Periodic tips
    setInterval(() => {
      if (state === 'idle' && Math.random() < 0.3 && !isSpeaking)
        say(TIPS[Math.floor(Math.random() * TIPS.length)], 4000)
    }, 15000)
  }

  // ── Compute eye direction based on mouse ──────────────────────────────

  function updateEyeDir() {
    if (!container) return
    const rect = container.getBoundingClientRect()
    const cx = rect.left + 50
    const cy = rect.top + 36
    const dx = mouseX - cx
    const dy = mouseY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 5) {
      const maxOffset = 3
      eyeDirX = (dx / dist) * maxOffset
      eyeDirY = (dy / dist) * maxOffset
    }
  }

  // ── Draw Cute Cat ─────────────────────────────────────────────────────

  function drawCat(f) {
    const canvas = document.getElementById('vcat-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 100, 100)

    // Colors
    const fur = '#F5E6D3'
    const furDark = '#D4A574'
    const furLight = '#FDF5EE'
    const ear = '#F0C8A0'
    const earIn = '#FFD1DC'
    const pupil = '#3D2B1F'
    const blush = '#FFB5C0'
    const nose = '#FF9EB5'
    const hp = '#4A4A5A'
    const hpAcc = '#FF7EB3'
    const collarC = '#FF6B8A'
    const bellC = '#FFD700'
    const white = '#FFFFFF'

    const blink = f % 100 < 6
    const breathe = Math.sin(f * 0.08) * 0.8
    const earBob = Math.sin(f * 0.12) * 2

    // ── Body ──
    ctx.fillStyle = furDark
    ctx.beginPath()
    ctx.ellipse(50, 70, 18, 16 + breathe, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(50, 67, 14, 12 + breathe, 0, 0, Math.PI * 2)
    ctx.fill()

    // ── BIG Head (chibi!) ──
    ctx.fillStyle = fur
    ctx.beginPath()
    ctx.ellipse(50, 36, 28, 26, 0, 0, Math.PI * 2)
    ctx.fill()

    // Face
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(50, 42, 20, 16, 0, 0, Math.PI * 2)
    ctx.fill()

    // ── Cheek fluff ──
    for (const s of [-1, 1]) {
      ctx.fillStyle = furLight
      ctx.beginPath()
      ctx.ellipse(50 + s * 24, 42, 14, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // ── Ears ──
    for (const s of [-1, 1]) {
      const ex = 50 + s * 24
      const ey = 12
      ctx.fillStyle = ear
      ctx.beginPath()
      ctx.moveTo(ex - 8, ey + 10 + earBob)
      ctx.lineTo(ex, ey - 6 + earBob)
      ctx.lineTo(ex + 8, ey + 10 + earBob)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = earIn
      ctx.beginPath()
      ctx.moveTo(ex - 4, ey + 7 + earBob)
      ctx.lineTo(ex, ey - 2 + earBob)
      ctx.lineTo(ex + 4, ey + 7 + earBob)
      ctx.closePath()
      ctx.fill()
    }

    // ── Headphones ──
    ctx.fillStyle = hp
    ctx.fillRect(8, 14, 84, 5)
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(50 + s * 38, 28, 9, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = hpAcc
      ctx.beginPath()
      ctx.arc(50 + s * 38, 28, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = hp
    }

    // ── BIG Eyes (with mouse tracking) ──
    for (const s of [-1, 1]) {
      const ex = 50 + s * 14
      const ey = 32
      // White
      ctx.fillStyle = white
      ctx.beginPath()
      ctx.ellipse(ex, ey, 9, 10, 0, 0, Math.PI * 2)
      ctx.fill()

      if (blink) {
        // Happy squish
        ctx.strokeStyle = pupil
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ex - 2, ey - 1, 6, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(ex + 2, ey - 1, 6, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
      } else {
        // Iris with eye tracking
        const ix = ex + eyeDirX
        const iy = ey + eyeDirY * 0.6
        ctx.fillStyle = pupil
        ctx.beginPath()
        ctx.ellipse(ix, iy, 6, 7.5, 0, 0, Math.PI * 2)
        ctx.fill()
        // Primary shine (big!)
        ctx.fillStyle = white
        ctx.beginPath()
        ctx.arc(ix + 2.5, iy - 3, 2.8, 0, Math.PI * 2)
        ctx.fill()
        // Secondary shine
        ctx.beginPath()
        ctx.arc(ix - 2, iy + 2, 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── Blush ──
    for (const s of [-1, 1]) {
      ctx.fillStyle = blush
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.ellipse(50 + s * 20, 42, 7, 4.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // ── Nose ──
    ctx.fillStyle = nose
    ctx.beginPath()
    ctx.moveTo(50, 38)
    ctx.lineTo(47, 42)
    ctx.lineTo(53, 42)
    ctx.closePath()
    ctx.fill()

    // ── Cute Smile ──
    ctx.strokeStyle = pupil
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(50, 42, 5, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()

    // ── Whiskers ──
    ctx.strokeStyle = 'rgba(180,160,140,0.4)'
    ctx.lineWidth = 1
    for (const s of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(50 + s * 12, 38 + i * 5)
        ctx.lineTo(50 + s * 32, 34 + i * 6)
        ctx.stroke()
      }
    }

    // ── Collar ──
    ctx.fillStyle = collarC
    ctx.beginPath()
    ctx.ellipse(50, 60, 9, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Bell
    ctx.fillStyle = bellC
    ctx.beginPath()
    ctx.arc(50, 64, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#DAA520'
    ctx.beginPath()
    ctx.arc(50, 66.5, 1, 0, Math.PI * 2)
    ctx.fill()

    // ── Paws ──
    for (const s of [-1, 1]) {
      for (const f of [-1, 1]) {
        ctx.fillStyle = furDark
        ctx.beginPath()
        ctx.ellipse(50 + s * 16, 76 + f * 5, 5, 3.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#FFB5B5'
        ctx.beginPath()
        ctx.ellipse(50 + s * 16, 79 + f * 5, 3, 1.5, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── Tail ──
    ctx.strokeStyle = furDark
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    const tailWag = Math.sin(f * 0.06) * 4
    ctx.moveTo(50, 80)
    ctx.quadraticCurveTo(68, 78, 72 + tailWag, 68)
    ctx.stroke()
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.arc(72 + tailWag, 68, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── Animation Loop (with gentle float + eye tracking) ─────────────────

  let animFrame = 0
  function animate() {
    animFrame++
    updateEyeDir()

    // Gentle floating idle
    if (!isDragging) {
      floatOffset = Math.sin(animFrame * 0.015) * 4
      container.style.top = (baseY + floatOffset) + 'px'
    }

    drawCat(animFrame)
    requestAnimationFrame(animate)
  }

  // ── Speech ─────────────────────────────────────────────────────────────

  function say(text, duration = 4000) {
    const speech = document.getElementById('vcat-speech')
    const textEl = document.getElementById('vcat-speech-text')
    if (!speech || !textEl) return
    textEl.textContent = text
    speech.classList.remove('vcat-hidden')
    speech.classList.add('vcat-show')
    isSpeaking = true
    setState('talking')

    clearTimeout(speech._timer)
    speech._timer = setTimeout(() => {
      speech.classList.remove('vcat-show')
      speech.classList.add('vcat-hidden')
      isSpeaking = false
    }, duration)
  }

  function sayResult(result) {
    const score = result.hallucination_score ?? 50
    let cat = 'LOW'
    if (score >= 70) cat = 'HIGH'
    else if (score >= 30) cat = 'MEDIUM'

    const msgs = REACTIONS[cat]
    let msg = msgs[Math.floor(Math.random() * msgs.length)]
    const details = result.issues?.length ? '\n' + result.issues.slice(0, 2).join('\n') : ''
    say(`${msg} [${Math.round(score)}/100]${details}`, 5000)
  }

  function setState(newState) {
    state = newState
    const emoji = document.getElementById('vcat-emoji')
    const label = document.getElementById('vcat-label')
    if (!emoji || !label) return
    const states = {
      idle: { e: '🎧', l: 'Ready!' },
      listening: { e: '👂', l: 'Listening...' },
      thinking: { e: '🤔', l: 'Hmm...' },
      talking: { e: '💬', l: 'Meow!' },
    }
    const s = states[newState] || states.idle
    emoji.textContent = s.e
    label.textContent = s.l
    setTimeout(() => {
      if (state === newState) {
        emoji.textContent = states.idle.e
        label.textContent = states.idle.l
        state = 'idle'
      }
    }, 3000)
  }

  // ── Message Handler ────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'CHECK_HALLUCINATION') {
      setState('thinking')
      say('Let me check that... 🧐', 2000)
      chrome.runtime.sendMessage({ type: 'VERIFY_TEXT', text: msg.text }, (res) => {
        if (res) sayResult(res)
        else say('Couldn\'t reach Veritas API! 😿', 3000)
      })
    }
    if (msg.type === 'SUMMON_CAT') {
      container.style.display = 'block'
      say('You called? 🐱', 3000)
    }
    if (msg.type === 'HIDE_CAT') container.style.display = 'none'
    if (msg.type === 'SHOW_CAT') container.style.display = 'block'
  })

  // ── Init ────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', buildCat)
  else
    buildCat()
})()
