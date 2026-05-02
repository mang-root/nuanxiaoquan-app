package com.warmcircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 答疑帖子实体（暖圈答疑功能）
 *
 * 设计思路：
 *  - 用户在"知识小馆"的答疑区发问题
 *  - 开发者（isAdmin=true 的账号）以"官方"身份回答
 *  - 普通用户看不到"答疑管理"入口，开发者用同一个 APP 登录
 *  - 每条帖子有 parentId = null 表示问题，parentId != null 表示回复
 */
@Data
@Entity
@Table(name = "qa_posts")
public class QAPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 发帖人 ID */
    @Column(nullable = false)
    private Long userId;

    /** 发帖人昵称（冗余存储，避免 JOIN） */
    @Column(length = 50)
    private String userNickname;

    /** 是否管理员发的（官方回复标识） */
    private Boolean isOfficial = false;

    /** 帖子内容 */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /** 分类标签（记账/生理期/学习/资源/其他） */
    @Column(length = 20)
    private String category = "其他";

    /** 父帖 ID（null=问题本身，有值=对某问题的回复） */
    @Column(name = "parent_id")
    private Long parentId;

    /** 点赞数 */
    private Integer likes = 0;

    /** 是否已有官方回复（方便前端显示"已解答"标签） */
    private Boolean hasOfficialReply = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
