// ============================================================
// 文件：screens/home_screen.dart
// 作用：首页 - APP 核心页面
// 包含：AI 学习计划（C位） + 每日语录卡片 + 资源推荐卡片
// 无任何生理期、女性向元素，保持全用户友好
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../services/api_service.dart';
import '../controllers/app_controller.dart';
import '../widgets/study_plan_card.dart';   // 学习计划卡片组件
import '../widgets/quote_card.dart';         // 语录卡片组件
import '../widgets/resource_card.dart';      // 资源推荐卡片

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // 资源服务，负责和后端 API 通信
  final _resourceService = ResourceService();

  // 学习计划列表（从后端拉取）
  List<dynamic> _studyPlans = [];

  // AI推荐资源列表
  List<dynamic> _recommendations = [];

  // 今日语录
  Map<String, dynamic>? _todayQuote;

  // 是否正在加载数据（控制loading转圈圈显示）
  bool _isLoading = true;

  // 全局控制器
  final _appController = Get.find<AppController>();

  @override
  void initState() {
    super.initState();
    _loadHomeData(); // 进入页面时加载数据
  }

  // 加载首页所有数据
  Future<void> _loadHomeData() async {
    try {
      // 同时发起多个请求（并行，比串行更快）
      final results = await Future.wait([
        _resourceService.getRecommendations(limit: 5),
        _resourceService.getTodayQuote(),
        _resourceService.getMyStudyPlans(),
      ]);

      // 更新状态，触发界面刷新
      setState(() {
        _recommendations = results[0] as List<dynamic>;
        _todayQuote = results[1] as Map<String, dynamic>?;
        _studyPlans = results[2] as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      // 网络错误时停止loading，显示错误状态
      setState(() => _isLoading = false);
      // 实际开发中可以显示 SnackBar 提示错误
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // -------------------------------------------------------
      // 顶部栏
      // -------------------------------------------------------
      appBar: AppBar(
        // APP名称 + 简约装饰
        title: Row(
          mainAxisSize: MainAxisSize.min, // 行宽度自适应内容
          children: [
            // 暖字 Logo 圆形背景
            Container(
              width: 28.w,
              height: 28.w,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '暖',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            SizedBox(width: 8.w),
            Text(
              '暖小圈',
              style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          // 搜索按钮
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: 跳转搜索页
            },
          ),
        ],
      ),

      // -------------------------------------------------------
      // 页面主体：可下拉刷新的滚动列表
      // -------------------------------------------------------
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              // 下拉刷新回调
              onRefresh: _loadHomeData,
              child: ListView(
                padding: EdgeInsets.all(16.w),
                children: [
                  // === 1. 今日语录卡片 ===
                  if (_todayQuote != null)
                    QuoteCard(quote: _todayQuote!),

                  SizedBox(height: 20.h),

                  // === 2. AI 学习计划专区（C位，最大面积）===
                  _buildStudyPlanSection(),

                  SizedBox(height: 20.h),

                  // === 3. AI推荐资源 ===
                  _buildRecommendSection(),

                  // 底部留白，避免内容被导航栏遮挡
                  SizedBox(height: 20.h),

                  // 小暖技术支持标注（浅灰色小字，低调）
                  Center(
                    child: Text(
                      '火山引擎豆包大模型提供智能技术支持',
                      style: TextStyle(
                        fontSize: 10.sp,
                        color: Colors.grey[400],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  // -------------------------------------------------------
  // 学习计划专区组件
  // -------------------------------------------------------
  Widget _buildStudyPlanSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 标题行：左边标题 + 右边"新建"按钮
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '📚 我的学习计划',
              style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
            ),
            TextButton.icon(
              onPressed: _createNewPlan,
              icon: Icon(Icons.add, size: 16.sp),
              label: Text('新建', style: TextStyle(fontSize: 13.sp)),
            ),
          ],
        ),
        SizedBox(height: 8.h),

        // 计划列表（支持拖拽排序）
        if (_studyPlans.isEmpty)
          _buildEmptyPlanHint()
        else
          // ReorderableListView 支持长按拖拽排序
          ReorderableListView.builder(
            shrinkWrap: true,              // 高度自适应内容
            physics: const NeverScrollableScrollPhysics(), // 禁止自己滚动，由外层ListView控制
            itemCount: _studyPlans.length,
            itemBuilder: (context, index) {
              return StudyPlanCard(
                key: ValueKey(_studyPlans[index]['id']), // 拖拽排序必须有 key
                plan: _studyPlans[index],
                onDelete: () => _deletePlan(index),
              );
            },
            onReorder: (oldIndex, newIndex) {
              // 拖拽完成后更新列表顺序
              setState(() {
                if (newIndex > oldIndex) newIndex--;
                final item = _studyPlans.removeAt(oldIndex);
                _studyPlans.insert(newIndex, item);
              });
            },
          ),
      ],
    );
  }

  // 无计划时显示的引导提示
  Widget _buildEmptyPlanHint() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Icon(Icons.lightbulb_outline, size: 40.sp, color: Colors.amber),
          SizedBox(height: 8.h),
          Text(
            '让小暖帮你制定第一个学习计划吧～',
            style: TextStyle(color: Colors.grey[600], fontSize: 14.sp),
          ),
          SizedBox(height: 12.h),
          ElevatedButton(
            onPressed: _createNewPlan,
            child: const Text('✨ 一键生成AI计划'),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------
  // AI推荐资源区域
  // -------------------------------------------------------
  Widget _buildRecommendSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '🔥 小暖为你推荐',
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8.h),
        ..._recommendations.map((item) => ResourceCard(resource: item)).toList(),
      ],
    );
  }

  // -------------------------------------------------------
  // 新建学习计划（跳转到AI生成计划页面）
  // -------------------------------------------------------
  void _createNewPlan() {
    Get.toNamed('/create-plan'); // 跳转到创建计划页，路由在 main.dart 配置
  }

  // 删除计划（带二次确认）
  void _deletePlan(int index) {
    Get.dialog(
      AlertDialog(
        title: const Text('确定要删除这条计划吗？'),
        content: const Text('删除后 30 天内可在「我的」→「回收站」找回'),
        actions: [
          TextButton(onPressed: () => Get.back(), child: const Text('取消')),
          TextButton(
            onPressed: () {
              Get.back();
              setState(() => _studyPlans.removeAt(index));
              // TODO: 调用后端API删除，并发送到回收站
            },
            child: const Text('删除', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
