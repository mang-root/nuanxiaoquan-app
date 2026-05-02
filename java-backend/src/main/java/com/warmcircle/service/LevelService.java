package com.warmcircle.service;

import com.warmcircle.entity.User;
import com.warmcircle.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              暖小圈 双等级系统                           ║
 * ║                                                          ║
 * ║  星途学阶：日常打卡/自习/记账/生理期记录 → 快速升         ║
 * ║  暖源贡献：发布资源/被点赞收藏 → 慢速升（激励分享）       ║
 * ╚══════════════════════════════════════════════════════════╝
 */
@Service
public class LevelService {

    @Autowired
    private UserRepository userRepository;

    // ──────────────────────────────────────────────────────────
    // 星途学阶：升级所需经验（Lv1→2 需要100，以此类推）
    // ──────────────────────────────────────────────────────────
    private static final Map<Integer, Integer> STAR_EXP_TABLE = Map.of(
        1, 100,   // 暖芽萌动 → 圈圈行者
        2, 200,
        3, 320,
        4, 480,
        5, 650,
        6, 850,
        7, 1100,
        8, 1400,
        9, 1800,
        10, 9999  // 满级封顶
    );

    // 知源贡献：比学阶同级高约 50%
    private static final Map<Integer, Integer> CONTRIB_EXP_TABLE = Map.of(
        1, 150,
        2, 320,
        3, 500,
        4, 730,
        5, 1000,
        6, 1300,
        7, 1700,
        8, 2150,
        9, 2800,
        10, 9999
    );

    // ──────────────────────────────────────────────────────────
    // 各行为获得的星途经验（日常工具使用都能涨）
    // ──────────────────────────────────────────────────────────
    private static final Map<String, Integer> STAR_REWARDS = new HashMap<>() {{
        put("daily_login",        10);   // 每日登录
        put("study_30min",        20);   // 自习室专注30分钟
        put("study_60min",        50);   // 专注60分钟
        put("complete_plan_task", 30);   // 完成学习计划任务
        put("add_accounting",     15);   // 记账一笔（关联记账功能）
        put("view_monthly_bill",  10);   // 查看月账单分析
        put("log_menstrual",      20);   // 记录生理期（关联生理期功能）
        put("view_prediction",    10);   // 查看生理期预测
        put("view_resource",       5);   // 浏览资源
        put("view_quote",          2);   // 查看今日语录
        put("post_qa",            15);   // 在答疑区提问
    }};

    // 各行为获得的暖源贡献经验（必须发资源才有）
    private static final Map<String, Integer> CONTRIB_REWARDS = new HashMap<>() {{
        put("publish_resource",    50);  // 发布资源
        put("resource_liked",      10);  // 资源被点赞
        put("resource_collected",  20);  // 资源被收藏
        put("resource_downloaded", 15);  // 资源被下载
        put("resource_featured",  100);  // 资源被AI推荐到首页
        put("qa_answer_liked",     25);  // 在答疑区的回答被点赞（鼓励互帮）
    }};

    /** 给用户增加星途学阶经验 */
    @Transactional
    public Map<String, Object> addStarExp(Long userId, String action) {
        int gain = STAR_REWARDS.getOrDefault(action, 0);
        if (gain == 0) return Map.of("success", false, "msg", "未知行为: " + action);

        User user = userRepository.findById(userId).orElseThrow();
        user.setStarExp(user.getStarExp() + gain);

        boolean levelUp = false;
        int newLevel = user.getStarLevel();
        if (newLevel < 10 && user.getStarExp() >= STAR_EXP_TABLE.get(newLevel)) {
            newLevel = Math.min(newLevel + 1, 10);
            user.setStarLevel(newLevel);
            user.setStarExp(0);
            levelUp = true;
        }
        userRepository.save(user);

        return Map.of(
            "success", true,
            "gained", gain,
            "levelUp", levelUp,
            "level", user.getStarLevel(),
            "title", getStarTitle(user.getStarLevel()),
            "exp", user.getStarExp(),
            "nextExp", STAR_EXP_TABLE.getOrDefault(user.getStarLevel(), 9999)
        );
    }

    /** 给用户增加暖源贡献经验 */
    @Transactional
    public Map<String, Object> addContribExp(Long userId, String action) {
        int gain = CONTRIB_REWARDS.getOrDefault(action, 0);
        if (gain == 0) return Map.of("success", false, "msg", "该行为不产生贡献经验");

        User user = userRepository.findById(userId).orElseThrow();
        user.setContribExp(user.getContribExp() + gain);

        boolean levelUp = false;
        int newLevel = user.getContribLevel();
        if (newLevel < 10 && user.getContribExp() >= CONTRIB_EXP_TABLE.get(newLevel)) {
            newLevel = Math.min(newLevel + 1, 10);
            user.setContribLevel(newLevel);
            user.setContribExp(0);
            levelUp = true;
        }
        userRepository.save(user);

        return Map.of(
            "success", true,
            "gained", gain,
            "levelUp", levelUp,
            "level", user.getContribLevel(),
            "title", getContribTitle(user.getContribLevel()),
            "exp", user.getContribExp(),
            "nextExp", CONTRIB_EXP_TABLE.getOrDefault(user.getContribLevel(), 9999)
        );
    }

