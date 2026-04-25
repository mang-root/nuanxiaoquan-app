// pages/mine/levelDetail/levelDetail.js
const storage = require('../../../utils/storage.js');
const levelConfig = require('../../../utils/levelConfig.js');

Page({
  data: {
    userInfo: {},
    levelInfo: {},
    allLevels: [],
    rules: [],
    activeTab: "reward",
    heartLogs: []
  },

  onShow() {
    const userInfo = storage.getUserInfo();
    const levelInfo = levelConfig.getNextLevelInfo(userInfo.heartValue || 0);
    const allLevels = levelConfig.LEVEL_THRESHOLDS.map(lv => {
      const reward = levelConfig.LEVEL_REWARDS.find(r => r.level === lv.level);
      return {
        ...lv,
        rewards: reward ? reward.rewards : [],
        isCurrent: lv.level === userInfo.level,
        isUnlocked: userInfo.level >= lv.level
      };
    });

    const rules = Object.keys(levelConfig.HEART_RULES).map(k => ({
      key: k,
      ...levelConfig.HEART_RULES[k]
    }));

    const heartLogs = storage.getHeartLogs().slice(0, 50).map(log => ({
      ...log,
      timeLabel: this.formatTime(log.time)
    }));

    this.setData({
      userInfo,
      levelInfo,
      allLevels,
      rules,
      heartLogs
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  }
});
