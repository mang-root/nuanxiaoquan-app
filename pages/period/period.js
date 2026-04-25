// pages/period/period.js
Page({
  onLoad() {
    wx.showModal({
      title: "功能位置调整",
      content: "生理期记录已合并到「知时」日历中,请在「我的」-「设置」里开启生理期模式后使用。",
      showCancel: false,
      success: () => {
        wx.switchTab({
          url: '/miniprogram/pages/zhishi/zhishi'
        });
      }
    });
  }
});
