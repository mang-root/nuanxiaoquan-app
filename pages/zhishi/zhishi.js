// pages/zhishi/zhishi.js
// 知时 - 学习计划 / 记账 / 生理期

const storage = require('../../utils/storage.js');
const security = require('../../utils/security.js');

Page({
  data: {
    currentMode: 'plan',        // plan 学习计划 / account 记账 / period 生理期
    modeSelectorShow: false,
    showPeriodMode: false,      // 用户是否开启了生理期模式

    today: '',
    todayLabel: '',
    viewYear: 2025,
    viewMonth: 4,
    weekLabel: '',
    planCountToday: 0,
    accountCountToday: 0,

    // ===== 学习计划（板块模式）=====
    planBoards: [],              // [{id,title,color,items:[{id,text,done}],doneCount}]
    planDoneCount: 0,
    planTotalCount: 0,
    addItemInputs: {},           // {boardId: currentInputText}
    colorPickShow: false,
    colorPickBoardId: null,
    colorPickCurrentColor: '',
    boardColors: [
      '#6b9bd8', '#ff8da8', '#7dce82', '#f5a623', '#9b59b6',
      '#e74c3c', '#1abc9c', '#e67e22', '#2ecc71', '#3498db'
    ],
    planHistoryShow: false,      // 历史计划弹层
    planHistory: [],             // 最近 7 天有计划的日期

    // ===== 记账 =====
    accountList: [],             // 今日账单
    accountForm: {
      type: 'expense',           // expense / income
      amount: '',
      note: ''
    },
    accountFormShow: false,
    accountStats: {
      dayIncome: '0.00',
      dayExpense: '0.00',
      dayBalance: '0.00',
      monthIncome: '0.00',
      monthExpense: '0.00'
    },

    // ===== 生理期 =====
    periodInfo: {
      hasData: false,
      cycleDay: 0,               // 当前周期第几天
      nextPredict: '—',          // 下次预测
      daysUntilNext: 0,          // 距下次还有多少天
      lastStart: '—',            // 最近一次开始
      avgCycle: 28
    },
    periodRecordShow: false,
    periodForm: {
      flow: '中',
      pain: '无',
      bloodColor: '暗红色',
      note: ''
    },
    periodCustomCycle: 28,   // 用户自定义周期
    bloodColorOptions: ['鲜红色', '暗红色', '粉红色', '褐色', '咖啡色'],
    bloodColorTips: {
      '鲜红色': '血量偏多时段常见,建议记录',
      '暗红色': '经期中后段常见,建议记录常规状态',
      '粉红色': '血量偏少时出现,建议记录',
      '褐色': '经期前后陈旧经血排出,建议记录前后时段',
      '咖啡色': '少量经血氧化后颜色,建议记录少量出血时段'
    }
  },

  onLoad() {
    const today = this.formatToday();
    const d = new Date();
    this.setData({
      today,
      todayLabel: this.getTodayLabel(),
      viewYear: d.getFullYear(),
      viewMonth: d.getMonth() + 1,
      weekLabel: ['日','一','二','三','四','五','六'][d.getDay()]
    });
  },

  onShow() {

    // 检查是否有AI导入的计划
    const pendingPlan = wx.getStorageSync('pendingImportPlan');
    if (pendingPlan) {
      wx.removeStorageSync('pendingImportPlan');
      this.importAIPlan(pendingPlan);
    }

    const userInfo = storage.getUserInfo();
    this.setData({ showPeriodMode: userInfo.showPeriodMode === true });

    if (!userInfo.showPeriodMode && this.data.currentMode === 'period') {
      this.setData({ currentMode: 'plan' });
    }

    // 检查昨天有没有未完成的计划
    this.checkYesterdayUnfinished();
    
    this.refreshData();

    // 更新顶部计划数和记账数
    const planBoards = this._getPlanBoards(this.data.today) || [];
    const planCount = planBoards.reduce((s, b) => s + (b.items || []).length, 0);
    const accountItems = storage.getAccountItems(this.data.today) || [];
    this.setData({
      planCountToday: planCount,
      accountCountToday: accountItems.length
    });

    // 加载自定义周期
    const customCycle = wx.getStorageSync('periodCustomCycle') || 28;
    this.setData({ periodCustomCycle: customCycle });
  },

  prevMonth() {
    let { viewYear, viewMonth } = this.data;
    viewMonth--;
    if (viewMonth < 1) { viewMonth = 12; viewYear--; }
    this.setData({ viewYear, viewMonth });
  },

  nextMonth() {
    let { viewYear, viewMonth } = this.data;
    viewMonth++;
    if (viewMonth > 12) { viewMonth = 1; viewYear++; }
    this.setData({ viewYear, viewMonth });
  },

  refreshData() {
    if (this.data.currentMode === 'plan') {
      this.loadPlan();
    } else if (this.data.currentMode === 'account') {
      this.loadAccount();
    } else if (this.data.currentMode === 'period') {
      this.loadPeriod();
    }
  },

  formatToday() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  getTodayLabel() {
    const d = new Date();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekDays[d.getDay()]}`;
  },

  // =============== 下拉框切换逻辑（新增）===============
  toggleModeSelector() {
    this.setData({ modeSelectorShow: !this.data.modeSelectorShow });
  },

  chooseMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.currentMode) {
      this.setData({ modeSelectorShow: false });
      return;
    },
    if (mode === 'period' && !this.data.showPeriodMode) {
      wx.showModal({
        title: '生理期模式未开启',
        content: '请在「我的 → 设置」中开启后再使用',
        showCancel: false
      });
      return;
    }
    this.setData({
      currentMode: mode,
      modeSelectorShow: false
    });
    this.refreshData();
  },

  // =============== 学习计划（板块模式）===============
  _getPlanBoards(dateStr) {
    const all = wx.getStorageSync('planBoards') || {};
    return all[dateStr] || null;
  },

  _savePlanBoards(dateStr, boards) {
    const all = wx.getStorageSync('planBoards') || {};
    all[dateStr] = boards;
    wx.setStorageSync('planBoards', all);
    // 同步到旧格式，保障 mine.js 的学习统计可用
    const allTasks = boards.flatMap(b => b.items);
    storage.saveTasks(dateStr, allTasks.map((t, i) => ({
      id: t.id || Date.now() + i,
      text: t.text,
      title: t.text,
      done: t.done,
      duration: 30
    })));
  },

  _annotateBoards(boards) {
    let totalDone = 0, totalAll = 0;
    const annotated = (boards || []).map(b => {
      const doneCount = (b.items || []).filter(t => t.done).length;
      totalDone += doneCount;
      totalAll += (b.items || []).length;
      return { ...b, doneCount };
    });
    return { boards: annotated, totalDone, totalAll };
  },

  loadPlan() {
    let boards = this._getPlanBoards(this.data.today);
    // 迁移：若无新格式但有旧任务，转成单板块
    if (!boards) {
      const oldTasks = storage.getTasks(this.data.today) || [];
      if (oldTasks.length > 0) {
        boards = [{
          id: Date.now(),
          title: '今日计划',
          color: '#6b9bd8',
          items: oldTasks.map((t, i) => ({ id: t.id || Date.now() + i, text: t.text || t.title || '', done: !!t.done }))
        }];
        this._savePlanBoards(this.data.today, boards);
      } else {
        boards = [];
      }
    }
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll, addItemInputs: {} });
  },

  // ---- 板块管理 ----
  addBoard() {
    const colors = this.data.boardColors;
    const color = colors[this.data.planBoards.length % colors.length];
    const newBoard = { id: Date.now(), title: '新板块', color, items: [] };
    const boards = [...this.data.planBoards.map(b => ({ ...b })), newBoard];
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
  },

  deleteBoard(e) {
    const boardId = e.currentTarget.dataset.boardid;
    wx.showModal({
      title: '删除板块',
      content: '板块及其所有任务将被删除',
      confirmText: '删除',
      success: (res) => {
        if (!res.confirm) return;
        const boards = this.data.planBoards.filter(b => b.id !== boardId);
        this._savePlanBoards(this.data.today, boards);
        const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
        this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
      }
    });
  },

  onBoardTitleInput(e) {
    const { boardid, boardindex } = e.currentTarget.dataset;
    this.setData({ [`planBoards[${boardindex}].title`]: e.detail.value });
    this._pendingTitleBoardId = boardid;
    this._pendingTitleValue = e.detail.value;
    this._pendingTitleIndex = boardindex;
  },

  onBoardTitleBlur(e) {
    if (this._pendingTitleBoardId == null) return;
    const boards = this.data.planBoards.map(b =>
      b.id === this._pendingTitleBoardId ? { ...b, title: this._pendingTitleValue || '板块' } : b
    );
    this._savePlanBoards(this.data.today, boards);
    this._pendingTitleBoardId = null;
  },

  // ---- 颜色选择 ----
  openColorPicker(e) {
    const boardId = e.currentTarget.dataset.boardid;
    const board = this.data.planBoards.find(b => b.id === boardId);
    this.setData({ colorPickShow: true, colorPickBoardId: boardId, colorPickCurrentColor: board ? board.color : '' });
  },

  closeColorPicker() {
    this.setData({ colorPickShow: false, colorPickBoardId: null });
  },

  pickColor(e) {
    const color = e.currentTarget.dataset.color;
    const boardId = this.data.colorPickBoardId;
    const boards = this.data.planBoards.map(b => b.id === boardId ? { ...b, color } : b);
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll, colorPickShow: false, colorPickBoardId: null });
  },

  // ---- 任务操作 ----
  toggleTask(e) {
    const { boardid, taskid } = e.currentTarget.dataset;
    let wasUndone = false;
    const boards = this.data.planBoards.map(b => {
      if (b.id !== boardid) return b;
      const items = b.items.map(t => {
        if (t.id !== taskid) return t;
        wasUndone = !t.done;
        return { ...t, done: !t.done };
      });
      return { ...b, items };
    });
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
    if (wasUndone) storage.addHeartValue(5, '完成学习计划');
  },

  onNewItemInput(e) {
    const boardId = e.currentTarget.dataset.boardid;
    this.setData({ [`addItemInputs.${boardId}`]: e.detail.value });
  },

  addTaskToBoard(e) {
    const boardId = e.currentTarget.dataset.boardid;
    const text = (this.data.addItemInputs[boardId] || '').trim();
    if (!text) return;
    const newTask = { id: Date.now(), text, done: false };
    const boards = this.data.planBoards.map(b => {
      if (b.id !== boardId) return b;
      return { ...b, items: [...b.items, newTask] };
    });
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll, [`addItemInputs.${boardId}`]: '' });
  },

  deleteTask(e) {
    const { boardid, taskid } = e.currentTarget.dataset;
    const boards = this.data.planBoards.map(b => {
      if (b.id !== boardid) return b;
      return { ...b, items: b.items.filter(t => t.id !== taskid) };
    });
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
  },

  moveTaskToNext(e) {
    const { boardid, taskid, boardindex } = e.currentTarget.dataset;
    const idx = Number(boardindex);
    if (idx >= this.data.planBoards.length - 1) return;
    const boards = this.data.planBoards.map((b, i) => ({ ...b, items: b.items.slice() }));
    const fromBoard = boards[idx];
    const taskIdx = fromBoard.items.findIndex(t => t.id === taskid);
    if (taskIdx === -1) return;
    const [task] = fromBoard.items.splice(taskIdx, 1);
    boards[idx + 1].items.push({ ...task, done: false });
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
  },

  moveAllDoneToNext(e) {
    const idx = Number(e.currentTarget.dataset.boardindex);
    if (idx >= this.data.planBoards.length - 1) return;
    const boards = this.data.planBoards.map((b, i) => ({ ...b, items: b.items.slice() }));
    const done = boards[idx].items.filter(t => t.done);
    boards[idx].items = boards[idx].items.filter(t => !t.done);
    boards[idx + 1].items.push(...done.map(t => ({ ...t, done: false })));
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
    wx.showToast({ title: `已移 ${done.length} 项`, icon: 'none' });
  },

  // ---- 触摸滑动完成 ----
  onTaskTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._touchBoardId = e.currentTarget.dataset.boardid;
    this._touchTaskId = e.currentTarget.dataset.taskid;
    this._touchDone = e.currentTarget.dataset.done;
  },

  onTaskTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - this._touchStartX;
    const dy = Math.abs(endY - this._touchStartY);
    // 水平右滑 > 60px 且垂直偏移 < 30px：切换完成状态
    if (dx > 60 && dy < 30) {
      const boards = this.data.planBoards.map(b => {
        if (b.id !== this._touchBoardId) return b;
        const items = b.items.map(t => {
          if (t.id !== this._touchTaskId) return t;
          const wasUndone = !t.done;
          if (wasUndone) storage.addHeartValue(5, '完成学习计划');
          return { ...t, done: !t.done };
        });
        return { ...b, items };
      });
      this._savePlanBoards(this.data.today, boards);
      const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
      this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll });
    }
  },

  // ---- 历史计划 ----
  openHistoryPlan() {
    // 先从新格式找历史
    const allNew = wx.getStorageSync('planBoards') || {};
    const allOld = storage.getAllTasksMap();
    const allDates = new Set([...Object.keys(allNew), ...Object.keys(allOld)]);
    const dates = [...allDates]
      .filter(d => d !== this.data.today)
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, 10);

    const history = dates.map(d => {
      const boards = allNew[d];
      if (boards && boards.length > 0) {
        const allItems = boards.flatMap(b => b.items);
        if (allItems.length === 0) return null;
        return { date: d, preview: allItems.slice(0, 3).map(t => t.text).join(' / '), count: allItems.length };
      }
      const tasks = allOld[d] || [];
      if (tasks.length === 0) return null;
      return { date: d, preview: tasks.slice(0, 3).map(t => t.text || t.title).join(' / '), count: tasks.length };
    }).filter(Boolean);

    if (history.length === 0) {
      wx.showToast({ title: '暂无历史计划', icon: 'none' });
      return;
    }
    this.setData({ planHistory: history, planHistoryShow: true });
  },

  closeHistoryPlan() {
    this.setData({ planHistoryShow: false });
  },

  useHistoryPlan(e) {
    const date = e.currentTarget.dataset.date;
    const allNew = wx.getStorageSync('planBoards') || {};
    let items = [];
    if (allNew[date] && allNew[date].length > 0) {
      items = allNew[date].flatMap(b => b.items).map(t => ({ id: Date.now() + Math.random(), text: t.text, done: false }));
    } else {
      const tasks = storage.getAllTasksMap()[date] || [];
      items = tasks.map((t, i) => ({ id: Date.now() + i, text: t.text || t.title || '', done: false }));
    },
    if (items.length === 0) { wx.showToast({ title: '那天没内容', icon: 'none' }); return; }

    // 追加到第一个板块，如没有则新建
    let boards = this.data.planBoards.map(b => ({ ...b, items: b.items.slice() }));
    if (boards.length === 0) {
      boards = [{ id: Date.now(), title: '历史载入', color: '#6b9bd8', items }];
    } else {
      boards[0].items = [...boards[0].items, ...items];
    }
    this._savePlanBoards(this.data.today, boards);
    const { boards: annotated, totalDone, totalAll } = this._annotateBoards(boards);
    this.setData({ planBoards: annotated, planDoneCount: totalDone, planTotalCount: totalAll, planHistoryShow: false });
    wx.showToast({ title: `已载入 ${items.length} 条`, icon: 'none' });
  },

  // 检查昨天未完成任务弹窗
  checkYesterdayUnfinished() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yesterday = `${y}-${m}-${day}`;

    const tasks = storage.getTasks(yesterday) || [];
    const unfinished = tasks.filter(t => !t.done);
    if (unfinished.length === 0) return;

    // 已经提示过了就不再提示
    const flagKey = `checked_unfinished_${yesterday}`;
    if (wx.getStorageSync(flagKey)) return;
    wx.setStorageSync(flagKey, true);

    wx.showModal({
      title: '昨天有 ' + unfinished.length + ' 个计划未完成',
      content: '没关系的,把它们移到今天继续,还是放下?',
      confirmText: '移到今天',
      cancelText: '没关系,放下啦 +2',
      success: (res) => {
        if (res.confirm) {
          // 移到今天
          const today = this.data.today;
          const todayTasks = storage.getTasks(today) || [];
          const merged = [...todayTasks, ...unfinished.map(t => ({
            ...t, id: Date.now() + Math.random(), done: false
          }))];
          storage.saveTasks(today, merged);
          this.loadPlan && this.loadPlan();
          wx.showToast({ title: '已移到今天', icon: 'success' });
        } else {
          // 放下 + 2 暖心值
          storage.addHeartValue(2, '学会放下,自我关怀');
          wx.showToast({ title: '学会放下也是成长', icon: 'none', duration: 2500 });
        }
      }
    });
  },

  // =============== 记账 ===============
  loadAccount() {
    const items = storage.getAccountItems(this.data.today) || [];
    this.setData({ accountList: items });
    this.computeAccountStats();
  },

  computeAccountStats() {
    const items = this.data.accountList;
    let dayIncome = 0, dayExpense = 0;
    items.forEach(i => {
      if (i.type === 'income') dayIncome += Number(i.amount);
      else dayExpense += Number(i.amount);
    });

    const d = new Date();
    const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const allMap = storage.getAllAccountMap();
    let monthIncome = 0, monthExpense = 0;
    Object.keys(allMap).forEach(date => {
      if (date.startsWith(monthPrefix)) {
        (allMap[date] || []).forEach(i => {
          if (i.type === 'income') monthIncome += Number(i.amount);
          else monthExpense += Number(i.amount);
        });
      }
    });

    this.setData({
      accountStats: {
        dayIncome: dayIncome.toFixed(2),
        dayExpense: dayExpense.toFixed(2),
        dayBalance: (dayIncome - dayExpense).toFixed(2),
        monthIncome: monthIncome.toFixed(2),
        monthExpense: monthExpense.toFixed(2)
      }
    });
  },

  openAccountForm() {
    this.setData({
      accountFormShow: true,
      accountForm: {
        type: 'expense',
        amount: '',
        note: ''
      }
    });
  },

  closeAccountForm() {
    this.setData({ accountFormShow: false });
  },

  onAccountType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'accountForm.type': type });
  },

  onAccountAmount(e) {
    this.setData({ 'accountForm.amount': e.detail.value });
  },

  onAccountNote(e) {
    this.setData({ 'accountForm.note': e.detail.value });
  },

  saveAccount() {
    const { type, amount, note } = this.data.accountForm;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      wx.showToast({ title: '请填写金额', icon: 'none' });
      return;
    }

    const items = this.data.accountList.slice();
    items.unshift({
      id: Date.now(),
      type,
      amount: amt,
      note: note || (type === 'income' ? '收入' : '支出'),
      createdAt: new Date().toISOString()
    });
    storage.saveAccountItems(this.data.today, items);
    this.setData({
      accountList: items,
      accountFormShow: false
    });
    this.computeAccountStats();
    storage.addHeartValue(1, '记账一笔');
  },

  deleteAccountItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除',
      content: '确认删除这条记录?',
      success: (res) => {
        if (res.confirm) {
          const items = this.data.accountList.filter(i => i.id !== id);
          storage.saveAccountItems(this.data.today, items);
          this.setData({ accountList: items });
          this.computeAccountStats();
        }
      }
    });
  },

  // =============== 生理期(完善版) ===============
  loadPeriod() {
    const allMap = storage.getAllPeriodMap();
    // 只取有流量记录的日期(表示真正有过经期)
    const periodDates = Object.keys(allMap)
      .filter(d => allMap[d] && allMap[d].flow && allMap[d].flow !== '无')
      .sort();

    if (periodDates.length === 0) {
      this.setData({
        periodInfo: {
          hasData: false, phase: '', phaseDay: 0,
          cycleDay: 0, nextPredict: '—', daysUntilNext: 0,
          lastStart: '—', avgCycle: 28, avgPeriod: 5,
          ovulationDay: '—', ovulationStart: '—', ovulationEnd: '—',
          todayTip: '', todayAdvice: '', anomalyTip: ''
        }
      });
      return;
    }

    // ===== 聚合为若干次周期 =====
    const cycles = []; // [{start, end, length}]
    let cycleStart = periodDates[0];
    let prev = periodDates[0];
    for (let i = 1; i < periodDates.length; i++) {
      const gap = (new Date(periodDates[i]) - new Date(prev)) / 86400000;
      if (gap > 2) {
        // 上一次经期结束
        const periodLen = Math.round((new Date(prev) - new Date(cycleStart)) / 86400000) + 1;
        cycles.push({ start: cycleStart, end: prev, periodLen });
        cycleStart = periodDates[i];
      }
      prev = periodDates[i];
    }
    // 最后一次(可能还没结束)
    const lastPeriodLen = Math.round((new Date(prev) - new Date(cycleStart)) / 86400000) + 1;
    cycles.push({ start: cycleStart, end: prev, periodLen: lastPeriodLen });

    // ===== 平均经期长度 =====
    const completedCycles = cycles.slice(0, -1); // 排除最后一次(可能还没结束)
    const avgPeriod = completedCycles.length > 0
      ? Math.round(completedCycles.slice(-3).reduce((s, c) => s + c.periodLen, 0) / Math.min(completedCycles.length, 3))
      : 5;

    // ===== 平均周期长度(两次经期首日间隔) =====
    let avgCycle = wx.getStorageSync('periodCustomCycle') || 28;
    if (cycles.length >= 2) {
      const gaps = [];
      for (let i = 1; i < cycles.length; i++) {
        const g = Math.round((new Date(cycles[i].start) - new Date(cycles[i-1].start)) / 86400000);
        if (g > 10 && g < 60) gaps.push(g);
      },
      if (gaps.length > 0) {
        const recent = gaps.slice(-3);
        avgCycle = Math.round(recent.reduce((s, v) => s + v, 0) / recent.length);
      }
    }

    const lastCycle = cycles[cycles.length - 1];
    const lastStart = lastCycle.start;
    const today = this.data.today;
    const todayDate = new Date(today);
    const lastStartDate = new Date(lastStart);
    const daysSinceLast = Math.round((todayDate - lastStartDate) / 86400000);

    // ===== 下次月经预测 =====
    const nextStartDate = new Date(lastStart);
    nextStartDate.setDate(nextStartDate.getDate() + avgCycle);
    const nextPredict = this.dateToStr(nextStartDate);
    const daysUntilNext = Math.round((nextStartDate - todayDate) / 86400000);

    // ===== 排卵日预测(下次经期首日 - 14天) =====
    const ovulationDate = new Date(nextStartDate);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const ovulationDay = this.dateToStr(ovulationDate);
    const ovStartDate = new Date(ovulationDate); ovStartDate.setDate(ovStartDate.getDate() - 5);
    const ovEndDate = new Date(ovulationDate); ovEndDate.setDate(ovEndDate.getDate() + 4);
    const ovulationStart = this.dateToStr(ovStartDate);
    const ovulationEnd = this.dateToStr(ovEndDate);

    // ===== 当前所处阶段 =====
    const periodEndDate = new Date(lastStart);
    periodEndDate.setDate(periodEndDate.getDate() + avgPeriod - 1);

    let phase = '', phaseDay = 0, todayTip = '', todayAdvice = '';

    if (todayDate <= periodEndDate) {
      phase = '月经期';
      phaseDay = daysSinceLast + 1;
      todayTip = `今天是你经期第 ${phaseDay} 天,激素水平处于低位,容易疲惫、注意力不集中都是正常的。`;
      todayAdvice = '记得做好保暖,久坐每隔1小时起来走走,学不动就用暖停额度好好休息 💗';
    } else if (todayDate < ovStartDate) {
      phase = '卵泡期';
      phaseDay = Math.round((todayDate - periodEndDate) / 86400000);
      todayTip = `今天是你卵泡期第 ${phaseDay} 天,雌激素持续回升,精力和专注力都在线 ✨`;
      todayAdvice = '很适合安排重难点学习、制定新的学习计划,稳步前进超棒的！';
    } else if (todayDate <= ovEndDate) {
      phase = '排卵期';
      phaseDay = Math.round((todayDate - ovStartDate) / 86400000) + 1;
      todayTip = `今天是你排卵期第 ${phaseDay} 天,身体状态平稳,专注力在线。`;
      todayAdvice = '很适合刷题、整理笔记、复盘近期学习内容，按自己的节奏来就好 📝';
    } else {
      phase = '黄体期';
      phaseDay = Math.round((todayDate - ovEndDate) / 86400000) + 1;
      todayTip = `今天是你黄体期第 ${phaseDay} 天,孕激素变化可能让你容易情绪波动、乏力犯困。`;
      todayAdvice = '不用对自己太苛刻,学习计划可以适当减量,累了就歇会 🌸';
    }

    // ===== 异常检测 =====
    let anomalyTip = '';
    if (daysUntilNext < 0 && Math.abs(daysUntilNext) >= 3 && Math.abs(daysUntilNext) < 7) {
      anomalyTip = `月经已比预测晚了 ${Math.abs(daysUntilNext)} 天，作息、压力、情绪都会影响周期，偶尔波动是正常的，不用焦虑 🌿`;
    } else if (daysUntilNext < 0 && Math.abs(daysUntilNext) >= 7) {
      anomalyTip = `月经已比预测晚了 ${Math.abs(daysUntilNext)} 天，若持续推迟建议关注一下身体状态，规律作息、减少压力 💛`;
    }

    // ===== 经前提醒 =====
    let prePeriodTip = '';
    if (daysUntilNext > 0 && daysUntilNext <= 7) {
      prePeriodTip = `还有 ${daysUntilNext} 天就到预计经期啦，孕激素变化可能让你容易疲惫或情绪烦躁，这些都是正常的，已为你预备好暖停额度 💕`;
    }

    this.setData({
      periodInfo: {
        hasData: true,
        phase, phaseDay,
        cycleDay: daysSinceLast + 1,
        nextPredict, daysUntilNext,
        lastStart, avgCycle, avgPeriod,
        ovulationDay, ovulationStart, ovulationEnd,
        todayTip, todayAdvice,
        anomalyTip, prePeriodTip
      }
    });
  },

  dateToStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  openPeriodRecord() {
    const existing = storage.getPeriodRecord(this.data.today);
    this.setData({
      periodRecordShow: true,
      periodForm: existing ? {
        flow: existing.flow || '中',
        pain: existing.pain || '无',
        bloodColor: existing.bloodColor || '暗红色',
        note: existing.note || ''
      } : {
        flow: '中',
        pain: '无',
        bloodColor: '暗红色',
        note: ''
      }
    });
  },

  closePeriodRecord() {
    this.setData({ periodRecordShow: false });
  },

  onPeriodFlow(e) {
    this.setData({ 'periodForm.flow': e.currentTarget.dataset.val });
  },

  onPeriodPain(e) {
    this.setData({ 'periodForm.pain': e.currentTarget.dataset.val });
  },

  onBloodColorChange(e) {
    this.setData({ 'periodForm.bloodColor': e.currentTarget.dataset.val });
  },

  onCustomCycleInput(e) {
    const val = Number(e.detail.value);
    if (val >= 21 && val <= 45) {
      this.setData({ periodCustomCycle: val });
      wx.setStorageSync('periodCustomCycle', val);
    }
  },

  onPeriodNote(e) {
    this.setData({ 'periodForm.note': e.detail.value });
  },

  savePeriod() {
    const form = this.data.periodForm;
    const existing = storage.getPeriodRecord(this.data.today);
    storage.savePeriodRecord(this.data.today, {
      flow: form.flow,
      pain: form.pain,
      bloodColor: form.bloodColor || '暗红色',
      note: form.note
    });
    this.setData({ periodRecordShow: false });
    if (!existing) {
      storage.addHeartValue(3, '生理期记录');
    }
    this.loadPeriod();
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  importAIPlan(text) {
    // 解析AI生成的学习计划文本，提取板块和任务
    const lines = text.split('\n').filter(l => l.trim());
    const boards = [];
    let currentBoard = null;
    const colors = ['#6b9bd8','#ff8da8','#7dce82','#f5a623','#9b59b6'];

    lines.forEach(line => {
      const trimmed = line.trim();
      // 识别板块标题：第X天/大板块/主题行
      if (/^(第\d+天|Day\s*\d+|\d+\.|[一二三四五六七八九十]+、|\*\*[^*]+\*\*|#+\s)/.test(trimmed) && !currentBoard) {
        const title = trimmed.replace(/^[\d#*一二三四五六七八九十、.\s]+/, '').replace(/\*\*/g, '').trim() || trimmed;
        currentBoard = { id: 'ai_' + Date.now() + '_' + boards.length, title: title.substring(0, 15), color: colors[boards.length % colors.length], items: [], doneCount: 0 };
        boards.push(currentBoard);
      } else if (currentBoard && /^[-•·*✦\d]/.test(trimmed) && trimmed.length > 2) {
        // 识别任务项
        const taskText = trimmed.replace(/^[-•·*✦\d.、]\s*/, '').trim();
        if (taskText.length > 1 && taskText.length < 50) {
          currentBoard.items.push({ id: 'task_' + Date.now() + '_' + Math.random(), text: taskText, done: false });
        }
      } else if (trimmed.length > 4 && !currentBoard) {
        // 兜底：作为默认板块
        if (boards.length === 0) {
          currentBoard = { id: 'ai_default_' + Date.now(), title: 'AI导入计划', color: '#6b9bd8', items: [], doneCount: 0 };
          boards.push(currentBoard);
        }
      }
    });

    if (boards.length === 0) {
      // 没有识别到结构，创建一个总板块
      boards.push({
        id: 'ai_single_' + Date.now(),
        title: 'AI学习计划',
        color: '#6b9bd8',
        items: [{ id: 'task_' + Date.now(), text: 'AI计划已导入，请手动整理', done: false }],
        doneCount: 0
      });
    }

    // 合并到当前计划
    const existing = this.data.planBoards || [];
    const merged = [...existing, ...boards];
    this.setData({ planBoards: merged, currentMode: 'plan' });
    this._savePlanBoards(this.data.today, merged);
    this._recalcProgress(merged);
    wx.showToast({ title: `已导入 ${boards.length} 个板块`, icon: 'none' });
  },

});