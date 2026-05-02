// ============================================================
// 文件：services/offline_calculator.dart
// 作用：离线本地算法引擎（断网也能用，不依赖 AI）
//
// 三大模块离线能力：
//   1. 生理期预测  —— 基于历史均值+标准差算法
//   2. 记账分析    —— 关键词分类 + 本地趋势计算
//   3. 学习计划    —— 时间块算法（截止日期/难度/可用时间）
//
// 模块关联引擎：
//   · 经期敏感期 → 自动降低学习建议强度
//   · 高消费日   → 关联经期前情绪波动提示
//   · 学习低谷   → 检查是否重叠经期/压力期
// ============================================================

import 'dart:math';

// ─────────────────────────────────────────────────────────
// 生理期离线预测
// ─────────────────────────────────────────────────────────

class PeriodCalculator {
  /// 根据历史记录预测下次经期
  /// [startDates] 历史开始日期列表（至少2条才能预测）
  static PeriodPrediction predict(List<DateTime> startDates) {
    if (startDates.length < 2) {
      return PeriodPrediction(
        nextStart: startDates.isNotEmpty
            ? startDates.last.add(const Duration(days: 28))
            : DateTime.now().add(const Duration(days: 28)),
        avgCycle: 28,
        confidence: 'low',
        phaseToday: _getCurrentPhase(startDates),
      );
    }

    // 计算每次周期长度
    final cycles = <int>[];
    for (int i = 1; i < startDates.length; i++) {
      cycles.add(startDates[i].difference(startDates[i - 1]).inDays);
    }

    final avg = cycles.reduce((a, b) => a + b) / cycles.length;
    final variance = cycles.map((c) => pow(c - avg, 2)).reduce((a, b) => a + b) / cycles.length;
    final stdDev = sqrt(variance);

    // 置信度：标准差越小越准
    final confidence = stdDev < 2 ? 'high' : stdDev < 4 ? 'medium' : 'low';
    final nextStart = startDates.last.add(Duration(days: avg.round()));

    return PeriodPrediction(
      nextStart: nextStart,
      avgCycle: avg.round(),
      confidence: confidence,
      daysUntilNext: nextStart.difference(DateTime.now()).inDays,
      phaseToday: _getCurrentPhase(startDates),
    );
  }

  /// 判断今天处于经期哪个阶段（用于模块关联）
  static CyclePhase _getCurrentPhase(List<DateTime> startDates) {
    if (startDates.isEmpty) return CyclePhase.unknown;
    final lastStart = startDates.last;
    final daysSince = DateTime.now().difference(lastStart).inDays;

    if (daysSince < 0) return CyclePhase.unknown;
    if (daysSince <= 5) return CyclePhase.menstrual;      // 经期（1-5天）
    if (daysSince <= 13) return CyclePhase.follicular;    // 卵泡期（6-13天）
    if (daysSince <= 15) return CyclePhase.ovulation;     // 排卵期（14-15天）
    if (daysSince <= 24) return CyclePhase.luteal;        // 黄体期（16-24天）
    return CyclePhase.premenstrual;                        // 经前期（敏感期）
  }

  /// 经期阶段的学习/生活建议
  static PhaseAdvice getPhaseAdvice(CyclePhase phase) {
    switch (phase) {
      case CyclePhase.menstrual:
        return PhaseAdvice(
          studyIntensity: 0.5,  // 建议降低到50%强度
          label: '经期',
          studyTip: '建议轻量复习为主，避免高强度记忆任务',
          lifeTip: '多喝热水，适当休息，避免剧烈运动',
          emoji: '🌸',
        );
      case CyclePhase.follicular:
        return PhaseAdvice(
          studyIntensity: 1.0,
          label: '卵泡期',
          studyTip: '精力充沛，适合攻克难点和新知识',
          lifeTip: '状态最佳，可以挑战高难度目标',
          emoji: '✨',
        );
      case CyclePhase.ovulation:
        return PhaseAdvice(
          studyIntensity: 1.0,
          label: '排卵期',
          studyTip: '思维活跃，适合创意性学习和表达练习',
          lifeTip: '社交能力强，适合团队学习',
          emoji: '🌟',
        );
      case CyclePhase.luteal:
        return PhaseAdvice(
          studyIntensity: 0.8,
          label: '黄体期',
          studyTip: '适合整理笔记、复习已学内容',
          lifeTip: '可能轻微情绪波动，保持规律作息',
          emoji: '🍃',
        );
      case CyclePhase.premenstrual:
        return PhaseAdvice(
          studyIntensity: 0.6,
          label: '经前期',
          studyTip: '适当放慢节奏，避免强迫自己高效',
          lifeTip: '注意情绪管理，记录当下感受',
          emoji: '🌙',
        );
      case CyclePhase.unknown:
        return PhaseAdvice(studyIntensity: 1.0, label: '正常', studyTip: '', lifeTip: '', emoji: '');
    }
  }
}

