import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../routes/app_routes.dart';
import '../widgets/app_logo.dart';
import '../widgets/blob_background.dart';
import '../utils/constants.dart';

/// Boot screen: runs auth bootstrap (validate stored token) then routes to the
/// home shell or login.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final auth = context.read<AuthProvider>();
    await auth.bootstrap();
    // small min-dwell so the splash doesn't flash
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    Navigator.pushReplacementNamed(
      context,
      auth.isAuthed ? Routes.home : Routes.login,
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppLogo(size: 76),
            const SizedBox(height: 20),
            const AppWordmark(fontSize: 26),
            const SizedBox(height: 8),
            const Text('Park smarter, not longer.',
                style: TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 40),
            SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColors.accent.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
