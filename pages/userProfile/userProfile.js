// pages/userProfile/userProfile.js
const storage = require('../../utils/storage.js');
const levelConfig = require('../../utils/levelConfig.js');

Page({
  data: {
    isSelf: false,
    profile: {},
    levelInfo: {},
    stats: {
      postCount: 0,
      resourceCount: 0,
      likedCount: 0,
      collectCount: 0
    },
    activeTab: 'post',
    posts: [],
    resources: []
  },

  onLoad(options) {
    // 判断是看自己还是看别人
    // self=1 表示自己,否则按 nickname 查
    if (options.self === '1') {
      this.setData({ isSelf: true });
      this.loadSelf();
    } else if (options.nickname) {
      this.setData({ isSelf: false });
      this.loadOther(options.nickname);
    } else {
      // 没传参数,当作自己
      this.setData({ isSelf: true });
      this.loadSelf();
    }
  },

  loadSelf() {
    const user = storage.getUserInfo();
    const next = levelConfig.getNextLevelInfo(user.heartValue || 0);
    const allPosts = storage.getPosts();
    const allRes = storage.getResources();
    const name = user.nickname;

    const myPosts = allPosts.filter(p => p.authorNickname === name && !p.privateOnly);
    const myRes = allRes.filter(r => r.authorNickname === name);
    const likedCount = myPosts.reduce((s, p) => s + (p.likeCount || 0), 0);
    const collectCount = myPosts.reduce((s, p) => s + (p.collectCount || 0), 0)
      + myRes.reduce((s, r) => s + (r.collectCount || 0), 0);

    this.setData({
      profile: {
        nickname: user.nickname || '同学',
        avatarColor: user.avatarColor || '#FFD4DF',
        levelName: user.levelName || '新序',
        level: user.level || 1,
        heartValue: user.heartValue || 0,
        signature: user.signature || '专注学习,温柔生长',
        joinDate: user.joinDate || '—'
      },
      levelInfo: next,
      stats: {
        postCount: myPosts.length,
        resourceCount: myRes.length,
        likedCount,
        collectCount
      },
      posts: myPosts,
      resources: myRes
    });

    wx.setNavigationBarTitle({ title: '我的主页' });
  },

  loadOther(nickname) {
    const allPosts = storage.getPosts();
    const allRes = storage.getResources();

    const posts = allPosts.filter(p => p.authorNickname === nickname && !p.privateOnly);
    const resources = allRes.filter(r => r.authorNickname === nickname);

    // 从帖子里提取这个人的信息
    const sample = posts[0] || resources[0] || {};
    const likedCount = posts.reduce((s, p) => s + (p.likeCount || 0), 0);
    const collectCount = posts.reduce((s, p) => s + (p.collectCount || 0), 0)
      + resources.reduce((s, r) => s + (r.collectCount || 0), 0);

    this.setData({
      profile: {
        nickname: nickname,
        avatarColor: sample.authorAvatarColor || '#D4E4FF',
        levelName: sample.authorLevelName || '新序',
        level: sample.authorLevel || 1,
        heartValue: 0,
        signature: '',
        joinDate: ''
      },
      levelInfo: { isMax: false, percent: 0 },
      stats: {
        postCount: posts.length,
        resourceCount: resources.length,
        likedCount,
        collectCount
      },
      posts,
      resources
    });

    wx.setNavigationBarTitle({ title: nickname + ' 的主页' });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
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
  },

  gotoLevel() {
    if (this.data.isSelf) {
      wx.navigateTo({ url: '/miniprogram/pages/mine/levelDetail/levelDetail' });
    }
  },

  editProfile() {
    if (!this.data.isSelf) return;
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting' });
  }
});