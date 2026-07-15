<template>
  <div class="xj-page">
    <span class="xj-kicker">SOCIAL EXPLORATION</span><h1 class="xj-title">好友与团队</h1>
    <div class="social-grid">
      <section class="xj-panel">
        <h2>添加好友</h2>
        <div class="xj-form"><label>用户名<input v-model="friendForm.username"></label><label>申请留言<input v-model="friendForm.message"></label><button class="xj-button" @click="sendRequest">发送申请</button></div>
        <h2 class="section-title">待处理申请</h2>
        <div v-for="request in overview.requests" :key="request.id" class="social-row"><div><strong>{{ request.senderName }}</strong><p>{{ request.message }}</p></div><div><button class="mini" @click="respond(request.id,'accept')">接受</button><button class="mini" @click="respond(request.id,'reject')">拒绝</button></div></div>
      </section>
      <section class="xj-panel">
        <template v-if="overview.team">
          <span class="xj-kicker">MY TEAM</span><h2>{{ overview.team.name }}</h2><div class="team-code">{{ overview.team.code }}</div><p>{{ overview.team.description }}</p>
          <div class="team-metrics"><span>{{ overview.team.memberCount }} 成员</span><span>{{ overview.team.totalPoints }} 积分</span></div>
          <div v-for="member in overview.teamMembers" :key="member.id" class="social-row"><strong>{{ member.username }}</strong><span>{{ member.role }} · {{ member.totalEarned }} 积分</span></div>
        </template>
        <template v-else>
          <h2>创建或加入团队</h2><div class="xj-form"><label>团队名称<input v-model="teamForm.name"></label><label>团队介绍<input v-model="teamForm.description"></label><button class="xj-button" @click="createNewTeam">创建团队</button><label>邀请码<input v-model="joinCode"></label><button class="xj-button xj-button--ghost" @click="joinExistingTeam">加入团队</button></div>
        </template>
      </section>
    </div>
    <section class="xj-panel" style="margin-top:18px"><h2>我的好友</h2><div v-for="friend in overview.friends" :key="friend.id" class="social-row"><strong>{{ friend.username }}</strong><span>{{ friend.checkinCount }} 次打卡 · {{ friend.totalEarned }} 累计积分</span></div><div v-if="!overview.friends.length" class="xj-empty">暂无好友</div></section>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian', middleware: 'auth' })
const overview = reactive<any>({ friends: [], requests: [], team: null, teamMembers: [] })
const friendForm = reactive({ username: '', message: '一起探索城市吧' })
const teamForm = reactive({ name: '', description: '' })
const joinCode = ref('')
async function load() { Object.assign(overview, (await $fetch<any>('/api/friends')).data) }
async function sendRequest() { try { const response = await $fetch<any>('/api/friend-requests', { method: 'POST', body: friendForm }); ElMessage.success(response.message) } catch (error: any) { ElMessage.error(error?.data?.message || '发送失败') } }
async function respond(id: number, action: string) { await $fetch(`/api/friend-requests/${id}/${action}`, { method: 'POST' }); ElMessage.success('处理成功'); await load() }
async function createNewTeam() { try { const response = await $fetch<any>('/api/teams', { method: 'POST', body: teamForm }); ElMessage.success(response.message); await load() } catch (error: any) { ElMessage.error(error?.data?.message || '创建失败') } }
async function joinExistingTeam() { try { const response = await $fetch<any>('/api/teams/join', { method: 'POST', body: { code: joinCode.value } }); ElMessage.success(response.message); await load() } catch (error: any) { ElMessage.error(error?.data?.message || '加入失败') } }
await load()
</script>
<style scoped lang="scss">.social-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:40px}.social-grid h2,.xj-panel h2{margin-bottom:20px}.section-title{margin-top:36px}.social-row{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--xj-border)}.social-row p,.social-row span{color:var(--xj-muted)}.mini{margin-left:8px;padding:7px 10px;border:1px solid var(--xj-border);background:none;color: var(--xj-text);border-radius:6px;cursor:pointer}.team-code{display:inline-block;margin:12px 0 20px;padding:12px 20px;border:1px dashed var(--xj-accent);color:var(--xj-accent);font:24px var(--void-mono)}.team-metrics{display:flex;gap:30px;margin:24px 0;color:var(--xj-muted)}</style>
