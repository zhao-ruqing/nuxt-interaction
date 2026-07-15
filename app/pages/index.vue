<template>
  <div ref="homeRef" class="xj-home" @mousemove="handlePointerMove">
    <canvas ref="canvasRef" class="xj-home__canvas" />
    <div class="xj-home__grid" />
    <div class="xj-home__glow xj-home__glow--one" />
    <div class="xj-home__glow xj-home__glow--two" />

    <NuxtLink data-testid="dev-points-preview" to="/dashboard/points?create=1" style="position:fixed;left:8px;top:100px;z-index:9999">PREVIEW</NuxtLink>

    <header class="home-nav">
      <NuxtLink to="/" class="home-brand">
        <span class="home-brand__mark">行</span>
        <span class="home-brand__copy"><strong>行鉴</strong><small>XINGJIAN / CITY ARCHIVE</small></span>
      </NuxtLink>
      <nav class="home-nav__links">
        <NuxtLink to="/cities">城市</NuxtLink>
        <NuxtLink to="/checkins">地图打卡</NuxtLink>
        <NuxtLink to="/routes">探索路线</NuxtLink>
        <NuxtLink to="/activities">城市活动</NuxtLink>
        <NuxtLink to="/products">饮品商城</NuxtLink>
      </nav>
      <div class="home-nav__actions">
        <NuxtLink to="/auth/login" class="home-nav__login">登录</NuxtLink>
        <NuxtLink to="/checkins" class="home-nav__start">开始探索 <span>↗</span></NuxtLink>
      </div>
    </header>

    <main>
      <section class="home-hero">
        <div class="home-hero__copy">
          <div class="home-eyebrow" data-reveal><span class="signal-dot" />CITY FIELD SYSTEM · ONLINE</div>
          <h1 data-reveal><span class="hero-title-line">把城市，</span><span class="hero-title-line">走成自己的<em>作品。</em></span></h1>
          <p class="home-hero__lead" data-reveal>行鉴把真实城市变成一套可以探索、记录和分享的坐标系统。发现地点，进入围栏，完成打卡，让每一次步行都有迹可循。</p>
          <div class="home-hero__actions" data-reveal>
            <NuxtLink to="/checkins" class="home-button home-button--primary">打开城市地图 <LucideIcon name="arrow-up-right" :size="17" /></NuxtLink>
            <NuxtLink to="/routes" class="home-button home-button--ghost">浏览精选路线</NuxtLink>
          </div>
          <div class="home-hero__metrics" data-reveal>
            <div><strong>{{ cityCount }}</strong><span>开放城市</span></div>
            <div><strong>{{ pointCount }}</strong><span>可探索点位</span></div>
            <div><strong>{{ routeCount }}</strong><span>城市路线</span></div>
          </div>
        </div>

        <div ref="heroVisualRef" class="home-hero__visual" data-reveal>
          <div class="city-orbit city-orbit--outer" /><div class="city-orbit city-orbit--middle" /><div class="city-orbit city-orbit--inner" />
          <div class="city-radar" /><div class="city-axis city-axis--x" /><div class="city-axis city-axis--y" />
          <svg class="city-route" viewBox="0 0 620 620" aria-hidden="true"><path d="M78 410 C155 335 190 350 245 275 S350 175 422 226 S507 316 555 150" /></svg>
          <span class="city-node city-node--1"><i />01</span><span class="city-node city-node--2"><i />02</span><span class="city-node city-node--3"><i />03</span><span class="city-node city-node--4"><i />04</span>
          <div class="city-core"><span>ACTIVE CITY</span><strong>{{ featuredCity.name }}</strong><p>{{ featuredCity.province || 'CITY ARCHIVE' }}</p></div>
          <div class="city-coordinate city-coordinate--top">N 31.2304°</div><div class="city-coordinate city-coordinate--bottom">E 121.4737°</div>
          <div class="city-status-card"><span><i /> LIVE POSITION</span><strong>探索半径 / 3.2 KM</strong><div><b style="--w:76%" /><b style="--w:42%" /><b style="--w:91%" /></div></div>
        </div>
        <div class="home-hero__scroll"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section class="home-statement home-section">
        <div class="section-index" data-reveal>01 / WHY XINGJIAN</div>
        <div class="statement-copy" data-reveal><p>不是攻略列表，<br>而是一套属于你的城市档案。</p></div>
        <div class="statement-detail" data-reveal><p>从地图选点到地理围栏，从路线完成到积分奖励，行鉴把线下发生的真实行动转化成清晰、可信、可回看的探索记录。</p><NuxtLink to="/xingjian">了解行鉴系统 <span>→</span></NuxtLink></div>
      </section>

      <section class="city-showcase home-section">
        <header class="section-head" data-reveal><div><span class="section-index">02 / CITY SELECTION</span><h2>选择一座城市，<br>从一个坐标开始。</h2></div><p>精选城市中的建筑、街区、滨水空间与文化现场。每个点位都有真实围栏和独立奖励。</p></header>
        <div class="city-cards">
          <NuxtLink v-for="(city,index) in displayCities" :key="city.id || index" :to="`/checkins?cityId=${city.id}`" class="city-card" data-reveal>
            <div class="city-card__top"><span>{{ String(index + 1).padStart(2,'0') }}</span><span>{{ city.province || 'CHINA' }}</span></div>
            <div class="city-card__map" :class="`city-card__map--${index + 1}`"><i v-for="n in 7" :key="n" :style="{ '--i': n }" /><b /></div>
            <div class="city-card__body"><h3>{{ city.name }}</h3><p>{{ city.description || cityDescriptions[index] }}</p></div>
            <div class="city-card__foot"><span>{{ city.pointCount || cityPointFallback[index] }} POINTS</span><strong>进入城市 ↗</strong></div>
          </NuxtLink>
        </div>
      </section>

      <section class="experience home-section">
        <header class="section-head section-head--compact" data-reveal><div><span class="section-index">03 / EXPLORATION FLOW</span><h2>从发现，到抵达。</h2></div></header>
        <div class="experience-grid">
          <article v-for="(item,index) in experienceSteps" :key="item.title" class="experience-card" data-reveal>
            <span class="experience-card__number">0{{ index + 1 }}</span><div class="experience-card__icon"><LucideIcon :name="item.icon" :size="23" /></div><h3>{{ item.title }}</h3><p>{{ item.description }}</p><div class="experience-card__line"><i /></div>
          </article>
        </div>
      </section>

      <section class="field-console home-section" data-reveal>
        <div class="field-console__copy"><span class="section-index">04 / YOUR FIELD NOTES</span><h2>每次出发，<br>都在建立你的城市坐标系。</h2><p>完成打卡、路线和活动后，积分会进入个人档案。它们不仅能兑换奖励，也会成为你与这座城市真实发生过联系的证明。</p><div class="field-console__actions"><NuxtLink to="/auth/register" class="home-button home-button--primary">创建探索档案</NuxtLink><NuxtLink to="/rankings" class="home-button home-button--ghost">查看城市排行</NuxtLink></div></div>
        <div class="field-console__panel">
          <div class="console-head"><span>FIELD LOG / PREVIEW</span><i /><i /><i /></div>
          <div class="console-profile"><div class="console-profile__avatar">行</div><div><span>URBAN EXPLORER</span><strong>城市观察者</strong></div><b>LV.08</b></div>
          <div class="console-stats"><div><span>CHECK-INS</span><strong>24</strong></div><div><span>DISTANCE</span><strong>86.4<small>KM</small></strong></div><div><span>POINTS</span><strong>1,280</strong></div></div>
          <div class="console-route"><div class="console-route__track"><i /><i /><i /><i /></div><div class="console-route__labels"><span>武康大楼</span><span>徐汇滨江</span><span>城市终点</span></div></div>
          <div class="console-log"><span>LAST SIGNAL</span><p>你在 18:42 进入「徐汇滨江」有效围栏，获得 15 积分。</p></div>
        </div>
      </section>

      <section class="home-cta home-section" data-reveal><div class="home-cta__orbit"><i /><i /><i /></div><span>READY FOR THE NEXT COORDINATE?</span><h2>下一段城市故事，<br>从你的位置开始。</h2><NuxtLink to="/checkins" class="home-button home-button--primary">立即开始探索 <LucideIcon name="arrow-up-right" :size="17" /></NuxtLink></section>
    </main>

    <footer class="home-footer">
      <NuxtLink to="/" class="home-brand"><span class="home-brand__mark">行</span><span class="home-brand__copy"><strong>行鉴</strong><small>XINGJIAN / CITY ARCHIVE</small></span></NuxtLink>
      <div class="home-footer__links"><NuxtLink to="/cities">城市</NuxtLink><NuxtLink to="/checkins">打卡</NuxtLink><NuxtLink to="/routes">路线</NuxtLink><NuxtLink to="/activities">活动</NuxtLink><NuxtLink to="/mall">积分商城</NuxtLink></div>
      <span>© {{ new Date().getFullYear() }} XINGJIAN · DESKTOP EXPERIENCE</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

