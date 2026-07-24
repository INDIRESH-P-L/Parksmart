import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../dashboard/dashboard_screen.dart';
import '../map/parking_map_screen.dart';
import '../booking/my_bookings_screen.dart';
import '../profile/profile_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../scanner/qr_scanner_screen.dart';

/// Bottom-nav shell. Tabs adapt to role:
///  - everyone: Dashboard, Map, Bookings, Profile
///  - admin: + Admin
///  - admin/operator: a Scan action (gate QR check-in/out)
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    final tabs = <_Tab>[
      const _Tab('Home', Icons.grid_view_rounded, DashboardScreen()),
      const _Tab('Map', Icons.map_outlined, ParkingMapScreen()),
      const _Tab('Bookings', Icons.confirmation_num_outlined, MyBookingsScreen()),
      const _Tab('Profile', Icons.person_outline, ProfileScreen()),
      if (auth.isAdmin)
        const _Tab('Admin', Icons.shield_outlined, AdminDashboardScreen()),
    ];
    final safeIndex = _index.clamp(0, tabs.length - 1);

    return Scaffold(
      extendBody: true,
      backgroundColor: AppColors.ink,
      body: IndexedStack(
        index: safeIndex,
        children: tabs.map((t) => t.screen).toList(),
      ),
      floatingActionButton: auth.isStaff
          ? FloatingActionButton.extended(
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.ink,
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const QrScannerScreen())),
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan', style: TextStyle(fontWeight: FontWeight.w700)),
            )
          : null,
      bottomNavigationBar: _GlassNavBar(
        tabs: tabs,
        index: safeIndex,
        onTap: (i) => setState(() => _index = i),
      ),
    );
  }
}

class _Tab {
  final String label;
  final IconData icon;
  final Widget screen;
  const _Tab(this.label, this.icon, this.screen);
}

class _GlassNavBar extends StatelessWidget {
  final List<_Tab> tabs;
  final int index;
  final ValueChanged<int> onTap;

  const _GlassNavBar({required this.tabs, required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  for (var i = 0; i < tabs.length; i++)
                    _NavItem(
                      tab: tabs[i],
                      active: i == index,
                      onTap: () => onTap(i),
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

class _NavItem extends StatelessWidget {
  final _Tab tab;
  final bool active;
  final VoidCallback onTap;

  const _NavItem({required this.tab, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? Colors.white.withOpacity(0.08) : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(tab.icon,
                  size: 22,
                  color: active ? AppColors.accent : AppColors.textSecondary),
              const SizedBox(height: 3),
              Text(
                tab.label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  color: active ? AppColors.textPrimary : AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
