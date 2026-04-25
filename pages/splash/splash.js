Page({
  onLoad() {
    // 动画播完再跳首页，体验更顺
    setTimeout(() => {
      wx.switchTab({
        url: "/pages/home/home"
      })
    }, 2800);
  }
})