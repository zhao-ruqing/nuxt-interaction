/**
 * Lucide 图标工具：统一管理项目内图标名称映射与解析。
 * 用法：resolveIconName('coffee') 或 resolveIconName('☕') 获取 kebab-case 图标名；
 *       iconRegistry['coffee'] 获取对应 Vue 组件。
 */
import type { FunctionalComponent, SVGAttributes } from "vue";
import {
  Bot,
  Brain,
  Citrus,
  Coffee,
  Coins,
  Cookie,
  CupSoda,
  Diamond,
  Droplets,
  Frown,
  Leaf,
  List,
  LoaderCircle,
  MessageCircle,
  Milk,
  Package,
  Plus,
  Search,
  Snowflake,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Wallet,
  X,
} from "@lucide/vue";

type LucideProps = Partial<SVGAttributes> & {
  size?: number;
  strokeWidth?: number | string;
};

export type LucideIconComponent = FunctionalComponent<LucideProps>;

/** 默认商品展示图标 */
export const DEFAULT_PRODUCT_ICON = "coffee";

/** kebab-case 名称 → Lucide 组件映射（按需注册，便于 tree-shaking） */
export const iconRegistry: Record<string, LucideIconComponent> = {
  bot: Bot,
  brain: Brain,
  citrus: Citrus,
  coffee: Coffee,
  coins: Coins,
  cookie: Cookie,
  "cup-soda": CupSoda,
  diamond: Diamond,
  droplets: Droplets,
  frown: Frown,
  leaf: Leaf,
  list: List,
  "loader-circle": LoaderCircle,
  "message-circle": MessageCircle,
  milk: Milk,
  package: Package,
  plus: Plus,
  search: Search,
  snowflake: Snowflake,
  sparkles: Sparkles,
  star: Star,
  tags: Tags,
  "trash-2": Trash2,
  wallet: Wallet,
  x: X,
};

/** 旧 emoji 图标 → Lucide 名称（兼容数据库历史数据） */
const emojiIconMap: Record<string, string> = {
  "☕": "coffee",
  "🧊": "snowflake",
  "🥤": "cup-soda",
  "🍋": "citrus",
  "🍵": "leaf",
  "🧋": "milk",
  "🍊": "citrus",
  "🍉": "droplets",
  "🍠": "cookie",
  "😕": "frown",
  "🤖": "bot",
  "💚": "message-circle",
  "💙": "wallet",
  "💰": "coins",
  "🍃": "leaf",
  "🧠": "brain",
  "◇": "diamond",
  "✕": "x",
};

/** 将 kebab-case 转为 PascalCase，供动态查找备用 */
export function toPascalCase(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** 解析图标名（支持 emoji 旧值与 kebab-case） */
export function resolveIconName(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_PRODUCT_ICON;
  if (emojiIconMap[raw]) return emojiIconMap[raw];
  const normalized = raw.toLowerCase();
  if (iconRegistry[normalized]) return normalized;
  return DEFAULT_PRODUCT_ICON;
}

/** 根据名称获取 Lucide 组件，找不到时回退默认图标 */
export function getIconComponent(name?: string | null): LucideIconComponent {
  const resolved = resolveIconName(name);
  return iconRegistry[resolved] ?? Coffee;
}
