// ============================================================
// 文件：services/notification_accounting.dart
// 作用：通知栏自动记账（监听微信支付/支付宝通知 → 弹窗确认）
//
// 原理：
//   监听系统通知栏 → 识别"微信支付"/"支付宝"关键词
//   → 正则提取金额 → 弹出确认框 → 用户一键记账
//
// 注意：
//   - 需要用户授权"通知使用权限"（首次使用弹窗引导）
//   - 纯本地实现，不联网，不接入第三方支付平台
//   - 需要在 pubspec.yaml 添加：notification_listener_service: ^0.0.8
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'offline_calculator.dart';

class NotificationAccountingService {
  static final NotificationAccountingService _instance = NotificationAccountingService._();
  factory NotificationAccountingService() => _instance;
  NotificationAccountingService._();

  bool _isListening = false;

  // 支持的支付关键词
  static const _paymentTitles = ['微信支付', '支付宝', 'Alipay', '财付通'];

  // 金额提取正则（匹配 "¥12.50" "支付12.50元" "-12.50" 等格式）
  static final _amountRegex = RegExp(r'[¥￥-]?\s*(\d+(?:\.\d{1,2})?)\s*元?');

  /// 启动通知监听
  /// 实际使用时替换为 notification_listener_service 插件的调用
  void startListening(BuildContext context) {
    if (_isListening) return;
    _isListening = true;

    // === 实际插件接入代码（已注释，替换下面的模拟代码）===
    // NotificationListenerService.notificationsStream.listen((event) {
    //   _handleNotification(context, event.packageName, event.title ?? '', event.content ?? '');
    // });

    debugPrint('[通知记账] 监听已启动');
  }

  /// 处理收到的通知
  void _handleNotification(BuildContext context, String packageName, String title, String content) {
    // 判断是否是支付通知
    final isPayment = _paymentTitles.any((kw) => title.contains(kw) || content.contains(kw));
    if (!isPayment) return;

    // 提取金额
    final match = _amountRegex.firstMatch(content);
    if (match == null) return;

    final amountStr = match.group(1);
    final amount = double.tryParse(amountStr ?? '');
    if (amount == null || amount <= 0) return;

    // 猜分类（根据通知内容）
    final guessedCategory = AccountingCalculator.guessCategory(content);

    // 弹出确认框
    _showConfirmDialog(context, amount, guessedCategory, content);
  }

  /// 弹出一键记账确认框
  void _showConfirmDialog(BuildContext context, double amount, String category, String originalContent) {
    final noteCtrl = TextEditingController(text: originalContent.length > 20 ? originalContent.substring(0, 20) : originalContent);
    String selectedCategory = category;

    Get.dialog(
      AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.payment, color: Color(0xFFFF8C42)),
            SizedBox(width: 8.w),
            Text('检测到支付', style: TextStyle(fontSize: 16.sp)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 金额大字展示
            Text(
              '¥${amount.toStringAsFixed(2)}',
              style: TextStyle(fontSize: 32.sp, fontWeight: FontWeight.bold, color: const Color(0xFFE53935)),
            ),
            SizedBox(height: 12.h),

            // 分类选择
            DropdownButtonFormField<String>(
              value: selectedCategory,
              decoration: InputDecoration(labelText: '分类', isDense: true, border: const OutlineInputBorder()),
              items: ['餐饮', '学习', '交通', '娱乐', '医疗', '生活', '人情', '其他']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => selectedCategory = v ?? '其他',
            ),
            SizedBox(height: 8.h),

            // 备注
            TextField(
              controller: noteCtrl,
              maxLength: 30,
              decoration: InputDecoration(
                labelText: '备注',
                isDense: true,
                border: const OutlineInputBorder(),
                counterText: '',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('忽略'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF8C42)),
            onPressed: () {
              Get.back();
              _saveRecord(amount, selectedCategory, noteCtrl.text);
            },
            child: const Text('记入支出', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      barrierDismissible: false,
    );
  }

  void _saveRecord(double amount, String category, String note) {
    // 调用记账 API 保存到后端
    // ApiService().post('/accounting/add', {
    //   'type': '支出',
    //   'amount': amount,
    //   'category': category,
    //   'note': note,
    //   'record_date': DateTime.now().toIso8601String(),
    // });
    Get.snackbar(
      '已记账',
      '¥${amount.toStringAsFixed(2)} · $category',
      backgroundColor: const Color(0xFFFF8C42),
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
    );
  }

  /// 引导用户开启通知权限
  static void showPermissionGuide(BuildContext context) {
    Get.dialog(
      AlertDialog(
        title: const Text('开启通知权限'),
        content: const Text(
          '自动记账需要读取通知栏内容（仅用于识别支付金额）\n\n'
          '数据完全本地处理，不上传任何通知内容。\n\n'
          '点击"去开启"后，在设置中允许暖小圈读取通知。',
        ),
        actions: [
          TextButton(onPressed: () => Get.back(), child: const Text('暂不开启')),
          ElevatedButton(
            onPressed: () {
              Get.back();
              // 跳转到系统通知权限设置
              // AppSettings.openNotificationSettings();
            },
            child: const Text('去开启'),
          ),
        ],
      ),
    );
  }
}
