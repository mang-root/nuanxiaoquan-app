// utils/imageHelper.js
// 图片选择统一封装 - 新接口 wx.chooseMedia,已废弃 wx.chooseImage

const security = require('./security.js');

/**
 * 选择图片 + 内容安全检查
 * @param {Object} opts
 * @param {number} opts.count 最多选几张(微信上限9,业务上限自己定)
 * @param {number} opts.maxSize 单张最大字节数,默认 2MB
 * @returns {Promise<string[]>} 通过检查的 tempFilePaths
 */
function chooseAndCheck(opts = {}) {
  const count = opts.count || 3;
  const maxSize = opts.maxSize || 2 * 1024 * 1024; // 2MB

  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: Math.min(count, 9),
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      camera: 'back',
      success: async (res) => {
        // 检查大小
        const tempFiles = res.tempFiles || [];
        for (const f of tempFiles) {
          if (f.size > maxSize) {
            wx.showToast({
              title: `有图片超过${Math.floor(maxSize / 1024 / 1024)}MB,已忽略`,
              icon: 'none'
            });
            reject(new Error("image too large"));
            return;
          }
        }

        const paths = tempFiles.map(f => f.tempFilePath);

        // 安全检查
        wx.showLoading({ title: '审核中...', mask: true });
        const check = await security.checkImages(paths);
        wx.hideLoading();

        if (!check.pass) {
          wx.showToast({
            title: check.reason || '图片含不允许内容',
            icon: 'none'
          });
          reject(new Error("security fail"));
          return;
        }

        resolve(paths);
      },
      fail: (err) => {
        // 用户取消不提示
        if (err.errMsg && err.errMsg.includes('cancel')) {
          reject(new Error("cancel"));
          return;
        }
        reject(err);
      }
    });
  });
}

module.exports = {
  chooseAndCheck
};
