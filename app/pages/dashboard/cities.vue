<template>
  <div class="void-dash-page">
    <div class="void-dash-header"><div><span class="void-dash-eyebrow">XINGJIAN / CITIES</span><h1>城市管理</h1><p class="void-dash-desc">维护行鉴开放城市、中心坐标和发布状态</p></div><button class="admin-button" @click="openCreate">新增城市</button></div>
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>城市</th><th>编码</th><th>省份</th><th>点位</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="city in cities" :key="city.id"><td>#{{ city.id }}</td><td><strong>{{ city.name }}</strong></td><td>{{ city.code }}</td><td>{{ city.province }}</td><td>{{ city.pointCount }}</td><td><span class="status-dot" :class="city.status">{{ statusText[city.status] }}</span></td><td><button class="admin-link" @click="openEdit(city)">编辑</button></td></tr></tbody></table></div>
    <el-dialog v-model="visible" :title="editingId ? '编辑城市' : '新增城市'" width="620px"><el-form label-position="top"><div class="form-grid"><el-form-item label="城市名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="城市编码"><el-input v-model="form.code" /></el-form-item><el-form-item label="省份"><el-input v-model="form.province" /></el-form-item><el-form-item label="发布状态"><el-select v-model="form.status"><el-option label="已发布" value="published"/><el-option label="草稿" value="draft"/><el-option label="停用" value="disabled"/></el-select></el-form-item><el-form-item label="经度"><el-input-number v-model="form.longitude" :precision="6" :controls="false" /></el-form-item><el-form-item label="纬度"><el-input-number v-model="form.latitude" :precision="6" :controls="false" /></el-form-item></div><el-form-item label="城市介绍"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item></el-form><template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template></el-dialog>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout:'dashboard', middleware:'auth' })
const cities=ref<any[]>([]);const visible=ref(false);const saving=ref(false);const editingId=ref<number|null>(null);const statusText:any={published:'已发布',draft:'草稿',disabled:'停用'}
const emptyForm=()=>({name:'',code:'',province:'',description:'',longitude:121.473701,latitude:31.230416,status:'published',sortOrder:0});const form=reactive(emptyForm())
async function load(){const response=await $fetch<any>('/api/admin/cities');cities.value=response.data}
function openCreate(){editingId.value=null;Object.assign(form,emptyForm());visible.value=true}
function openEdit(city:any){editingId.value=city.id;Object.assign(form,city);visible.value=true}
async function save(){saving.value=true;try{await $fetch(editingId.value?`/api/admin/cities/${editingId.value}`:'/api/admin/cities',{method:editingId.value?'PUT':'POST',body:form});ElMessage.success('保存成功');visible.value=false;await load()}catch(error:any){ElMessage.error(error?.data?.message||'保存失败')}finally{saving.value=false}}
await load()
</script>
<style scoped lang="scss">@use '@/styles/xingjian-admin.scss' as *;</style>
