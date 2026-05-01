// ============================================================
// 文件：widgets/resource_card.dart
// 作用：学习资源卡片（知识小馆 + 首页推荐都用到）
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';

class ResourceCard extends StatelessWidget {
  final Map<String, dynamic> resource;

  // 是否显示上传者信息（知识小馆显示，首页不显示）
  final bool showUploader;

  const ResourceCard({
    Key? key,
    required this.resource,
    this.showUploader = false,
  }) : super(key: key);

  // 根据文件类型返回对应图标
  IconData _getFileIcon(String? fileType) {
    switch (fileType) {
      case 'PDF': return Icons.picture_as_pdf_outlined;
      case 'Word': return Icons.description_outlined;
      case '视频': return Icons.play_circle_outline;
      case '图片': return Icons.image_outlined;
      case '链接': return Icons.link;
      default: return Icons.insert_drive_file_outlined;
    }
  }

  // 根据文件类型返回对应颜色
  Color _getFileColor(String? fileType) {
    switch (fileType) {
      case 'PDF': return Colors.red;
      case 'Word': return Colors.blue;
      case '视频': return Colors.purple;
      case '图片': return Colors.green;
      case '链接': return Colors.orange;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fileType = resource['file_type'] as String?;
    final fileColor = _getFileColor(fileType);

    return Card(
      margin: EdgeInsets.only(bottom: 10.h),
      child: InkWell(
        onTap: () {
          // 跳转资源详情页
          Get.toNamed('/resource-detail', arguments: resource);
        },
        borderRadius: BorderRadius.circular(12.r),
        child: Padding(
          padding: EdgeInsets.all(14.w),
          child: Row(
            children: [
              // 文件类型图标（彩色圆形背景）
              Container(
                width: 44.w,
                height: 44.w,
                decoration: BoxDecoration(
                  color: fileColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(
                  _getFileIcon(fileType),
                  color: fileColor,
                  size: 24.sp,
                ),
              ),

              SizedBox(width: 12.w),

              // 资源信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 资源标题
                    Text(
                      resource['title'] ?? '未命名资源',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis, // 超出显示省略号
                      style: TextStyle(
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF333333),
                      ),
                    ),

                    SizedBox(height: 4.h),

                    // 标签行（学段 + 科目标签）
                    Row(
                      children: [
                        if (resource['education_level'] != null)
                          _buildTag(resource['education_level'], Colors.blue),
                        if (resource['subject'] != null) ...[
                          SizedBox(width: 4.w),
                          _buildTag(resource['subject'], Colors.green),
                        ],
                      ],
                    ),

                    SizedBox(height: 6.h),

                    // 统计数据（浏览/点赞/收藏）
                    Row(
                      children: [
                        Icon(Icons.visibility_outlined,
                            size: 12.sp, color: Colors.grey[400]),
                        SizedBox(width: 3.w),
                        Text(
                          '${resource['views'] ?? 0}',
                          style: TextStyle(
                              fontSize: 11.sp, color: Colors.grey[400]),
                        ),
                        SizedBox(width: 12.w),
                        Icon(Icons.thumb_up_outlined,
                            size: 12.sp, color: Colors.grey[400]),
                        SizedBox(width: 3.w),
                        Text(
                          '${resource['likes'] ?? 0}',
                          style: TextStyle(
                              fontSize: 11.sp, color: Colors.grey[400]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 右侧：收藏按钮
              IconButton(
                icon: Icon(Icons.bookmark_border, size: 20.sp),
                color: Colors.grey[400],
                onPressed: () {
                  // TODO: 收藏/取消收藏
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 小标签组件
  Widget _buildTag(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4.r),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10.sp, color: color),
      ),
    );
  }
}
