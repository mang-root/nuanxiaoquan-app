package com.warmcircle.controller;

import com.warmcircle.entity.Feedback;
import com.warmcircle.repository.FeedbackRepository;
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
 * 意见反馈接口
 * 用户提交建议 → 管理员后台查看 + 回复
 */
@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepo;

    /** 提交反馈（需登录） */
    @PostMapping("/submit")
    public ResponseEntity<?> submit(@Valid @RequestBody SubmitRequest req, HttpServletRequest http) {
        Long userId = (Long) http.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("msg", "请先登录"));

        Feedback fb = new Feedback();
        fb.setUserId(userId);
        fb.setContent(req.getContent());
        fb.setCategory(req.getCategory() != null ? req.getCategory() : "其他");
        feedbackRepo.save(fb);
        return ResponseEntity.ok(Map.of("msg", "提交成功，感谢你的建议！"));
    }

    /** 管理员查看所有反馈（仅 admin） */
    @GetMapping("/list")
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean handled,
            HttpServletRequest http) {

        if (!Boolean.TRUE.equals(http.getAttribute("isAdmin"))) {
            return ResponseEntity.status(403).body(Map.of("msg", "无权限"));
        }
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Feedback> result = handled != null
                ? feedbackRepo.findByHandled(handled, pr)
                : feedbackRepo.findAll(pr);
        return ResponseEntity.ok(result);
    }

    /** 管理员回复并标记已处理（仅 admin） */
    @PostMapping("/{id}/reply")
    public ResponseEntity<?> reply(@PathVariable Long id, @RequestBody Map<String, String> body,
                                   HttpServletRequest http) {
        if (!Boolean.TRUE.equals(http.getAttribute("isAdmin"))) {
            return ResponseEntity.status(403).body(Map.of("msg", "无权限"));
        }
        Feedback fb = feedbackRepo.findById(id).orElse(null);
        if (fb == null) return ResponseEntity.notFound().build();
        fb.setAdminReply(body.get("reply"));
        fb.setHandled(true);
        feedbackRepo.save(fb);
        return ResponseEntity.ok(Map.of("msg", "已回复"));
    }

    @Data
    static class SubmitRequest {
        @NotBlank String content;
        String category;
    }
}
