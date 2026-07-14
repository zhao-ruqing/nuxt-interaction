<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>VOID</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/" class="void-nav__link" data-magnetic>首页</NuxtLink>
        <NuxtLink to="/auth/register" class="void-nav__cta" data-magnetic>注册</NuxtLink>
      </nav>
    </header>

    <main class="void-page void-page--center">
      <div class="void-card" ref="cardRef">
        <div class="void-card__badge">
          <span class="void-card__pulse" />
          AUTH GATE
        </div>
        <h1 class="void-card__title">登录</h1>
        <p class="void-card__subtitle">欢迎回来，请登录你的账号</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            />
          </el-form-item>
          <button
            type="submit"
            class="void-btn void-btn--primary"
            data-magnetic
            :disabled="loading"
          >
            <span class="void-btn__glow" />
            {{ loading ? "登录中..." : "登录" }}
          </button>
        </el-form>

        <p class="void-card__switch">
          还没有账号？<NuxtLink to="/auth/register">立即注册</NuxtLink>
        </p>
      </div>
    </main>
  </VoidShell>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { gsap } from "gsap";

definePageMeta({ layout: false });

useHead({
  title: "登录 — VOID",
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
    },
  ],
});

const form = reactive({ username: "", password: "" });
const loading = ref(false);
const formRef = ref<FormInstance>();
const cardRef = ref<HTMLElement>();

const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

/** 提交登录表单 */
async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const { post } = useApi();
    const res = await post<any>("/api/auth/login", form);
    if (res.success) {
      ElMessage.success("登录成功");
      window.location.href = res.user?.role === "admin" ? "/dashboard" : "/xingjian";
    } else {
      ElMessage.error(res.message);
    }
  } catch {
    ElMessage.error("登录失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

/** 卡片入场动画 */
function playEnterAnimation() {
  const card = cardRef.value;
  if (!card) return;
  gsap.fromTo(card, { y: 48, opacity: 0, scale: 0.96 }, {
    y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out",
  });
}

onMounted(() => {
  nextTick(playEnterAnimation);
});
</script>
