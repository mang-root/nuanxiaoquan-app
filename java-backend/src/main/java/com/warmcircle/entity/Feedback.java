package com.warmcircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

/**
 * 意见反馈实体
 * 用户在"我的"页面提交建议，管理员在后台查看
 */
@Data
@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 提交人 ID（可为空，支持匿名反馈） */
    private Long userId;

    /** 反馈内容 */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /** 反馈分类（功能建议/BUG反馈/其他） */
    @Column(length = 20)
    private String category = "其他";

    /** 是否已处理（管理员标记） */
    private Boolean handled = false;

    /** 管理员回复 */
    @Column(columnDefinition = "TEXT")
    private String adminReply;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
