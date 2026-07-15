<template>
  <ElConfigProvider :z-index="4000">
    <div>
      <NuxtRouteAnnouncer />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <VoidToolHub />
    </div>
  </ElConfigProvider>
</template>
