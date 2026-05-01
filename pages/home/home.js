// pages/home/home.js
const storage = require('../../utils/storage.js');
const dateHelper = require('../../utils/dateHelper.js');

Page({
  data: {
    dailyQuote: { text: '学习的最大敌人不是懒惰，而是无效努力。', author: '暖小圈' },
    quoteLoading: false,
    checkinShow: false,
    todayMood: '',
    moodList: [
      { label: '愉悦', color: '#ffe8ee' },
      { label: '平静', color: '#f5f1eb' },
      { label: '低落', color: '#e8f2fb' },
      { label: '亢奋', color: '#fff0e8' },
      { label: '焦虑', color: '#f3eafb' },
      { label: '松弛', color: '#edf8f0' },
      { label: '专注', color: '#e8f8f6' },
      { label: '高效', color: '#e4f7ef' },
      { label: '摸鱼', color: '#f1f1f3' }
    ],
    checkinHistory: [],
    hotResources: [],
    hotResourcesLoading: false,
    todaySummary: { totalMin: 0, streak: 0 }
  },

  onLoad() {
    this.loadDailyQuote();
  },

  onShow() {
    const todayKey = 'mood_' + new Date().toISOString().split('T')[0];
    this.setData({ todayMood: wx.getStorageSync(todayKey) || '' });
    this.loadCheckinHistory();
    this.loadHotResources();
    this.loadTodaySummary();
  },

  // ── 每日语录 ──
  // 优先读 Storage 里的 quotes（你用爬虫导入的），没有才用内置备用
  _fallbackQuotes: [
    { text: '学习的最大敌人不是懒惰，而是无效努力。', author: '暖小圈' },
    { text: '你今天的坚持，是明天底气的来源。', author: '暖小圈' },
    { text: '每一个努力的早晨，都值得被认真对待。', author: '暖小圈' },
    { text: '慢慢来，比较快。专注当下，超越昨天。', author: '暖小圈' },
    { text: '不要和别人比进度，要和昨天的自己比成长。', author: '暖小圈' },
    { text: '目标不是终点，而是让你每天有理由出发的方向。', author: '暖小圈' },
    { text: '学习是一场马拉松，节奏比爆发更重要。', author: '暖小圈' },
    { text: '认真对待每一个小习惯，它们终将成就大改变。', author: '暖小圈' },
    { text: '休息不是放弃，而是为了走更远的路。', author: '暖小圈' },
    { text: '你的努力，时间都看见了。', author: '暖小圈' }
  ],

  loadDailyQuote() {
    // 读 Storage 里导入的 quotes（爬虫生成的）
    const imported = wx.getStorageSync('quotes') || [];
    const pool = imported.length > 0 ? imported : this._fallbackQuotes;
    // 按日期固定当天的语录，每天自动换一条
    const today = new Date().toISOString().split('T')[0];
    // 用日期字符串生成一个稳定的 index，同一天始终显示同一条
    const seed = today.replace(/-/g, '') | 0;
    const idx = seed % pool.length;
    this.setData({ dailyQuote: pool[idx] });
  },

  refreshQuote() {
    this.setData({ quoteLoading: true });
    try {
      wx.cloud.database().collection('quotes').where({}).limit(20).get({
        success: res => {
          if (res.data && res.data.length > 0) {
            const q = res.data[Math.floor(Math.random() * res.data.length)];
            this.setData({ dailyQuote: { text: q.text, author: q.author || '暖小圈' }, quoteLoading: false });
          } else {
            this.loadDailyQuote();
            this.setData({ quoteLoading: false });
          }
        },
        fail: () => { this.loadDailyQuote(); this.setData({ quoteLoading: false }); }
      });
    } catch (e) { this.loadDailyQuote(); this.setData({ quoteLoading: false }); }
  },

  // ── 打卡 ──
  openCheckin() { this.setData({ checkinShow: true }); },
  closeCheckin() { this.setData({ checkinShow: false }); },

  selectMood(e) {
    const label = e.currentTarget.dataset.label;
    const today = new Date().toISOString().split('T')[0];
    const todayKey = 'mood_' + today;
    const isFirst = wx.getStorageSync('lastCheckinDay') !== today;
    wx.setStorageSync(todayKey, label);
    if (isFirst) {
      wx.setStorageSync('lastCheckinDay', today);
      let history = wx.getStorageSync('checkinHistory') || [];
      history.unshift({ date: today, mood: label, ts: Date.now() });
      if (history.length > 60) history = history.slice(0, 60);
      wx.setStorageSync('checkinHistory', history);
      if (typeof storage.addHeartValue === 'function') storage.addHeartValue(2, '每日情绪打卡');
      wx.showToast({ title: '打卡成功 +2 暖心值', icon: 'none' });
    } else {
      let history = wx.getStorageSync('checkinHistory') || [];
      if (history.length > 0 && history[0].date === today) { history[0].mood = label; wx.setStorageSync('checkinHistory', history); }
      wx.showToast({ title: '心情已更新：' + label, icon: 'none' });
    }
    this.setData({ todayMood: label, checkinShow: false });
    this.loadCheckinHistory();
  },

  loadCheckinHistory() {
    const history = wx.getStorageSync('checkinHistory') || [];
    const recent = history.slice(0, 7).map(item => {
      const d = new Date(item.date);
      return { ...item, dayLabel: (d.getMonth() + 1) + '/' + d.getDate() };
    });
    this.setData({ checkinHistory: recent });
  },

  // ── 热门资源（按点击量+收藏量排序）──
  loadHotResources() {
    this.setData({ hotResourcesLoading: true });
    try {
      let all = storage.getResources();
      all = all.map(r => ({
        ...r,
        score: (r.clickCount || 0) * 1 + (r.collectCount || 0) * 2
      })).sort((a, b) => b.score - a.score).slice(0, 10);
      this.setData({ hotResources: all, hotResourcesLoading: false });
    } catch (e) {
      this.setData({ hotResourcesLoading: false });
    }
  },

  // ── 今日学习概览 ──
  loadTodaySummary() {
    try {
      const tasksMap = storage.getAllTasksMap();
      let totalMin = 0;
      Object.keys(tasksMap).forEach(d => {
        (tasksMap[d] || []).forEach(t => { if (t.done) totalMin += Number(t.duration || 0); });
      });
      const today = new Date().toISOString().split('T')[0];
      let streak = 0;
      let check = new Date(today);
      while (true) {
        const ds = check.toISOString().split('T')[0];
        const hasDone = (tasksMap[ds] || []).some(t => t.done);
        if (hasDone) { streak++; check.setDate(check.getDate() - 1); } else break;
      }
      this.setData({ todaySummary: { totalMin, streak } });
    } catch (e) {}
  },

  // ── 跳转 ──
  gotoCheckinHistory() { wx.navigateTo({ url: '/miniprogram/pages/checkin/checkin' }); },
  gotoAI() { wx.navigateTo({ url: '/miniprogram/pages/ai/ai' }); },
  gotoShop() { wx.switchTab({ url: '/miniprogram/pages/shop/shop' }); },
  gotoZhishi() { wx.switchTab({ url: '/miniprogram/pages/zhishi/zhishi' }); },
  gotoResourceDetail(e) {
    // 记录点击量
    const id = e.currentTarget.dataset.id;
    const all = storage.getResources();
    const r = all.find(x => x.id == id);
    if (r) {
      r.clickCount = (r.clickCount || 0) + 1;
      wx.setStorageSync('resources', all);
    }
    wx.navigateTo({ url: `/miniprogram/pages/shop/goodsDetail/goodsDetail?id=${id}` });
  }
});
