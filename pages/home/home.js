Page({
  data: {
    tabType: 'new',
    showFilter: false,
    filterDay: 0,
    cateList: [],
    cate: 0,
    list: []
  },
  switchTab(e) {
    this.setData({ tabType: e.currentTarget.dataset.type })
  },
  switchCate(e) {
    this.setData({ cate: e.currentTarget.dataset.index })
  },
  showFilter() {
    this.setData({ showFilter: true })
  },
  closeFilter() {
    this.setData({ showFilter: false })
  },
  setFilter(e) {
    const day = e.currentTarget.dataset.day
    wx.showToast({ title: `已筛选近${day}天`, icon: 'none' })
    this.setData({ showFilter: false, filterDay: day })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/post/post?id=${id}` })
  },
  goUser(e) {
    const uid = e.currentTarget.dataset.userid
    wx.navigateTo({ url: `/pages/user/user?userId=${uid}` })
  }
})