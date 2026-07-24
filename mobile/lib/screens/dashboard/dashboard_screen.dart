import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/availability.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../providers/parking_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/booking_card.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/stat_card.dart';
import '../ticket/active_ticket_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchAvailability();
      context.read<BookingProvider>().fetchMyBookings();
    });
  }

  Future<void> _refresh() async {
    await Future.wait([
      context.read<ParkingProvider>().fetchAvailability(),
      context.read<BookingProvider>().fetchMyBookings(),
    ]);
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final availability = context.watch<ParkingProvider>().availability;
    final bookings = context.watch<BookingProvider>();
    final todays = bookings.bookings
        .where((b) => b.status != 'cancelled')
        .take(3)
        .toList();

    return AppScaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppColors.accent,
        backgroundColor: AppColors.inkSoft,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          children: [
            Text('$_greeting, ${user?.name.split(' ').first ?? ''}',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
              Format.date(DateTime.now()),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            _statsGrid(availability),
            const SizedBox(height: 24),
            const Text('Today\'s bookings',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
            const SizedBox(height: 12),
            if (bookings.loading && todays.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: AppColors.accent)))
            else if (todays.isEmpty)
              GlassCard(
                child: Column(children: const [
                  Text('Nothing booked yet.', style: TextStyle(color: AppColors.textMuted)),
                  SizedBox(height: 4),
                  Text('Head to the Map tab to grab a spot.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ]),
              )
            else
              ...todays.map((b) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: BookingCard(
                      booking: b,
                      onTapTicket: b.hasTicket
                          ? () => Navigator.push(context,
                              MaterialPageRoute(builder: (_) => ActiveTicketScreen(booking: b)))
                          : null,
                    ),
                  )),
            const SizedBox(height: 12),
            if (availability != null) _heatmap(availability),
          ],
        ),
      ),
    );
  }

  Widget _statsGrid(Availability? a) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.7,
      children: [
        StatCard(label: 'Available', value: '${a?.available ?? '—'}', dot: AppColors.lime, glow: AppColors.mint, index: 0),
        StatCard(label: 'Occupied', value: '${a?.occupied ?? '—'}', dot: AppColors.danger, index: 1),
        StatCard(label: 'Reserved', value: '${a?.reserved ?? '—'}', dot: AppColors.warn, index: 2),
        StatCard(label: 'Total slots', value: '${a?.total ?? '—'}', dot: AppColors.accent, glow: AppColors.accent, index: 3),
      ],
    );
  }

  Widget _heatmap(Availability a) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Parking heat map',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          const SizedBox(height: 14),
          ...a.zones.map((z) {
            final density = z.density;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(z.zone, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                      Text('${(density * 100).round()}% full',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: density.clamp(0.04, 1),
                      minHeight: 8,
                      backgroundColor: Colors.white.withOpacity(0.08),
                      valueColor: AlwaysStoppedAnimation(
                        density > 0.75 ? AppColors.danger : density > 0.4 ? AppColors.warn : AppColors.mint,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
