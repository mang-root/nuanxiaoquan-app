// pages/mine/setting/setting.js
const storage = require('../../../utils/storage.js');

Page({
  data: {
    userInfo: {},
    showPeriodMode: false,
    autoFocus: '',
    // 性别配置 合并在这里，不重复
    genderOptions: ['男', '女', '保密'],
    genderIndex: 2,
    gender: '保密',
    userGender: 'female'  // 你要求新增
  },

  onLoad(options) {
    const userInfo = storage.getUserInfo();
    this.setData({ userInfo, showPeriodMode: userInfo.showPeriodMode === true });
    // 根据来源自动聚焦
    if (options.focus === 'nickname') {
      this.setData({ autoFocus: 'nickname' });
    } else if (options.focus === 'signature') {
      this.setData({ autoFocus: 'signature' });
    }

    // ========== 你要求添加的主题初始化 ==========
    const userGender = wx.getStorageSync('userGender') || 'female';
    this.setData({ userGender });
  },

  // ========== 你要求添加的主题切换方法 ==========
  setTheme(e) {
    const gender = e.currentTarget.dataset.gender;
    wx.setStorageSync('userGender', gender);
    getApp().globalData.theme = gender;
    this.setData({ userGender: gender });
    wx.showToast({ title: gender === 'male' ? '已切换男生主题' : '已切换女生主题', icon: 'none' });
  },

  // ========== 昵称输入框失焦保存 ==========
  onNicknameBlur(e) {
    const val = e.detail.value.trim();
    if (!val) return;
    const user = storage.getUserInfo();
    user.nickname = val;
    storage.setUserInfo(user);
    this.setData({ 'userInfo.nickname': val });
    wx.showToast({ title: '昵称已更新', icon: 'success' });
  },

  onShow() {
    const userInfo = storage.getUserInfo();
    // 读取用户性别
    const gender = userInfo.gender || "保密";
    const genderIndex = this.data.genderOptions.indexOf(gender);
    
    this.setData({
      userInfo,
      showPeriodMode: userInfo.showPeriodMode === true,
      gender: gender,
      genderIndex: genderIndex
    });
  },

  // 切换性别
  onGenderChange(e) {
    const index = e.detail.value;
    const gender = this.data.genderOptions[index];
    // 保存到本地
    const user = storage.getUserInfo();
    user.gender = gender;
    storage.setUserInfo(user);
    // 更新页面
    this.setData({
      genderIndex: index,
      gender: gender
    });
    wx.showToast({ title: '性别已保存', icon: 'none' });
  },

  togglePeriod(e) {
    const val = e.detail.value;
    const user = storage.getUserInfo();
    user.showPeriodMode = val;
    storage.setUserInfo(user);
    this.setData({ showPeriodMode: val });
    wx.showToast({
      title: val ? "已开启生理期模式" : "已关闭生理期模式",
      icon: "none"
    });
  },

  editNickname() {
    wx.showModal({
      title: "修改昵称",
      editable: true,
      placeholderText: this.data.userInfo.nickname,
      success: async (res) => {
        if (res.confirm && res.content) {
          const security = require('../../../utils/security.js');
          const check = await security.checkText(res.content);
          if (!check.pass) {
            wx.showToast({ title: "昵称含不允许内容", icon: "none" });
            return;
          }
          const u = storage.getUserInfo();
          u.nickname = res.content.trim();
          storage.setUserInfo(u);
          this.onShow();
          wx.showToast({ title: "已修改", icon: "success" });
        }
      }
    });
  },

  editSignature() {
    wx.showModal({
      title: "修改签名",
      editable: true,
      placeholderText: this.data.userInfo.signature || "说点什么",
      success: async (res) => {
        if (res.confirm) {
          const security = require('../../../utils/security.js');
          const check = await security.checkText(res.content || "");
          if (!check.pass) {
            wx.showToast({ title: "签名含不允许内容", icon: "none" });
            return;
          }
          const u = storage.getUserInfo();
          u.signature = (res.content || "").trim();
          storage.setUserInfo(u);
          this.onShow();
        }
      }
    });
  },

  changeAvatarColor() {
    const colors = ["#FFD4DF", "#D4E4FF", "#FFE8D0", "#D4EDD6", "#E0D4FF", "#FFCFE3", "#FFE0A8"];
    wx.showActionSheet({
      itemList: colors.map((c, i) => `配色 ${i + 1}`),
      success: (res) => {
        const u = storage.getUserInfo();
        u.avatarColor = colors[res.tapIndex];
        storage.setUserInfo(u);
        this.onShow();
      }
    });
  },

  feedbackEmail() {
    wx.setClipboardData({
      data: "请写信给我们反馈",
      success: () => {
        wx.showModal({
          title: "意见反馈",
          content: "请给我们发邮件,邮箱:acd2123759705@outlook.com。我们会认真看每一条反馈。",
          showCancel: false
        });
      }
    });
  },
  goFeedback() {
    wx.setClipboardData({
      data: 'acd2123759705@outlook.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制，可去邮件APP反馈',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  aboutUs() {
    wx.showModal({
      title: "关于暖小圈",
      content: "一个陪你学习的小地方。\n无广告 · 无会员 · 无好友私聊",
      showCancel: false
    });
  },

  // 只清临时缓存(不清用户数据)

  clearTempCache() {
    // 临时缓存 key 列表(不影响用户内容)
    const tempKeys = [
      'heartLogs',    // 暖心值流水(太多了可以清)
    ];
    wx.showModal({
      title: '清除缓存',
      content: '只会清理暖心值流水等临时数据,你的帖子、任务、账单、资源都不会丢失',
      success: (res) => {
        if (res.confirm) {
          tempKeys.forEach(k => {
            try { wx.removeStorageSync(k); } catch(e) {}
          });
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  },

  // 清全部数据(原来的 clearCache)
  clearAllData() {
    wx.showModal({
      title: '清除全部数据',
      content: '⚠️ 这会清空你所有的帖子、任务、账单、资源等全部本地数据,无法恢复,确定吗?',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '已清除', icon: 'success' });
          setTimeout(() => {
            wx.reLaunch({ url: '/miniprogram/pages/home/home' });
          }, 800);
        }
      }
    });
  },

  userAgreement() {
    wx.showModal({
      title: "用户协议",
      content: "使用本小程序,请遵守国家法律法规,不发布违法违规、色情暴力、政治敏感、引流广告等内容。违规内容将被删除,严重者账号会被限制。",
      showCancel: false
    });
  },

  privacyPolicy() {
    wx.showModal({
      title: "隐私政策",
      content: "本小程序仅收集必要的用户信息用于功能实现。所有数据优先存储在你的设备本地,不会未经你同意上传或分享。",
      showCancel: false
    });
  }
});