// utils/storage.js
// 本地存储统一封装
const db = wx.cloud.database();
const _ = db.command;
const levelConfig = require('./levelConfig.js');

// =============== 用户 ===============
function getUserInfo() {
  const u = wx.getStorageSync("userInfo");
  if (u) return u;
  const init = {
    avatar: "",
    avatarColor: "#FFD4DF",
    nickname: "同学",
    heartValue: 0,
    level: 1,
    levelName: "新序",
    showPeriodMode: false,
    signature: "",
    joinDate: new Date().toISOString().split("T")[0],

    gender: "保密"//默认保密
  };
  wx.setStorageSync("userInfo", init);
  return init;
}

function setUserInfo(info) {
  wx.setStorageSync("userInfo", info);
}

function addHeartValue(value, reason) {
  const user = getUserInfo();
  const oldLevel = user.level || 1;
  user.heartValue = (user.heartValue || 0) + value;
  const newLv = levelConfig.getLevelByHeart(user.heartValue);
  user.level = newLv.level;
  user.levelName = newLv.name;
  setUserInfo(user);
  addHeartLog(value, reason);

  if (newLv.level > oldLevel) {
    setTimeout(() => {
      wx.showModal({
        title: "升级啦",
        content: `恭喜升到 ${newLv.level} 级「${newLv.name}」`,
        showCancel: false,
        confirmText: "看看奖励",
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: "/miniprogram/pages/mine/levelDetail/levelDetail" });
          }
        }
      });
    }, 200);
  } else {
    wx.showToast({
      title: `+${value} 暖心值`,
      icon: "none",
      duration: 1200
    });
  }
}

function addHeartLog(value, reason) {
  const logs = wx.getStorageSync("heartLogs") || [];
  logs.unshift({
    value,
    reason: reason || "完成任务",
    time: Date.now()
  });
  if (logs.length > 200) logs.length = 200;
  wx.setStorageSync("heartLogs", logs);
}

function getHeartLogs() {
  return wx.getStorageSync("heartLogs") || [];
}

// =============== 学习任务 ===============
function getTasks(dateStr) {
  const all = wx.getStorageSync("tasks") || {};
  return all[dateStr] || [];
}

function saveTasks(dateStr, tasks) {
  const all = wx.getStorageSync("tasks") || {};
  all[dateStr] = tasks;
  wx.setStorageSync("tasks", all);
}

function getAllTasksMap() {
  return wx.getStorageSync("tasks") || {};
}

// =============== 账单 ===============
function getAccountItems(dateStr) {
  const all = wx.getStorageSync("accounts") || {};
  return all[dateStr] || [];
}

function saveAccountItems(dateStr, items) {
  const all = wx.getStorageSync("accounts") || {};
  all[dateStr] = items;
  wx.setStorageSync("accounts", all);
}

function getAllAccountMap() {
  return wx.getStorageSync("accounts") || {};
}

// =============== 生理期 ===============
function getPeriodRecord(dateStr) {
  const all = wx.getStorageSync("periods") || {};
  return all[dateStr] || null;
}

function savePeriodRecord(dateStr, record) {
  const all = wx.getStorageSync("periods") || {};
  all[dateStr] = record;
  wx.setStorageSync("periods", all);
}

function getAllPeriodMap() {
  return wx.getStorageSync("periods") || {};
}

// =============== 帖子 ===============
function getPosts() {
  return wx.getStorageSync("posts") || [];
}

function addPost(post) {
  const posts = getPosts();
  posts.unshift(post);
  wx.setStorageSync("posts", posts);
}

function updatePost(id, patch) {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx > -1) {
    posts[idx] = { ...posts[idx], ...patch };
    wx.setStorageSync("posts", posts);
    return posts[idx];
  }
  return null;
}

function deletePost(id) {
  const posts = getPosts().filter(p => p.id !== id);
  wx.setStorageSync("posts", posts);
}

function getPost(id) {
  return getPosts().find(p => p.id === id);
}

function togglePostLike(id) {
  const posts = getPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  p.liked = !p.liked;
  p.likeCount = (p.likeCount || 0) + (p.liked ? 1 : -1);
  if (p.likeCount < 0) p.likeCount = 0;
  wx.setStorageSync("posts", posts);
}

function togglePostCollect(id) {
  const posts = getPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  p.collected = !p.collected;
  p.collectCount = (p.collectCount || 0) + (p.collected ? 1 : -1);
  if (p.collectCount < 0) p.collectCount = 0;
  wx.setStorageSync("posts", posts);
}

function addComment(postId, comment) {
  const posts = getPosts();
  const p = posts.find(x => x.id === postId);
  if (!p) return;
  p.comments = p.comments || [];
  p.comments.push(comment);
  p.commentCount = p.comments.length;
  wx.setStorageSync("posts", posts);
}

// =============== 小馆资源 ===============
function getResources() {
  return wx.getStorageSync("resources") || [];
}

function addResource(res) {
  const all = getResources();
  all.unshift(res);
  wx.setStorageSync("resources", all);
}

function updateResource(id, patch) {
  const all = getResources();
  const idx = all.findIndex(r => r.id === id);
  if (idx > -1) {
    all[idx] = { ...all[idx], ...patch };
    wx.setStorageSync("resources", all);
  }
}

function getResource(id) {
  return getResources().find(r => r.id === id);
}

function toggleResourceCollect(id) {
  const all = getResources();
  const r = all.find(x => x.id === id);
  if (!r) return;
  r.collected = !r.collected;
  r.collectCount = (r.collectCount || 0) + (r.collected ? 1 : -1);
  if (r.collectCount < 0) r.collectCount = 0;
  wx.setStorageSync("resources", all);
}

// =============== 房间(前端模拟,无真实后端) ===============
function getRooms() {
  return wx.getStorageSync("rooms") || [];
}

function setRooms(rooms) {
  wx.setStorageSync("rooms", rooms);
}

// =============== 只获取我收藏的别人的内容 ===============
function getCollectedOthersPosts() {
  const myNickname = getUserInfo().nickname || "同学";
  return getPosts().filter(p => p.collected && p.authorNickname !== myNickname);
}

function getCollectedOthersResources() {
  const myNickname = getUserInfo().nickname || "同学";
  return getResources().filter(r => r.collected && r.authorNickname !== myNickname);
}

// =============== 只获取我发布的内容 ===============
function getMyPosts() {
  const myNickname = getUserInfo().nickname || "同学";
  return getPosts().filter(p => p.authorNickname === myNickname);
}

function getMyResources() {
  const myNickname = getUserInfo().nickname || "同学";
  return getResources().filter(r => r.authorNickname === myNickname);
}

module.exports = {
  getUserInfo,
  setUserInfo,
  addHeartValue,
  addHeartLog,
  getHeartLogs,
  getTasks,
  saveTasks,
  getAllTasksMap,
  getAccountItems,
  saveAccountItems,
  getAllAccountMap,
  getPeriodRecord,
  savePeriodRecord,
  getAllPeriodMap,
  getPosts,
  addPost,
  updatePost,
  deletePost,
  getPost,
  togglePostLike,
  togglePostCollect,
  addComment,
  getResources,
  addResource,
  updateResource,
  getResource,
  toggleResourceCollect,
  getRooms,
  setRooms,

  getCollectedOthersPosts,
  getCollectedOthersResources,
  getMyPosts,
  getMyResources
};
