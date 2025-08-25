
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/login" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Syarat dan Ketentuan Penggunaan
            </h1>
            <h2 className="text-xl text-blue-600 font-semibold mb-4">
              Aplikasi Web G7KAIH SMKN 4 Payakumbuh
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-gray-600">
              <span><strong>Versi:</strong> 1.0</span>
              <span><strong>Tanggal Berlaku:</strong> Saat aplikasi diluncurkan</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              1. Definisi dan Interpretasi
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">1.1 Definisi</h3>
              <div className="grid gap-3">
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-blue-600">"Aplikasi"</strong> berarti aplikasi web G7KAIH yang dikelola oleh SMKN 4 Payakumbuh
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-blue-600">"G7KAIH"</strong> berarti Gerakan 7 Kebiasaan Anak Indonesia Hebat, program Kemendikbudristek
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-blue-600">"Sekolah"</strong> berarti SMK Negeri 4 Payakumbuh
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-blue-600">"Pengguna"</strong> berarti siswa, guru, dan orang tua yang menggunakan aplikasi
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-blue-600">"Ketujuh Kebiasaan"</strong> berarti: bangun pagi, beribadah, berolahraga, makan sehat dan bergizi, gemar belajar, bermasyarakat, dan tidur cepat
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">1.2 Interpretasi</h3>
              <p className="text-gray-700">
                Syarat dan ketentuan ini berlaku untuk semua pengguna aplikasi G7KAIH SMKN 4 Payakumbuh.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              2. Penerimaan Syarat dan Ketentuan
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">2.1 Persetujuan</h3>
              <p className="text-gray-700 mb-2">Dengan menggunakan aplikasi ini, Anda menyatakan bahwa:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Anda telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan</li>
                <li>Anda berkomitmen untuk mematuhi aturan yang berlaku</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">2.2 Kapasitas Hukum</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Siswa pengguna adalah siswa aktif jurusan PPLG SMKN 4 Payakumbuh</li>
                <li>Orang tua/wali memiliki otoritas untuk memberikan validasi</li>
                <li>Guru adalah pendidik resmi SMKN 4 Payakumbuh yang ditunjuk sebagai validator</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              3. Deskripsi Layanan
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">3.1 Tujuan Aplikasi</h3>
              <p className="text-gray-700 mb-2">
                Aplikasi ini dikembangkan untuk mendukung implementasi program G7KAIH dari Kemendikbudristek melalui:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Pemantauan dan pelaporan aktivitas harian siswa</li>
                <li>Validasi kegiatan oleh guru dan orang tua</li>
                <li>Pembentukan karakter positif siswa</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">3.2 Fitur Utama</h3>
              <div className="grid gap-3">
                <div className="border border-blue-200 bg-blue-50 p-3 rounded-md">
                  <strong className="text-blue-700">Jurnal Harian:</strong> Siswa melaporkan kegiatan ketujuh kebiasaan sebelum tidur
                </div>
                <div className="border border-green-200 bg-green-50 p-3 rounded-md">
                  <strong className="text-green-700">Upload Foto Bukti:</strong> Dokumentasi visual aktivitas yang dilakukan
                </div>
                <div className="border border-purple-200 bg-purple-50 p-3 rounded-md">
                  <strong className="text-purple-700">Sistem Validasi:</strong> Verifikasi aktivitas oleh guru dan orang tua
                </div>
                <div className="border border-orange-200 bg-orange-50 p-3 rounded-md">
                  <strong className="text-orange-700">Dashboard Monitoring:</strong> Tampilan progress dan statistik kegiatan
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">3.3 Akses Layanan</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Aplikasi berbasis web yang dapat diakses melalui browser</li>
                <li>Tersedia 24/7 dengan kemungkinan maintenance terjadwal</li>
                <li>Akses dibatasi pada komunitas SMKN 4 Payakumbuh</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              4. Registrasi dan Akun Pengguna
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">4.1 Persyaratan Registrasi</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-2">Untuk Siswa:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Siswa aktif jurusan PPLG SMKN 4 Payakumbuh</li>
                    <li>• Memiliki NISN dan NIS yang valid</li>
                  </ul>
                </div>
                
                <div className="border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-2">Untuk Guru:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Pendidik resmi SMKN 4 Payakumbuh</li>
                    <li>• Ditunjuk sebagai validator program G7KAIH</li>
                    <li>• Memiliki NIP yang valid</li>
                  </ul>
                </div>
                
                <div className="border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-700 mb-2">Untuk Orang Tua:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Orang tua/wali sah siswa yang terdaftar</li>
                    <li>• Memiliki hubungan keluarga yang dapat diverifikasi</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">4.2 Keamanan Akun</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Pengguna bertanggung jawab menjaga kerahasiaan login credentials</li>
                <li>Segera laporkan jika terjadi penyalahgunaan akun</li>
                <li>Sekolah berhak menonaktifkan akun yang melanggar aturan</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">4.3 Akun Tidak Dapat Dipindahtangankan</h3>
              <p className="text-gray-700">
                Akun bersifat personal dan tidak dapat dipindahtangankan kepada pihak lain.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              5. Kewajiban dan Hak Pengguna
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">5.1 Kewajiban Siswa</h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Melaporkan aktivitas ketujuh kebiasaan secara jujur dan akurat</li>
                  <li>Mengisi jurnal harian sebelum tidur</li>
                  <li>Menyediakan foto bukti yang relevan dan pantas</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-center text-gray-600 text-sm">
              <strong>Dokumen ini berlaku efektif sejak:</strong> Aplikasi diluncurkan
            </p>
            
            <div className="mt-6 text-center">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}