// ─────────────────────────────────────────────────────────
// 记账离线分析
// ─────────────────────────────────────────────────────────

class AccountingCalculator {
  /// 关键词分类（不依赖 AI，纯本地匹配）
  static final Map<String, List<String>> _categoryKeywords = {
    '餐饮':   ['饭', '餐', '外卖', '奶茶', '咖啡', '零食', '超市', '食堂', '点餐'],
    '学习':   ['书', '课程', '资料', '文具', '打印', '考试', '培训', '教材'],
    '交通':   ['地铁', '公交', '打车', '滴滴', '高铁', '机票', '共享单车'],
    '娱乐':   ['电影', '游戏', '演唱会', '旅游', '景区', '购物'],
    '医疗':   ['药', '医院', '诊所', '检查'],
    '生活':   ['房租', '水电', '话费', '网费', '日用品'],
    '人情':   ['转账', '红包', '礼物', '份子'],
  };

  /// 根据备注自动猜分类
  static String guessCategory(String note) {
    final lower = note.toLowerCase();
    for (final entry in _categoryKeywords.entries) {
      if (entry.value.any((kw) => lower.contains(kw))) {
        return entry.key;
      }
    }
    return '其他';
  }

  /// 月度支出分析（离线，不需要网络）
  static MonthlyReport analyzeMonth(List<Map<String, dynamic>> records, int year, int month) {
    final monthRecords = records.where((r) {
      final date = DateTime.parse(r['record_date']);
      return date.year == year && date.month == month;
    }).toList();

    double totalIn = 0, totalOut = 0;
    final categoryMap = <String, double>{};
    final dailySpend = <int, double>{};

    for (final r in monthRecords) {
      final amount = (r['amount'] as num).toDouble();
      final date = DateTime.parse(r['record_date']);
      if (r['type'] == '收入') {
        totalIn += amount;
      } else {
        totalOut += amount;
        final cat = r['category'] ?? '其他';
        categoryMap[cat] = (categoryMap[cat] ?? 0) + amount;
        dailySpend[date.day] = (dailySpend[date.day] ?? 0) + amount;
      }
    }

    // 找高消费日（超过均值 1.5 倍）
    final avgDaily = dailySpend.isEmpty ? 0.0 : totalOut / dailySpend.length;
    final highSpendDays = dailySpend.entries
        .where((e) => e.value > avgDaily * 1.5)
        .map((e) => e.key)
        .toList();

    return MonthlyReport(
      year: year, month: month,
      totalIncome: totalIn,
      totalExpense: totalOut,
      balance: totalIn - totalOut,
      categoryBreakdown: categoryMap,
      highSpendDays: highSpendDays,
      avgDailySpend: avgDaily,
    );
  }

  /// 预算预警（离线判断）
  static BudgetAlert checkBudget(double monthlyBudget, double currentSpend, int dayOfMonth) {
    final daysInMonth = 30;
    final expectedSpend = monthlyBudget / daysInMonth * dayOfMonth;
    final ratio = currentSpend / monthlyBudget;

    if (ratio >= 1.0) {
      return BudgetAlert(level: AlertLevel.over, ratio: ratio, message: '本月预算已超支 ${((ratio-1)*100).toStringAsFixed(0)}%');
    } else if (ratio >= 0.85) {
      return BudgetAlert(level: AlertLevel.warning, ratio: ratio, message: '预算已用 ${(ratio*100).toStringAsFixed(0)}%，请注意控制支出');
    } else if (currentSpend > expectedSpend * 1.2) {
      return BudgetAlert(level: AlertLevel.ahead, ratio: ratio, message: '消费进度超前，建议放慢节奏');
    }
    return BudgetAlert(level: AlertLevel.normal, ratio: ratio, message: '消费正常');
  }
}

// ─────────────────────────────────────────────────────────
// 学习计划离线算法
// ─────────────────────────────────────────────────────────

