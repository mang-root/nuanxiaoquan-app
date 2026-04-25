// pages/zhishi/report/report.js
// 学习报告 / 月度报告 / 周期报告 三合一报告页

const storage = require('../../../utils/storage.js');
const dateHelper = require('../../../utils/dateHelper.js');

Page({
  data: {
    mode: "plan",           // plan / account / period
    title: "学习报告",

    // ========== 学习报告 ==========
    planReport: {
      totalMinutes: 0,
      totalTasks: 0,
      doneTasks: 0,
      completionRate: 0,
      streakDays: 0,
      weekTrend: [],        // 最近 4 周的每周总分钟
      weekTrendHeight: [],
      categoryStats: [],    // [{name, count, percent}]
      timeSlotStats: {      // 学习时段分布
        morning: 0,
        noon: 0,
        evening: 0,
        night: 0
      },
      bestDay: "—",
      bestDayMinutes: 0
    },

    // ========== 月度报告 ==========
    accountReport: {
      monthLabel: "",
      income: 0,
      expense: 0,
      balance: 0,
      incomeLastMonth: 0,
      expenseLastMonth: 0,
      dailyBars: [],         // 每天收支
      dailyBarsHeight: [],
      topCategories: [],     // Top3 支出分类
      learnInvestment: 0,
      learnInvestPercent: 0,
      maxDay: { date: "—", amount: 0 },
      minDay: { date: "—", amount: 0 }
    },

    // ========== 周期报告 ==========
    periodReport: {
      avgCycle: 28,
      lastCycles: [],        // 最近 6 次周期长度
      lastCyclesHeight: [],
      symptomRank: [],       // Top5 症状
      moodStats: [],         // 心情统计
      hasData: false
    }
  },

  onLoad(options) {
    const mode = options.mode || "plan";
    const titleMap = {
      plan: "学习报告",
      account: "月度报告",
      period: "周期报告"
    };
    wx.setNavigationBarTitle({ title: titleMap[mode] || "报告" });
    this.setData({ mode, title: titleMap[mode] });

    if (mode === "plan") this.buildPlanReport();
    else if (mode === "account") this.buildAccountReport();
    else if (mode === "period") this.buildPeriodReport();
  },

  // ==================== 学习报告 ====================
  buildPlanReport() {
    const allTasks = storage.getAllTasksMap();
    const dates = Object.keys(allTasks).sort();

    let totalMinutes = 0;
    let totalTasks = 0;
    let doneTasks = 0;
    const categoryCount = {};
    const timeSlots = { morning: 0, noon: 0, evening: 0, night: 0 };
    const dailyMinutes = {};
    let bestDay = "—", bestDayMinutes = 0;

    dates.forEach(date => {
      const tasks = allTasks[date] || [];
      totalTasks += tasks.length;
      let dayMin = 0;
      tasks.forEach(t => {
        if (t.done) {
          doneTasks++;
          const m = Number(t.duration || 0);
          totalMinutes += m;
          dayMin += m;
          // 分类
          const cat = t.category || "其他";
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          // 时段(看创建时间的小时)
          if (t.createdAt) {
            const h = new Date(t.createdAt).getHours();
            if (h < 6 || h >= 22) timeSlots.night++;
            else if (h < 11) timeSlots.morning++;
            else if (h < 14) timeSlots.noon++;
            else timeSlots.evening++;
          }
        }
      });
      dailyMinutes[date] = dayMin;
      if (dayMin > bestDayMinutes) {
        bestDayMinutes = dayMin;
        bestDay = date;
      }
    });

    // 最近 4 周
    const weekTrend = [];
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      let weekMin = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7 + d));
        const dateStr = dateHelper.format(date);
        weekMin += dailyMinutes[dateStr] || 0;
      }
      weekTrend.push(weekMin);
    }
    const maxWeek = Math.max(...weekTrend, 60);
    const weekTrendHeight = weekTrend.map(v => Math.max(6, Math.floor((v / maxWeek) * 160)));

    // 分类统计
    const categoryStats = Object.keys(categoryCount).map(name => ({
      name,
      count: categoryCount[name],
      percent: doneTasks > 0 ? Math.floor((categoryCount[name] / doneTasks) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // 连续打卡天数
    let streak = 0;
    const today = dateHelper.today();
    let checkDate = new Date(today);
    while (true) {
      const ds = dateHelper.format(checkDate);
      const hasDone = (allTasks[ds] || []).some(t => t.done);
      if (hasDone) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.setData({
      planReport: {
        totalMinutes,
        totalTasks,
        doneTasks,
        completionRate: totalTasks > 0 ? Math.floor((doneTasks / totalTasks) * 100) : 0,
        streakDays: streak,
        weekTrend,
        weekTrendHeight,
        categoryStats,
        timeSlotStats: timeSlots,
        bestDay,
        bestDayMinutes
      }
    });
  },

  // ==================== 月度报告 ====================
  buildAccountReport() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastMonthYear = month === 1 ? year - 1 : year;

    const allAccounts = storage.getAllAccountMap();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const lastPrefix = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

    let income = 0, expense = 0, lastIncome = 0, lastExpense = 0;
    const catExpense = {};
    const dailyNet = {};
    let maxDay = { date: "—", amount: 0 };
    let minDay = { date: "—", amount: 999999 };

    Object.keys(allAccounts).forEach(date => {
      const items = allAccounts[date] || [];
      let dayNet = 0;
      items.forEach(i => {
        const amt = Number(i.amount);
        if (date.startsWith(monthPrefix)) {
          if (i.type === "income") income += amt;
          else {
            expense += amt;
            catExpense[i.category] = (catExpense[i.category] || 0) + amt;
            dayNet -= amt;
          }
          if (i.type === "income") dayNet += amt;
        } else if (date.startsWith(lastPrefix)) {
          if (i.type === "income") lastIncome += amt;
          else lastExpense += amt;
        }
      });
      if (date.startsWith(monthPrefix)) {
        dailyNet[date] = dayNet;
        const absAmount = Math.abs(dayNet);
        if (absAmount > maxDay.amount) {
          maxDay = { date, amount: absAmount };
        }
        if (absAmount > 0 && absAmount < minDay.amount) {
          minDay = { date, amount: absAmount };
        }
      }
    });

    if (minDay.amount === 999999) minDay = { date: "—", amount: 0 };

    // Top3 分类
    const topCategories = Object.keys(catExpense)
      .map(name => ({ name, amount: catExpense[name].toFixed(2), percent: expense > 0 ? Math.floor((catExpense[name] / expense) * 100) : 0 }))
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 3);

    // 学习投入(category === "学习")
    const learnInvestment = catExpense["学习"] || 0;
    const learnInvestPercent = expense > 0 ? Math.floor((learnInvestment / expense) * 100) : 0;

    // 每天柱状图(本月所有天)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBars = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      dailyBars.push(dailyNet[ds] || 0);
    }
    const maxAbs = Math.max(...dailyBars.map(v => Math.abs(v)), 50);
    const dailyBarsHeight = dailyBars.map(v => ({
      height: Math.max(4, Math.floor((Math.abs(v) / maxAbs) * 120)),
      isPositive: v >= 0
    }));

    this.setData({
      accountReport: {
        monthLabel: `${year}年${month}月`,
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        balance: (income - expense).toFixed(2),
        incomeLastMonth: lastIncome.toFixed(2),
        expenseLastMonth: lastExpense.toFixed(2),
        dailyBars,
        dailyBarsHeight,
        topCategories,
        learnInvestment: learnInvestment.toFixed(2),
        learnInvestPercent,
        maxDay: { date: maxDay.date, amount: maxDay.amount.toFixed(2) },
        minDay: { date: minDay.date, amount: minDay.amount.toFixed(2) }
      }
    });
  },

  // ==================== 周期报告 ====================
  buildPeriodReport() {
    const all = storage.getAllPeriodMap();
    const dates = Object.keys(all)
      .filter(d => all[d] && all[d].flow && all[d].flow !== "无")
      .sort();

    if (dates.length === 0) {
      this.setData({ "periodReport.hasData": false });
      return;
    }

    // 把连续的经期日期聚为一次周期
    const cycles = [];
    let currentStart = dates[0];
    let prev = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const gap = (new Date(dates[i]) - new Date(prev)) / 86400000;
      if (gap > 3) {
        // 新一次周期
        const cycleLen = (new Date(dates[i]) - new Date(currentStart)) / 86400000;
        cycles.push({ start: currentStart, length: cycleLen });
        currentStart = dates[i];
      }
      prev = dates[i];
    }

    const lastCycles = cycles.slice(-6).map(c => Math.floor(c.length));
    const maxLen = Math.max(...lastCycles, 30);
    const lastCyclesHeight = lastCycles.map(v => Math.max(8, Math.floor((v / maxLen) * 140)));

    const avg = lastCycles.length > 0
      ? Math.floor(lastCycles.reduce((s, v) => s + v, 0) / lastCycles.length)
      : 28;

    // 症状统计
    const symCount = {};
    const moodCount = {};
    dates.forEach(d => {
      const r = all[d];
      (r.symptoms || []).forEach(s => {
        symCount[s] = (symCount[s] || 0) + 1;
      });
      (r.moods || []).forEach(m => {
        moodCount[m] = (moodCount[m] || 0) + 1;
      });
    });

    const symptomRank = Object.keys(symCount)
      .map(name => ({ name, count: symCount[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const moodStats = Object.keys(moodCount)
      .map(name => ({ name, count: moodCount[name] }))
      .sort((a, b) => b.count - a.count);

    this.setData({
      periodReport: {
        avgCycle: avg,
        lastCycles,
        lastCyclesHeight,
        symptomRank,
        moodStats,
        hasData: true
      }
    });
  }
});
