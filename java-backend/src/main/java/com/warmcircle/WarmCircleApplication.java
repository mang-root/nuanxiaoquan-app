package com.warmcircle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 暖小圈 Spring Boot 主启动类
 * 端口 8080，Python 安全服务在 8000
 */
@SpringBootApplication
@EnableScheduling  // 开启定时任务（每日经验清零等）
public class WarmCircleApplication {
    public static void main(String[] args) {
        SpringApplication.run(WarmCircleApplication.class, args);
        System.out.println("╔══════════════════════════════════╗");
        System.out.println("║   暖小圈 Java 后端启动成功 🎉     ║");
        System.out.println("║   接口文档：/api/swagger-ui.html  ║");
        System.out.println("╚══════════════════════════════════╝");
    }
}
