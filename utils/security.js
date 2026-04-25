// utils/security.js
// 微信内容安全 API 的封装 - 所有用户输入文字/图片在提交前都必须过一遍
// 注意:这些接口需要在云函数里调用,前端只负责触发
// 本文件先提供前端友好的提示文案 + 云函数调用封装

/**
 * 检查文字内容是否合规
 * @param {string} content 要检查的文字
 * @returns {Promise<{ pass: boolean, reason?: string }>}
 */
function checkText(content) {
  return new Promise((resolve) => {
    if (!content || content.trim().length === 0) {
      resolve({ pass: true });
      return;
    }

    // 先做一个简单的前端敏感词粗筛(真实项目要放在服务端,这里只做兜底)
    const localBlacklist = [
      // 常见引流词
      "加v", "加微信", "扣扣", "qq群", "私聊",
      // 商业违规
      "代购", "代发", "返现"
    ];
    const lowerContent = content.toLowerCase();
    for (const word of localBlacklist) {
      if (lowerContent.includes(word)) {
        resolve({
          pass: false,
          reason: "内容含不允许的关键词,请修改后重试"
        });
        return;
      }
    }

    // 真实项目要调用云函数做 msgSecCheck
    // wx.cloud.callFunction({
    //   name: 'checkText',
    //   data: { content },
    //   success: res => resolve(res.result),
    //   fail: () => resolve({ pass: false, reason: "审核服务异常,请稍后再试" })
    // });

    // 开发阶段先默认通过(接入云函数后去掉这行)
    resolve({ pass: true });
  });
}

/**
 * 检查图片是否合规
 * @param {string} filePath 本地临时路径
 * @returns {Promise<{ pass: boolean, reason?: string }>}
 */
function checkImage(filePath) {
  return new Promise((resolve) => {
    if (!filePath) {
      resolve({ pass: true });
      return;
    }

    // 真实项目要调用云函数做 imgSecCheck
    // wx.cloud.callFunction({
    //   name: 'checkImage',
    //   data: { filePath },
    //   success: res => resolve(res.result),
    //   fail: () => resolve({ pass: false, reason: "图片审核异常,请稍后再试" })
    // });

    // 开发阶段先默认通过
    resolve({ pass: true });
  });
}

/**
 * 批量检查图片
 */
async function checkImages(filePaths) {
  for (const p of filePaths) {
    const result = await checkImage(p);
    if (!result.pass) {
      return result;
    }
  }
  return { pass: true };
}

/**
 * 综合检查(文字+图片)
 */
async function checkAll({ text, images = [] }) {
  if (text) {
    const t = await checkText(text);
    if (!t.pass) return t;
  }
  if (images.length) {
    const i = await checkImages(images);
    if (!i.pass) return i;
  }
  return { pass: true };
}

module.exports = {
  checkText,
  checkImage,
  checkImages,
  checkAll
};
