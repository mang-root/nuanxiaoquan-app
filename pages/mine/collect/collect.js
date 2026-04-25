const storage = require('../../../utils/storage.js');

Page({
  data: {
    activeTab: 0, // 0=帖子 1=资源 2=收藏夹
    folders: [],
    posts: [],
    resources: []
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const folders = storage.getFolders();
    const allPosts = storage.getPosts().filter(p => p.collected);
    const allResources = storage.getResources().filter(r => r.collected);
    
    this.setData({
      folders,
      posts: allPosts,
      resources: allResources
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.id });
  },

  // 新建收藏夹
  addFolder() {
    wx.showModal({
      title: '新建收藏夹',
      editable: true,
      placeholderText: '输入收藏夹名字',
      success: (res) => {
        if (res.confirm && res.content) {
          storage.addFolder(res.content);
          this.loadData();
          wx.showToast({ title: '新建成功' });
        }
      }
    });
  },

  // 长按删除收藏夹
  longPressFolder(e) {
    const id = e.currentTarget.dataset.id;
    if (id === 0) return;
    wx.showModal({
      title: '删除收藏夹',
      content: '删除后，里面的内容会移到默认收藏夹',
      success: (res) => {
        if (res.confirm) {
          storage.deleteFolder(id);
          this.loadData();
          wx.showToast({ title: '删除成功' });
        }
      }
    });
  },

  // 跳转到收藏夹详情
  goToFolderDetail(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/miniprogram/pages/mine/collect/folderDetail/folderDetail?id=${id}&name=${name}`
    });
  }
});