class StudyPlanCalculator {
  /// 生成离线学习计划（不依赖 AI）
  /// [goal] 学习目标，[deadlineDays] 距截止天数，[dailyHours] 每天可用时间
  static OfflineStudyPlan generate({
    required String goal,
    required int deadlineDays,
    required double dailyHours,
    CyclePhase cyclePhase = CyclePhase.unknown,
  }) {
    // 根据经期阶段调整强度系数
    final phaseAdv = PeriodCalculator.getPhaseAdvice(cyclePhase);
    final intensityFactor = phaseAdv.studyIntensity;

    final tasks = <StudyTask>[];
    final totalHours = deadlineDays * dailyHours * intensityFactor;

    // 阶段划分：理解(40%) → 练习(35%) → 复习(25%)
    tasks.add(StudyTask(
      phase: '理解阶段',
      days: (deadlineDays * 0.4).round(),
      dailyHours: dailyHours * intensityFactor,
      tip: '专注核心概念，做好笔记',
    ));
    tasks.add(StudyTask(
      phase: '练习阶段',
      days: (deadlineDays * 0.35).round(),
      dailyHours: dailyHours * intensityFactor,
      tip: '大量刷题，找薄弱点',
    ));
    tasks.add(StudyTask(
      phase: '复习阶段',
      days: (deadlineDays * 0.25).round(),
      dailyHours: dailyHours * 0.7,  // 复习阶段适当减量
      tip: '错题整理，查漏补缺',
    ));

    return OfflineStudyPlan(
      goal: goal,
      totalHours: totalHours,
      tasks: tasks,
      cycleAdjusted: cyclePhase != CyclePhase.unknown,
      cycleNote: cyclePhase != CyclePhase.unknown ? phaseAdv.studyTip : null,
    );
  }

  /// 学习进度评估
  static StudyProgress evaluate(int plannedMinutes, int actualMinutes, int completedDays, int totalDays) {
    final completionRate = plannedMinutes == 0 ? 0.0 : actualMinutes / plannedMinutes;
    final dayProgress = totalDays == 0 ? 0.0 : completedDays / totalDays;

    String status;
    if (completionRate >= 1.0) {
      status = '超额完成';
    } else if (completionRate >= 0.8) {
      status = '良好';
    } else if (completionRate >= 0.6) {
      status = '需加油';
    } else {
      status = '严重落后';
    }

    return StudyProgress(
      completionRate: completionRate,
      dayProgress: dayProgress,
      status: status,
      suggestion: _getSuggestion(completionRate, dayProgress),
    );
  }

  static String _getSuggestion(double completionRate, double dayProgress) {
    if (completionRate < dayProgress - 0.2) return '进度落后较多，建议增加每日学习时长';
    if (completionRate > dayProgress + 0.1) return '进度超前，可以适当休息或提前复习';
    return '进度正常，继续保持';
  }
}

// ─────────────────────────────────────────────────────────
// 三模块关联引擎（核心差异化功能）
// ─────────────────────────────────────────────────────────

