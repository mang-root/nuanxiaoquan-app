// app.js (根目录)
App({
  onLaunch() {

    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库")
    } else {
      wx.cloud.init({
        env: "cloudbase-d2ga5ex1wd094efb3",
        traceUser: true
      })
    }
    //以上调用云开发
    const warmValue = wx.getStorageSync('warmValue') || 0;
    const level = this.calculateLevel(warmValue);
    
    this.globalData.warmValue = warmValue;
    this.globalData.level = level;

    // 把 config 里的配置同步一份到 globalData,方便各页面用 app.globalData.xxx 读取
    this.globalData.shopCategories = this.config.shopCategories;
    this.globalData.topicList = this.config.topicList;

    // ================== 主题初始化（你要求添加的） ==================
    const gender = wx.getStorageSync('userGender') || 'female';
    if (gender === 'male') {
      // 微信小程序不能直接操作 class,用全局变量存,页面自己读
      this.globalData.theme = 'male';
    } else {
      this.globalData.theme = 'female';
    }
    // =================================================================
  },

  calculateLevel(warmValue) {
    const levels = [
      { level: 1, name: '新序', value: 0 },
      { level: 2, name: '待苞', value: 30 },
      { level: 3, name: '初绽', value: 100 },
      { level: 4, name: '栖暖', value: 250 },
      { level: 5, name: '温行', value: 500 },
      { level: 6, name: '晴和', value: 900 },
      { level: 7, name: '风叙', value: 1500 },
      { level: 8, name: '向煦', value: 2500 },
      { level: 9, name: '揽星', value: 4000 },
      { level: 10, name: '暖小圈', value: 6500 }
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (warmValue >= levels[i].value) {
        return levels[i];
      }
    }
    return levels[0];
  },

  globalData: {
    userInfo: null,
    warmValue: 0,
    level: { level: 1, name: '新序', value: 0 },
    todayStudyTime: 0,
    continuousCheckIn: 0,
    theme: 'female'  // 你要求添加的主题默认值
  },

  config: {
    topicList: [
      '全部', '考研', '四六级', '考公', '考证',
      '高考', '中考', '语言学习', '学习方法', '求助问答'
    ],
    // 小馆资源分类(4 个精简分类 + 全部)
    shopCategories: [
      { id: 0, name: '全部' },
      { id: 1, name: '笔记' },
      { id: 2, name: '资料' },
      { id: 3, name: '心得' },
      { id: 4, name: '其他' }
    ],
    expenseCategories: [
      '餐饮', '交通', '购物', '娱乐', '学习',
      '医疗', '通讯', '居住', '其他支出'
    ],
    incomeCategories: [
      '生活费', '兼职', '奖学金', '红包', '其他收入'
    ],
    periodSymptoms: [
      '无', '腹痛', '腰酸', '乏力', '头痛',
      '乳房胀痛', '情绪波动', '失眠', '食欲不振'
    ],
    tomatoOptions: [15, 25, 45, 60, 90]
  }
});