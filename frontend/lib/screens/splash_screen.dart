// ============================================================
// 文件：screens/splash_screen.dart
// 作用：开屏动画页（APP启动时显示的第一个页面）
// 功能：
//   1. 显示LOGO + 品牌名
//   2. 检查登录状态
//   3. 自动跳转（已登录→主页，未登录→登录页）
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../controllers/app_controller.dart';
import 'main_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  // 动画控制器
  late AnimationController _animController;

  // 透明度动画（渐入效果）
  late Animation<double> _opacityAnim;

  // 缩放动画（从小到大）
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();

    // 初始化动画（持续800毫秒）
    _animController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _opacityAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeIn),
    );

    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    // 启动动画
    _animController.forward();

    // 2秒后检查登录状态并跳转
    Future.delayed(const Duration(seconds: 2), _checkLoginAndNavigate);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  // 检查是否已登录，决定跳转哪个页面
  Future<void> _checkLoginAndNavigate() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userId = prefs.getInt('user_id') ?? 0;

    if (token != null && token.isNotEmpty && userId > 0) {
      // 已登录：恢复用户信息，跳主页
      final controller = Get.find<AppController>();
      await controller.updateUserInfo(
        userId: userId,
        name: prefs.getString('user_name') ?? '',
        avatar: prefs.getString('user_avatar') ?? '',
        gender: prefs.getString('user_gender') ?? 'unknown',
        studyLv: prefs.getInt('study_level') ?? 1,
        studyE: prefs.getInt('study_exp') ?? 0,
        contributeLv: prefs.getInt('contribute_level') ?? 1,
        contributeE: prefs.getInt('contribute_exp') ?? 0,
      );

      // Get.off = 跳转并销毁当前页（防止用户按返回键回到开屏）
      Get.off(() => const MainScreen());
    } else {
      // 未登录：跳登录页
      Get.off(() => const LoginScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    // 获取主题色
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      // 背景色用主题色
      backgroundColor: primaryColor,
      body: Center(
        child: FadeTransition(
          opacity: _opacityAnim,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 大 LOGO 圆
                Container(
                  width: 100.w,
                  height: 100.w,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: Colors.white.withOpacity(0.5), width: 2),
                  ),
                  child: Center(
                    child: Text(
                      '暖',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 48.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

                SizedBox(height: 20.h),

                // APP名称
                Text(
                  '暖小圈',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28.sp,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 4, // 字间距，让文字更大气
                  ),
                ),

                SizedBox(height: 8.h),

                // 副标题
                Text(
                  '你的一站式智能学习伙伴',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 13.sp,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
