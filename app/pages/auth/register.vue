<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>行鉴</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/" class="void-nav__link" data-magnetic>首页</NuxtLink>
        <NuxtLink to="/auth/login" class="void-nav__cta" data-magnetic
          >登录</NuxtLink
        >
      </nav>
    </header>

    <main class="void-page void-page--center">
      <div class="void-card" ref="cardRef">
        <div class="void-card__badge">
          <span class="void-card__pulse" />
          AUTH GATE
        </div>
        <h1 class="void-card__title">注册</h1>
        <p class="void-card__subtitle">创建一个新账号开始使用</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名（3-50个字符）"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码（至少6位）"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认密码"
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
            {{ loading ? "注册中..." : "注册" }}
          </button>
        </el-form>

        <p class="void-card__switch">
          已有账号？<NuxtLink to="/auth/login">立即登录</NuxtLink>
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
  title: "注册 — 行鉴",
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
    },
  ],
});

const form = reactive({ username: "", password: "", confirmPassword: "" });
const loading = ref(false);
const formRef = ref<FormInstance>();
const cardRef = ref<HTMLElement>();

/** 校验两次密码是否一致 */
const validateConfirm = (
  _rule: unknown,
  value: string,
  callback: (err?: Error) => void,
) => {
  if (value !== form.password) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const rules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 50,
      message: "用户名长度需在 3-50 个字符之间",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" },
  ],
};

/** 提交注册表单 */
async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const { post } = useApi();
    const res = await post<any>("/api/auth/register", {
      username: form.username,
      password: form.password,
    });
    if (res.success) {
      ElMessage.success("注册成功，请登录");
      navigateTo("/auth/login");
    } else {
      ElMessage.error(res.message);
    }
  } catch {
    ElMessage.error("注册失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

/** 卡片入场动画 */
function playEnterAnimation() {
  const card = cardRef.value;
  if (!card) return;
  gsap.fromTo(
    card,
    { y: 48, opacity: 0, scale: 0.96 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.9,
      ease: "power3.out",
    },
  );
}

onMounted(() => {
  nextTick(playEnterAnimation);
});
</script>
