<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>登录</h2>
      <p class="auth-subtitle">欢迎回来，请登录你的账号</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" class="submit-btn">
          登录
        </el-button>
      </el-form>
      <p class="auth-switch">
        还没有账号？<NuxtLink to="/auth/register">立即注册</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({ layout: 'default' })

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const formRef = ref<FormInstance>()

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const { post } = useApi()
    const res = await post<any>('/api/auth/login', form)
    if (res.success) {
      ElMessage.success('登录成功')
      // 使用 location 跳转确保 httpOnly cookie 生效后再校验登录状态
      window.location.href = '/dashboard'
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
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
</style>
