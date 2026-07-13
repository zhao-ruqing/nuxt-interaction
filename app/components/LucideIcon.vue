<!--
  Lucide 图标组件：按名称渲染 Lucide SVG 图标。
  用法：<LucideIcon name="coffee" :size="24" />
-->
<template>
  <component
    :is="iconComponent"
    class="lucide-icon"
    :size="size"
    :stroke-width="strokeWidth"
    :color="color"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getIconComponent } from "~/utils/lucideIcons";

const props = withDefaults(
  defineProps<{
    /** Lucide 图标名（kebab-case），兼容旧 emoji 值 */
    name?: string | null;
    /** 图标尺寸（px） */
    size?: number;
    /** 描边宽度 */
    strokeWidth?: number;
    /** 图标颜色 */
    color?: string;
  }>(),
  {
    name: "",
    size: 24,
    strokeWidth: 2,
    color: "currentColor",
  },
);

/** 根据 name 解析并返回对应 Lucide 组件 */
const iconComponent = computed(() => getIconComponent(props.name));
</script>

<style scoped lang="scss">
.lucide-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
