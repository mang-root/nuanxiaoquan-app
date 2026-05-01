// ============================================================
// 文件：screens/mine_screen.dart
// 作用：「我的」页面 - 个人中心
// 包含：
//   - 顶部：头像 + 双等级徽章
//   - 中部：记账助手 / 备忘录 / 生理期（仅女性可见）入口
//   - 下部：我的发布 / 我的收藏 / 我的点赞
//   - 底部：设置入口
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../controllers/app_controller.dart';
import '../widgets/level_badge.dart'; // 等级徽章组件

class MineScreen extends StatelessWidget {
  const MineScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Get.find 找到之前注入的全局控制器
    final controller = Get.find<AppController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('我的'),
        actions: [
          // 右上角设置按钮
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Get.toNamed('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ===================================================
            // 1. 顶部个人信息区
            // ===================================================
            _buildProfileHeader(context, controller),

            SizedBox(height: 12.h),

            // ===================================================
            // 2. 双等级详情卡片
            // ===================================================
            _buildLevelCard(context, controller),

            SizedBox(height: 12.h),

            // ===================================================
            // 3. 核心功能入口
            // ===================================================
            _buildFunctionGrid(context, controller),

            SizedBox(height: 12.h),

            // ===================================================
            // 4. 我的内容管理
            // ===================================================
            _buildMyContentSection(context),

            SizedBox(height: 12.h),

            // ===================================================
            // 5. 其他设置区
            // ===================================================
            _buildSettingsSection(context, controller),

            SizedBox(height: 40.h), // 底部留白
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------
  // 1. 顶部个人信息区
  // -------------------------------------------------------
  Widget _buildProfileHeader(BuildContext context, AppController controller) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 20.h),
      color: Colors.white,
      child: Obx(() => Row(
        children: [
          // 头像（可点击进入个人主页）
          GestureDetector(
            onTap: () => Get.toNamed('/profile'),
            child: CircleAvatar(
              radius: 30.r,
              backgroundImage: controller.currentUserAvatar.value.isNotEmpty
                  ? NetworkImage(controller.currentUserAvatar.value)
                  : null,
              child: controller.currentUserAvatar.value.isEmpty
                  ? Icon(Icons.person, size: 30.sp, color: Colors.white)
                  : null,
              backgroundColor: Theme.of(context).primaryColor,
            ),
          ),

          SizedBox(width: 16.w),

          // 昵称 + 等级徽章
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 昵称
                Text(
                  controller.isLoggedIn
                      ? controller.currentUserName.value
                      : '点击登录',
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 6.h),
                // 双等级徽章（并排显示）
                Row(
                  children: [
                    // 星途学阶等级
                    LevelBadge(
                      level: controller.studyLevel.value,
                      type: LevelType.study, // 学习等级
                    ),
                    SizedBox(width: 8.w),
                    // 知源贡献等级
                    LevelBadge(
                      level: controller.contributeLevel.value,
                      type: LevelType.contribute, // 贡献等级
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 右箭头（进入个人主页）
          Icon(Icons.chevron_right, color: Colors.grey[400]),
        ],
      )),
    );
  }

  // -------------------------------------------------------
  // 2. 双等级详情卡片
  // -------------------------------------------------------
  Widget _buildLevelCard(BuildContext context, AppController controller) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16.w),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Obx(() => Column(
        children: [
          // 星途学阶等级行
          _buildLevelRow(
            context,
            title: '⭐ 星途学阶',
            subtitle: '日常学习 / 打卡专属等级',
            level: controller.studyLevel.value,
            currentExp: controller.studyExp.value,
            // 星途学阶每级所需经验（升级快，门槛低）
            nextLevelExp: _getStudyNextLevelExp(controller.studyLevel.value),
            color: Colors.amber,
          ),
          SizedBox(height: 16.h),
          Divider(height: 1.h, color: Colors.grey.shade100),
          SizedBox(height: 16.h),
          // 知源贡献等级行
          _buildLevelRow(
            context,
            title: '📚 知源贡献',
            subtitle: '发布学习资源专属等级（更难升）',
            level: controller.contributeLevel.value,
            currentExp: controller.contributeExp.value,
            // 知源贡献每级所需经验（比学阶高30%以上）
            nextLevelExp: _getContributeNextLevelExp(controller.contributeLevel.value),
            color: Colors.deepPurple,
          ),
        ],
      )),
    );
  }

  // 单行等级展示（进度条）
  Widget _buildLevelRow(
    BuildContext context, {
    required String title,
    required String subtitle,
    required int level,
    required int currentExp,
    required int nextLevelExp,
    required Color color,
  }) {
    // 计算进度百分比（0.0 ~ 1.0）
    final progress = nextLevelExp > 0
        ? (currentExp / nextLevelExp).clamp(0.0, 1.0)
        : 1.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontSize: 14.sp, fontWeight: FontWeight.w600)),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 11.sp, color: Colors.grey[500])),
                ],
              ),
            ),
            // 等级数字
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20.r),
              ),
              child: Text(
                'Lv.$level',
                style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 13.sp),
              ),
            ),
          ],
        ),
        SizedBox(height: 8.h),
        // 进度条
        ClipRRect(
          borderRadius: BorderRadius.circular(4.r),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6.h,
          ),
        ),
        SizedBox(height: 4.h),
        Text(
          '$currentExp / $nextLevelExp EXP',
          style: TextStyle(fontSize: 10.sp, color: Colors.grey[400]),
        ),
      ],
    );
  }

  // -------------------------------------------------------
  // 星途学阶：每级升级所需总经验
  // 升级快，门槛低，每日打卡即可轻松升级
  // Lv1→2: 100, Lv2→3: 200, ... 每级递增100
  // -------------------------------------------------------
  int _getStudyNextLevelExp(int level) {
    if (level >= 10) return 9999; // 满级
    return level * 100; // 线性增长，轻松升级
  }

  // -------------------------------------------------------
  // 知源贡献：每级升级所需总经验
  // 比星途学阶同等级高 30%+，升级更难，体现稀缺优越感
  // Lv1→2: 150, Lv2→3: 300, ... 每级递增更多
  // -------------------------------------------------------
  int _getContributeNextLevelExp(int level) {
    if (level >= 10) return 9999; // 满级
    return (level * 100 * 1.5).toInt(); // 比学阶高50%，升级明显更慢
  }

  // -------------------------------------------------------
  // 3. 功能入口网格
  // -------------------------------------------------------
  Widget _buildFunctionGrid(BuildContext context, AppController controller) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16.w),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('我的工具',
              style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700])),
          SizedBox(height: 12.h),

          // Obx监听性别变化，自动决定是否显示生理期入口
          Obx(() {
            // 生理期入口仅女性可见
            final showMenstrual = controller.isMenstrualUnlocked;

            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: showMenstrual ? 3 : 2, // 女性显示3列，男性2列
              crossAxisSpacing: 12.w,
              mainAxisSpacing: 12.h,
              childAspectRatio: 1.2,
              children: [
                // 记账助手（所有用户可见）
                _buildFunctionItem(
                  context,
                  icon: Icons.account_balance_wallet_outlined,
                  label: '记账助手',
                  color: Colors.green,
                  onTap: () => Get.toNamed('/accounting'),
                ),
                // 备忘录（所有用户可见）
                _buildFunctionItem(
                  context,
                  icon: Icons.note_alt_outlined,
                  label: '备忘录',
                  color: Colors.orange,
                  onTap: () => Get.toNamed('/memo'),
                ),
                // 生理期（仅女性用户可见）
                if (showMenstrual)
                  _buildFunctionItem(
                    context,
                    icon: Icons.favorite_outline,
                    label: '生理期助手',
                    color: Colors.pink,
                    onTap: () => Get.toNamed('/menstrual'),
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }

  // 单个功能入口卡片
  Widget _buildFunctionItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10.r),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28.sp),
            SizedBox(height: 6.h),
            Text(
              label,
              style: TextStyle(fontSize: 12.sp, color: color),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------
  // 4. 我的内容管理
  // -------------------------------------------------------
  Widget _buildMyContentSection(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        children: [
          _buildListTile(
            icon: Icons.upload_file_outlined,
            iconColor: Colors.blue,
            title: '我的发布',
            subtitle: '管理发布的学习资源',
            onTap: () => Get.toNamed('/my-resources'),
          ),
          _buildDivider(),
          _buildListTile(
            icon: Icons.bookmark_outline,
            iconColor: Colors.amber,
            title: '我的收藏',
            subtitle: '收藏夹 + 自建分类',
            onTap: () => Get.toNamed('/my-collects'),
          ),
          _buildDivider(),
          _buildListTile(
            icon: Icons.thumb_up_outlined,
            iconColor: Colors.pink,
            title: '我的点赞',
            subtitle: '点赞过的语录和资源',
            onTap: () => Get.toNamed('/my-likes'),
          ),
          _buildDivider(),
          // 30天回收站
          _buildListTile(
            icon: Icons.restore_from_trash_outlined,
            iconColor: Colors.grey,
            title: '回收站',
            subtitle: '30天内删除的内容可找回',
            onTap: () => Get.toNamed('/recycle-bin'),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------
  // 5. 设置区
  // -------------------------------------------------------
  Widget _buildSettingsSection(BuildContext context, AppController controller) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        children: [
          _buildListTile(
            icon: Icons.smart_toy_outlined,
            iconColor: Colors.purple,
            title: '小暖AI设置',
            subtitle: '悬浮按钮 / 问候气泡 / 服务开关',
            onTap: () => Get.toNamed('/ai-settings'),
          ),
          _buildDivider(),
          _buildListTile(
            icon: Icons.palette_outlined,
            iconColor: Colors.teal,
            title: '主题换肤',
            subtitle: '5种主题，一键全局换色',
            onTap: () => Get.toNamed('/theme-settings'),
          ),
          _buildDivider(),
          _buildListTile(
            icon: Icons.security_outlined,
            iconColor: Colors.indigo,
            title: '隐私与安全',
            subtitle: '账号安全、数据加密设置',
            onTap: () => Get.toNamed('/privacy-settings'),
          ),
          _buildDivider(),
          _buildListTile(
            icon: Icons.feedback_outlined,
            iconColor: Colors.orange,
            title: '意见反馈',
            subtitle: '联系我们，帮助暖小圈更好',
            onTap: () => Get.toNamed('/feedback'),
          ),
          _buildDivider(),
          // 退出登录按钮（红色警示）
          _buildListTile(
            icon: Icons.logout,
            iconColor: Colors.red,
            title: '退出登录',
            onTap: () {
              Get.dialog(AlertDialog(
                title: const Text('确定退出登录？'),
                actions: [
                  TextButton(onPressed: () => Get.back(), child: const Text('取消')),
                  TextButton(
                    onPressed: () {
                      controller.logout();
                      Get.back();
                      Get.offAllNamed('/login'); // 跳转登录页
                    },
                    child: const Text('退出', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ));
            },
          ),
        ],
      ),
    );
  }

  // 列表项组件
  Widget _buildListTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 36.w,
        height: 36.w,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Icon(icon, color: iconColor, size: 20.sp),
      ),
      title: Text(title, style: TextStyle(fontSize: 14.sp)),
      subtitle: subtitle != null
          ? Text(subtitle,
              style: TextStyle(fontSize: 12.sp, color: Colors.grey[500]))
          : null,
      trailing: Icon(Icons.chevron_right, color: Colors.grey[400], size: 18.sp),
      onTap: onTap,
    );
  }

  // 分割线
  Widget _buildDivider() {
    return Divider(
      height: 1.h,
      indent: 56.w, // 左边缩进，对齐文字
      color: Colors.grey.shade100,
    );
  }
}