class CorrelationEngine {
  /// 生成跨模块洞察（记账 × 生理期 × 学习 的交叉分析）
  static List<CorrelationInsight> analyze({
    required MonthlyReport accountingReport,
    required PeriodPrediction periodPrediction,
    required StudyProgress studyProgress,
  }) {
    final insights = <CorrelationInsight>[];

    // 洞察1：经前高消费模式
    if (periodPrediction.daysUntilNext != null &&
        periodPrediction.daysUntilNext! <= 5 &&
        accountingReport.highSpendDays.isNotEmpty) {
      insights.add(CorrelationInsight(
        type: InsightType.spendingPeriod,
        title: '经前消费提醒',
        description: '检测到经前期高消费模式，这个阶段情绪波动可能影响购物决策',
        suggestion: '可以把非必须购物推迟到经期结束后再决定',
        icon: '💰🌙',
        priority: 2,
      ));
    }

    // 洞察2：经期学习建议
    final phase = periodPrediction.phaseToday;
    if (phase == CyclePhase.menstrual || phase == CyclePhase.premenstrual) {
      if (studyProgress.completionRate < 0.7) {
        insights.add(CorrelationInsight(
          type: InsightType.periodStudy,
          title: '经期学习调整',
          description: '当前处于${phase == CyclePhase.menstrual ? "经期" : "经前期"}，学习完成率偏低很正常',
          suggestion: '无需焦虑，轻量复习即可，身体优先',
          icon: '📚🌸',
          priority: 1,
        ));
      }
    }

    // 洞察3：高消费影响学习资源
    final learningSpend = accountingReport.categoryBreakdown['学习'] ?? 0;
    final totalSpend = accountingReport.totalExpense;
    if (totalSpend > 0 && learningSpend / totalSpend < 0.05 && studyProgress.completionRate < 0.6) {
      insights.add(CorrelationInsight(
        type: InsightType.spendingStudy,
        title: '学习投入偏低',
        description: '本月学习相关支出占比低于5%，而学习完成率也偏低',
        suggestion: '考虑增加学习资源投入（课程/资料），或重新审视学习计划',
        icon: '📖💡',
        priority: 3,
      ));
    }

    // 洞察4：综合健康评分
    final healthScore = _calcHealthScore(accountingReport, periodPrediction, studyProgress);
    insights.add(CorrelationInsight(
      type: InsightType.overall,
      title: '本周暖小圈评分',
      description: '综合记账 · 生理期 · 学习三个维度',
      suggestion: '得分 $healthScore/100 — ${healthScore >= 80 ? "状态很棒！" : healthScore >= 60 ? "继续努力～" : "给自己多一点温柔"}',
      icon: '🌡️',
      priority: 0,
    ));

    insights.sort((a, b) => a.priority.compareTo(b.priority));
    return insights;
  }

  static int _calcHealthScore(MonthlyReport accounting, PeriodPrediction period, StudyProgress study) {
    int score = 60;
    // 记账维度（30分）：预算内+10，有记录习惯+10，分类清晰+10
    if (accounting.balance >= 0) score += 10;
    if (accounting.totalExpense > 0) score += 10;
    if (accounting.categoryBreakdown.length >= 3) score += 10;
    // 学习维度（30分）
    score += (study.completionRate * 30).round().clamp(0, 30);
    // 经期维度（固定+10，有记录即得）
    if (period.confidence != 'low') score += 10;
    return score.clamp(0, 100);
  }
}

// ─────────────────────────────────────────────────────────
// 数据模型
// ─────────────────────────────────────────────────────────

enum CyclePhase { menstrual, follicular, ovulation, luteal, premenstrual, unknown }
enum AlertLevel { normal, ahead, warning, over }
enum InsightType { spendingPeriod, periodStudy, spendingStudy, overall }

class PeriodPrediction {
  final DateTime nextStart;
  final int avgCycle;
  final String confidence;
  final int? daysUntilNext;
  final CyclePhase phaseToday;
  PeriodPrediction({required this.nextStart, required this.avgCycle, required this.confidence, this.daysUntilNext, required this.phaseToday});
}

class PhaseAdvice {
  final double studyIntensity;
  final String label, studyTip, lifeTip, emoji;
  PhaseAdvice({required this.studyIntensity, required this.label, required this.studyTip, required this.lifeTip, required this.emoji});
}

class MonthlyReport {
  final int year, month;
  final double totalIncome, totalExpense, balance, avgDailySpend;
  final Map<String, double> categoryBreakdown;
  final List<int> highSpendDays;
  MonthlyReport({required this.year, required this.month, required this.totalIncome, required this.totalExpense, required this.balance, required this.categoryBreakdown, required this.highSpendDays, required this.avgDailySpend});
}

class BudgetAlert {
  final AlertLevel level;
  final double ratio;
  final String message;
  BudgetAlert({required this.level, required this.ratio, required this.message});
}

class OfflineStudyPlan {
  final String goal;
  final double totalHours;
  final List<StudyTask> tasks;
  final bool cycleAdjusted;
  final String? cycleNote;
  OfflineStudyPlan({required this.goal, required this.totalHours, required this.tasks, required this.cycleAdjusted, this.cycleNote});
}

class StudyTask {
  final String phase, tip;
  final int days;
  final double dailyHours;
  StudyTask({required this.phase, required this.days, required this.dailyHours, required this.tip});
}

class StudyProgress {
  final double completionRate, dayProgress;
  final String status, suggestion;
  StudyProgress({required this.completionRate, required this.dayProgress, required this.status, required this.suggestion});
}

class CorrelationInsight {
  final InsightType type;
  final String title, description, suggestion, icon;
  final int priority;
  CorrelationInsight({required this.type, required this.title, required this.description, required this.suggestion, required this.icon, required this.priority});
}
