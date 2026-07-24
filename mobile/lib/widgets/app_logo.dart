import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// Brand mark drawn with widgets (no bundled image asset needed): a volt
/// rounded square with an ink "P".
class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 36});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [
          BoxShadow(color: AppColors.accent.withOpacity(0.35), blurRadius: 18),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        'P',
        style: TextStyle(
          color: AppColors.ink,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.62,
          height: 1,
        ),
      ),
    );
  }
}

/// Wordmark: "Park" + volt "Smart".
class AppWordmark extends StatelessWidget {
  final double fontSize;
  const AppWordmark({super.key, this.fontSize = 18});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w800),
        children: const [
          TextSpan(text: 'Park', style: TextStyle(color: AppColors.textPrimary)),
          TextSpan(text: 'Smart', style: TextStyle(color: AppColors.accent)),
        ],
      ),
    );
  }
}
