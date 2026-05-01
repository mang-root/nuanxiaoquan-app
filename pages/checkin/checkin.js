// pages/checkin/checkin.js
Page({
  data: {
    history: [],
    streakDays: 0,
    totalDays: 0
  },
  onLoad() { this.loadHistory(); },
  onShow() { this.loadHistory(); },
  loadHistory() {
    const raw = wx.getStorageSync('checkinHistory') || [];
    const history = raw.map(item => {
      const d = new Date(item.date);
      const moodColors = {
        '愉悦': '#ffe8ee', '平静': '#f5f1eb', '低落': '#e8f2fb',
        '亢奋': '#fff0e8', '焦虑': '#f3eafb', '松弛': '#edf8f0',
        '专注': '#e8f8f6', '高效': '#e4f7ef', '摸鱼': '#f1f1f3'
      };
      return {
        ...item,
        dateLabel: `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`,
        weekLabel: ['日','一','二','三','四','五','六'][d.getDay()],
        color: moodColors[item.mood] || '#f5f5f5'
      };
    });
    // 计算连续打卡天数
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    for (let i = 0; i < history.length; i++) {
      const expected = checkDate.toISOString().split('T')[0];
      if (history[i].date === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else { break; }
    }
    this.setData({ history, streakDays: streak, totalDays: history.length });
  },
  goBack() { wx.navigateBack(); }
});
