// ============================================================
// 文件：widgets/level_badge.dart
// 作用：等级徽章组件
// 双等级体系：
//   - 星途学阶（⭐）：日常学习打卡，升级快
//   - 知源贡献（📚）：发布资源，升级明显更慢（难度+50%）
// Lv1~Lv10，满级10级，两个等级层级相同
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

// 等级类型枚举
enum LevelType {
  study,      // 星途学阶
  contribute, // 知源贡献
}

class LevelBadge extends StatelessWidget {
  final int level;       // 当前等级（1~10）
  final LevelType type;  // 等级类型
  final bool showLabel;  // 是否显示等级名称文字（详情页用大版本，列表用小版本）

  const LevelBadge({
    Key? key,
    required this.level,
    required this.type,
    this.showLabel = true,
  }) : super(key: key);

  // 根据等级和类型获取颜色
  // 等级越高颜色越深/越特别
  Color get _badgeColor {
    // 10级颜色梯度（越高越珍贵）
    const studyColors = [
      Color(0xFFBDBDBD), // Lv1 灰色（普通）
      Color(0xFF90CAF9), // Lv2 浅蓝
      Color(0xFF64B5F6), // Lv3 蓝色
      Color(0xFF4DD0E1), // Lv4 青色
      Color(0xFF81C784), // Lv5 绿色
      Color(0xFFFFB74D), // Lv6 橙色
      Color(0xFFFF8A65), // Lv7 深橙
      Color(0xFFE57373), // Lv8 红色
      Color(0xFFBA68C8), // Lv9 紫色
      Color(0xFFFFD700), // Lv10 金色（满级）
    ];

    const contributeColors = [
      Color(0xFFBDBDBD), // Lv1 灰色
      Color(0xFF80CBC4), // Lv2 蓝绿
      Color(0xFF4DB6AC), // Lv3
      Color(0xFF26A69A), // Lv4
      Color(0xFF00897B), // Lv5 深青
      Color(0xFF7986CB), // Lv6 靛蓝
      Color(0xFF5C6BC0), // Lv7
      Color(0xFF7E57C2), // Lv8 紫
      Color(0xFF9C27B0), // Lv9 深紫
      Color(0xFFE040FB), // Lv10 亮紫（满级，更稀有）
    ];

    final colors = type == LevelType.study ? studyColors : contributeColors;
    // level从1开始，数组从0开始，所以-1
    final index = (level - 1).clamp(0, 9);
    return colors[index];
  }

  // 等级图标
  String get _icon {
    return type == LevelType.study ? '⭐' : '📚';
  }

  // 等级名称（简短版，用于徽章）
  String get _shortName {
    return type == LevelType.study ? '学阶' : '贡献';
  }

  // 完整等级称号（根据等级段有专属名字，增加成就感）
  String get _levelTitle {
    if (type == LevelType.study) {
      const titles = [
        'Lv.1 初心学子',   // 刚开始
        'Lv.2 勤勉学生',
        'Lv.3 认真学者',
        'Lv.4 努力青年',
        'Lv.5 学习达人',
        'Lv.6 知识探索者',
        'Lv.7 学途精英',
        'Lv.8 学海领航',
        'Lv.9 智慧先锋',
        'Lv.10 星途巅峰', // 满级
      ];
      return titles[(level - 1).clamp(0, 9)];
    } else {
      // 知源贡献等级：稀缺感更强的名号
      const titles = [
        'Lv.1 初入知源',
        'Lv.2 资源分享者',
        'Lv.3 知识传播者',
        'Lv.4 干货贡献者',
        'Lv.5 学习领路人',
        'Lv.6 知识布道师',
        'Lv.7 资源守护者',
        'Lv.8 学海灯塔',
        'Lv.9 知源大师',
        'Lv.10 知源至尊', // 满级极稀有
      ];
      return titles[(level - 1).clamp(0, 9)];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: _badgeColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: _badgeColor.withOpacity(0.5), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min, // 宽度自适应内容
        children: [
          Text(_icon, style: TextStyle(fontSize: 10.sp)),
          SizedBox(width: 3.w),
          Text(
            showLabel ? _levelTitle : 'Lv.$level $_shortName',
            style: TextStyle(
              fontSize: 10.sp,
              color: _badgeColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
