/** Page Agent 演示用快捷任务 */
export interface PageAgentQuickTask {
  /** 按钮展示文案 */
  label: string
  /** 交给 Agent 执行的完整任务描述 */
  task: string
}

/** 快捷任务列表（点击后程序化 execute） */
export const PAGE_AGENT_QUICK_TASKS: PageAgentQuickTask[] = [
  {
    label: '逛饮品商城',
    task: '跳转到 /products 饮品商城，观察分类或商品，用一两句话描述你看到的内容。',
  },
  {
    label: '搜一杯咖啡',
    task: '在饮品商城搜索「咖啡」，查看结果后点开任意一款详情，汇报商品名与规格（不要支付）。',
  },
  {
    label: '去积分商城',
    task: '跳转到 /mall 积分商城，浏览可兑换商品并用一两句话总结（不要兑换）。',
  },
  {
    label: '打开打卡地图',
    task: '跳转到 /checkins 打卡页，观察界面并说明是否需要定位权限（不要强制打卡）。',
  },
]
