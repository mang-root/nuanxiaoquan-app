// ============================================================
// 文件：screens/login_screen.dart
// 作用：登录页（仅手机号验证码登录）
// 页面风格：简约，居中LOGO，不花哨
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import '../services/api_service.dart';
import '../controllers/app_controller.dart';
import 'main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // 手机号输入控制器
  final _phoneController = TextEditingController();

  // 验证码输入控制器
  final _codeController = TextEditingController();

  // 发送验证码倒计时（60秒）
  int _countdown = 0;
  bool _isSendingCode = false;

  // 是否正在登录
  bool _isLoggingIn = false;

  // 认证服务
  final _authService = AuthService();

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // 背景白色，简约风格
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 32.w),
            child: Column(
              children: [
                SizedBox(height: 80.h),

                // ===================================================
                // 居中 LOGO 区域
                // ===================================================
                _buildLogo(context),

                SizedBox(height: 60.h),

                // ===================================================
                // 手机号登录表单
                // ===================================================
                _buildPhoneInput(),

                SizedBox(height: 16.h),

                _buildCodeInput(),

                SizedBox(height: 32.h),

                // 登录按钮
                _buildLoginButton(),

                SizedBox(height: 40.h),

                // 底部协议说明
                _buildAgreementText(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------
  // LOGO区域
  // -------------------------------------------------------
  Widget _buildLogo(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80.w,
          height: 80.w,
          decoration: BoxDecoration(
            color: Theme.of(context).primaryColor,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '暖',
              style: TextStyle(
                color: Colors.white,
                fontSize: 36.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        SizedBox(height: 16.h),
        Text(
          '暖小圈',
          style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 4.h),
        Text(
          '你的智能学习伙伴',
          style: TextStyle(fontSize: 13.sp, color: Colors.grey[500]),
        ),
      ],
    );
  }

  // -------------------------------------------------------
  // 手机号输入框
  // -------------------------------------------------------
  Widget _buildPhoneInput() {
    return TextField(
      controller: _phoneController,
      keyboardType: TextInputType.phone, // 弹出数字键盘
      maxLength: 11,
      decoration: InputDecoration(
        labelText: '手机号',
        hintText: '请输入11位手机号',
        prefixIcon: const Icon(Icons.phone_outlined),
        counterText: '', // 隐藏字数计数
      ),
    );
  }

  // -------------------------------------------------------
  // 验证码输入框 + 发送按钮
  // -------------------------------------------------------
  Widget _buildCodeInput() {
    return Row(
      children: [
        // 验证码输入框（占大部分宽度）
        Expanded(
          child: TextField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: const InputDecoration(
              labelText: '验证码',
              hintText: '6位验证码',
              prefixIcon: Icon(Icons.sms_outlined),
              counterText: '',
            ),
          ),
        ),
        SizedBox(width: 12.w),
        // 发送验证码按钮
        SizedBox(
          width: 100.w,
          child: OutlinedButton(
            onPressed: _countdown > 0 ? null : _sendVerificationCode,
            child: Text(
              _countdown > 0 ? '${_countdown}秒' : '发送验证码',
              style: TextStyle(fontSize: 12.sp),
            ),
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------
  // 登录按钮
  // -------------------------------------------------------
  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 50.h,
      child: ElevatedButton(
        onPressed: _isLoggingIn ? null : _loginWithPhone,
        child: _isLoggingIn
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
            : Text('登录 / 注册', style: TextStyle(fontSize: 16.sp)),
      ),
    );
  }

  // 用户协议说明
  Widget _buildAgreementText() {
    return Text(
      '登录即代表同意《用户协议》和《隐私政策》',
      style: TextStyle(fontSize: 11.sp, color: Colors.grey[400]),
      textAlign: TextAlign.center,
    );
  }

  // -------------------------------------------------------
  // 业务逻辑
  // -------------------------------------------------------

  // 发送验证码
  Future<void> _sendVerificationCode() async {
    final phone = _phoneController.text.trim();
    if (phone.length != 11) {
      Get.snackbar('提示', '请输入正确的11位手机号', snackPosition: SnackPosition.BOTTOM);
      return;
    }

    setState(() => _isSendingCode = true);

    try {
      // TODO: 调用后端发送短信API
      // await _authService.sendCode(phone: phone);

      // 开始60秒倒计时
      setState(() {
        _countdown = 60;
        _isSendingCode = false;
      });

      // 每秒减1
      Future.doWhile(() async {
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          setState(() => _countdown--);
        }
        return _countdown > 0;
      });

      Get.snackbar('已发送', '验证码已发送到 $phone', snackPosition: SnackPosition.BOTTOM);
    } catch (e) {
      setState(() => _isSendingCode = false);
      Get.snackbar('发送失败', '请稍后重试', snackPosition: SnackPosition.BOTTOM);
    }
  }

  // 手机号验证码登录
  Future<void> _loginWithPhone() async {
    final phone = _phoneController.text.trim();
    final code = _codeController.text.trim();

    if (phone.length != 11) {
      Get.snackbar('提示', '请输入正确的手机号');
      return;
    }
    if (code.length != 6) {
      Get.snackbar('提示', '请输入6位验证码');
      return;
    }

    setState(() => _isLoggingIn = true);

    try {
      // TODO: 调用实际登录API
      // final result = await _authService.loginWithCode(phone: phone, code: code);

      // 模拟登录成功（开发阶段使用）
      final controller = Get.find<AppController>();
      await controller.updateUserInfo(
        userId: 1,
        name: '暖小圈用户',
        gender: 'unknown',
      );

      Get.off(() => const MainScreen());
    } catch (e) {
      setState(() => _isLoggingIn = false);
      Get.snackbar('登录失败', '验证码错误或已过期');
    }
  }

}
