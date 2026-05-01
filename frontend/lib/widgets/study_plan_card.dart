// ============================================================
// 文件：widgets/study_plan_card.dart
// 作用：学习计划卡片（支持拖拽排序、左滑删除）
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class StudyPlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;  // 计划数据
  final VoidCallback? onDelete;     // 删除回调

  const StudyPlanCard({
    Key? key,
    required this.plan,
    this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 完成进度（0.0 ~ 1.0）
    final progress = ((plan['progress'] ?? 0) as num) / 100.0;

    // 状态颜色
    Color statusColor;
    switch (plan['status']) {
      case '已完成': statusColor = Colors.green; break;
      case '已放弃': statusColor = Colors.grey; break;
      default: statusColor = Theme.of(context).primaryColor;
    }

    // Dismissible = 支持左滑删除的组件
    return Dismissible(
      key: Key('plan_${plan['id']}'),
      direction: DismissDirection.endToStart, // 只允许从右往左滑
      background: Container(
        alignment: Alignment.centerRight,
        padding: EdgeInsets.only(right: 20.w),
        margin: EdgeInsets.only(bottom: 10.h),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Icon(Icons.delete_outline, color: Colors.white, size: 24.sp),
      ),
      confirmDismiss: (direction) async {
        // 左滑删除前弹出确认框
        return await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('确认删除'),
            content: const Text('确定要删除这条计划吗？删除后30天内可在回收站找回'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text('取消')),
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  child:
                      const Text('删除', style: TextStyle(color: Colors.red))),
            ],
          ),
        );
      },
      onDismissed: (direction) {
        onDelete?.call(); // 确认删除后调用回调
      },
      child: Card(
        margin: EdgeInsets.only(bottom: 10.h),
        child: Padding(
          padding: EdgeInsets.all(14.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // 拖拽图标（提示用户可以拖拽排序）
                  Icon(Icons.drag_handle, color: Colors.grey[300], size: 20.sp),

                  SizedBox(width: 8.w),

                  // 计划标题
                  Expanded(
                    child: Text(
                      plan['title'] ?? '未命名计划',
                      style: TextStyle(
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                  // 状态标签
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Text(
                      plan['status'] ?? '进行中',
                      style: TextStyle(
                          fontSize: 11.sp,
                          color: statusColor,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),

              SizedBox(height: 10.h),

              // 进度条
              ClipRRect(
                borderRadius: BorderRadius.circular(4.r),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey.shade100,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(statusColor),
                  minHeight: 6.h,
                ),
              ),

              SizedBox(height: 6.h),

              // 进度文字 + 天数信息
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${(progress * 100).toInt()}% 完成',
                    style: TextStyle(fontSize: 11.sp, color: Colors.grey[500]),
                  ),
                  Text(
                    '共 ${plan['duration'] ?? 0} 天',
                    style: TextStyle(fontSize: 11.sp, color: Colors.grey[500]),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
