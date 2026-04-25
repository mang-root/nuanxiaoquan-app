// pages/mine/mine.js
const storage = require('../../utils/storage.js');
const levelConfig = require('../../utils/levelConfig.js');
const dateHelper = require('../../utils/dateHelper.js');

Page({
  data: {
    userInfo: {},
    levelInfo: {},
    stats: {
      totalMinutes: 0,
      streakDays: 0,
      postCount: 0,
      collectedCount: 0
    },
    // Tab:post 帖子 / resource 资源 / collect 收藏 / private 私密
    activeTab: "post",
    myPosts: [],
    myResources: [],
    myCollects: [],
    myPrivate: []
  },

  // ========== 微信头像授权 ==========
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    const user = storage.getUserInfo();
    user.avatarUrl = avatarUrl;
    storage.setUserInfo(user);
    this.setData({ 'userInfo.avatarUrl': avatarUrl });
    wx.showToast({ title: '头像已更新', icon: 'success' });
  },

  onShow() {
    // 1. 获取用户信息
    const user = storage.getUserInfo();
    const myName = user.nickname || "同学";

    // 2. 统计学习时长和连续打卡
    const tasksMap = storage.getAllTasksMap();
    let totalMin = 0;
    Object.keys(tasksMap).forEach(d => {
      (tasksMap[d] || []).forEach(t => {
        if (t.done) totalMin += Number(t.duration || 0);
      });
    });

    let streak = 0;
    const today = dateHelper.today();
    let check = new Date(today);
    while (true) {
      const ds = dateHelper.format(check);
      const hasDone = (tasksMap[ds] || []).some(t => t.done);
      if (hasDone) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // 3. 计算等级信息
    const levelInfo = levelConfig.getLevelByHeart(user.heartValue);

    // 4. 获取所有帖子和资源
    const allPosts = storage.getPosts();
    const allResources = storage.getResources();

    // 5. 过滤数据
    const myPosts = allPosts.filter(p => p.authorNickname === myName && !p.privateOnly); // 我的公开帖子
    const myPrivate = allPosts.filter(p => p.authorNickname === myName && p.privateOnly); // 我的私密笔记
    const myResources = allResources.filter(r => r.authorNickname === myName); // 我的资源
    
    // 我的收藏（帖子+资源）
    const collectedPosts = allPosts.filter(p => p.collected && !p.privateOnly);
    const collectedResources = allResources.filter(r => r.collected);
    const myCollects = [...collectedPosts, ...collectedResources];

    // 6. 统一 setData
    this.setData({
      userInfo: user,
      levelInfo: levelInfo,
      stats: {
        totalMinutes: totalMin,
        streakDays: streak,
        postCount: myPosts.length,
        collectedCount: myCollects.length
      },
      activeTab: "post",
      myPosts: myPosts,
      myResources: myResources,
      myCollects: myCollects,
      myPrivate: myPrivate
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // 点头像 → 个人主页
  gotoProfile() {
    wx.navigateTo({
      url: '/miniprogram/pages/userProfile/userProfile?self=1'
    });
  },

  gotoEditNickname() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting?focus=nickname' });
  },

  gotoEditSignature() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting?focus=signature' });
  },

  // 点等级卡片 → 等级详情
  gotoLevel() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/levelDetail/levelDetail' });
  },

  gotoSetting() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting' });
  },

  gotoMessage() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/messageCenter/messageCenter' });
  },

  gotoPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/miniprogram/pages/postDetail/postDetail?id=${id}`
    });
  },

  gotoResourceDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/miniprogram/pages/shop/goodsDetail/goodsDetail?id=${id}`
    });
  }
});