definePageMeta({ layout: false })
useHead({
  title: '行鉴 — 走进城市，留下坐标',
  bodyAttrs: { class: 'xj-home-body' },
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap' }],
})

const { data: cityResponse } = await useFetch<any>('/api/cities')
const { data: pointResponse } = await useFetch<any>('/api/points')
const { data: routeResponse } = await useFetch<any>('/api/routes')
const homeRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const heroVisualRef = ref<HTMLElement | null>(null)

const fallbackCities = [
  { id: 1, name: '上海', province: 'SHANGHAI', pointCount: 12, description: '从梧桐街区到滨水空间，读取城市更新留下的层层切片。' },
  { id: 2, name: '杭州', province: 'ZHEJIANG', pointCount: 9, description: '沿湖岸、桥梁与老街行走，在山水之间寻找日常生活的尺度。' },
  { id: 3, name: '苏州', province: 'JIANGSU', pointCount: 7, description: '穿过园林、河巷与新城，在传统秩序和当代生活之间漫游。' },
]
const cityDescriptions = fallbackCities.map(item => item.description)
const cityPointFallback = [12, 9, 7]
const cities = computed<any[]>(() => cityResponse.value?.data || [])
const points = computed<any[]>(() => pointResponse.value?.data || [])
const routes = computed<any[]>(() => routeResponse.value?.data || [])
const displayCities = computed(() => {
  const source = cities.value.length ? cities.value : fallbackCities
  return [...source.slice(0, 3), ...fallbackCities].slice(0, 3)
})
const featuredCity = computed(() => displayCities.value[0] || fallbackCities[0])
const cityCount = computed(() => String(cities.value.length || 3).padStart(2, '0'))
const pointCount = computed(() => String(points.value.length || 28).padStart(2, '0'))
const routeCount = computed(() => String(routes.value.length || 6).padStart(2, '0'))
const experienceSteps = [
  { icon: 'map', title: '发现坐标', description: '在城市地图中查看点位、围栏范围和当前位置，选择下一处值得抵达的现场。' },
  { icon: 'navigation', title: '进入现场', description: '按照路线抵达真实地点。定位精度和服务端围栏共同确保每次打卡可信。' },
  { icon: 'scan-line', title: '留下记录', description: '完成打卡、路线与活动，让时间、地点和奖励进入个人城市档案。' },
  { icon: 'sparkles', title: '交换体验', description: '使用探索积分兑换城市好物、活动权益和一杯真正属于路上的饮品。' },
]

