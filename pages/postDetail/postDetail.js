// pages/postDetail/postDetail.js
Page({
  data: {
    post: {},
    isOfficial: false
  },

  onLoad(options) {
    const id = Number(options.id);
    const isOfficial = options.official === '1';
    
    if (isOfficial) {
      const posts = wx.getStorageSync('officialPosts') || [];
      const post = posts.find(p => p.id === id) || {};
      this.setData({
        post: { ...post, dateStr: post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '' },
        isOfficial: true
      });
    } else {
      // Private note detail
      const notes = wx.getStorageSync('privateNotes') || [];
      const note = notes.find(n => n.id === id) || {};
      this.setData({
        post: { ...note, dateStr: note.createdAt ? new Date(note.createdAt).toLocaleDateString('zh-CN') : '' }
      });
    }
  }
});
