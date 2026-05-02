package com.warmcircle.controller;

import com.warmcircle.config.JwtUtil;
import com.warmcircle.entity.User;
import com.warmcircle.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证接口：注册 / 登录
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    /** 注册 */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByPhone(req.getPhone())) {
            return ResponseEntity.badRequest().body(Map.of("msg", "手机号已注册"));
        }
        User user = new User();
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname() != null ? req.getNickname() : "暖芽萌动");
        user.setIsFemale(req.getIsFemale() != null && req.getIsFemale());
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId(), user.getPhone(), false);
        return ResponseEntity.ok(Map.of("token", token, "userId", user.getId(), "msg", "注册成功"));
    }

    /** 登录 */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByPhone(req.getPhone()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("msg", "手机号或密码错误"));
        }
        String token = jwtUtil.generateToken(user.getId(), user.getPhone(), user.getIsAdmin());
        return ResponseEntity.ok(Map.of(
            "token",      token,
            "userId",     user.getId(),
            "nickname",   user.getNickname(),
            "isAdmin",    user.getIsAdmin(),
            "isFemale",   user.getIsFemale(),
            "starLevel",  user.getStarLevel(),
            "starTitle",  getStarTitle(user.getStarLevel())
        ));
    }

    // 复用称号（避免循环依赖，这里简单写死）
    private String getStarTitle(int level) {
        String[] titles = {"", "暖芽萌动","圈圈行者","晴心学伴","暖意日积","小圈达人",
                               "暖光引路","圈中精英","暖圈先锋","暖圈守望","暖圈至尊"};
        return level >= 1 && level <= 10 ? titles[level] : "暖芽萌动";
    }

    @Data
    static class RegisterRequest {
        @NotBlank @Pattern(regexp = "\\d{11}", message = "手机号格式不对")
        String phone;
        @NotBlank String password;
        String nickname;
        Boolean isFemale;
    }

    @Data
    static class LoginRequest {
        @NotBlank String phone;
        @NotBlank String password;
    }
}
