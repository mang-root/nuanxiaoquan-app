Page({
  data: {
    userId: null,
    isMe: true,
    tab: 0,
    user: {
      nickname: '星星',
      level: 3,
      sign: '温柔且坚定',
      postNum: 12,
      likeNum: 320,
      favNum: 46
    },
    list: [
      { id: 2, content: '肚子有点不舒服，想躺平', private: true },
      { id: 3, content: '分享四级词汇', private: false }
    ]
  },

  onLoad(options) {
    this.setData({ userId: options.userId })
  },

  setTab(e) {
    this.setData({ tab: e.currentTarget.dataset.i })
  },

  goPost(e) {
    wx.navigateTo({ url: '/pages/post/post?id='+e.currentTarget.dataset.id })
  },

  setPrivacy() {
    wx.showModal({
      title: '隐私设置',
      content: '设置后仅自己可见',
      confirmText: '设为私密',
      success: () => {
        wx.showToast({ title: '已设置' })
      }
    })
  }
})