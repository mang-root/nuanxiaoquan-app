// pages/userProfile/userProfile.js
const storage = require('../../utils/storage.js');
const levelConfig = require('../../utils/levelConfig.js');
const dateHelper = require('../../utils/dateHelper.js');

Page({
  data: {
    isSelf: false,
    profile: {},
    stats: {
      studyDays: 0,
      totalMinutes: 0
    }
  },

  onLoad(options) {
    const isSelf = options.self === '1';
    const user = storage.getUserInfo();

    if (isSelf) {
      const levelInfo = levelConfig.getLevelByHeart(user.heartValue);
      const tasksMap = storage.getAllTasksMap();
      let totalMin = 0;
      let studyDays = 0;
      Object.keys(tasksMap).forEach(d => {
        const dayTasks = tasksMap[d] || [];
        const hasDone = dayTasks.some(t => t.done);
        if (hasDone) studyDays++;
        dayTasks.forEach(t => { if (t.done) totalMin += Number(t.duration || 0); });
      });

      this.setData({
        isSelf: true,
        profile: { ...user, level: levelInfo.level, levelName: levelInfo.name },
        stats: { studyDays, totalMinutes: totalMin }
      });
    } else {
      const nickname = decodeURIComponent(options.nickname || '同学');
      const color = decodeURIComponent(options.color || '#FFD4DF');
      this.setData({
        isSelf: false,
        profile: { nickname, avatarColor: color, level: 1, levelName: '新序', signature: '' },
        stats: { studyDays: 0, totalMinutes: 0 }
      });
    }
  },

  gotoLevel() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/levelDetail/levelDetail' });
  },

  editProfile() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting' });
  }
});
