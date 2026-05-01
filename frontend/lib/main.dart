// ============================================================
// 文件：main.dart
// 作用：APP 的最最最入口，整个程序从这里启动
// 相当于房子的大门，所有功能都从这里进入
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart'; // 屏幕尺寸适配库，让手机大小不同显示一样
import 'package:get/get.dart';                               // GetX：状态管理 + 路由跳转 + 依赖注入 三合一
import 'package:shared_preferences/shared_preferences.dart'; // 本地轻量存储，存主题/token等小数据
import 'themes/app_themes.dart';       // 我们自己写的主题颜色配置
import 'services/api_service.dart';    // 和后端服务器通信的工具
import 'screens/splash_screen.dart';   // 启动页（开屏动画）
import 'controllers/app_controller.dart'; // 全局控制器（主题切换等）

// ============================================================
// main函数：程序的起点，async 表示里面有需要等待的操作
// ============================================================
void main() async {
  // 必须先初始化 Flutter 绑定，才能在 main 里用 async
  WidgetsFlutterBinding.ensureInitialized();

  // 初始化 API 服务（设置服务器地址、网络配置等）
  await ApiService().init();

  // 把全局控制器注入到 GetX 的依赖容器里
  // 这样 APP 里任何地方都能用 Get.find<AppController>() 取到它
  Get.put(AppController());

  // 启动 APP，把 WarmCircleApp 作为根组件
  runApp(const WarmCircleApp());
}

// ============================================================
// WarmCircleApp：APP 根组件
// StatefulWidget = 有状态的组件（状态变化时会重新渲染界面）
// StatelessWidget = 无状态（内容固定不变）
// ============================================================
class WarmCircleApp extends StatefulWidget {
  const WarmCircleApp({Key? key}) : super(key: key);

  @override
  State<WarmCircleApp> createState() => _WarmCircleAppState();
}

class _WarmCircleAppState extends State<WarmCircleApp> {
  // 当前主题名称，默认是简约灰
  String _currentTheme = AppThemes.defaultTheme;

  @override
  void initState() {
    super.initState();
    _loadSavedTheme(); // 启动时读取上次保存的主题
  }

  // 从本地存储读取上次用户选择的主题
  Future<void> _loadSavedTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final savedTheme = prefs.getString('app_theme') ?? AppThemes.defaultTheme;
    setState(() {
      _currentTheme = savedTheme;
    });
  }

  // 切换主题，同时保存到本地（下次打开还是这个主题）
  void changeTheme(String themeName) async {
    setState(() {
      _currentTheme = themeName;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_theme', themeName);
  }

  @override
  Widget build(BuildContext context) {
    // ScreenUtilInit：初始化屏幕适配
    // designSize = 设计稿的基准尺寸（根据 375x812 iPhone X 设计）
    return ScreenUtilInit(
      designSize: const Size(375, 812),
      minTextAdapt: true, // 最小字号适配
      builder: (context, child) {
        // GetMaterialApp 是 GetX 版本的 MaterialApp
        // 比普通 MaterialApp 多了路由管理、对话框等功能
        return GetMaterialApp(
          title: '暖小圈',
          debugShowCheckedModeBanner: false, // 去掉右上角 DEBUG 红色标签
          theme: AppThemes.getTheme(_currentTheme), // 应用当前主题
          home: const SplashScreen(),              // 首先显示启动页
          locale: const Locale('zh', 'CN'),        // 设置中文语言
          // 把 changeTheme 方法存到全局控制器，方便其他页面调用
          builder: (context, widget) {
            // 找到全局控制器，注册主题切换回调
            final controller = Get.find<AppController>();
            controller.onThemeChange = changeTheme;
            return widget!;
          },
        );
      },
    );
  }
}
