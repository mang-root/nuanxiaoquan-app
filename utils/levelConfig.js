// utils/levelConfig.js
// 等级 / 暖心值 / 等级奖励 统一配置

const LEVEL_THRESHOLDS = [
  { level: 1,  name: "新序",   required: 0,     color: "#B0B0B0", emoji: "🌱" },
  { level: 2,  name: "待苞",   required: 30,    color: "#FFC1CE", emoji: "🌷" },
  { level: 3,  name: "初绽",   required: 100,   color: "#FF8DA8", emoji: "🌸" },
  { level: 4,  name: "栖暖",   required: 250,   color: "#FFB380", emoji: "🔥" },
  { level: 5,  name: "温行",   required: 500,   color: "#FFCE6B", emoji: "⭐" },
  { level: 6,  name: "晴和",   required: 900,   color: "#7DCE82", emoji: "🌤" },
  { level: 7,  name: "风叙",   required: 1500,  color: "#6BD8C9", emoji: "🍃" },
  { level: 8,  name: "向煦",   required: 2500,  color: "#6B9BD8", emoji: "💎" },
  { level: 9,  name: "揽星",   required: 4000,  color: "#9B7DCE", emoji: "🌙" },
  { level: 10, name: "暖小圈", required: 6500,  color: "#FF8DA8", emoji: "👑" }
];

// 暖心值获取规则（去掉社交相关，保留个人行为）
const HEART_RULES = {
  dailyLogin:        { value: 2,  limit: 2,   desc: "每日首次登录" },
  dailyCheckin:      { value: 2,  limit: 2,   desc: "每日情绪打卡" },
  completeTask:      { value: 5,  limit: 30,  desc: "完成学习任务" },
  tomatoComplete:    { value: 5,  limit: 20,  desc: "自习室学满30分钟" },
  readResource:      { value: 1,  limit: 10,  desc: "浏览学习资源" },
  collectResource:   { value: 2,  limit: 10,  desc: "收藏学习资源" },
  writeNote:         { value: 5,  limit: 15,  desc: "写私密笔记" },
  addPeriodRecord:   { value: 3,  limit: 3,   desc: "生理期记录" },
  weeklyStreak:      { value: 20, limit: 20,  desc: "连续打卡一周" },
  monthlyStreak:     { value: 50, limit: 50,  desc: "连续打卡一个月" }
};

// 等级奖励（纯用emoji+CSS实现，不需要找图片）
const LEVEL_REWARDS = [
  {
    level: 1, name: "新序",
    rewards: [
      { text: "默认头像装饰「新芽」🌱", type: "avatarDeco", value: "🌱" },
    ]
  },
  {
    level: 2, name: "待苞",
    rewards: [
      { text: "头像装饰「花苞」🌷", type: "avatarDeco", value: "🌷" },
      { text: "解锁小馆资源收藏功能", type: "feature" },
    ]
  },
  {
    level: 3, name: "初绽",
    rewards: [
      { text: "头像装饰「樱花」🌸", type: "avatarDeco", value: "🌸" },
      { text: "个人签名自定义颜色", type: "feature" },
      { text: "知时日历主题「暖粉」", type: "theme", value: "pink" },
    ]
  },
  {
    level: 4, name: "栖暖",
    rewards: [
      { text: "头像装饰「暖焰」🔥", type: "avatarDeco", value: "🔥" },
      { text: "自习室自定义时长(5-90分钟)", type: "feature" },
    ]
  },
  {
    level: 5, name: "温行",
    rewards: [
      { text: "头像装饰「星辰」⭐", type: "avatarDeco", value: "⭐" },
      { text: "知时日历主题「暖橙」", type: "theme", value: "orange" },
      { text: "学习数据周报可导出图片", type: "feature" },
    ]
  },
  {
    level: 6, name: "晴和",
    rewards: [
      { text: "头像装饰「晴光」🌤", type: "avatarDeco", value: "🌤" },
      { text: "知时日历主题「清绿」", type: "theme", value: "green" },
    ]
  },
  {
    level: 7, name: "风叙",
    rewards: [
      { text: "头像装饰「风叶」🍃", type: "avatarDeco", value: "🍃" },
      { text: "昵称渐变色效果", type: "feature" },
      { text: "个人页自定义简介", type: "feature" },
    ]
  },
  {
    level: 8, name: "向煦",
    rewards: [
      { text: "头像装饰「钻石」💎", type: "avatarDeco", value: "💎" },
      { text: "知时日历主题「深蓝」", type: "theme", value: "blue" },
      { text: "学习报告可分享为图片", type: "feature" },
    ]
  },
  {
    level: 9, name: "揽星",
    rewards: [
      { text: "头像装饰「星月」🌙（带光效）", type: "avatarDeco", value: "🌙" },
      { text: "学习成就勋章墙解锁", type: "feature" },
    ]
  },
  {
    level: 10, name: "暖小圈",
    rewards: [
      { text: "头像装饰「王冠」👑（带闪烁）", type: "avatarDeco", value: "👑" },
      { text: "全主题皮肤解锁", type: "feature" },
      { text: "昵称自定义颜色", type: "feature" },
      { text: "专属称号「暖小圈创始者」", type: "title", value: "暖小圈创始者" },
    ]
  }
];

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

function getNextLevelInfo(heartValue) {
  const current = getLevelByHeart(heartValue);
  if (current.level === 10) {
    return { isMax: true, current, next: null, remaining: 0, percent: 100 };
  }
  const next = LEVEL_THRESHOLDS[current.level];
  const remaining = next.required - heartValue;
  const total = next.required - current.required;
  const earned = heartValue - current.required;
  const percent = Math.min(100, Math.floor((earned / total) * 100));
  return { isMax: false, current, next, remaining, percent };
}

// 获取用户已解锁的头像装饰
function getUnlockedDecos(heartValue) {
  const level = getLevelByHeart(heartValue).level;
  const decos = [];
  LEVEL_REWARDS.forEach(lr => {
    if (lr.level <= level) {
      lr.rewards.forEach(r => {
        if (r.type === 'avatarDeco') {
          decos.push({ level: lr.level, name: lr.name, emoji: r.value, text: r.text });
        }
      });
    }
  });
  return decos;
}

module.exports = {
  LEVEL_THRESHOLDS,
  HEART_RULES,
  LEVEL_REWARDS,
  getLevelByHeart,
  getNextLevelInfo,
  getUnlockedDecos
};
