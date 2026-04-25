// pages/mine/messageCenter/messageCenter.js
Page({
  data: {
    activeTab: "system",
    messages: {
      system: [],
      room: [],
      interact: [],
      shop: []
    }
  },

  onShow() {
    // 模拟消息(实际要接云端)
    this.setData({
      messages: {
        system: [
          { id: 1, title: "欢迎来到暖小圈", desc: "开始你的学习之旅吧", time: "刚刚", unread: false }
        ],
        room: [],
        interact: [],
        shop: []
      }
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  clearAll() {
    wx.showToast({ title: "全部已读", icon: "success" });
  }
});