    /** 获取用户完整等级信息 */
    public Map<String, Object> getLevelInfo(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return Map.of(
            "star", Map.of(
                "level",   user.getStarLevel(),
                "title",   getStarTitle(user.getStarLevel()),
                "exp",     user.getStarExp(),
                "nextExp", STAR_EXP_TABLE.getOrDefault(user.getStarLevel(), 9999),
                "desc",    getStarDesc(user.getStarLevel())
            ),
            "contrib", Map.of(
                "level",   user.getContribLevel(),
                "title",   getContribTitle(user.getContribLevel()),
                "exp",     user.getContribExp(),
                "nextExp", CONTRIB_EXP_TABLE.getOrDefault(user.getContribLevel(), 9999),
                "desc",    getContribDesc(user.getContribLevel())
            )
        );
    }

    // ──────────────────────────────────────────────────────────
    // 星途学阶称号（与"暖小圈"品牌强关联）
    // 升级逻辑：用了记账/生理期/学习工具，就像暖芽一点点生长
    // ──────────────────────────────────────────────────────────
    private String getStarTitle(int level) {
        return switch (level) {
            case 1  -> "暖芽萌动";    // 刚注册，像小芽破土
            case 2  -> "圈圈行者";    // 开始用工具，踏上暖圈之路
            case 3  -> "晴心学伴";    // 记账/生理期/学习 初体验
            case 4  -> "暖意日积";    // 坚持打卡，暖意一点点积累
            case 5  -> "小圈达人";    // 三大工具都用熟了
            case 6  -> "暖光引路";    // 自己变好了，也在引导别人
            case 7  -> "圈中精英";    // 暖小圈的核心用户
            case 8  -> "暖圈先锋";    // 先锋探索者
            case 9  -> "暖圈守望";    // 守护暖小圈社区
            case 10 -> "暖圈至尊";    // 无上荣耀
            default -> "暖芽萌动";
        };
    }

    // 星途学阶描述（在个人中心展示，让用户有代入感）
    private String getStarDesc(int level) {
        return switch (level) {
            case 1  -> "欢迎来到暖小圈，记录你的第一笔账吧～";
            case 2  -> "已踏上暖圈之路，坚持使用各项工具";
            case 3  -> "记账、生理期、学习计划……用暖小圈记录生活";
            case 4  -> "每一天的积累都算数，暖意正在生长";
            case 5  -> "三大核心工具你都驾驭了，了不起！";
            case 6  -> "你的进步或许正在鼓励着身边的人";
            case 7  -> "暖小圈的精英用户，学习生活两不误";
            case 8  -> "先锋探索者，总是第一个尝试新功能";
            case 9  -> "默默守护着暖圈的温度与氛围";
            case 10 -> "暖小圈荣耀之巅，传说中的存在";
            default -> "";
        };
    }

    // ──────────────────────────────────────────────────────────
    // 暖源贡献称号（与资源分享、帮助他人强关联）
    // 升级逻辑：在暖小圈分享资源，是"传递温暖"的象征
    // ──────────────────────────────────────────────────────────
    private String getContribTitle(int level) {
        return switch (level) {
            case 1  -> "知芽初生";     // 第一次分享资源，知识的幼芽
            case 2  -> "暖圈分享者";   // 开始分享，把暖意传递出去
            case 3  -> "资料小暖手";   // 分享了不少资料，别人受益
            case 4  -> "暖心传递者";   // 传递温暖的使者
            case 5  -> "圈中知灯";     // 在暖圈里发光，照亮求学之路
            case 6  -> "暖圈布道师";   // 积极传播好资源，布道者
            case 7  -> "资源守护星";   // 守护知识质量的明星
            case 8  -> "暖圈灯塔";     // 灯塔般指引迷茫的学习者
            case 9  -> "暖源大师";     // 知识与温暖的来源
            case 10 -> "暖源至尊";     // 暖小圈知识贡献最高荣誉
            default -> "知芽初生";
        };
    }

    private String getContribDesc(int level) {
        return switch (level) {
            case 1  -> "你分享的第一份资料，可能改变了一个人的学习轨迹";
            case 2  -> "感谢你把暖意带进圈子里";
            case 3  -> "你的资料已经帮助了很多同学，继续加油～";
            case 4  -> "传递温暖，你做到了";
            case 5  -> "你是圈中的一盏灯，照亮了别人的求学路";
            case 6  -> "积极布道，让更多人受益于你的分享";
            case 7  -> "你的高质量资源是暖小圈的宝贝";
            case 8  -> "灯塔永不熄灭，你指引着无数求学者";
            case 9  -> "温暖与知识的双重大师";
            case 10 -> "暖小圈因你而更暖，感谢你的一切贡献";
            default -> "";
        };
    }
}
