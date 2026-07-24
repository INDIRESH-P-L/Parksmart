import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';

enum BtnVariant { primary, mint, glass, danger }

/// App button with a built-in loading state (CTA → spinner), matching the web
/// Button's behaviour.
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final BtnVariant variant;
  final IconData? icon;
  final bool expand;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.variant = BtnVariant.primary,
    this.icon,
    this.expand = true,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (variant) {
      BtnVariant.primary => (AppColors.accent, AppColors.ink, null),
      BtnVariant.mint => (AppColors.mint, Colors.white, null),
      BtnVariant.glass => (Colors.white.withOpacity(0.06), AppColors.textPrimary, AppColors.glassBorder),
      BtnVariant.danger => (AppColors.danger.withOpacity(0.15), AppColors.danger, AppColors.danger.withOpacity(0.3)),
    };

    final disabled = loading || onPressed == null;

    return SizedBox(
      width: expand ? double.infinity : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 150),
        opacity: disabled ? 0.6 : 1,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(AppTheme.rButton),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppTheme.rButton),
            onTap: disabled ? null : onPressed,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.rButton),
                border: border != null ? Border.all(color: border) : null,
              ),
              child: Row(
                mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: loading
                    ? [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: fg),
                        ),
                      ]
                    : [
                        if (icon != null) ...[Icon(icon, size: 18, color: fg), const SizedBox(width: 8)],
                        Text(
                          label,
                          style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 15),
                        ),
                      ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
