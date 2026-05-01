Page({
  onLoad() {
    setTimeout(() => {
      wx.switchTab({ url: '/miniprogram/pages/home/home' });
    }, 2800);
  }
});
