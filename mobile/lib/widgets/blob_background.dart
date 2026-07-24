import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// The drifting mint/teal/volt gradient mesh behind every screen — the mobile
/// port of the web's animated blob field. Three blurred circles slowly orbit
/// via a single long-running controller. Wrap screen content in a Stack over
/// this (see AppScaffold).
class BlobBackground extends StatefulWidget {
  const BlobBackground({super.key});

  @override
  State<BlobBackground> createState() => _BlobBackgroundState();
}

class _BlobBackgroundState extends State<BlobBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 26))
        ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: ColoredBox(
          color: AppColors.ink,
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, _) {
              final t = _c.value * 2 * math.pi;
              return Stack(
                children: [
                  _blob(
                    color: AppColors.mint,
                    align: Alignment(-0.8 + 0.3 * math.sin(t), -0.9 + 0.2 * math.cos(t)),
                    size: 360,
                    opacity: 0.32,
                  ),
                  _blob(
                    color: AppColors.teal,
                    align: Alignment(0.9 + 0.2 * math.cos(t), 0.9 + 0.2 * math.sin(t)),
                    size: 380,
                    opacity: 0.30,
                  ),
                  _blob(
                    color: AppColors.accent,
                    align: Alignment(0.4 * math.cos(t * 0.7), 0.2 + 0.3 * math.sin(t)),
                    size: 300,
                    opacity: 0.14,
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _blob({
    required Color color,
    required Alignment align,
    required double size,
    required double opacity,
  }) {
    return Align(
      alignment: align,
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 90, sigmaY: 90),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withOpacity(opacity),
          ),
        ),
      ),
    );
  }
}

/// Convenience scaffold: blob background + safe content, transparent AppBar.
class AppScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? floatingActionButton;
  final Widget? bottomNavigationBar;

  const AppScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.floatingActionButton,
    this.bottomNavigationBar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      extendBodyBehindAppBar: true,
      backgroundColor: AppColors.ink,
      appBar: appBar,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomNavigationBar,
      body: Stack(
        children: [
          const BlobBackground(),
          SafeArea(bottom: false, child: body),
        ],
      ),
    );
  }
}
