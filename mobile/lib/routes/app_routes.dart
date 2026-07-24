/// Named routes. Screens that need an argument (slot id, booking) are pushed
/// with MaterialPageRoute directly from the calling screen; these constants
/// cover the top-level destinations.
class Routes {
  const Routes._();

  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const home = '/home'; // bottom-nav shell
  static const scanner = '/scanner'; // admin/operator QR gate scan
}
