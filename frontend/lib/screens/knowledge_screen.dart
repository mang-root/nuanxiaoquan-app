// ============================================================
// 文件：screens/knowledge_screen.dart
// 作用：知识小馆页面（三个 Tab：语录 / 资源 / 答疑）
//
// 答疑 Tab 说明：
//   · 放在第三个 Tab，不明显但能找到
//   · 普通用户：可提问、可点赞
//   · 管理员（开发者登录）：自动显示"官方回复"按钮，普通用户不可见
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../services/api_service.dart';
import '../widgets/resource_card.dart';
import '../widgets/quote_card.dart';
import 'qa_screen.dart';

class KnowledgeScreen extends StatefulWidget {
  const KnowledgeScreen({Key? key}) : super(key: key);

  @override
  State<KnowledgeScreen> createState() => _KnowledgeScreenState();
}

class _KnowledgeScreenState extends State<KnowledgeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _apiService = ApiService();

  List<dynamic> _quotes = [];
  List<dynamic> _resources = [];
  bool _quotesLoading = true;
  bool _resourcesLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadQuotes();
    _loadResources();
  }

  Future<void> _loadQuotes() async {
    try {
      final result = await _apiService.get('/quote/list?limit=20');
      setState(() {
        _quotes = result is List ? result : (result['content'] ?? []);
        _quotesLoading = false;
      });
    } catch (_) {
      setState(() => _quotesLoading = false);
    }
  }

  Future<void> _loadResources() async {
    try {
      final result = await _apiService.get('/resource/list?limit=20');
      setState(() {
        _resources = result is List ? result : (result['content'] ?? []);
        _resourcesLoading = false;
      });
    } catch (_) {
      setState(() => _resourcesLoading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('知识小馆', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.primaryColor,
          indicatorWeight: 3,
          labelColor: theme.primaryColor,
          unselectedLabelColor: Colors.grey[500],
          labelStyle: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: '干货语录'),
            Tab(text: '学习资源'),
            Tab(text: '答疑'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab1: 语录列表
          _quotesLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadQuotes,
                  child: ListView.builder(
                    padding: EdgeInsets.all(12.w),
                    itemCount: _quotes.length,
                    itemBuilder: (ctx, i) => QuoteCard(quote: _quotes[i]),
                  ),
                ),

          // Tab2: 资源列表
          _resourcesLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _loadResources,
                  child: ListView.builder(
                    padding: EdgeInsets.all(12.w),
                    itemCount: _resources.length,
                    itemBuilder: (ctx, i) => ResourceCard(resource: _resources[i]),
                  ),
                ),

          // Tab3: 答疑（嵌入 QAScreen）
          const QAScreen(),
        ],
      ),
    );
  }
}
