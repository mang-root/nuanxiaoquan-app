package com.warmcircle.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 11, unique = true, nullable = false)
    private String phone;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 50)
    private String nickname = "暖芽萌动";

    @Column(length = 500)
    private String avatar = "";

    // 学习阶段
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EducationLevel educationLevel = EducationLevel.高中;

    // ──────────────────────────────────
    // 双等级系统
    // ──────────────────────────────────

    /** 星途学阶：等级（1-10，日常打卡升） */
    private Integer starLevel = 1;

    /** 星途学阶：当前经验值 */
    private Integer starExp = 0;

    /** 知源贡献：等级（1-10，发资源才升） */
    private Integer contribLevel = 1;

    /** 知源贡献：当前经验值 */
    private Integer contribExp = 0;

    /** 性别（true=女性，解锁生理期功能） */
    private Boolean isFemale = false;

    /** 是否管理员（开发者用） */
    private Boolean isAdmin = false;

    @Column(length = 20)
    private String theme = "default";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum EducationLevel {
        小学, 初中, 高中, 专升本, 本科, 考研, 考公, 自考
    }
}
