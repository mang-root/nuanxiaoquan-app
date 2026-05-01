// ============================================================
// 文件：widgets/ai_float_button.dart
// 作用：小暖AI悬浮按钮（可拖拽，所有页面叠加显示）
// 特性：
//   - 支持手指任意拖拽到屏幕任何位置
//   - 每日首次打开弹出问候气泡（3秒自动消失）
//   - 点击打开小暖AI对话框
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../controllers/app_controller.dart';

class AiFloatButton extends StatefulWidget {
  const AiFloatButton({Key? key}) : super(key: key);

  @override
  State<AiFloatButton> createState() => _AiFloatButtonState();
}

class _AiFloatButtonState extends State<AiFloatButton>
    with TickerProviderStateMixin {
  // 悬浮按钮的当前位置（相对于屏幕右下角）
  // 用 Offset 表示，x/y 分别是距右边/底部的距离
  double _right = 20;
  double _bottom = 100; // 在底部导航栏上方

  // 是否显示问候气泡
  bool _showGreeting = false;

  // 全局控制器
  final _controller = Get.find<AppController>();

  // 问候气泡的动画控制器
  late AnimationController _greetingAnimController;
  late Animation<double> _greetingOpacity;

  @override
  void initState() {
    super.initState();

    // 初始化气泡动画（渐入渐出）
    _greetingAnimController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _greetingOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _greetingAnimController, curve: Curves.easeIn),
    );

    // 启动时检查是否需要显示每日问候
    _checkDailyGreeting();
  }

  @override
  void dispose() {
    _greetingAnimController.dispose();
    super.dispose();
  }

  // 检查今天是否已经显示过问候（每天只显示一次）
  Future<void> _checkDailyGreeting() async {
    // 如果用户关闭了每日问候功能，不显示
    if (!_controller.showDailyGreeting.value) return;

    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toIso8601String().substring(0, 10); // 今日日期字符串
    final lastGreetingDay = prefs.getString('last_greeting_day') ?? '';

    if (lastGreetingDay != today) {
      // 今天还没显示过，延迟1秒后显示
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() => _showGreeting = true);
        _greetingAnimController.forward(); // 播放渐入动画

        // 保存今天已显示的记录
        await prefs.setString('last_greeting_day', today);

        // 3秒后自动消失
        await Future.delayed(const Duration(seconds: 3));
        if (mounted) {
          _greetingAnimController.reverse(); // 播放渐出动画
          await Future.delayed(const Duration(milliseconds: 300));
          if (mounted) setState(() => _showGreeting = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: _right,
      bottom: _bottom,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // -------------------------------------------------------
          // 问候气泡（每日首次显示）
          // -------------------------------------------------------
          if (_showGreeting)
            FadeTransition(
              opacity: _greetingOpacity,
              child: Container(
                margin: EdgeInsets.only(bottom: 8.h),
                padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                constraints: BoxConstraints(maxWidth: 200.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  // 文案温柔治愈，不无聊不机械
                  '我是你的专属助手小暖，随时帮你规划学习、整理生活～',
                  style: TextStyle(fontSize: 12.sp, color: Colors.grey[700]),
                ),
              ),
            ),

          // -------------------------------------------------------
          // 悬浮按钮本体（可拖拽）
          // GestureDetector 监听拖拽事件
          // -------------------------------------------------------
          GestureDetector(
            // 拖拽过程中实时更新位置
            onPanUpdate: (details) {
              setState(() {
                // delta 是本次移动的偏移量
                // 悬浮按钮靠右/靠下锚点，所以x方向取负
                _right -= details.delta.dx;
                _bottom -= details.delta.dy;

                // 边界限制：不让按钮拖出屏幕
                final screenWidth = MediaQuery.of(context).size.width;
                final screenHeight = MediaQuery.of(context).size.height;
                _right = _right.clamp(0, screenWidth - 56); // 56 是按钮宽度
                _bottom = _bottom.clamp(80, screenHeight - 120); // 避免遮住导航栏
              });
            },
            // 点击打开AI对话
            onTap: _openAiChat,
            child: Container(
              width: 52.w,
              height: 52.w,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).primaryColor.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  '小\n暖', // 竖向排列
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.bold,
                    height: 1.2,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 打开小暖AI对话界面
  void _openAiChat() {
    Get.toNamed('/ai-chat');
  }
}
