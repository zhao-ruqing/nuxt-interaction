<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>注册</h2>
      <p class="auth-subtitle">创建一个新账号开始使用</p>
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
        <button>
          <span class="shadow"></span>
          <span class="edge"></span>
          <span class="front text"> 注册 </span>
        </button>
      </el-form>
      <p class="auth-switch">
        已有账号？<NuxtLink to="/auth/login">立即登录</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";

definePageMeta({ layout: "default" });

const form = reactive({ username: "", password: "", confirmPassword: "" });
const loading = ref(false);
const formRef = ref<FormInstance>();

const validateConfirm = (_rule: any, value: string, callback: Function) => {
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
</script>

<style scoped lang="scss">
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px - 73px);
  padding: 40px 24px;
}

.auth-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: $shadow-lg;

  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }
}

.auth-subtitle {
  color: $text-secondary;
  font-size: 14px;
  margin-bottom: 32px;
}

.submit-btn {
  width: 100%;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: $text-secondary;

  a {
    color: $primary;
    font-weight: 500;
  }
}
button {
  position: relative;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  outline-offset: 4px;
  width: 100%;
  transition: filter 250ms;
  user-select: none;
  touch-action: manipulation;
}

.shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: hsl(0deg 0% 0% / 0.25);
  will-change: transform;
  transform: translateY(2px);
  transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
}

.edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(
    to left,
    hsl(340deg 100% 16%) 0%,
    hsl(340deg 100% 32%) 8%,
    hsl(340deg 100% 32%) 92%,
    hsl(340deg 100% 16%) 100%
  );
}

.front {
  display: block;
  position: relative;
  padding: 12px 27px;
  border-radius: 12px;
  font-size: 1.1rem;
  color: white;
  background: hsl(345deg 100% 47%);
  will-change: transform;
  transform: translateY(-4px);
  transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
}

button:hover {
  filter: brightness(110%);
}

button:hover .front {
  transform: translateY(-6px);
  transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
}

button:active .front {
  transform: translateY(-2px);
  transition: transform 34ms;
}

button:hover .shadow {
  transform: translateY(4px);
  transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
}

button:active .shadow {
  transform: translateY(1px);
  transition: transform 34ms;
}

button:focus:not(:focus-visible) {
  outline: none;
}
</style>
