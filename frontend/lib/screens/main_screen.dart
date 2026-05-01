// ============================================================
// 文件：screens/main_screen.dart
// 作用：主页面框架，包含底部 4 个 Tab 导航
// Tab 结构（按文档要求）：
//   首页 → 自习室 → 知识小馆 → 我的
// 注意：记账、生理期、备忘录都收纳在「我的」里，不单独占Tab
// ============================================================

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/app_controller.dart';
import '../widgets/ai_float_button.dart'; // AI 小暖悬浮按钮组件
import 'home_screen.dart';
import 'study_room_screen.dart';
import 'knowledge_screen.dart';
import 'mine_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  // 当前选中的 Tab 索引（0=首页 1=自习室 2=知识小馆 3=我的）
  int _currentIndex = 0;

  // 全局控制器（用于读取AI按钮模式等设置）
  final AppController _appController = Get.find<AppController>();

  // --------------------------------------------------------
  // 四个 Tab 对应的页面
  // 用 IndexedStack 而不是直接切换，好处是：
  //   切换 Tab 不会重建页面，保留页面状态（如滚动位置）
  // --------------------------------------------------------
  final List<Widget> _pages = const [
    HomeScreen(),        // 首页：AI学习计划 + 语录 + 推荐资源
    StudyRoomScreen(),   // 自习室：专注计时 + 房间
    KnowledgeScreen(),   // 知识小馆：语录 + 学习资源
    MineScreen(),        // 我的：个人中心 + 子工具入口
  ];

  @override
  Widget build(BuildContext context) {
    // Scaffold 是 Flutter 的标准页面框架，提供 AppBar、body、bottomBar 等位置
    return Scaffold(
      // -------------------------------------------------------
      // body：页面主内容区域
      // Stack 允许多个组件叠加（AI悬浮按钮叠在页面内容上）
      // -------------------------------------------------------
      body: Stack(
        children: [
          // IndexedStack：只显示当前索引的页面，其余隐藏但不销毁
          IndexedStack(
            index: _currentIndex,
            children: _pages,
          ),

          // AI 小暖悬浮按钮（叠加在所有页面上层）
          // 通过 Obx 监听 AI 模式变化，自动决定是否显示
          Obx(() {
            // aiButtonMode == 0 或 2 时不显示悬浮按钮
            if (_appController.aiButtonMode.value == 0 ||
                _appController.aiButtonMode.value == 2) {
              return const SizedBox.shrink(); // 空组件，不占空间
            }
            // 显示可拖拽的 AI 悬浮按钮
            return const AiFloatButton();
          }),
        ],
      ),

      // -------------------------------------------------------
      // 底部导航栏
      // -------------------------------------------------------
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        // 点击 Tab 切换页面
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        // fixed 类型：图标始终显示文字，不随选中状态改变
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),  // 选中时换填充图标
            label: '首页',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.timer_outlined),
            activeIcon: Icon(Icons.timer),
            label: '自习室',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_books_outlined),
            activeIcon: Icon(Icons.library_books),
            label: '知识小馆',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: '我的',
          ),
        ],
      ),
    );
  }
}
