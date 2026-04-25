// pages/shop/goodsDetail/goodsDetail.js
const storage = require('../../../utils/storage.js');

Page({
  data: {
    resource: null,
    createdTime: ""
  },

  onLoad(options) {
    this.resId = Number(options.id);
    this.loadResource();
  },

  onShow() {
    if (this.resId) this.loadResource();
  },

  loadResource() {
    const r = storage.getResource(this.resId);
    if (!r) {
      this.setData({ resource: null });
      return;
    }
    this.setData({
      resource: r,
      createdTime: this.formatTime(r.createdAt)
    });
  },

  formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.resource.images,
      current: url
    });
  },

  toggleCollect() {
    storage.toggleResourceCollect(this.resId);
    this.loadResource();
  },

  reportResource() {
    wx.showActionSheet({
      itemList: ['举报:引流广告', '举报:盗版侵权', '举报:违法违规'],
      success: () => {
        wx.showToast({ title: '已收到,会尽快处理', icon: 'none' });
      }
    });
  }
});
