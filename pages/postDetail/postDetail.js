// pages/postDetail/postDetail.js
const storage = require('../../utils/storage.js');
const security = require('../../utils/security.js');

Page({
  data: {
    post: null,
    comments: [],
    commentCount: 0,
    createdTime: "",
    commentSheetShow: false,
    commentInput: ""
  },

  onLoad(options) {
    const id = Number(options.id);
    this.postId = id;
    this.loadPost();
  },

  onShow() {
    if (this.postId) this.loadPost();
  },

  loadPost() {
    const post = storage.getPost(this.postId);
    if (!post) {
      this.setData({ post: null });
      return;
    }
    const comments = post.comments || [];
    this.setData({
      post,
      comments,
      commentCount: comments.length,
      createdTime: this.formatTime(post.createdAt)
    });
  },

  formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day} ${h}:${min}`;
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.post.images,
      current: url
    });
  },

  likePost() {
    storage.togglePostLike(this.postId);
    this.loadPost();
  },

  collectPost() {
    storage.togglePostCollect(this.postId);
    this.loadPost();
  },

  reportPost() {
    wx.showActionSheet({
      itemList: ['举报:广告引流', '举报:违法违规', '举报:不友善'],
      success: () => {
        wx.showToast({ title: '已收到,会尽快处理', icon: 'none' });
      }
    });
  },

  collectAuthor() {
    wx.showToast({ title: '已收藏作者', icon: 'success' });
  },

  openCommentInput() {
    this.setData({ commentSheetShow: true, commentInput: "" });
  },

  closeCommentInput() {
    this.setData({ commentSheetShow: false });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  async submitComment() {
    const content = (this.data.commentInput || "").trim();
    if (!content) {
      wx.showToast({ title: '说点什么吧', icon: 'none' });
      return;
    }
    const check = await security.checkText(content);
    if (!check.pass) {
      wx.showToast({ title: check.reason || '含不允许内容', icon: 'none' });
      return;
    }

    const user = storage.getUserInfo();
    storage.addComment(this.postId, {
      id: Date.now(),
      nickname: user.nickname || "同学",
      avatarColor: user.avatarColor || "#D4E4FF",
      content,
      time: Date.now()
    });
    this.setData({ commentSheetShow: false, commentInput: "" });
    this.loadPost();
    wx.showToast({ title: '评论成功', icon: 'success' });
  }
});