interface SignalParticle { x: number; y: number; vx: number; vy: number; size: number; phase: number }
let particles: SignalParticle[] = []
let context: CanvasRenderingContext2D | null = null
let rafId = 0
let canvasWidth = 0
let canvasHeight = 0
let animationContext: gsap.Context | null = null

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  context = canvas.getContext('2d')
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles = Array.from({ length: 44 }, () => ({ x: Math.random() * canvasWidth, y: Math.random() * canvasHeight, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, size: Math.random() * 1.4 + .4, phase: Math.random() * Math.PI * 2 }))
}

function drawSignalField() {
  if (!context) return
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  const styles = getComputedStyle(document.documentElement)
  const accent = styles.getPropertyValue('--xj-accent').trim() || '#f4ff58'
  const border = styles.getPropertyValue('--xj-border').trim() || 'rgba(255,255,255,.1)'
  particles.forEach((particle, index) => {
    particle.x += particle.vx
    particle.y += particle.vy
    particle.phase += .01
    if (particle.x < -20) particle.x = canvasWidth + 20
    if (particle.x > canvasWidth + 20) particle.x = -20
    if (particle.y < -20) particle.y = canvasHeight + 20
    if (particle.y > canvasHeight + 20) particle.y = -20
    context!.beginPath()
    context!.fillStyle = index % 7 === 0 ? accent : border
    context!.globalAlpha = index % 7 === 0 ? .42 : .55
    context!.arc(particle.x, particle.y, particle.size + Math.sin(particle.phase) * .3, 0, Math.PI * 2)
    context!.fill()
  })
  context.globalAlpha = 1
  rafId = requestAnimationFrame(drawSignalField)
}

