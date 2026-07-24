import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../routes/app_routes.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _vehicle;
  final _password = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user;
    _name = TextEditingController(text: u?.name ?? '');
    _phone = TextEditingController(text: u?.phoneNumber ?? '');
    _vehicle = TextEditingController(text: u?.vehicleNumber ?? '');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().fetchMyBookings();
    });
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _vehicle, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await context.read<AuthProvider>().updateProfile({
        'name': _name.text.trim(),
        'phone_number': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        'vehicle_number': _vehicle.text.trim().isEmpty ? null : _vehicle.text.trim(),
        if (_password.text.isNotEmpty) 'password': _password.text,
      });
      _password.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) {
      Navigator.pushNamedAndRemoveUntil(context, Routes.login, (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final bookings = context.watch<BookingProvider>().bookings;
    final completed = bookings.where((b) => b.status == 'completed').length;
    final active = bookings.where((b) => ['confirmed', 'active'].contains(b.status)).length;

    return AppScaffold(
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Profile', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 16),
          GlassCard(
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(colors: [AppColors.accent, AppColors.mint]),
                  ),
                  child: Text(Format.initials(user?.name),
                      style: const TextStyle(color: AppColors.ink, fontSize: 24, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 12),
                Text(user?.name ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                Text(user?.email ?? '', style: const TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.mint.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text((user?.role ?? 'user').toUpperCase(),
                      style: const TextStyle(color: AppColors.mintSoft, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _stat('Bookings', '${bookings.length}', AppColors.textPrimary),
              const SizedBox(width: 12),
              _stat('Completed', '$completed', AppColors.mintSoft),
              const SizedBox(width: 12),
              _stat('Active', '$active', AppColors.accent),
            ],
          ),
          const SizedBox(height: 16),
          GlassCard(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Edit profile',
                        style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _name,
                    decoration: const InputDecoration(labelText: 'Full name'),
                    validator: (v) => (v == null || v.trim().length < 2) ? 'Name is too short' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
                  const SizedBox(height: 12),
                  TextFormField(controller: _vehicle, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Vehicle number')),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'New password',
                      helperText: 'Leave blank to keep current',
                      helperStyle: TextStyle(color: AppColors.textMuted),
                    ),
                    validator: (v) => (v != null && v.isNotEmpty && v.length < 8) ? 'At least 8 characters' : null,
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(label: 'Save changes', loading: _saving, onPressed: _save),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Log out', variant: BtnVariant.danger, icon: Icons.logout, onPressed: _logout),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) => Expanded(
        child: GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
              const SizedBox(height: 2),
              Text(label.toUpperCase(),
                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.5)),
            ],
          ),
        ),
      );
}
