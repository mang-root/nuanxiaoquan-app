// pages/index/index.js
const storage = require('../../utils/storage.js');
const security = require('../../utils/security.js');

Page({
  data: {
    tabType: 'new',         // new 最新 / hot 热门
    showFilter: false,
    filterDay: 0,

    cateList: ['知学', '心安', ' 烟火'],
    cate: -1,               // -1 表示"全部",其他是 cateList 的下标

    list: [],

    // 发帖弹层
    publishShow: false,
    publishForm: {
      title: '',
      content: '',
      images: [],
      cateIndex: 0,
      privateOnly: false    // 仅自己可见
    }
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  loadList() {
    const me = storage.getUserInfo();
    let all = storage.getPosts();

    // 过滤私密帖:私密帖只有作者自己能看
    all = all.filter(p => {
      if (p.privateOnly) {
        return p.authorNickname === me.nickname;
      }
      return true;
    });

    // 分类过滤
    if (this.data.cate >= 0) {
      const catName = this.data.cateList[this.data.cate];
      all = all.filter(p => p.categoryName === catName);
    }

    // 时间过滤
    if (this.data.filterDay > 0) {
      const cutoff = Date.now() - this.data.filterDay * 86400000;
      all = all.filter(p => (p.createdAt || 0) >= cutoff);
    }

    // 排序
    if (this.data.tabType === 'hot') {
      all.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else {
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    this.setData({ list: all });
  },

  switchTab(e) {
    this.setData({ tabType: e.currentTarget.dataset.type });
    this.loadList();
  },

  switchCate(e) {
    const idx = e.currentTarget.dataset.index;
    // 再点一次取消选中
    this.setData({ cate: this.data.cate === idx ? -1 : idx });
    this.loadList();
  },

  showFilter() {
    this.setData({ showFilter: true });
  },

  closeFilter() {
    this.setData({ showFilter: false });
  },

  setFilter(e) {
    const day = Number(e.currentTarget.dataset.day);
    this.setData({ showFilter: false, filterDay: day });
    wx.showToast({ title: day === 0 ? '全部' : `近${day}天`, icon: 'none' });
    this.loadList();
  },

  clearFilter() {
    this.setData({ showFilter: false, filterDay: 0 });
    this.loadList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/miniprogram/pages/postDetail/postDetail?id=${id}`
    });
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

  likeCard(e) {
    const id = e.currentTarget.dataset.id;
    storage.togglePostLike(id);
    this.loadList();
  },

  // ========== 发帖 ==========
  openPublish() {
    this.setData({
      publishShow: true,
      publishForm: {
        title: '',
        content: '',
        images: [],
        cateIndex: 0,
        privateOnly: false
      }
    });
  },

  closePublish() {
    this.setData({ publishShow: false });
  },

  onPubTitle(e) {
    this.setData({ 'publishForm.title': e.detail.value });
  },

  onPubContent(e) {
    this.setData({ 'publishForm.content': e.detail.value });
  },

  onPubCate(e) {
    this.setData({ 'publishForm.cateIndex': Number(e.detail.value) });
  },

  onPubPrivateChange(e) {
    this.setData({ 'publishForm.privateOnly': e.detail.value });
  },

  choosePubImages() {
    const current = this.data.publishForm.images;
    const remain = 3 - current.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多 3 张', icon: 'none' });
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
          'publishForm.images': [...current, ...paths].slice(0, 3)
        });
      }
    });
  },

  removePubImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const imgs = this.data.publishForm.images.slice();
    imgs.splice(idx, 1);
    this.setData({ 'publishForm.images': imgs });
  },

  async submitPost() {
    const f = this.data.publishForm;
    if (!f.content.trim()) {
      wx.showToast({ title: '说点什么吧', icon: 'none' });
      return;
    }

    // 内容安全检查
    wx.showLoading({ title: '发布中...', mask: true });
    const check = await security.checkAll({
      text: (f.title || '') + '\n' + f.content,
      images: f.images
    });
    wx.hideLoading();
    if (!check.pass) {
      wx.showToast({ title: check.reason || '含不允许内容', icon: 'none' });
      return;
    }

    const user = storage.getUserInfo();
    storage.addPost({
      id: Date.now(),
      title: f.title.trim(),
      content: f.content.trim(),
      images: f.images.slice(),
      categoryName: this.data.cateList[f.cateIndex],
      privateOnly: f.privateOnly,
      authorNickname: user.nickname || '同学',
      authorAvatarColor: user.avatarColor || '#FFD4DF',
      authorLevelName: user.levelName || '新序',
      authorLevel: user.level || 1,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      liked: false,
      collected: false,
      createdAt: Date.now()
    });

    // 私密帖不加暖心值(因为是给自己的)
    if (!f.privateOnly) {
      storage.addHeartValue(10, '发布帖子');
    }

    this.setData({ publishShow: false });
    this.loadList();
    wx.showToast({
      title: f.privateOnly ? '已保存到私密' : '发布成功',
      icon: 'success'
    });
  }
});