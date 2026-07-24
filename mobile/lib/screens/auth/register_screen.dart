import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../../utils/constants.dart';
import '../../utils/validators.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _phone = TextEditingController();
  final _vehicle = TextEditingController();
  bool _loading = false;
  String? _serverError;

  @override
  void dispose() {
    for (final c in [_name, _email, _password, _confirm, _phone, _vehicle]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _serverError = null;
    });
    try {
      final payload = <String, dynamic>{
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        if (_phone.text.trim().isNotEmpty) 'phone_number': _phone.text.trim(),
        if (_vehicle.text.trim().isNotEmpty) 'vehicle_number': _vehicle.text.trim(),
      };
      await context.read<AuthProvider>().register(payload);
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, Routes.home, (_) => false);
    } catch (e) {
      setState(() => _serverError = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: GlassCard(
              padding: const EdgeInsets.all(28),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const AppLogo(size: 40),
                    const SizedBox(height: 20),
                    const Text('Create your account',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    const Text('One minute now, zero circling later.',
                        style: TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 24),
                    TextFormField(
                      controller: _name,
                      decoration: const InputDecoration(labelText: 'Full name'),
                      validator: Validators.name,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: Validators.email,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password'),
                      validator: Validators.password,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _confirm,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Confirm password'),
                      validator: (v) =>
                          v != _password.text ? 'Passwords do not match' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Phone (optional)'),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _vehicle,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(labelText: 'Vehicle number (optional)'),
                    ),
                    if (_serverError != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(_serverError!,
                            style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                      ),
                    ],
                    const SizedBox(height: 24),
                    PrimaryButton(label: 'Create account', loading: _loading, onPressed: _submit),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text.rich(TextSpan(
                          text: 'Already registered? ',
                          style: TextStyle(color: AppColors.textSecondary),
                          children: [
                            TextSpan(
                                text: 'Sign in',
                                style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600)),
                          ],
                        )),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