function handlePointerMove(event: MouseEvent) {
  const x = event.clientX / window.innerWidth - .5
  const y = event.clientY / window.innerHeight - .5
  if (heroVisualRef.value) gsap.to(heroVisualRef.value, { x: x * 14, y: y * 10, rotateX: y * -2, rotateY: x * 2, duration: .8, ease: 'power3.out' })
}

function initAnimations() {
  if (!homeRef.value) return
  gsap.registerPlugin(ScrollTrigger)
  animationContext = gsap.context(() => {
    gsap.from('.home-nav', { y: -28, opacity: 0, duration: .8, ease: 'power3.out' })
    gsap.from('.home-hero [data-reveal]', { y: 42, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', delay: .12 })
    gsap.from('.city-node', { scale: 0, opacity: 0, duration: .7, stagger: .12, ease: 'back.out(1.8)', delay: .65 })
    gsap.to('.city-radar', { rotate: 360, duration: 10, repeat: -1, ease: 'none' })
    gsap.to('.city-orbit--middle', { rotate: -360, duration: 24, repeat: -1, ease: 'none' })
    gsap.to('.city-orbit--inner', { rotate: 360, duration: 18, repeat: -1, ease: 'none' })
    gsap.utils.toArray<HTMLElement>('.home-section [data-reveal], .home-section[data-reveal]').forEach((element) => {
      gsap.from(element, { y: 46, opacity: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } })
    })
  }, homeRef.value)
}

onMounted(() => {
  document.body.classList.add('xj-home-body')
  resizeCanvas()
  drawSignalField()
  initAnimations()
  window.addEventListener('resize', resizeCanvas)
})
onUnmounted(() => {
  document.body.classList.remove('xj-home-body')
  cancelAnimationFrame(rafId)
  animationContext?.revert()
  ScrollTrigger.getAll().forEach(trigger => trigger.kill())
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped lang="scss">
.xj-home { position:relative; min-width:1120px; min-height:100vh; overflow:hidden; color:var(--xj-text); background:var(--xj-bg); font-family:var(--void-display,'Syne'),sans-serif; isolation:isolate; }
.xj-home__canvas { position:fixed; inset:0; z-index:-1; pointer-events:none; }
.xj-home__grid { position:fixed; inset:0; z-index:-2; pointer-events:none; opacity:.34; background-image:linear-gradient(color-mix(in srgb,var(--xj-text) 4%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--xj-text) 4%,transparent) 1px,transparent 1px); background-size:72px 72px; mask-image:linear-gradient(to bottom,#000,transparent 75%); }
.xj-home__glow { position:fixed; z-index:-3; width:520px; height:520px; border-radius:50%; pointer-events:none; background:radial-gradient(circle,var(--xj-accent-soft),transparent 68%); opacity:.7; }.xj-home__glow--one{top:-220px;right:4vw}.xj-home__glow--two{top:45vh;left:-310px;opacity:.34}
.home-nav { position:relative; z-index:40; height:84px; display:grid; grid-template-columns:290px 1fr 260px; align-items:center; gap:24px; padding:0 42px; border-bottom:1px solid var(--xj-border); background:color-mix(in srgb,var(--xj-bg) 78%,transparent); backdrop-filter:blur(18px); }
.home-brand { display:inline-flex; align-items:center; gap:12px; color:var(--xj-text); }.home-brand__mark{width:40px;height:40px;display:grid;place-items:center;color:var(--xj-accent-contrast);background:var(--xj-accent-solid);border-radius:50%;font-size:17px;font-weight:800;box-shadow:0 0 0 6px var(--xj-accent-soft)}.home-brand__copy{display:flex;flex-direction:column;gap:2px}.home-brand__copy strong{font-size:16px;letter-spacing:.16em}.home-brand__copy small{color:var(--xj-faint);font:8px var(--void-mono);letter-spacing:.1em}
.home-nav__links{display:flex;justify-content:center;gap:30px;color:var(--xj-muted);font-size:12px}.home-nav__links a{position:relative;padding:32px 0;transition:color .2s}.home-nav__links a::after{content:'';position:absolute;left:0;right:100%;bottom:21px;height:1px;background:var(--xj-accent);transition:right .25s}.home-nav__links a:hover{color:var(--xj-text)}.home-nav__links a:hover::after{right:0}.home-nav__actions{justify-self:end;display:flex;align-items:center;gap:16px;font-size:11px}.home-nav__login{color:var(--xj-muted)}.home-nav__start{display:flex;align-items:center;gap:12px;padding:11px 16px;color:var(--xj-accent-contrast);background:var(--xj-accent-solid);border-radius:999px;font-weight:700}
main{position:relative;z-index:1}.home-hero{position:relative;min-height:calc(100vh - 84px);display:grid;grid-template-columns:minmax(560px,1fr) minmax(520px,.92fr);align-items:center;gap:48px;padding:66px 6vw 76px;border-bottom:1px solid var(--xj-border);perspective:1200px}.home-hero__copy{max-width:760px}.home-eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:28px;color:var(--xj-muted);font:9px var(--void-mono);letter-spacing:.16em}.signal-dot{width:7px;height:7px;border-radius:50%;background:var(--xj-success);box-shadow:0 0 12px var(--xj-success);animation:signalPulse 1.8s ease-in-out infinite}@keyframes signalPulse{50%{opacity:.35;transform:scale(.75)}}
.home-hero h1{margin:0;color:var(--xj-text);font-size:clamp(68px,6vw,112px);font-weight:700;line-height:.91;letter-spacing:-.075em}.hero-title-line{display:block;white-space:nowrap}.home-hero h1 em{color:var(--xj-accent);font-style:normal}.home-hero__lead{max-width:590px;margin:34px 0 0;color:var(--xj-text-soft);font-size:15px;line-height:1.9}.home-hero__actions{display:flex;gap:12px;margin-top:34px}.home-button{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:0 20px;border:1px solid var(--xj-border);border-radius:999px;font-size:12px;font-weight:700;transition:.22s}.home-button:hover{transform:translateY(-2px)}.home-button--primary{color:var(--xj-accent-contrast);border-color:var(--xj-accent-solid);background:var(--xj-accent-solid)}.home-button--ghost{color:var(--xj-text);background:var(--xj-surface)}.home-button--ghost:hover{border-color:var(--xj-border-strong);background:var(--xj-accent-soft)}
.home-hero__metrics{max-width:590px;display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px;padding-top:22px;border-top:1px solid var(--xj-border)}.home-hero__metrics div{display:flex;flex-direction:column;gap:5px;border-right:1px solid var(--xj-border)}.home-hero__metrics div:not(:first-child){padding-left:24px}.home-hero__metrics div:last-child{border:0}.home-hero__metrics strong{color:var(--xj-text);font:26px var(--void-mono)}.home-hero__metrics span{color:var(--xj-muted);font-size:10px}
.home-hero__visual{position:relative;justify-self:center;width:min(40vw,620px);height:min(40vw,620px);transform-style:preserve-3d}.city-orbit{position:absolute;inset:0;border:1px solid var(--xj-border);border-radius:50%}.city-orbit::before,.city-orbit::after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;background:var(--xj-accent-solid);box-shadow:0 0 18px var(--xj-accent)}.city-orbit::before{top:14%;left:14%}.city-orbit::after{right:7%;bottom:30%}.city-orbit--outer{border-style:dashed;opacity:.55}.city-orbit--middle{inset:62px;border-color:var(--xj-border-strong)}.city-orbit--inner{inset:145px;border-style:dotted}.city-radar{position:absolute;inset:82px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 78%,color-mix(in srgb,var(--xj-accent) 30%,transparent) 96%,transparent)}.city-axis{position:absolute;background:var(--xj-border)}.city-axis--x{left:0;right:0;top:50%;height:1px}.city-axis--y{top:0;bottom:0;left:50%;width:1px}.city-route{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--xj-accent);stroke-width:2;stroke-dasharray:8 9;opacity:.75;filter:drop-shadow(0 0 8px var(--xj-accent-soft))}
.city-node{position:absolute;z-index:3;display:flex;align-items:center;gap:6px;color:var(--xj-muted);font:9px var(--void-mono)}.city-node i{width:12px;height:12px;display:block;border:3px solid var(--xj-bg);border-radius:50%;background:var(--xj-accent-solid);box-shadow:0 0 0 1px var(--xj-accent),0 0 18px var(--xj-accent)}.city-node--1{left:11%;top:64%}.city-node--2{left:37%;top:43%}.city-node--3{right:25%;top:31%}.city-node--4{right:7%;top:15%}.city-core{position:absolute;z-index:5;inset:33%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--xj-border-strong);border-radius:50%;background:color-mix(in srgb,var(--xj-bg-elevated) 88%,transparent);box-shadow:0 0 60px var(--xj-accent-soft);backdrop-filter:blur(14px)}.city-core span{color:var(--xj-muted);font:8px var(--void-mono);letter-spacing:.12em}.city-core strong{margin-top:8px;color:var(--xj-accent);font-size:36px}.city-core p{margin:3px 0 0;color:var(--xj-faint);font:8px var(--void-mono)}
.city-coordinate{position:absolute;color:var(--xj-faint);font:8px var(--void-mono);letter-spacing:.08em}.city-coordinate--top{top:3%;left:53%}.city-coordinate--bottom{left:3%;bottom:46%;transform:rotate(-90deg)}.city-status-card{position:absolute;z-index:8;right:-22px;bottom:52px;width:222px;padding:14px;border:1px solid var(--xj-border);background:color-mix(in srgb,var(--xj-bg-elevated) 90%,transparent);box-shadow:var(--xj-shadow);backdrop-filter:blur(18px)}.city-status-card>span{display:flex;align-items:center;gap:7px;color:var(--xj-muted);font:8px var(--void-mono);letter-spacing:.08em}.city-status-card>span i{width:6px;height:6px;border-radius:50%;background:var(--xj-success)}.city-status-card>strong{display:block;margin:9px 0 12px;color:var(--xj-text);font:10px var(--void-mono)}.city-status-card>div{display:flex;flex-direction:column;gap:5px}.city-status-card b{width:var(--w);height:2px;background:var(--xj-accent-solid)}.home-hero__scroll{position:absolute;left:42px;bottom:26px;display:flex;align-items:center;gap:13px;color:var(--xj-faint);font:8px var(--void-mono);letter-spacing:.12em}.home-hero__scroll i{width:70px;height:1px;overflow:hidden;background:var(--xj-border)}.home-hero__scroll i::after{content:'';display:block;width:25px;height:1px;background:var(--xj-accent);animation:scrollSignal 2s infinite}@keyframes scrollSignal{from{transform:translateX(-25px)}to{transform:translateX(80px)}}
.home-section{padding:110px 6vw;border-bottom:1px solid var(--xj-border)}.section-index{color:var(--xj-accent);font:9px var(--void-mono);letter-spacing:.14em}.home-statement{display:grid;grid-template-columns:.55fr 1.45fr .8fr;gap:46px;align-items:start}.statement-copy p{margin:0;color:var(--xj-text);font-size:clamp(40px,4.6vw,78px);font-weight:600;line-height:1.04;letter-spacing:-.055em}.statement-detail{padding-top:68px}.statement-detail p{margin:0;color:var(--xj-text-soft);font-size:14px;line-height:1.9}.statement-detail a{display:inline-flex;gap:14px;margin-top:24px;color:var(--xj-accent);font-size:11px;font-weight:700}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:48px;margin-bottom:46px}.section-head h2{margin:14px 0 0;color:var(--xj-text);font-size:clamp(48px,5vw,82px);line-height:.98;letter-spacing:-.06em}.section-head>p{max-width:390px;margin:0;color:var(--xj-muted);font-size:13px;line-height:1.8}.section-head--compact{margin-bottom:36px}
.city-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.city-card{position:relative;min-width:0;overflow:hidden;color:var(--xj-text);border:1px solid var(--xj-border);background:var(--xj-surface);transition:.3s}.city-card:hover{transform:translateY(-7px);border-color:var(--xj-border-strong);background:var(--xj-surface-solid)}.city-card__top{display:flex;justify-content:space-between;padding:14px 16px;color:var(--xj-muted);border-bottom:1px solid var(--xj-border);font:8px var(--void-mono);letter-spacing:.1em}.city-card__map{position:relative;height:250px;overflow:hidden;border-bottom:1px solid var(--xj-border);background-color:var(--xj-bg-elevated);background-image:linear-gradient(var(--xj-border) 1px,transparent 1px),linear-gradient(90deg,var(--xj-border) 1px,transparent 1px);background-size:34px 34px}.city-card__map::before{content:'';position:absolute;width:270px;height:130px;left:12%;top:28%;border:1px solid var(--xj-border-strong);border-radius:44% 56% 62% 38%/42% 38% 62% 58%;transform:rotate(-12deg);box-shadow:inset 0 0 40px var(--xj-accent-soft)}.city-card__map--2::before{left:24%;top:18%;transform:rotate(22deg);border-radius:28% 72% 38% 62%}.city-card__map--3::before{left:8%;top:35%;transform:rotate(7deg)}.city-card__map i{position:absolute;left:calc((var(--i) * 37px) + 8%);top:calc((var(--i) * 23px) + 5%);width:5px;height:5px;border-radius:50%;background:var(--xj-muted)}.city-card__map b{position:absolute;left:52%;top:46%;width:15px;height:15px;border:4px solid var(--xj-bg-elevated);border-radius:50%;background:var(--xj-accent-solid);box-shadow:0 0 0 1px var(--xj-accent),0 0 25px var(--xj-accent)}.city-card__body{min-height:160px;padding:23px}.city-card__body h3{margin:0 0 12px;font-size:29px}.city-card__body p{margin:0;color:var(--xj-muted);font-size:12px;line-height:1.75}.city-card__foot{display:flex;justify-content:space-between;padding:14px 22px;color:var(--xj-muted);border-top:1px solid var(--xj-border);font:8px var(--void-mono);letter-spacing:.08em}.city-card__foot strong{color:var(--xj-accent);font:10px var(--void-display)}
.experience-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--xj-border);border-left:1px solid var(--xj-border)}.experience-card{min-height:330px;display:flex;flex-direction:column;padding:24px;border-right:1px solid var(--xj-border);border-bottom:1px solid var(--xj-border);background:color-mix(in srgb,var(--xj-surface) 72%,transparent);transition:background .25s}.experience-card:hover{background:var(--xj-surface-hover)}.experience-card__number{color:var(--xj-faint);font:9px var(--void-mono)}.experience-card__icon{width:52px;height:52px;display:grid;place-items:center;margin-top:44px;color:var(--xj-accent);border:1px solid var(--xj-border-strong);border-radius:50%;background:var(--xj-accent-soft)}.experience-card h3{margin:26px 0 10px;color:var(--xj-text);font-size:22px}.experience-card p{margin:0;color:var(--xj-muted);font-size:12px;line-height:1.75}.experience-card__line{margin-top:auto;height:1px;background:var(--xj-border)}.experience-card__line i{display:block;width:28%;height:1px;background:var(--xj-accent);transition:width .3s}.experience-card:hover .experience-card__line i{width:100%}
.field-console{display:grid;grid-template-columns:.85fr 1.15fr;gap:8vw;align-items:center;background:color-mix(in srgb,var(--xj-bg-elevated) 72%,transparent)}.field-console__copy h2{margin:18px 0 24px;color:var(--xj-text);font-size:clamp(48px,4.7vw,78px);line-height:1;letter-spacing:-.06em}.field-console__copy>p{max-width:550px;margin:0;color:var(--xj-text-soft);font-size:14px;line-height:1.9}.field-console__actions{display:flex;gap:12px;margin-top:30px}.field-console__panel{border:1px solid var(--xj-border-strong);background:var(--xj-surface-solid);box-shadow:var(--xj-shadow)}.console-head{height:42px;display:flex;align-items:center;gap:7px;padding:0 16px;color:var(--xj-muted);border-bottom:1px solid var(--xj-border);font:8px var(--void-mono);letter-spacing:.1em}.console-head span{margin-right:auto}.console-head i{width:6px;height:6px;border:1px solid var(--xj-muted);border-radius:50%}.console-profile{display:grid;grid-template-columns:62px 1fr auto;align-items:center;gap:16px;padding:22px;border-bottom:1px solid var(--xj-border)}.console-profile__avatar{width:62px;height:62px;display:grid;place-items:center;color:var(--xj-accent-contrast);background:var(--xj-accent-solid);border-radius:50%;font-size:24px;font-weight:800}.console-profile span{display:block;color:var(--xj-muted);font:8px var(--void-mono)}.console-profile strong{display:block;margin-top:5px;color:var(--xj-text);font-size:17px}.console-profile>b{color:var(--xj-accent);font:11px var(--void-mono)}.console-stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--xj-border)}.console-stats div{padding:20px;border-right:1px solid var(--xj-border)}.console-stats div:last-child{border:0}.console-stats span{display:block;color:var(--xj-faint);font:8px var(--void-mono)}.console-stats strong{display:block;margin-top:8px;color:var(--xj-text);font:25px var(--void-mono)}.console-stats small{margin-left:3px;color:var(--xj-muted);font-size:9px}.console-route{padding:28px 24px 20px;border-bottom:1px solid var(--xj-border)}.console-route__track{position:relative;display:flex;justify-content:space-between}.console-route__track::before{content:'';position:absolute;top:5px;left:6px;right:6px;height:1px;background:var(--xj-accent)}.console-route__track i{position:relative;z-index:1;width:11px;height:11px;border:3px solid var(--xj-surface-solid);border-radius:50%;background:var(--xj-accent-solid);box-shadow:0 0 0 1px var(--xj-accent)}.console-route__labels{display:flex;justify-content:space-between;margin-top:12px;color:var(--xj-muted);font-size:9px}.console-log{display:grid;grid-template-columns:120px 1fr;gap:18px;padding:18px 22px}.console-log span{color:var(--xj-accent);font:8px var(--void-mono)}.console-log p{margin:0;color:var(--xj-text-soft);font-size:11px}
.home-cta{position:relative;min-height:610px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden}.home-cta>span{color:var(--xj-accent);font:9px var(--void-mono);letter-spacing:.15em}.home-cta h2{position:relative;z-index:2;margin:22px 0 34px;color:var(--xj-text);font-size:clamp(58px,6.2vw,104px);line-height:.95;letter-spacing:-.07em}.home-cta__orbit{position:absolute;width:570px;height:570px;border:1px solid var(--xj-border);border-radius:50%}.home-cta__orbit::before,.home-cta__orbit::after{content:'';position:absolute;border:1px dashed var(--xj-border-strong);border-radius:50%}.home-cta__orbit::before{inset:70px}.home-cta__orbit::after{inset:145px}.home-cta__orbit i{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--xj-accent-solid);box-shadow:0 0 16px var(--xj-accent)}.home-cta__orbit i:nth-child(1){left:8%;top:30%}.home-cta__orbit i:nth-child(2){right:12%;top:18%}.home-cta__orbit i:nth-child(3){right:20%;bottom:8%}.home-footer{min-height:120px;display:grid;grid-template-columns:310px 1fr auto;align-items:center;gap:30px;padding:24px 42px;color:var(--xj-muted);border-top:1px solid var(--xj-border);background:var(--xj-bg-elevated);font-size:9px}.home-footer__links{display:flex;justify-content:center;gap:28px}.home-footer__links a:hover{color:var(--xj-accent)}
@media(prefers-reduced-motion:reduce){.signal-dot,.home-hero__scroll i::after{animation:none}}
</style>
<style lang="scss">body.xj-home-body{min-width:1120px;margin:0;overflow-x:hidden;background:var(--xj-bg)}</style>
