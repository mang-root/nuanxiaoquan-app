// pages/studyroom/match/match.js
const storage = require('../../../utils/storage.js');

Page({
  data: {
    studyTypeOptions: ['不限', '中小学', '高中', '大学', '考研', '考证', '职场技能', '其他学习'],
    genderOptions: ['不限', '男', '女'],
    studyTypeIndex: 0,
    genderIndex: 0,

    matchStatus: 'idle',
    matchCountdown: 0,
    matchedUser: null,
    dots: ''
  },

  onUnload() {
    this._clearTimers();
  },

  onStudyTypeChange(e) {
    this.setData({ studyTypeIndex: Number(e.detail.value) });
  },

  onGenderChange(e) {
    this.setData({ genderIndex: Number(e.detail.value) });
  },

  startMatch() {
    this.setData({ matchStatus: 'searching', matchCountdown: 30, dots: '' });

    // 省略号动画
    const dotList = ['', '。', '。。', '。。。'];
    let dotIdx = 0;
    this._dotTimer = setInterval(() => {
      dotIdx = (dotIdx + 1) % 4;
      this.setData({ dots: dotList[dotIdx] });
    }, 500);

    // 倒计时
    this._countdownTimer = setInterval(() => {
      const left = this.data.matchCountdown - 1;
      if (left <= 0) {
        this._clearTimers();
        this.setData({ matchStatus: 'timeout' });
        return;
      }
      this.setData({ matchCountdown: left });
    }, 1000);

    // 模拟匹配:3-8秒随机找到
    const delay = (3 + Math.random() * 5) * 1000;
    this._matchTimer = setTimeout(() => {
      this._clearTimers();
      const mockNames = ['考研小队员', '背单词的兔子', '刷题达人', '学习打卡者', '专注学习ing'];
      const mockColors = ['#FFD4DF', '#D4E4FF', '#FFE8D0', '#D4EDD6', '#E0D4FF'];
      const idx = Math.floor(Math.random() * mockNames.length);
      const studyTypes = this.data.studyTypeOptions;
      const matchedUser = {
        nickname: mockNames[idx],
        avatarColor: mockColors[idx],
        studyType: studyTypes[Math.floor(Math.random() * (studyTypes.length - 1)) + 1],
        levelName: ['新序', '待苞', '初绽', '栖暖', '温行'][Math.floor(Math.random() * 5)]
      };
      this.setData({ matchStatus: 'found', matchedUser });
    }, delay);
  },

  cancelMatch() {
    this._clearTimers();
    this.setData({ matchStatus: 'idle', dots: '' });
  },

  retryMatch() {
    this.setData({ matchStatus: 'idle', dots: '' });
  },

  enterRoom() {
    this._clearTimers();
    const user = storage.getUserInfo();
    const matched = this.data.matchedUser;
    const rooms = storage.getRooms();
    const newRoom = {
      id: Date.now(),
      name: `${user.nickname} & ${matched.nickname}`,
      topic: this.data.studyTypeOptions[this.data.studyTypeIndex] === '不限'
        ? '自由学习' : this.data.studyTypeOptions[this.data.studyTypeIndex],
      currentNum: 2,
      maxNum: 2,
      password: '',
      ownerNickname: user.nickname || '同学',
      ownerAvatarColor: user.avatarColor || '#FFD4DF',
      isMine: true,
      isMatch: true,
      matchedUser: matched
    };
    storage.setRooms([newRoom, ...rooms]);
    wx.redirectTo({
      url: `/miniprogram/pages/studyroom/roomDetail/roomDetail?roomId=${newRoom.id}`
    });
  },

  _clearTimers() {
    if (this._dotTimer) clearInterval(this._dotTimer);
    if (this._countdownTimer) clearInterval(this._countdownTimer);
    if (this._matchTimer) clearTimeout(this._matchTimer);
    this._dotTimer = null;
    this._countdownTimer = null;
    this._matchTimer = null;
  }
});