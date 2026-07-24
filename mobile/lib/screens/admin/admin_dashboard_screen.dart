import 'package:flutter/material.dart';
import '../../services/admin_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';
import '../scanner/qr_scanner_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final _service = AdminService();
  Map<String, dynamic>? _summary;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final s = await _service.summary();
      if (mounted) setState(() => _summary = s);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.accent,
        backgroundColor: AppColors.inkSoft,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          children: [
            const Text('Admin', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('System overview & gate operations',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 20),
            if (_error != null)
              GlassCard(child: Text(_error!, style: const TextStyle(color: AppColors.danger)))
            else if (_summary == null)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: AppColors.accent)))
            else
              _stats(_summary!),
            const SizedBox(height: 20),
            PrimaryButton(
              label: 'Scan gate QR',
              icon: Icons.qr_code_scanner,
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const QrScannerScreen())),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stats(Map<String, dynamic> s) {
    final slots = s['slots'] as Map<String, dynamic>? ?? {};
    final bookings = s['bookings'] as Map<String, dynamic>? ?? {};
    final revenue = s['revenue'] as Map<String, dynamic>? ?? {};
    final users = s['users'] as Map<String, dynamic>? ?? {};
    final occupancy = ((slots['occupancyRate'] as num?) ?? 0) * 100;

    final tiles = <(String, String, Color)>[
      ('Occupancy', '${occupancy.round()}%', AppColors.accent),
      ('Bookings today', '${bookings['today'] ?? 0}', AppColors.lime),
      ('Active now', '${bookings['active'] ?? 0}', AppColors.mintSoft),
      ('Revenue 30d', Format.currency(revenue['last30Days'] as num?), AppColors.accent),
      ('Users', '${users['total'] ?? 0}', AppColors.textPrimary),
      ('Total bookings', '${bookings['total'] ?? 0}', AppColors.textPrimary),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.7,
      children: tiles
          .map((t) => GlassCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(t.$1.toUpperCase(),
                        style: const TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.5)),
                    const SizedBox(height: 6),
                    Text(t.$2, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: t.$3)),
                  ],
                ),
              ))
          .toList(),
    );
  }
}
