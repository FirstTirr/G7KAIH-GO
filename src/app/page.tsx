import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SMK Negeri 4 Payakumbuh</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Masuk
              </Link>
              <Link 
                href="/login" 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Sistem Monitoring
                  <span className="text-blue-600 block">Aktivitas Siswa</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Platform digital untuk memantau dan mengelola aktivitas pembelajaran siswa SMK Negeri 4 Payakumbuh secara real-time.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/login" 
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Mulai Sekarang
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-200 font-semibold text-lg">
                  Pelajari Lebih Lanjut
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Siswa Aktif</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-gray-600">Guru</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">1000+</div>
                  <div className="text-sm text-gray-600">Aktivitas</div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/hero.png"
                  alt="SMK Negeri 4 Payakumbuh - Sistem Monitoring"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl"
                  priority
                />
              </div>
              {/* Background decorations */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-green-100 rounded-full opacity-50 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistem yang dirancang khusus untuk memudahkan monitoring aktivitas siswa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Dashboard Siswa
              </h3>
              <p className="text-gray-600">
                Siswa dapat melihat dan melacak aktivitas pembelajaran mereka secara real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Panel Guru
              </h3>
              <p className="text-gray-600">
                Guru dapat memantau aktivitas siswa dan membuat laporan keaktifan harian.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Monitoring Orang Tua
              </h3>
              <p className="text-gray-600">
                Orang tua dapat memantau perkembangan aktivitas anak mereka di sekolah.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Laporan Real-time
              </h3>
              <p className="text-gray-600">
                Sistem pelaporan otomatis untuk tracking aktivitas siswa secara harian.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Multi-Role Access
              </h3>
              <p className="text-gray-600">
                Akses berbeda untuk siswa, guru, orang tua, dan administrator.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sistem Keamanan
              </h3>
              <p className="text-gray-600">
                Dilengkapi dengan sistem keamanan reCAPTCHA dan autentikasi yang aman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap untuk Memulai?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan SMK Negeri 4 Payakumbuh dan mulai monitoring aktivitas pembelajaran secara digital.
          </p>
          <Link 
            href="/login" 
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Masuk ke Sistem
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">SMK Negeri 4</span>
              </div>
              <p className="text-gray-400">
                Sistem Monitoring Aktivitas Siswa SMK Negeri 4 Payakumbuh
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Kontak</h3>
              <div className="space-y-2 text-gray-400">
                <p>Jl. Pendidikan No. 123</p>
                <p>Payakumbuh, Sumatera Barat</p>
                <p>Email: info@smkn4payakumbuh.sch.id</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors block">
                  Login
                </Link>
                <Link href="/tos" className="text-gray-400 hover:text-white transition-colors block">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SMK Negeri 4 Payakumbuh. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
