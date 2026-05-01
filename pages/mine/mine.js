// pages/mine/mine.js
const storage = require('../../utils/storage.js');
const levelConfig = require('../../utils/levelConfig.js');
const dateHelper = require('../../utils/dateHelper.js');

Page({
  data: {
    userInfo: {},
    levelInfo: {},
    currentDeco: "",
    stats: {
      totalMinutes: 0,
      streakDays: 0,
      noteCount: 0
    },
    myPrivate: [],
    addNoteShow: false,
    noteForm: {
      title: '',
      content: '',
      images: []
    }
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    const user = storage.getUserInfo();
    user.avatarUrl = avatarUrl;
    storage.setUserInfo(user);
    this.setData({ 'userInfo.avatarUrl': avatarUrl });
    wx.showToast({ title: '头像已更新', icon: 'success' });
  },

  onShow() {
    const u = storage.getUserInfo();
    if (!u.nickname || u.nickname === '同学' || u.nickname === '暖小圈用户') {
      u.nickname = 'nxq' + Math.floor(100000 + Math.random() * 900000);
      storage.setUserInfo(u);
    }

    const user = storage.getUserInfo();
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

    const levelInfo = levelConfig.getLevelByHeart(user.heartValue);
    const myPrivate = (wx.getStorageSync('privateNotes') || []).map(n => ({
      ...n,
      dateStr: n.createdAt ? new Date(n.createdAt).toLocaleDateString('zh-CN') : ''
    })).reverse();

    this.setData({
      userInfo: user,
      levelInfo,
      stats: {
        totalMinutes: totalMin,
        streakDays: streak,
        noteCount: myPrivate.length
      },
      myPrivate
    });
  },

  gotoEditNickname() {
    const that = this;
    wx.showModal({
      title: '自定义昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success(r) {
        if (r.confirm && r.content) {
          const u = storage.getUserInfo();
          u.nickname = r.content.trim();
          storage.setUserInfo(u);
          that.setData({ 'userInfo.nickname': u.nickname });
          wx.showToast({ title: '已更新', icon: 'success' });
        }
      }
    });
  },

  gotoEditSignature() {
    const that = this;
    wx.showModal({
      title: '编辑签名',
      editable: true,
      placeholderText: '说点什么...',
      success(r) {
        if (r.confirm) {
          const u = storage.getUserInfo();
          u.signature = r.content || '';
          storage.setUserInfo(u);
          that.setData({ 'userInfo.signature': u.signature });
          wx.showToast({ title: '已更新', icon: 'success' });
        }
      }
    });
  },

  gotoLevel() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/levelDetail/levelDetail' });
  },

  gotoSetting() {
    wx.navigateTo({ url: '/miniprogram/pages/mine/setting/setting' });
  },

  // 私密笔记操作
  openAddNote() {
    this.setData({
      addNoteShow: true,
      noteForm: { title: '', content: '', images: [] }
    });
  },

  closeAddNote() {
    this.setData({ addNoteShow: false });
  },

  onNoteTitle(e) {
    this.setData({ 'noteForm.title': e.detail.value });
  },

  onNoteContent(e) {
    this.setData({ 'noteForm.content': e.detail.value });
  },

  chooseNoteImages() {
    const current = this.data.noteForm.images;
    const remain = 9 - current.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const paths = (res.tempFiles || []).map(f => f.tempFilePath);
        this.setData({
          'noteForm.images': [...current, ...paths].slice(0, 9)
        });
      }
    });
  },

  removeNoteImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const imgs = this.data.noteForm.images.slice();
    imgs.splice(idx, 1);
    this.setData({ 'noteForm.images': imgs });
  },

  submitNote() {
    const f = this.data.noteForm;
    if (!f.content.trim() && !f.title.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    const notes = wx.getStorageSync('privateNotes') || [];
    notes.push({
      id: Date.now(),
      title: f.title.trim(),
      content: f.content.trim(),
      images: f.images.slice(),
      createdAt: Date.now()
    });
    wx.setStorageSync('privateNotes', notes);
    this.setData({ addNoteShow: false });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.onShow();
  },

  deleteNote(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除笔记',
      content: '确认删除这条私密笔记？',
      success: (res) => {
        if (res.confirm) {
          let notes = wx.getStorageSync('privateNotes') || [];
          notes = notes.filter(n => n.id !== id);
          wx.setStorageSync('privateNotes', notes);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.onShow();
        }
      }
    });
  },

  gotoNoteDetail(e) {
    // 点击笔记可查看详情（这里直接展开，不做跳转）
    wx.showToast({ title: '长按可删除', icon: 'none' });
  },

  gotoCheckinHistory() {
    wx.navigateTo({ url: '/miniprogram/pages/checkin/checkin' });
  },
});
