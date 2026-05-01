// pages/ai/ai.js
// 接入腾讯云CloudBase AI（混元大模型）- 云函数安全版

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    scrollId: '',
    importPlanShow: false,
    importPlanText: '',
    lastAiContent: ''
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  quickAsk(e) {
    const q = e.currentTarget.dataset.q;
    this.setData({ inputText: q });
    setTimeout(() => this.sendMessage(), 100);
  },

  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    const aiMsgId = Date.now() + 1;
    const aiMsg = { id: aiMsgId, role: 'assistant', content: '', loading: true };

    const newMessages = [...this.data.messages, userMsg, aiMsg];
    this.setData({
      messages: newMessages,
      inputText: '',
      loading: true,
      scrollId: 'msg-' + aiMsgId
    });

    try {
      const history = this.data.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      history.push({ role: 'user', content: text });

      // 调用腾讯云CloudBase AI云函数
      const res = await wx.cloud.callFunction({
        name: 'hunyuanAI',
        data: { history }
      });

      const content = res.result?.answer || '抱歉，我暂时无法回答，请稍后再试。';
      const updated = this.data.messages.map(m =>
        m.id === aiMsgId ? { ...m, content, loading: false } : m
      );

      // 检测是否是学习计划（含有"天"、"第"、"计划"等关键词）
      const isPlan = /第\d+天|学习计划|备考计划|\d+天计划/.test(content);

      this.setData({
        messages: updated,
        loading: false,
        scrollId: 'msg-' + aiMsgId,
        importPlanShow: isPlan,
        lastAiContent: content
      });

    } catch (err) {
      console.error('AI调用失败:', err);
      const updated = this.data.messages.map(m =>
        m.id === aiMsgId ? { ...m, content: '网络错误，请检查网络后重试。（请确认已部署 hunyuanAI 云函数）', loading: false } : m
      );
      this.setData({ messages: updated, loading: false });
    }
  },

  // 一键导入学习计划到知时
  importToPlan() {
    const content = this.data.lastAiContent;
    // 把AI生成的计划存到storage，然后跳转知时页面处理
    wx.setStorageSync('pendingImportPlan', content);
    wx.showModal({
      title: '导入学习计划',
      content: '将把AI生成的计划导入到「知时」学习计划，是否继续？',
      success: res => {
        if (res.confirm) {
          this.setData({ importPlanShow: false });
          wx.switchTab({ url: '/miniprogram/pages/zhishi/zhishi' });
          wx.showToast({ title: '请在知时页面查看导入计划', icon: 'none', duration: 2500 });
        }
      }
    });
  },

  dismissImport() {
    this.setData({ importPlanShow: false });
  },

  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确认清空所有对话记录？',
      success: res => {
        if (res.confirm) this.setData({ messages: [], importPlanShow: false });
      }
    });
  }
});
