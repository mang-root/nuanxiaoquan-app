package com.warmcircle.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具类：生成/解析/验证 Token
 */
@Component
public class JwtUtil {

    @Value("${warmcircle.jwt-secret}")
    private String secret;

    @Value("${warmcircle.jwt-expire-hours}")
    private int expireHours;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** 生成 Token（登录成功后调用） */
    public String generateToken(Long userId, String phone, boolean isAdmin) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("phone", phone)
                .claim("isAdmin", isAdmin)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + (long) expireHours * 3600 * 1000))
                .signWith(getKey())
                .compact();
    }

    /** 从 Token 中拿用户 ID */
    public Long getUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    /** 判断是否管理员 */
    public boolean isAdmin(String token) {
        return (Boolean) parseClaims(token).get("isAdmin");
    }

    /** 验证 Token 是否有效 */
    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
