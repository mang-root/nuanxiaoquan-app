// pages/studyroom/studyroom.js
const storage = require('../../utils/storage.js');
const security = require('../../utils/security.js');
const levelConfig = require('../../utils/levelConfig.js');

Page({
  data: {
    userInfo: {},
    levelInfo: {},

    roomList: [],
    roomTab: "hot",

    // 创建房间
    createModalShow: false,
    newRoom: {
      name: "",
      topic: "自由学习",
      maxNum: 8
    },
    topics: ["自由学习", "考研", "四六级", "考公", "考证", "高考", "中考", "语言学习"],

    // 暖圈钟
    tomatoShow: false,
    tomatoModeIndex: 0,   // 0 倒计时 / 1 正计时
    tomatoModes: ["倒计时", "正计时"],
    countdownMinutes: 25,
    customTimeShow: false,
    customMinInput: "",
    tomatoRunning: false,
    tomatoTime: "25:00",
    tomatoStartTimestamp: 0
  },

 


  onLoad() {
    this.initRooms();
  },

  onShow() {
    const userInfo = storage.getUserInfo();
    const next = levelConfig.getNextLevelInfo(userInfo.heartValue || 0);
    this.setData({
      userInfo,
      levelInfo: next
    });
    this.refreshRooms();
  },

  onUnload() {
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
  },

  initRooms() {
    let rooms = storage.getRooms();
    if (!rooms || rooms.length === 0) {
      rooms = [
        { id: 1001, name: "考研打卡室", topic: "考研", currentNum: 5, maxNum: 20, ownerNickname: "栖暖", ownerAvatarColor: "#FFD4DF" },
        { id: 1002, name: "四六级冲刺", topic: "四六级", currentNum: 3, maxNum: 8, ownerNickname: "温行", ownerAvatarColor: "#D4E4FF" },
        { id: 1003, name: "安静自习", topic: "自由学习", currentNum: 2, maxNum: 6, ownerNickname: "初绽", ownerAvatarColor: "#FFE8D0" }
      ];
      storage.setRooms(rooms);
    }
    this.refreshRooms();
  },

  refreshRooms() {
    this.setData({ roomList: storage.getRooms() });
  },

  switchRoomTab(e) {
    this.setData({ roomTab: e.currentTarget.dataset.tab });
  },

  // =============== 创建房间(无等级限制) ===============
  openCreateModal() {
    this.setData({
      createModalShow: true,
      "newRoom.name": "",
      "newRoom.topic": "自由学习",
      "newRoom.maxNum": 8
    });
  },

  closeCreateModal() {
    this.setData({ createModalShow: false });
  },

  onRoomName(e) {
    this.setData({ "newRoom.name": e.detail.value });
  },

  onRoomTopic(e) {
    this.setData({ "newRoom.topic": this.data.topics[e.detail.value] });
  },

  onRoomMaxNum(e) {
    let n = Number(e.detail.value) || 0;
    if (n > 20) n = 20;
    if (n < 2) n = 2;
    this.setData({ "newRoom.maxNum": n });
  },

  async createRoom() {
    const { name, topic, maxNum } = this.data.newRoom;
    if (!name || !name.trim()) {
      wx.showToast({ title: "请填写房间名", icon: "none" });
      return;
    }
    const check = await security.checkText(name);
    if (!check.pass) {
      wx.showToast({ title: check.reason || "房间名含不允许内容", icon: "none" });
      return;
    }

    const newRoom = {
      id: Date.now(),
      name: name.trim(),
      topic,
      currentNum: 1,
      maxNum,
      ownerNickname: this.data.userInfo.nickname || "同学",
      ownerAvatarColor: this.data.userInfo.avatarColor || "#FFD4DF",
      isMine: true
    };
    const rooms = [newRoom, ...storage.getRooms()];
    storage.setRooms(rooms);
    this.setData({ createModalShow: false });
    this.refreshRooms();

    wx.showToast({ title: "创建成功", icon: "success" });
    setTimeout(() => {
      wx.navigateTo({
        url: `/miniprogram/pages/studyroom/roomDetail/roomDetail?roomId=${newRoom.id}`
      });
    }, 500);
  },

  enterRoom(e) {
    const roomId = e.currentTarget.dataset.roomid;
    wx.navigateTo({
      url: `/miniprogram/pages/studyroom/roomDetail/roomDetail?roomId=${roomId}`
    });
  },

  openNearby() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        wx.openLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          scale: 15,
          name: "附近自习地点",
          address: "滑动地图搜索图书馆/自习室"
        });
      },
      fail: () => {
        wx.showModal({
          title: "需要定位授权",
          content: "请在微信设置中允许小程序使用你的位置",
          showCancel: false
        });
      }
    });
  },

  // =============== 暖圈钟 ===============
  openTomato() {
    this.setData({
      tomatoShow: true,
      tomatoModeIndex: 0,
      countdownMinutes: 25,
      tomatoRunning: false,
      tomatoTime: "25:00"
    });
  },

  closeTomato() {
    if (this.data.tomatoRunning) {
      wx.showModal({
        title: "确认退出?",
        content: "暖圈钟正在运行,退出会中断",
        success: (res) => {
          if (res.confirm) {
            this.stopTomato();
            this.setData({ tomatoShow: false });
          }
        }
      });
    } else {
      this.setData({ tomatoShow: false });
    }
  },

  switchTomatoMode(e) {
    if (this.data.tomatoRunning) return;
    const idx = Number(e.currentTarget.dataset.idx);
    this.setData({
      tomatoMode: idx,
      tomatoTime: idx === 0
        ? `${String(this.data.countdownMinutes).padStart(2, '0')}:00`
        : "00:00"
    });
  },

  setCountdownMin(e) {
    if (this.data.tomatoRunning) return;
    const min = Number(e.currentTarget.dataset.min);
    this.setData({
      countdownMinutes: min,
      tomatoTime: `${String(min).padStart(2, '0')}:00`
    });
  },

  openCustomTime() {
    if (this.data.tomatoRunning) return;
    this.setData({ customTimeShow: true, customMinInput: "" });
  },

  closeCustomTime() {
    this.setData({ customTimeShow: false });
  },

  onCustomMinInput(e) {
    this.setData({ customMinInput: e.detail.value });
  },

  confirmCustomTime() {
    const n = Number(this.data.customMinInput);
    if (!n || n < 1 || n > 180) {
      wx.showToast({ title: "请输入 1-180 的数字", icon: "none" });
      return;
    }
    this.setData({
      countdownMinutes: n,
      tomatoTime: `${String(n).padStart(2, '0')}:00`,
      customTimeShow: false
    });
  },

  startTomato() {
    this.setData({
      tomatoRunning: true,
      tomatoStartTimestamp: Date.now()
    });
    if (this.data.tomatoModeIndex === 0) {
      let totalSeconds = this.data.countdownMinutes * 60;
      this.tomatoTimer = setInterval(() => {
        totalSeconds--;
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        this.setData({ tomatoTime: `${m}:${s}` });
        if (totalSeconds <= 0) {
          clearInterval(this.tomatoTimer);
          this.setData({ tomatoRunning: false });
          this.onTomatoComplete(this.data.countdownMinutes);
        }
      }, 1000);
    } else {
      let totalSeconds = 0;
      this.tomatoTimer = setInterval(() => {
        totalSeconds++;
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        this.setData({ tomatoTime: `${m}:${s}` });
      }, 1000);
    }
  },

  stopTomato() {
    if (this.tomatoTimer) clearInterval(this.tomatoTimer);
    const duration = Math.floor((Date.now() - this.data.tomatoStartTimestamp) / 60000);
    this.setData({ tomatoRunning: false });
    if (duration >= 30) {
      storage.addHeartValue(5, "专注学习 30 分钟");
    } else if (duration > 0) {
      wx.showToast({ title: `专注了 ${duration} 分钟`, icon: "none" });
    }
  },

  onTomatoComplete(minutes) {
    wx.vibrateLong();
    wx.showModal({
      title: "专注完成 🎉",
      content: `你已专注 ${minutes} 分钟`,
      showCancel: false,
      confirmText: "继续努力"
    });
    if (minutes >= 30) {
      storage.addHeartValue(5, `完成 ${minutes} 分钟暖圈钟`);
    } else {
      storage.addHeartValue(2, `完成 ${minutes} 分钟暖圈钟`);
    }
  },

  // 打开地图合规公告链接
  openMapInfo() {
    wx.showModal({
      title: "地图服务说明",
      content: "地图数据来自:国家地理信息公共服务平台(天地图)与标准地图服务。本页仅展示生活场所位置,不展示国界边界相关内容。",
      showCancel: false,
      confirmText: "知道了"
    });
  }
});