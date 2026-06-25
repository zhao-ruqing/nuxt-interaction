<template>
  <div class="home">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg" ref="heroBgRef" />
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="line" ref="line1Ref">让项目管理</span>
          <span class="line" ref="line2Ref">更简单高效</span>
        </h1>
        <p class="hero-desc" ref="descRef">一站式项目协作平台，助力团队高效交付</p>
        <div class="hero-actions" ref="actionsRef">
          <NuxtLink to="/auth/register" class="btn-primary">立即开始</NuxtLink>
          <a href="#features" class="btn-secondary">了解更多</a>
        </div>
      </div>
    </section>

    <!-- 特性区域 -->
    <section id="features" class="features">
      <div class="features-inner">
        <h2 class="section-title" ref="sectionTitleRef">为什么选择我们</h2>
        <div class="features-grid">
          <div
            v-for="(item, i) in features"
            :key="i"
            :ref="el => setCardRef(el, i)"
            class="feature-card"
          >
            <div class="feature-icon">{{ item.icon }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="cta">
      <div class="cta-bg" ref="ctaBgRef" />
      <div class="cta-content">
        <h2 ref="ctaTitleRef">准备好开始了吗？</h2>
        <p ref="ctaDescRef">免费注册，即刻体验高效项目管理</p>
        <NuxtLink to="/auth/register" class="btn-primary" ref="ctaBtnRef">免费注册</NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

definePageMeta({ layout: 'default' })

const features = [
  { icon: '🎯', title: '高效协作', desc: '团队成员实时同步，协作无缝衔接' },
  { icon: '🔒', title: '安全可靠', desc: '企业级安全保障，数据全程加密' },
  { icon: '📊', title: '数据驱动', desc: '可视化报表，洞察项目全貌' },
  { icon: '⚡', title: '快速响应', desc: '毫秒级响应速度，极致流畅体验' },
]

// refs
const heroBgRef = ref<HTMLElement>()
const line1Ref = ref<HTMLElement>()
const line2Ref = ref<HTMLElement>()
const descRef = ref<HTMLElement>()
const actionsRef = ref<HTMLElement>()
const sectionTitleRef = ref<HTMLElement>()
const cardRefs = ref<HTMLElement[]>([])
const ctaBgRef = ref<HTMLElement>()
const ctaTitleRef = ref<HTMLElement>()
const ctaDescRef = ref<HTMLElement>()
const ctaBtnRef = ref<HTMLElement>()

function setCardRef(el: any, i: number) {
  if (el) cardRefs.value[i] = el
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  // Hero 入场动画
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: .8 } })
  tl.fromTo(line1Ref.value, { y: 60, opacity: 0 }, { y: 0, opacity: 1 })
    .fromTo(line2Ref.value, { y: 60, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.5')
    .fromTo(descRef.value, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.5')
    .fromTo(actionsRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.3')

  // Hero 视差背景
  gsap.to(heroBgRef.value, {
    y: 120,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })

  // 特性区域标题
  ScrollTrigger.create({
    trigger: sectionTitleRef.value,
    start: 'top 85%',
    onEnter: () => gsap.to(sectionTitleRef.value, { y: 0, opacity: 1, duration: .6, ease: 'power2.out' }),
  })

  // 特性卡片依次入场
  cardRefs.value.forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 90%',
      onEnter: () => gsap.fromTo(
        card,
        { x: i % 2 === 0 ? -40 : 40, opacity: 0 },
        { x: 0, opacity: 1, duration: .6, delay: i * .1, ease: 'power2.out' },
      ),
    })
  })

  // CTA 视差
  gsap.to(ctaBgRef.value, {
    y: -80,
    ease: 'none',
    scrollTrigger: {
      trigger: '.cta',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })

  // CTA 文字入场
  const ctaTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.cta',
      start: 'top 75%',
    },
  })
  ctaTl.fromTo(ctaTitleRef.value, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power2.out' })
    .fromTo(ctaDescRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.out' }, '-=0.3')
    .fromTo(ctaBtnRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.out' }, '-=0.3')
})
</script>

<style scoped lang="scss">
.home {
  overflow-x: hidden;
}

// Hero
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #eef1ff 0%, #f8f9fb 60%, #fff 100%);

  &::after {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba($primary, .08) 0%, transparent 70%);
    border-radius: 50%;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 0 24px;
  max-width: 700px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -1px;
  margin-bottom: 24px;

  .line {
    display: block;
    color: $text;
  }
}

.hero-desc {
  font-size: 18px;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary {
  display: inline-block;
  background: $primary;
  color: #fff;
  padding: 14px 36px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  transition: all .2s;

  &:hover {
    background: $primary-dark;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba($primary, .35);
  }
}

.btn-secondary {
  display: inline-block;
  padding: 14px 36px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  border: 1.5px solid $border;
  color: $text;
  transition: all .2s;

  &:hover {
    border-color: $text;
  }
}

// 特性
.features {
  padding: 100px 24px;
}

.features-inner {
  max-width: $max-width;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 56px;
  opacity: 0;
  transform: translateY(30px);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.feature-card {
  background: #fff;
  border-radius: $radius;
  padding: 32px 24px;
  text-align: center;
  box-shadow: $shadow;
  transition: box-shadow .3s, transform .3s;
  opacity: 0;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 14px;
  color: $text-secondary;
  line-height: 1.6;
}

// CTA
.cta {
  position: relative;
  padding: 120px 24px;
  text-align: center;
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #fff 0%, $text 100%);
  opacity: .04;
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
}

.cta-content p {
  font-size: 17px;
  color: $text-secondary;
  margin-bottom: 32px;
}

// 响应式
@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
