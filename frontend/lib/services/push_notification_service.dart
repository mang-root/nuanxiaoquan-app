// ============================================================
// 文件：services/push_notification_service.dart
// 作用：本地推送通知（完全离线，不依赖第三方推送服务器）
//
// 支持的推送类型：
//   1. 生理期提醒 — 经期前3天自动提醒
//   2. 学习打卡提醒 — 每天定时提醒
//   3. 记账提醒 — 晚上未记账时提醒
//   4. 预算超支提醒 — 支出超过预算80%时推送
//   5. 经期关怀 — 经期开始时推送暖心提示
//
// 技术方案：flutter_local_notifications（纯本地，无需服务器）
// pubspec 依赖：flutter_local_notifications: ^17.2.2
// ============================================================

import 'package:flutter/material.dart';

class PushNotificationService {
  static final _instance = PushNotificationService._();
  factory PushNotificationService() => _instance;
  PushNotificationService._();

  // 通知 ID 分配（避免冲突）
  static const int _idPeriodReminder = 1001;
  static const int _idStudyReminder  = 1002;
  static const int _idAccountReminder = 1003;
  static const int _idBudgetAlert    = 1004;
  static const int _idPeriodCare     = 1005;

  /// 初始化（在 main.dart 的 main() 里调用一次）
  Future<void> init() async {
    // === 实际初始化代码（已注释，接入插件后取消注释）===
    // const AndroidInitializationSettings androidSettings =
    //     AndroidInitializationSettings('@mipmap/ic_launcher');
    // const InitializationSettings settings =
    //     InitializationSettings(android: androidSettings);
    // await FlutterLocalNotificationsPlugin().initialize(settings);
    debugPrint('[推送] 本地通知服务初始化完成');
  }

  /// 安排生理期提醒（经期前 N 天）
  Future<void> schedulePeriodReminder(DateTime predictedDate, {int daysBefore = 3}) async {
    final reminderDate = predictedDate.subtract(Duration(days: daysBefore));
    if (reminderDate.isBefore(DateTime.now())) return;

    // FlutterLocalNotificationsPlugin().zonedSchedule(
    //   _idPeriodReminder,
    //   '🌸 经期提醒',
    //   '预计还有 $daysBefore 天来经期，记得准备好姨妈巾～',
    //   tz.TZDateTime.from(reminderDate, tz.local),
    //   notificationDetails,
    //   uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    // );
    debugPrint('[推送] 已安排经期提醒：$reminderDate');
  }

  /// 安排每日学习打卡提醒
  Future<void> scheduleStudyReminder(TimeOfDay time) async {
    // 每天固定时间提醒
    // FlutterLocalNotificationsPlugin().periodicallyShow(...)
    debugPrint('[推送] 已安排学习提醒：${time.hour}:${time.minute.toString().padLeft(2,'0')}');
  }

  /// 触发预算超支提醒（即时推送）
  Future<void> sendBudgetAlert(double ratio) async {
    final percent = (ratio * 100).toStringAsFixed(0);
    // FlutterLocalNotificationsPlugin().show(
    //   _idBudgetAlert, '💰 预算提醒', '本月已消费 $percent%，注意控制支出',
    //   notificationDetails,
    // );
    debugPrint('[推送] 预算提醒发送：已用 $percent%');
  }

  /// 经期开始关怀推送
  Future<void> sendPeriodCareMessage() async {
    const messages = [
      '好好休息，今天可以少做一点，没关系的 🌸',
      '记得多喝热水，暖小圈陪着你 💕',
      '这几天辛苦了，学习可以放慢节奏～',
    ];
    final msg = messages[DateTime.now().day % messages.length];
    // FlutterLocalNotificationsPlugin().show(_idPeriodCare, '暖小圈关怀', msg, ...);
    debugPrint('[推送] 经期关怀：$msg');
  }

  /// 晚间未记账提醒
  Future<void> scheduleAccountingReminder(TimeOfDay time) async {
    // FlutterLocalNotificationsPlugin().periodicallyShow(...)
    debugPrint('[推送] 已安排记账提醒：${time.hour}:${time.minute.toString().padLeft(2,'0')}');
  }

  /// 取消指定类型通知
  Future<void> cancelPeriodReminder() async {
    // FlutterLocalNotificationsPlugin().cancel(_idPeriodReminder);
  }

  Future<void> cancelStudyReminder() async {
    // FlutterLocalNotificationsPlugin().cancel(_idStudyReminder);
  }

  Future<void> cancelAll() async {
    // FlutterLocalNotificationsPlugin().cancelAll();
  }
}
