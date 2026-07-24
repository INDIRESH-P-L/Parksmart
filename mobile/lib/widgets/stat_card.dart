import 'package:flutter/material.dart';
import '../utils/constants.dart';
import 'glass_card.dart';

/// A dashboard counter tile — floats gently (the mobile echo of the web's
/// floating stat widgets).
class StatCard extends StatefulWidget {
  final String label;
  final String value;
  final Color dot;
  final Color? glow;
  final int index; // staggers the float loop

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.dot,
    this.glow,
    this.index = 0,
  });

  @override
  State<StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<StatCard> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 3),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        // phase-shift per index so tiles don't bob in unison
        final phase = (_c.value + widget.index * 0.25) % 1.0;
        final dy = -3 * (0.5 - (phase - 0.5).abs()) * 2;
        return Transform.translate(offset: Offset(0, dy), child: child);
      },
      child: GlassCard(
        glow: widget.glow,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: widget.dot, shape: BoxShape.circle),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.label.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.4,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(widget.value,
                style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
