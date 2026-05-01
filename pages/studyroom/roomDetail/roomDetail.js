// pages/studyroom/roomDetail/roomDetail.js
const storage = require('../../../utils/storage.js');

Page({
  data: {
    room: null,
    userInfo: {},
    members: [],
    tomatoRunning: false,
    tomatoMinutes: 25,
    tomatoTime: '25:00',
    totalTime: 0,
    totalTimeStr: '00:00:00',
    todayRoomMin: 0
  },

  onLoad(options) {
    this.roomId = Number(options.roomId);
    this.loadRoom();
    this.initMembers();
    this.startTotalTimer();
    const today = new Date().toLocaleDateString('zh-CN');
    const key = 'roomMin_' + today;
    this.setData({ todayRoomMin: wx.getStorageSync(key) || 0 });
  },

  onUnload() {
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
    if (this.totalTimerRef) clearInterval(this.totalTimerRef);
  },

  startTotalTimer() {
    this.totalTimerRef = setInterval(() => {
      const t = this.data.totalTime + 1;
      const h = String(Math.floor(t / 3600)).padStart(2, '0');
      const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
      const s = String(t % 60).padStart(2, '0');
      this.setData({ totalTime: t, totalTimeStr: `${h}:${m}:${s}` });
    }, 1000);
  },

  loadRoom() {
    const rooms = storage.getRooms();
    const room = rooms.find(r => r.id === this.roomId);
    this.setData({
      room: room || { name: '学习房间', topic: '自由学习', currentNum: 1, maxNum: 8 },
      userInfo: storage.getUserInfo()
    });
    wx.setNavigationBarTitle({ title: room ? room.name : '学习房间' });
  },

  initMembers() {
    const user = storage.getUserInfo();
    const room = this.data.room;
    const sampleNames = [
      { name: '栖暖', color: '#FFD4DF' },
      { name: '温行', color: '#D4E4FF' },
      { name: '初绽', color: '#FFE8D0' },
      { name: '晴和', color: '#D4EDD6' },
      { name: '风叙', color: '#E0D4FF' }
    ];
    const count = Math.min(room.currentNum || 1, sampleNames.length + 1);
    const members = [{
      id: 'me',
      nickname: user.nickname || '我',
      color: user.avatarColor || '#FFD4DF',
      isOwner: !!room.isMine,
      isMe: true,
      status: '学习中'
    }];
    for (let i = 0; i < count - 1; i++) {
      members.push({
        id: 's' + i,
        nickname: sampleNames[i].name,
        color: sampleNames[i].color,
        isOwner: i === 0 && !room.isMine,
        isMe: false,
        status: i % 2 === 0 ? '学习中' : '休息中'
      });
    }
    this.setData({ members });
  },

  changeTomatoMin(e) {
    if (this.data.tomatoRunning) return;
    const min = Number(e.currentTarget.dataset.min);
    this.setData({
      tomatoMinutes: min,
      tomatoTime: `${String(min).padStart(2, '0')}:00`
    });
  },

  startRoomTomato() {
    if (this.data.tomatoRunning) return;
    const min = this.data.tomatoMinutes;
    this.setData({ tomatoRunning: true });
    let totalSeconds = min * 60;
    this.tomatoTimer = setInterval(() => {
      totalSeconds--;
      const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const s = String(totalSeconds % 60).padStart(2, '0');
      this.setData({ tomatoTime: `${m}:${s}` });
      if (totalSeconds <= 0) {
        clearInterval(this.tomatoTimer);
        this.setData({ tomatoRunning: false, tomatoTime: `${String(min).padStart(2, '0')}:00` });
        wx.vibrateLong();
        wx.showModal({ title: '专注完成 🎉', content: `你已专注 ${min} 分钟`, showCancel: false });
        storage.addHeartValue(min >= 30 ? 5 : 2, `专注 ${min} 分钟`);
        // 记录今日房间专注时间
        const today = new Date().toLocaleDateString('zh-CN');
        const key = 'roomMin_' + today;
        const prev = wx.getStorageSync(key) || 0;
        wx.setStorageSync(key, prev + min);
        this.setData({ todayRoomMin: prev + min });
      }
    }, 1000);
  },

  stopRoomTomato() {
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
    this.setData({
      tomatoRunning: false,
      tomatoTime: `${String(this.data.tomatoMinutes).padStart(2, '0')}:00`
    });
  },

  saveRoom() {
    wx.showToast({ title: '已收藏房间', icon: 'success' });
  },

  shareResult() {
    wx.showShareMenu({ withShareTicket: false });
    wx.showToast({ title: '长按分享给朋友', icon: 'none' });
  },

  leaveRoom() {
    wx.showModal({
      title: '确认离开?',
      content: '离开后计时将停止',
      success: (res) => {
        if (res.confirm) {
          if (this.tomatoTimer) clearInterval(this.tomatoTimer);
          wx.navigateBack();
        }
      }
    });
  }
});
