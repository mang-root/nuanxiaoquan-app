// utils/levelConfig.js
// 等级 / 暖心值 / 等级奖励 统一配置
// 修改等级规则只改这里

// 升级曲线(暖心值累计)
const LEVEL_THRESHOLDS = [
  { level: 1,  name: "新序",   required: 0,     color: "#B0B0B0" },
  { level: 2,  name: "待苞",   required: 30,    color: "#FFC1CE" },
  { level: 3,  name: "初绽",   required: 100,   color: "#FF8DA8" },
  { level: 4,  name: "栖暖",   required: 250,   color: "#FFB380" },
  { level: 5,  name: "温行",   required: 500,   color: "#FFCE6B" },
  { level: 6,  name: "晴和",   required: 900,   color: "#7DCE82" },
  { level: 7,  name: "风叙",   required: 1500,  color: "#6BD8C9" },
  { level: 8,  name: "向煦",   required: 2500,  color: "#6B9BD8" },
  { level: 9,  name: "揽星",   required: 4000,  color: "#9B7DCE" },
  { level: 10, name: "暖小圈", required: 6500,  color: "#FF8DA8" }
];

// 暖心值获取规则
const HEART_RULES = {
  dailyLogin:        { value: 2,  limit: 2,   desc: "每日首次登录" },
  completeTask:      { value: 5,  limit: 30,  desc: "完成学习任务" },
  tomatoComplete:    { value: 5,  limit: 20,  desc: "自习室学满30分钟" },
  publishPost:       { value: 10, limit: 30,  desc: "发帖(审核通过)" },
  postLiked:         { value: 1,  limit: 20,  desc: "帖子被点赞" },
  postCollected:     { value: 2,  limit: 30,  desc: "帖子被收藏" },
  publishShare:      { value: 15, limit: 30,  desc: "分享资源(审核通过)" },
  shareCollected:    { value: 1,  limit: 20,  desc: "资源被收藏" },
  shareDownloaded:   { value: 2,  limit: 30,  desc: "资源被获取" },
  addAccountItem:    { value: 1,  limit: 5,   desc: "记账一笔" },
  addPeriodRecord:   { value: 3,  limit: 3,   desc: "生理期记录" },
  weeklyStreak:      { value: 20, limit: 20,  desc: "连续打卡一周" },
  inviteNewUser:     { value: 30, limit: 999, desc: "邀请新用户" }
};

// 等级奖励
const LEVEL_REWARDS = [
  {
    level: 1, name: "新序",
    rewards: ["默认头像框「初见」"]
  },
  {
    level: 2, name: "待苞",
    rewards: [
      "发帖权限解锁",
      "小馆分享权限解锁",
      "创建多人房间权限",
      "自定义自习室房间人数(1-20)"
    ]
  },
  {
    level: 3, name: "初绽",
    rewards: ["发帖气泡「小花苞」", "评论颜色可选"]
  },
  {
    level: 4, name: "栖暖",
    rewards: ["自习室入场动效", "暖圈钟可自定义时长(5-60分钟)"]
  },
  {
    level: 5, name: "温行",
    rewards: [
      "自定义背景图上传",
      "背景图透明度调节",
      "白噪音自定义组合"
    ]
  },
  {
    level: 6, name: "晴和",
    rewards: ["头像框「晴日」", "知时日历皮肤2款"]
  },
  {
    level: 7, name: "风叙",
    rewards: ["专属昵称框「风叙者」", "我的主页自定义简介", "评论区高亮色块"]
  },
  {
    level: 8, name: "向煦",
    rewards: ["头像框「煦光」", "发帖可加个人logo水印", "知时日历皮肤新增2款"]
  },
  {
    level: 9, name: "揽星",
    rewards: ["限定头像框「星河」(渐变动效)", "学习成就勋章墙", "知时报告可导出为图片"]
  },
  {
    level: 10, name: "暖小圈",
    rewards: [
      "满级称号图标",
      "全皮肤解锁",
      "自定义昵称颜色",
      "专属勋章「暖小圈创始成员」"
    ]
  }
];

/**
 * 根据暖心值算出当前等级
 */
function getLevelByHeart(heartValue) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (const lv of LEVEL_THRESHOLDS) {
    if (heartValue >= lv.required) {
      currentLevel = lv;
    } else {
      break;
    }
  }
  return currentLevel;
}

/**
 * 算出下一级还需要多少暖心值
 */
function getNextLevelInfo(heartValue) {
  const current = getLevelByHeart(heartValue);
  if (current.level === 10) {
    return { isMax: true, current, next: null, remaining: 0, percent: 100 };
  }
  const next = LEVEL_THRESHOLDS[current.level]; // level 数组索引就是下一级
  const remaining = next.required - heartValue;
  const total = next.required - current.required;
  const earned = heartValue - current.required;
  const percent = Math.min(100, Math.floor((earned / total) * 100));
  return { isMax: false, current, next, remaining, percent };
}

module.exports = {
  LEVEL_THRESHOLDS,
  HEART_RULES,
  LEVEL_REWARDS,
  getLevelByHeart,
  getNextLevelInfo
};
