// ============================================================
// 文件：controllers/app_controller.dart
// 作用：全局控制器，管理整个APP的公共状态
// 比如：主题切换、用户信息、AI悬浮按钮开关等
// GetxController = GetX 提供的控制器基类
// ============================================================

import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppController extends GetxController {
  // --------------------------------------------------------
  // 主题切换回调（由 main.dart 注入，其他页面调用）
  // --------------------------------------------------------
  Function(String)? onThemeChange;

  // --------------------------------------------------------
  // 用 Rx 类型定义可观察变量
  // 当这些变量变化时，界面会自动刷新（响应式编程）
  // .obs 是 GetX 的扩展方法，让普通变量变成"可观察的"
  // --------------------------------------------------------

  // AI悬浮按钮是否显示（三档：0=关闭 1=保留按钮关问候 2=完全关闭）
  final RxInt aiButtonMode = 1.obs;

  // 每日问候气泡是否开启
  final RxBool showDailyGreeting = true.obs;

  // 当前登录的用户ID（0代表未登录）
  final RxInt currentUserId = 0.obs;

  // 当前用户昵称
  final RxString currentUserName = ''.obs;

  // 当前用户头像URL
  final RxString currentUserAvatar = ''.obs;

  // 用户性别（'male'/'female'/'unknown'）
  // 生理期功能仅在 female 时解锁
  final RxString userGender = 'unknown'.obs;

  // 星途学阶等级（日常学习打卡等级）
  final RxInt studyLevel = 1.obs;

  // 星途学阶经验值
  final RxInt studyExp = 0.obs;

  // 知源贡献等级（发布资源专属等级）
  final RxInt contributeLevel = 1.obs;

  // 知源贡献经验值
  final RxInt contributeExp = 0.obs;

  // 是否管理员（后端 isAdmin=true 时解锁回复功能）
  final RxBool _isAdmin = false.obs;
  bool get isAdmin => _isAdmin.value;

  // 是否已登录
  bool get isLoggedIn => currentUserId.value > 0;

  // 是否解锁生理期功能（仅女性用户）
  bool get isMenstrualUnlocked => userGender.value == 'female';

  @override
  void onInit() {
    super.onInit();
    _loadSettings(); // 初始化时读取本地设置
  }

  // 读取本地保存的设置
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();

    aiButtonMode.value = prefs.getInt('ai_button_mode') ?? 1;
    showDailyGreeting.value = prefs.getBool('show_daily_greeting') ?? true;
    currentUserId.value = prefs.getInt('user_id') ?? 0;
    currentUserName.value = prefs.getString('user_name') ?? '';
    currentUserAvatar.value = prefs.getString('user_avatar') ?? '';
    userGender.value = prefs.getString('user_gender') ?? 'unknown';
    _isAdmin.value = prefs.getBool('is_admin') ?? false;
    studyLevel.value = prefs.getInt('study_level') ?? 1;
    studyExp.value = prefs.getInt('study_exp') ?? 0;
    contributeLevel.value = prefs.getInt('contribute_level') ?? 1;
    contributeExp.value = prefs.getInt('contribute_exp') ?? 0;
  }

  // 保存AI按钮模式设置
  Future<void> setAiButtonMode(int mode) async {
    aiButtonMode.value = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('ai_button_mode', mode);
  }

  // 更新用户信息（登录成功后调用）
  Future<void> updateUserInfo({
    required int userId,
    required String name,
    String avatar = '',
    String gender = 'unknown',
    bool admin = false,
    int studyLv = 1,
    int studyE = 0,
    int contributeLv = 1,
    int contributeE = 0,
  }) async {
    currentUserId.value = userId;
    currentUserName.value = name;
    currentUserAvatar.value = avatar;
    userGender.value = gender;
    _isAdmin.value = admin;
    studyLevel.value = studyLv;
    studyExp.value = studyE;
    contributeLevel.value = contributeLv;
    contributeExp.value = contributeE;

    // 同步保存到本地
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('user_id', userId);
    await prefs.setString('user_name', name);
    await prefs.setString('user_avatar', avatar);
    await prefs.setString('user_gender', gender);
    await prefs.setBool('is_admin', admin);
    await prefs.setInt('study_level', studyLv);
    await prefs.setInt('study_exp', studyE);
    await prefs.setInt('contribute_level', contributeLv);
    await prefs.setInt('contribute_exp', contributeE);
  }

  // 退出登录（清空所有登录信息）
  Future<void> logout() async {
    currentUserId.value = 0;
    currentUserName.value = '';
    currentUserAvatar.value = '';
    userGender.value = 'unknown';
    _isAdmin.value = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_avatar');
    await prefs.remove('user_gender');
    await prefs.remove('is_admin');
    await prefs.remove('token');
  }

  // 更新性别（用于生理期功能解锁）
  Future<void> updateGender(String gender) async {
    userGender.value = gender;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_gender', gender);
  }
}
