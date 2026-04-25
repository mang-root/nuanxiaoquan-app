// pages/studyroom/roomDetail/roomDetail.js
// 房间详情 - 学习房间内部,仿语音厅排版但是打字交流,配共享暖圈钟

const storage = require('../../../utils/storage.js');
const security = require('../../../utils/security.js');

Page({
  data: {
    room: null,
    userInfo: {},

    // 在线同学(前端模拟,用于排版展示)
    members: [],

    // 聊天
    messages: [],
    inputMsg: "",

    // 共享暖圈钟(房间内)
    tomatoRunning: false,
    tomatoMinutes: 25,
    tomatoTime: "25:00",

    showChat: true, // 已删除重复的showChat，只保留一个

    // ===================== 【需求1 新增：总计时变量】 =====================
    totalTime: 0,        // 总学习秒数
    totalTimeStr: '00:00:00', // 格式化时间
    totalTimer: null     // 总计时定时器
  },

  // ===================== 【需求1：聊天隐藏/显示（保留你原有方法，删除重复）】 =====================
  toggleChat() {
    this.setData({
      showChat: !this.data.showChat
    })
  },

  // ===================== 【需求1 新增：启动总计时】 =====================
  startTotalTimer() {
    if (this.data.totalTimer) return;
    const timer = setInterval(() => {
      let time = this.data.totalTime + 1;
      this.setData({ totalTime: time });
      this.setData({ totalTimeStr: this.formatTime(time) });
    }, 1000);
    this.setData({ totalTimer: timer });
  },

  // ===================== 【需求1 新增：时间格式化 时:分:秒】 =====================
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  onLoad(options) {
    this.roomId = Number(options.roomId);
    this.loadRoom();
    this.initMembers();
    this.initMessages();
    
    // ===================== 【需求1 新增：页面加载启动总计时】 =====================
    this.startTotalTimer();
  },

  onUnload() {
    // 你原有暖圈钟定时器清理
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
    // ===================== 【需求1 新增：清理总计时】 =====================
    if (this.data.totalTimer) clearInterval(this.data.totalTimer);
  },

  loadRoom() {
    const rooms = storage.getRooms();
    const room = rooms.find(r => r.id === this.roomId);
    this.setData({
      room: room || { name: "学习房间", topic: "自由学习", currentNum: 1, maxNum: 8 },
      userInfo: storage.getUserInfo()
    });
    wx.setNavigationBarTitle({ title: room ? room.name : "学习房间" });
  },

  initMembers() {
    // 前端模拟的在线成员(包含自己+示例同学)
    const user = storage.getUserInfo();
    const room = this.data.room;
    const sampleNames = [
      { name: "栖暖", color: "#FFD4DF" },
      { name: "温行", color: "#D4E4FF" },
      { name: "初绽", color: "#FFE8D0" },
      { name: "晴和", color: "#D4EDD6" },
      { name: "风叙", color: "#E0D4FF" }
    ];
    const count = Math.min(room.currentNum || 1, sampleNames.length + 1);
    const members = [
      {
        id: "me",
        nickname: user.nickname || "我",
        color: user.avatarColor || "#FFD4DF",
        isOwner: !!room.isMine,
        isMe: true,
        status: "学习中"
      }
    ];
    for (let i = 0; i < count - 1; i++) {
      members.push({
        id: "s" + i,
        nickname: sampleNames[i].name,
        color: sampleNames[i].color,
        isOwner: i === 0 && !room.isMine,
        isMe: false,
        status: i === 0 ? "学习中" : (i % 2 === 0 ? "学习中" : "挂起")
      });
    }
    this.setData({ members });
  },

  initMessages() {
    // 默认欢迎消息
    this.setData({
      messages: [
        { id: 1, nickname: "系统", isSystem: true, content: "欢迎来到房间,一起专注学习吧", time: Date.now() - 60000 }
      ]
    });
  },

  onInputMsg(e) {
    this.setData({ inputMsg: e.detail.value });
  },

  async sendMsg() {
    const content = (this.data.inputMsg || "").trim();
    if (!content) return;

    const check = await security.checkText(content);
    if (!check.pass) {
      wx.showToast({ title: check.reason || "含不允许内容", icon: "none" });
      return;
    }

    const user = storage.getUserInfo();
    const newMsg = {
      id: Date.now(),
      nickname: user.nickname || "我",
      color: user.avatarColor || "#FFD4DF",
      isMe: true,
      content,
      time: Date.now()
    };
    this.setData({
      messages: [...this.data.messages, newMsg],
      inputMsg: ""
    });
    // 滚到底部
    setTimeout(() => {
      wx.pageScrollTo({ scrollTop: 999999, duration: 200 });
    }, 100);
  },

  // 快捷短语
  sendQuick(e) {
    const text = e.currentTarget.dataset.text;
    const user = storage.getUserInfo();
    const newMsg = {
      id: Date.now(),
      nickname: user.nickname || "我",
      color: user.avatarColor || "#FFD4DF",
      isMe: true,
      content: text,
      time: Date.now()
    };
    this.setData({
      messages: [...this.data.messages, newMsg]
    });
  },

  // 共享暖圈钟
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
        wx.showModal({ title: "完成 🎉", content: `房间专注 ${min} 分钟`, showCancel: false });
        storage.addHeartValue(5, `房间暖圈钟 ${min} 分钟`);
      }
    }, 1000);

    // 系统消息
    this.setData({
      messages: [...this.data.messages, {
        id: Date.now(),
        nickname: "系统",
        isSystem: true,
        content: `共享暖圈钟开始(${min} 分钟)`,
        time: Date.now()
      }]
    });
  },

  stopRoomTomato() {
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
    this.setData({
      tomatoRunning: false,
      tomatoTime: `${String(this.data.tomatoMinutes).padStart(2, '0')}:00`
    });
  },

  changeTomatoMin(e) {
    if (this.data.tomatoRunning) return;
    const min = Number(e.currentTarget.dataset.min);
    this.setData({
      tomatoMinutes: min,
      tomatoTime: `${String(min).padStart(2, '0')}:00`
    });
  },

  // 打卡
  checkIn() {
    storage.addHeartValue(2, "房间打卡");
    this.setData({
      messages: [...this.data.messages, {
        id: Date.now(),
        nickname: this.data.userInfo.nickname || "我",
        color: this.data.userInfo.avatarColor || "#FFD4DF",
        isMe: true,
        isCheckIn: true,
        content: "打卡了 ✓",
        time: Date.now()
      }]
    });
  },

  gotoMemberProfile(e) {
    const { nickname, color } = e.currentTarget.dataset;
    const me = this.data.userInfo;
    if (nickname === (me.nickname || '同学')) {
      wx.navigateTo({ url: '/miniprogram/pages/userProfile/userProfile?self=1' });
    } else {
      wx.navigateTo({ url: `/miniprogram/pages/userProfile/userProfile?nickname=${encodeURIComponent(nickname)}&color=${encodeURIComponent(color || '#FFD4DF')}` });
    }
  },

  leaveRoom() {
    wx.showModal({
      title: "确认离开?",
      content: "离开房间后聊天记录将消失",
      success: (res) => {
        if (res.confirm) {
          if (this.tomatoTimer) clearInterval(this.tomatoTimer);

          // 如果自己是房主,转移给下一人
          const members = this.data.members;
          const meIdx = members.findIndex(m => m.isMe);
          if (meIdx !== -1 && members[meIdx].isOwner && members.length > 1) {
            // 找下一个非自己的成员
            const nextOwnerIdx = members.findIndex((m, i) => !m.isMe);
            if (nextOwnerIdx !== -1) {
              wx.showToast({ title: `${members[nextOwnerIdx].nickname} 成为新房主`, icon: 'none', duration: 2000 });
            }
          }

          wx.navigateBack();
        }
      }
    });
  }


});