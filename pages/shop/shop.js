// pages/shop/shop.js
const app = getApp();
const storage = require('../../utils/storage.js');
const security = require('../../utils/security.js');

Page({
  data: {
    activeCate: 0,
    categories: [],
    leftColumn: [],
    rightColumn: [],
    searchKeyword: "",

    publishSheetShow: false,
    publishForm: {
      title: "",
      content: "",
      images: [],
      category: "笔记"
    }
  },

  onLoad() {
    this.setData({
      categories: app.globalData.shopCategories || [
        { id: 0, name: "全部" },
        { id: 1, name: "笔记" },
        { id: 2, name: "资料" },
        { id: 3, name: "心得" },
        { id: 4, name: "其他" }
      ]
    });
    this.loadResources();
  },

  onShow() {
    this.loadResources();
  },

  loadResources() {
    let all = storage.getResources();
    // 按分类过滤
    if (this.data.activeCate !== 0) {
      const cat = this.data.categories.find(c => c.id === this.data.activeCate);
      if (cat) {
        all = all.filter(r => r.category === cat.name);
      }
    }
    // 搜索
    const kw = (this.data.searchKeyword || "").trim().toLowerCase();
    if (kw) {
      all = all.filter(r =>
        (r.title && r.title.toLowerCase().includes(kw)) ||
        (r.content && r.content.toLowerCase().includes(kw))
      );
    }
    const left = [], right = [];
    all.forEach((r, i) => {
      if (i % 2 === 0) left.push(r);
      else right.push(r);
    });
    this.setData({ leftColumn: left, rightColumn: right });
  },

  switchCate(e) {
    this.setData({ activeCate: e.currentTarget.dataset.id });
    this.loadResources();
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    this.loadResources();
  },

  clearSearch() {
    this.setData({ searchKeyword: "" });
    this.loadResources();
  },

  gotoDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/miniprogram/pages/shop/goodsDetail/goodsDetail?id=${id}`
    });
  },

  toggleCollect(e) {
    const id = e.currentTarget.dataset.id;
    storage.toggleResourceCollect(id);
    this.loadResources();
  },

  // 发布
  openPublishSheet() {
    this.setData({
      publishSheetShow: true,
      "publishForm.title": "",
      "publishForm.content": "",
      "publishForm.images": [],
      "publishForm.category": ""    // 空,强制用户自己选
    });
    
  },
  

  closePublishSheet() {
    this.setData({ publishSheetShow: false });
  },

  onPubTitle(e) {
    this.setData({ "publishForm.title": e.detail.value });
  },

  onPubContent(e) {
    this.setData({ "publishForm.content": e.detail.value });
  },

  onPubCategory(e) {
    const names = ["笔记", "资料", "心得", "其他"];
    this.setData({ "publishForm.category": names[e.detail.value] });
  },

  chooseImages() {
    const current = this.data.publishForm.images;
    const remain = 5 - current.length;
    if (remain <= 0) {
      wx.showToast({ title: "最多 5 张", icon: "none" });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const paths = (res.tempFiles || []).map(f => f.tempFilePath);
        this.setData({
          "publishForm.images": [...current, ...paths].slice(0, 5)
        });
      }
    });
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const imgs = this.data.publishForm.images.slice();
    imgs.splice(idx, 1);
    this.setData({ "publishForm.images": imgs });
  },

  gotoAuthorProfile(e) {
    const { nickname, color } = e.currentTarget.dataset;
    const me = storage.getUserInfo();
    if (nickname === (me.nickname || '同学')) {
      wx.navigateTo({ url: '/miniprogram/pages/userProfile/userProfile?self=1' });
    } else {
      wx.navigateTo({ url: `/miniprogram/pages/userProfile/userProfile?nickname=${encodeURIComponent(nickname)}&color=${encodeURIComponent(color || '#FFD4DF')}` });
    }
  },

  async submitResource() {
    const { title, content, images, category } = this.data.publishForm;
    if (!title.trim()) {
      wx.showToast({ title: "请填写标题", icon: "none" });
      return;
    }
    if (!category) {
      wx.showToast({ title: "请选择分类", icon: "none" });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: "请填写说明", icon: "none" });
      return;
    }

    wx.showLoading({ title: "审核中..." });
    const check = await security.checkAll({ text: title + "\n" + content, images });
    wx.hideLoading();
    if (!check.pass) {
      wx.showToast({ title: check.reason || "含不允许内容", icon: "none" });
      return;
    }

    const user = storage.getUserInfo();
    storage.addResource({
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      images: images.slice(),
      category,
      authorNickname: user.nickname || "同学",
      authorAvatarColor: user.avatarColor || "#FFD4DF",
      authorLevelName: user.levelName || "新序",
      collectCount: 0,
      downloadCount: 0,
      collected: false,
      createdAt: Date.now()
    });

    storage.addHeartValue(15, "分享学习资源");

    this.setData({ publishSheetShow: false });
    this.loadResources();
    wx.showToast({ title: "分享成功", icon: "success" });
  }
});
