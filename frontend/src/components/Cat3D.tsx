import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Cat3D({ interactive = true }: { interactive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let rafId = 0

    try {
      const w = container.clientWidth || 280
      const h = container.clientHeight || 280

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(25, w / h, 0.1, 10)
      camera.position.set(1.2, 1.2, 3.8)
      camera.lookAt(0, 0.4, 0)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      container.appendChild(renderer.domElement)

      // ── Lights (soft, friendly) ────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xFFFFFF, 0.8))
      const key = new THREE.DirectionalLight(0xFFEEDD, 1.8)
      key.position.set(2, 3, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xDDEEFF, 0.6)
      fill.position.set(-2, 1, -2)
      scene.add(fill)
      const rim = new THREE.DirectionalLight(0xFFFFFF, 0.3)
      rim.position.set(-1, 2, -3)
      scene.add(rim)
      const bottom = new THREE.DirectionalLight(0xFFDDCC, 0.2)
      bottom.position.set(0, -2, 1)
      scene.add(bottom)

      // ── Soft ground glow ──────────────────────────────────────────
      const glow = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 1.1, 24),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.05, side: THREE.DoubleSide })
      )
      glow.rotation.x = -Math.PI / 2
      glow.position.y = -0.55
      scene.add(glow)

      // ── Build Cute Cat ──────────────────────────────────────────────
      const g = new THREE.Group()

      const C = {
        fur: 0xF5E6D3, // cream
        dark: 0xD4A574, // warm brown
        light: 0xFDF5EE, // white-cream
        ear: 0xF0C8A0,
        earIn: 0xFFD1DC, // pink inner ear
        pupil: 0x3D2B1F, // warm dark brown
        nose: 0xFF9EB5,
        tongue: 0xFF7B9C,
        blush: 0xFFB5C0,
        hp: 0x4A4A5A,
        hpPad: 0x6B6B7B,
        hpAcc: 0xFF7EB3,
        collar: 0xFF6B8A,
        bell: 0xFFD700,
        bellShine: 0xFFED4A,
      }

      const mat = (color: number, opts = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts })

      // ── Body (small, round) ──────────────────────────────────────────
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 20), mat(C.dark))
      body.position.y = -0.3
      body.scale.set(1, 0.8, 0.75)
      g.add(body)

      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), mat(C.light))
      belly.position.set(0, -0.1, 0.35)
      belly.scale.set(1, 0.65, 0.5)
      g.add(belly)

      // ── Chibi Head (big!) ────────────────────────────────────────────
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), mat(C.fur))
      head.position.y = 0.55
      head.scale.set(1, 0.92, 0.85)
      g.add(head)

      // Face fluff
      const faceFluff = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), mat(C.light))
      faceFluff.position.set(0, 0.5, 0.55)
      faceFluff.scale.set(1, 0.7, 0.45)
      g.add(faceFluff)

      // ── Cheeks (fluffy side tufts) ──────────────────────────────────
      for (const s of [-1, 1]) {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), mat(C.light))
        cheek.position.set(s * 0.6, 0.35, 0.45)
        cheek.scale.set(1.2, 0.6, 0.4)
        g.add(cheek)
      }

      // ── Ears (big, slightly floppy) ─────────────────────────────────
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 8), mat(C.ear))
        ear.position.set(s * 0.5, 0.95, 0.08)
        ear.rotation.z = s * 0.3
        ear.rotation.x = -0.25
        g.add(ear)
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 6), mat(C.earIn))
        inner.position.set(s * 0.5, 0.95, 0.14)
        inner.rotation.z = s * 0.3
        inner.rotation.x = -0.25
        g.add(inner)
      }

      // ── BIG Expressive Eyes (anime style) ────────────────────────────
      for (const s of [-1, 1]) {
        // Eye white
        const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), mat(0xFFFFFF, { roughness: 0.05 }))
        eyeW.position.set(s * 0.24, 0.62, 0.6)
        g.add(eyeW)

        // Iris (big!)
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), mat(C.pupil))
        iris.position.set(s * 0.24, 0.62, 0.72)
        iris.scale.set(1, 1.2, 0.4)
        g.add(iris)

        // Primary catchlight (BIG shine)
        const shine1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0xFFFFFF, { emissive: 0xFFFFFF, emissiveIntensity: 0.5 }))
        shine1.position.set(s * 0.28, 0.66, 0.75)
        g.add(shine1)

        // Secondary catchlight
        const shine2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0xFFFFFF, { emissive: 0xFFFFFF, emissiveIntensity: 0.3 }))
        shine2.position.set(s * 0.2, 0.59, 0.76)
        g.add(shine2)
      }

      // ── Blush (pink cheeks!) ─────────────────────────────────────────
      for (const s of [-1, 1]) {
        const blush = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(C.blush, { transparent: true, opacity: 0.5 }))
        blush.position.set(s * 0.42, 0.42, 0.6)
        blush.scale.set(1.3, 0.6, 0.3)
        g.add(blush)
      }

      // ── Tiny Nose ─────────────────────────────────────────────────────
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(C.nose))
      nose.position.set(0, 0.5, 0.72)
      nose.scale.set(1.2, 0.7, 0.5)
      g.add(nose)

      // ── Cute Smile ────────────────────────────────────────────────────
      const smilePts = [
        new THREE.Vector3(-0.08, 0.44, 0.74),
        new THREE.Vector3(-0.03, 0.42, 0.76),
        new THREE.Vector3(0, 0.41, 0.77),
        new THREE.Vector3(0.03, 0.42, 0.76),
        new THREE.Vector3(0.08, 0.44, 0.74),
      ]
      const smile = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 6, 0.008, 4, false),
        mat(C.pupil)
      )
      g.add(smile)

      // ── Whiskers ──────────────────────────────────────────────────────
      const whiskerMat = mat(0xCCCCCC, { transparent: true, opacity: 0.35 })
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.35, 4), whiskerMat)
          w.position.set(s * 0.3, 0.46 + i * 0.06, 0.7)
          w.rotation.z = s * (0.35 + i * 0.1)
          g.add(w)
        }
      }

      // ── Headphones ────────────────────────────────────────────────────
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.045, 6, 18, Math.PI),
        mat(C.hp, { roughness: 0.3, metalness: 0.4 })
      )
      band.position.y = 0.6
      band.rotation.x = 0.1
      band.scale.set(1, 0.75, 0.45)
      g.add(band)

      for (const s of [-1, 1]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 10), mat(C.hpPad, { roughness: 0.5 }))
        cup.position.set(s * 0.6, 0.55, 0.05)
        cup.rotation.x = 0.2
        cup.rotation.z = s * 0.15
        g.add(cup)
        const acc = new THREE.Mesh(new THREE.CircleGeometry(0.11, 8), mat(C.hpAcc, { roughness: 0.2, metalness: 0.3, side: THREE.DoubleSide }))
        acc.position.set(s * 0.6, 0.55, 0.12)
        acc.rotation.x = 0.2
        acc.rotation.z = s * 0.15
        g.add(acc)
      }

      // ── Collar with Bell ──────────────────────────────────────────────
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 12), mat(C.collar, { roughness: 0.4 }))
      collar.position.y = 0.0
      collar.rotation.x = -0.3
      collar.scale.set(1, 0.5, 0.45)
      g.add(collar)

      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(C.bell, { roughness: 0.2, metalness: 0.7 }))
      bell.position.set(0, -0.06, 0.35)
      bell.scale.set(1, 1.3, 0.8)
      g.add(bell)

      const bellLine = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 4),
        mat(C.bellShine, { emissive: C.bellShine, emissiveIntensity: 0.3, side: THREE.DoubleSide })
      )
      bellLine.position.set(0, -0.1, 0.38)
      g.add(bellLine)

      // ── Legs (little round paws) ─────────────────────────────────────
      for (const s of [-1, 1]) {
        for (const f of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(C.dark))
          leg.position.set(s * 0.35, -0.65, f * 0.35)
          leg.scale.set(0.9, 0.6, 1.1)
          g.add(leg)
          const paw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0xFFB5B5))
          paw.position.set(s * 0.35, -0.75, f * 0.35)
          paw.scale.set(1.2, 0.3, 1)
          g.add(paw)
        }
      }

      // ── Tail (curly, fluffy) ──────────────────────────────────────────
      const tailPts = [
        new THREE.Vector3(0, -0.5, -0.7),
        new THREE.Vector3(0.2, -0.3, -1.0),
        new THREE.Vector3(0.4, 0.1, -1.1),
        new THREE.Vector3(0.3, 0.4, -0.9),
        new THREE.Vector3(0.1, 0.55, -0.7),
      ]
      const tail = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 10, 0.09, 6, false),
        mat(C.dark)
      )
      g.add(tail)

      // Tail fluff tip
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), mat(C.light))
      tip.position.set(0.1, 0.55, -0.7)
      g.add(tip)

      scene.add(g)

      // ── Animation ──────────────────────────────────────────────────────
      const clock = new THREE.Clock()

      const animate = () => {
        if (cancelled) return
        const t = clock.getElapsedTime()

        // Happy idle sway
        g.position.y = Math.sin(t * 0.6) * 0.025
        g.rotation.y = Math.sin(t * 0.3) * 0.08

        // Head tilt (curious)
        head.rotation.z = Math.sin(t * 0.2) * 0.04
        head.rotation.x = Math.sin(t * 0.15) * 0.02

        // Ear flop
        g.children.forEach((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh && mesh.geometry.type === 'ConeGeometry' && mesh.position.y > 0.8) {
            mesh.rotation.z = (mesh.position.x > 0 ? 0.3 : -0.3) + Math.sin(t * 1.8 + (mesh.position.x > 0 ? 0 : 2)) * 0.04
          }
        })

        // Blink
        const blink = t % 3
        g.children.forEach((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh && mesh.geometry.type === 'SphereGeometry' && (mesh.material as THREE.MeshStandardMaterial)?.color?.getHex() === 0xFFFFFF && mesh.position.z > 0.55) {
            if ((blink > 2.85 && mesh.position.x > 0) || (blink > 2.75 && mesh.position.x < 0)) {
              mesh.scale.y = 0.08
            } else if (mesh.scale.y < 0.5) {
              mesh.scale.y = 1.0
            }
          }
        })

        // Tail wag
        tail.rotation.y = Math.sin(t * 0.7) * 0.15
        tip.rotation.y = Math.sin(t * 0.7) * 0.15

        // Gentle bounce when "talking" — subtle
        const bounce = Math.sin(t * 2.5) * 0.005
        g.position.y += bounce

        // Bell jingle
        bell.position.x = Math.sin(t * 0.9) * 0.008
        bell.position.z = 0.35 + Math.sin(t * 0.9 + 0.5) * 0.008

        renderer.render(scene, camera)
        rafId = requestAnimationFrame(animate)
      }

      animate()

      const resize = () => {
        if (!container || cancelled) return
        const cw = container.clientWidth || 280
        const ch = container.clientHeight || 280
        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        renderer.setSize(cw, ch)
      }
      window.addEventListener('resize', resize)

      return () => {
        cancelled = true
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', resize)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        scene.clear()
      }
    } catch (err) {
      console.error('Cat3D error:', err)
      container.innerHTML = '<div class="flex items-center justify-center h-full text-4xl text-white/30">😸</div>'
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: 'inherit' }} />
}
