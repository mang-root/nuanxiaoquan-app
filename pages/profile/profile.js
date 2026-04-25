Page({
  data: {
    level: 1,
    exp: 5,
    nextExp: 20,
    levelName: '小萌芽',
    showReward: false,

    taskList: [
      {id:1,title:'每日登录',exp:2},
      {id:2,title:'记录生理期',exp:10},
      {id:3,title:'发布帖子',exp:5},
      {id:4,title:'学习打卡',exp:8},
    ],

    periodCount: 3,
    studyCount: 12,
    postCount: 5,

    rewardList: [
      {level:1,reward:'新手头像框'},
      {level:2,reward:'浅粉主题+多人房间'},
      {level:3,reward:'小花发帖气泡'},
      {level:4,reward:'浅紫主题'},
      {level:5,reward:'浅蓝主题+自定义背景'},
      {level:6,reward:'自习室挂件'},
      {level:7,reward:'专属昵称框'},
      {level:8,reward:'浅绿主题'},
      {level:9,reward:'星光头像框'},
      {level:10,reward:'满级称号'},
    ]
  },

  showLevelReward() {
    this.setData({ showReward: true })
  },
  closeReward() {
    this.setData({ showReward: false })
  },

  

  clearData() {
    wx.showToast({ 
      title: '已清空本地数据', 
      icon: 'success' 
    })
  }
})