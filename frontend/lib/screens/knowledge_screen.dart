// ============================================================
// 文件：screens/knowledge_screen.dart
// 作用：知识小馆页面（原zip里的「小馆」Tab）
// 两大板块：
//   板块1：干货语录区（小暖AI每日自动生成）
//   板块2：学习资源区（用户上传 + 爬虫资源）
// 无二手实物、无闲置交易、纯虚拟学习资料
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../services/api_service.dart';
import '../widgets/quote_card.dart';
import '../widgets/resource_card.dart';

class KnowledgeScreen extends StatefulWidget {
  const KnowledgeScreen({Key? key}) : super(key: key);

  @override
  State<KnowledgeScreen> createState() => _KnowledgeScreenState();
}

class _KnowledgeScreenState extends State<KnowledgeScreen>
    with SingleTickerProviderStateMixin {
  // 顶部 Tab 控制器（语录 / 资源 两个子tab）
  late TabController _tabController;

  final _resourceService = ResourceService();

  // 资源分类筛选（默认全部）
  String _selectedCategory = '全部';
  // 预设分类列表（用户也可自建）
  final List<String> _categories = ['全部', '小学', '初中', '高中', '大学', '考研', '公考'];

  // 资源列表数据
  List<dynamic> _resources = [];
  bool _resourcesLoading = true;

  // 语录数据
  List<dynamic> _quotes = [];
  bool _quotesLoading = true;

  @override
  void initState() {
    super.initState();
    // 初始化 TabController，2个Tab
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // 加载数据
  Future<void> _loadData() async {
    _loadQuotes();
    _loadResources();
  }

  Future<void> _loadQuotes() async {
    try {
      // TODO: 调用后端接口获取语录列表
      setState(() => _quotesLoading = false);
    } catch (e) {
      setState(() => _quotesLoading = false);
    }
  }

  Future<void> _loadResources() async {
    try {
      final data = await _resourceService.searchResources(
        educationLevel: _selectedCategory == '全部' ? null : _selectedCategory,
      );
      setState(() {
        _resources = data;
        _resourcesLoading = false;
      });
    } catch (e) {
      setState(() => _resourcesLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('知识小馆'),
        actions: [
          // 搜索
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          // 发布资源
          IconButton(
            icon: const Icon(Icons.upload_outlined),
            onPressed: () => Get.toNamed('/publish-resource'),
          ),
        ],
        // 底部 Tab 栏
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '📖 干货语录'),
            Tab(text: '📁 学习资源'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ===================================================
          // Tab 1：干货语录区
          // ===================================================
          _buildQuotesTab(),

          // ===================================================
          // Tab 2：学习资源区
          // ===================================================
          _buildResourcesTab(),
        ],
      ),
    );
  }

  // -------------------------------------------------------
  // 语录 Tab
  // -------------------------------------------------------
  Widget _buildQuotesTab() {
    if (_quotesLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // 示例语录数据（实际从后端拉取小暖AI生成的语录）
    final sampleQuotes = [
      {
        'content': '每一次选择坚持，都是在给未来的自己加一块基石。',
        'author': '小暖',
        'category': '励志',
      },
      {
        'content': '学习不是为了别人，是你在用今天的努力，替明天的自己撑腰。',
        'author': '小暖',
        'category': '学习',
      },
      {
        'content': '不必和别人比，只需比昨天的自己多前进一点点。',
        'author': '小暖',
        'category': '励志',
      },
    ];

    return RefreshIndicator(
      onRefresh: _loadQuotes,
      child: ListView.builder(
        padding: EdgeInsets.all(16.w),
        itemCount: sampleQuotes.length,
        itemBuilder: (context, index) {
          return QuoteCard(
            quote: sampleQuotes[index],
            showActions: true, // 显示收藏、分享按钮
          );
        },
      ),
    );
  }

  // -------------------------------------------------------
  // 学习资源 Tab
  // -------------------------------------------------------
  Widget _buildResourcesTab() {
    return Column(
      children: [
        // 分类筛选横向滚动条
        Container(
          height: 44.h,
          color: Colors.white,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final cat = _categories[index];
              final isSelected = cat == _selectedCategory;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedCategory = cat;
                    _resourcesLoading = true;
                  });
                  _loadResources();
                },
                child: Container(
                  margin: EdgeInsets.only(right: 8.w),
                  padding:
                      EdgeInsets.symmetric(horizontal: 14.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Text(
                    cat,
                    style: TextStyle(
                      fontSize: 13.sp,
                      color: isSelected ? Colors.white : Colors.grey[700],
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // 资源列表
        Expanded(
          child: _resourcesLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadResources,
                  child: _resources.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: EdgeInsets.all(16.w),
                          itemCount: _resources.length,
                          itemBuilder: (context, index) {
                            return ResourceCard(
                              resource: _resources[index],
                              showUploader: true, // 显示上传者信息
                            );
                          },
                        ),
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.folder_open_outlined,
              size: 60.sp, color: Colors.grey[300]),
          SizedBox(height: 12.h),
          Text('还没有资源，快去发布吧～',
              style: TextStyle(color: Colors.grey[500], fontSize: 14.sp)),
          SizedBox(height: 16.h),
          ElevatedButton.icon(
            onPressed: () => Get.toNamed('/publish-resource'),
            icon: const Icon(Icons.add),
            label: const Text('发布学习资源'),
          ),
        ],
      ),
    );
  }
}
