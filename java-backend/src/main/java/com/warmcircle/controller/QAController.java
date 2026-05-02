package com.warmcircle.controller;

import com.warmcircle.entity.QAPost;
import com.warmcircle.entity.User;
import com.warmcircle.repository.QAPostRepository;
import com.warmcircle.repository.UserRepository;
import com.warmcircle.service.LevelService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  暖圈答疑  -  用户提问 + 开发者（管理员）官方回答      ║
 * ║                                                       ║
 * ║  设计说明：                                           ║
 * ║  · 入口在"知识小馆"页面，不单独做 Tab                 ║
 * ║  · 管理员用同一个 APP 登录，isAdmin=true 自动显示回答入口 ║
 * ║  · 普通用户看不到管理员专用 UI                         ║
 * ╚═══════════════════════════════════════════════════════╝
 */
@RestController
@RequestMapping("/qa")
public class QAController {

    @Autowired private QAPostRepository qaRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private LevelService levelService;

    /** 获取问题列表（所有人可见，无需登录） */
    @GetMapping("/list")
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<QAPost> posts;
        if (category != null && !category.equals("全部")) {
            posts = qaRepo.findByParentIdIsNullAndCategory(category, pageRequest);
        } else {
            posts = qaRepo.findByParentIdIsNull(pageRequest);
        }
        return ResponseEntity.ok(posts);
    }

    /** 获取某个问题的回复（无需登录） */
    @GetMapping("/detail/{postId}")
    public ResponseEntity<?> getReplies(@PathVariable Long postId) {
        QAPost parent = qaRepo.findById(postId).orElse(null);
        if (parent == null) return ResponseEntity.notFound().build();
        var replies = qaRepo.findByParentIdOrderByCreatedAtAsc(postId);
        return ResponseEntity.ok(Map.of("question", parent, "replies", replies));
    }

    /** 用户提问（需登录） */
    @PostMapping("/ask")
    public ResponseEntity<?> ask(@Valid @RequestBody AskRequest req, HttpServletRequest http) {
        Long userId = (Long) http.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("msg", "请先登录"));

        User user = userRepo.findById(userId).orElseThrow();

        QAPost post = new QAPost();
        post.setUserId(userId);
        post.setUserNickname(user.getNickname());
        post.setContent(req.getContent());
        post.setCategory(req.getCategory() != null ? req.getCategory() : "其他");
        post.setIsOfficial(false);
        qaRepo.save(post);

        // 提问奖励学阶经验
        levelService.addStarExp(userId, "post_qa");

        return ResponseEntity.ok(Map.of("msg", "提问成功，暖圈君会尽快回答～", "postId", post.getId()));
    }

    /**
     * 管理员回复（仅 isAdmin=true 可用）
     * 普通用户调用返回 403，不暴露管理功能
     */
    @PostMapping("/reply")
    public ResponseEntity<?> reply(@Valid @RequestBody ReplyRequest req, HttpServletRequest http) {
        Boolean isAdmin = (Boolean) http.getAttribute("isAdmin");
        Long userId = (Long) http.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("msg", "请先登录"));
        if (!Boolean.TRUE.equals(isAdmin)) return ResponseEntity.status(403).body(Map.of("msg", "无权限"));

        QAPost parent = qaRepo.findById(req.getParentId()).orElse(null);
        if (parent == null) return ResponseEntity.badRequest().body(Map.of("msg", "问题不存在"));

        User admin = userRepo.findById(userId).orElseThrow();

        QAPost reply = new QAPost();
        reply.setUserId(userId);
        reply.setUserNickname("暖圈官方");  // 管理员统一显示为"暖圈官方"
        reply.setContent(req.getContent());
        reply.setParentId(req.getParentId());
        reply.setIsOfficial(true);
        qaRepo.save(reply);

        // 更新父帖"已有官方回复"标志
        parent.setHasOfficialReply(true);
        qaRepo.save(parent);

        return ResponseEntity.ok(Map.of("msg", "回复成功"));
    }

    /** 点赞（需登录） */
    @PostMapping("/{postId}/like")
    public ResponseEntity<?> like(@PathVariable Long postId, HttpServletRequest http) {
        if (http.getAttribute("userId") == null) return ResponseEntity.status(401).build();
        QAPost post = qaRepo.findById(postId).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();
        post.setLikes(post.getLikes() + 1);
        qaRepo.save(post);
        return ResponseEntity.ok(Map.of("likes", post.getLikes()));
    }

    @Data static class AskRequest {
        @NotBlank String content;
        String category;
    }

    @Data static class ReplyRequest {
        @NotBlank Long parentId;
        @NotBlank String content;
    }
}
