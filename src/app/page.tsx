"use client";

import {
  Apple,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  Dumbbell,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Moon,
  Phone,
  Shield,
  Smartphone,
  Star,
  Sun,
  Twitter,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { href: "#features", label: "Fitur" },
  { href: "#activities", label: "Aktivitas" },
  { href: "#cta", label: "Daftar" },
  { href: "#footer", label: "Kontak" },
];

const featureHighlights = [
  {
    icon: CheckCircle,
    title: "Tracking Harian",
    description: "Monitor semua aktivitas siswa dalam satu dashboard yang mudah digunakan.",
  },
  {
    icon: BarChart3,
    title: "Laporan Progress",
    description: "Analisis perkembangan siswa dengan grafik dan statistik yang detail.",
  },
  {
    icon: Calendar,
    title: "Reminder Otomatis",
    description: "Notifikasi pengingat untuk setiap aktivitas agar tidak terlewat.",
  },
  {
    icon: Users,
    title: "Kolaborasi Orang Tua",
    description: "Libatkan orang tua dalam memantau perkembangan anak di rumah.",
  },
  {
    icon: Shield,
    title: "Data Aman",
    description: "Keamanan data siswa terjamin dengan enkripsi tingkat tinggi.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Akses mudah melalui smartphone, tablet, atau komputer.",
  },
];

const activities = [
  {
    id: 1,
    title: "Bangun Pagi",
    description: "Memulai hari dengan disiplin waktu untuk membentuk karakter yang konsisten.",
    icon: Sun,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: 2,
    title: "Beribadah",
    description: "Mendorong anak untuk beribadah sesuai dengan agama dan keyakinan masing-masing.",
    icon: Heart,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: 3,
    title: "Berolahraga",
    description: "Mengajak anak untuk aktif secara fisik melalui kegiatan seperti senam.",
    icon: Dumbbell,
    color: "bg-red-100 text-red-600",
  },
  {
    id: 4,
    title: "Makan Makanan Bergizi",
    description: "Membiasakan pola makan sehat untuk mendukung tumbuh kembang anak.",
    icon: Apple,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 5,
    title: "Gemar Belajar",
    description: "Mengembangkan minat dan kecintaan anak terhadap ilmu pengetahuan dan pendidikan.",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 6,
    title: "Bermasyarakat",
    description: "Mendorong anak untuk aktif dalam kegiatan sosial dan berinteraksi positif dengan lingkungan.",
    icon: Users,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 7,
    title: "Tidur Cepat",
    description: "Menanamkan kebiasaan tidur yang cukup dan teratur untuk kesehatan tubuh dan pikiran.",
    icon: Moon,
    color: "bg-indigo-100 text-indigo-600",
  },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <span>G7KAIH</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <Button size="sm" asChild className="hidden rounded-full px-5 md:inline-flex">
          <Link href="/login">
            Masuk
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 px-4">
      <div className="absolute inset-x-0 -top-24 mx-auto h-56 max-w-xl rounded-full bg-gradient-to-r from-blue-200/60 via-green-200/40 to-purple-200/60 blur-3xl" aria-hidden="true" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit">
              <Star className="mr-2 h-4 w-4" />
              Platform Pengawas Aktivitas Siswa
            </Badge>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-gray-900 lg:text-6xl">
                Membangun Karakter Siswa dengan
                <span className="mt-2 block text-blue-600">G7KAIH</span>
              </h1>
              <p className="max-w-xl text-xl leading-relaxed text-gray-600">
                Platform monitoring aktivitas harian yang membantu siswa mengembangkan 7 kebiasaan positif untuk membentuk karakter yang kuat dan sehat.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="px-8" asChild>
                <Link href="/login">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link href="#features">Pelajari Lebih Lanjut</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Siswa Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">50+</div>
                <div className="text-sm text-gray-600">Sekolah</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-600">Tingkat Kepuasan</div>
              </div>
            </div>
          </div>

          <div className="relative lg:justify-self-end">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl lg:w-[600px] xl:w-[640px]">
              <Image
                src="/hero.png"
                alt="Aktivitas siswa G7KAIH"
                width={920}
                height={640}
                priority
                className="h-[500px] w-full object-cover"
              />
            </div>
            <div className="absolute -right-6 -top-6 rounded-full bg-white p-4 shadow-lg">
              <div className="text-2xl" role="img" aria-label="Buku">📚</div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-full bg-white p-4 shadow-lg">
              <div className="text-2xl" role="img" aria-label="Bintang">🌟</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                Fitur Unggulan
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">
                Platform Lengkap untuk Pengembangan Karakter Siswa
              </h2>
              <p className="text-xl text-gray-600">
                G7KAIH menyediakan semua tools yang dibutuhkan untuk membantu siswa, guru, dan orang tua dalam membangun kebiasaan positif yang berkelanjutan.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {featureHighlights.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="overflow-hidden shadow-xl">
              <CardContent className="p-0">
                <Image
                  src="/hero.png"
                  alt="Guru mendampingi siswa"
                  width={480}
                  height={320}
                  className="h-48 w-full object-cover"
                />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow-lg">
              <div className="space-y-3">
                <div className="text-2xl font-semibold">98%</div>
                <p className="text-sm text-white/90">Siswa menunjukkan peningkatan disiplin setelah 3 bulan.</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-blue-500 p-6 text-white shadow-lg">
              <div className="space-y-3">
                <div className="text-2xl font-semibold">24/7</div>
                <p className="text-sm text-white/90">Monitoring aktivitas real-time oleh guru dan orang tua.</p>
              </div>
            </Card>
            <Card className="overflow-hidden shadow-xl">
              <CardContent className="p-0">
                <Image
                  src="/image/window.svg"
                  alt="Tampilan dashboard G7KAIH"
                  width={480}
                  height={320}
                  className="h-48 w-full object-cover bg-slate-900 p-6"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivitiesSection() {
  return (
    <section id="activities" className="bg-white py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900 lg:text-4xl">7 Kebiasaan Positif G7KAIH</h2>
          <p className="text-xl text-gray-600">
            Sistem monitoring yang dirancang khusus untuk membantu siswa mengembangkan kebiasaan harian yang membentuk karakter positif dan kehidupan yang seimbang.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <Card key={activity.id} className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-4 p-6 text-center">
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${activity.color}`}
                  >
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{activity.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="cta" className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="overflow-hidden border-none shadow-2xl">
          <CardContent className="space-y-8 bg-white p-12 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">Siap Memulai Perjalanan G7KAIH?</h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Bergabunglah dengan ribuan siswa dan sekolah yang telah merasakan manfaat sistem monitoring G7KAIH untuk pengembangan karakter yang lebih baik.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="px-8" asChild>
                <Link href="/login">
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link href="mailto:info@g7kaih.com">Konsultasi Gratis</Link>
              </Button>
            </div>

            <div className="grid gap-8 border-t border-gray-200 pt-8 sm:grid-cols-2">
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <Mail className="h-5 w-5" />
                <span>info@g7kaih.com</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <Phone className="h-5 w-5" />
                <span>+62 812-3456-7890</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 pt-4 text-gray-600">
              <div className="text-center">
                <div className="text-sm text-gray-500">Trusted by</div>
                <div className="font-semibold text-gray-700">500+ Students</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <div className="text-sm text-gray-500">Used in</div>
                <div className="font-semibold text-gray-700">50+ Schools</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="font-semibold text-gray-700">95%+</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 py-16 px-4 text-white">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Image src="/bcslogo.webp" alt="Logo BCS" width={100} height={48} className="h-12 w-96" />
              <span className="text-2xl font-bold">G7KAIH</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Platform monitoring aktivitas harian yang membantu siswa mengembangkan 7 kebiasaan positif untuk membentuk karakter yang kuat dan sehat.
            </p>
            <div className="flex gap-3">
              {[{ Icon: Facebook, label: "Facebook" }, { Icon: Twitter, label: "Twitter" }, { Icon: Instagram, label: "Instagram" }, { Icon: Linkedin, label: "LinkedIn" }].map(
                ({ Icon, label }) => (
                  <Button key={label} variant="ghost" size="icon" className="text-gray-400 hover:text-white" asChild>
                    <Link href="#" aria-label={label}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Dashboard",
                "Monitoring",
                "Laporan",
                "Analitik",
                "Mobile App",
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className="transition-colors hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Dukungan</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Help Center",
                "Panduan",
                "Tutorial",
                "FAQ",
                "Kontak",
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className="transition-colors hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Kontak Kami</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-gray-400">Email</div>
                  <div>info@g7kaih.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-gray-400">Telepon</div>
                  <div>+62 812-3456-7890</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-gray-400">Alamat</div>
                  <div>Jakarta, Indonesia</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-gray-400 md:flex-row">
          <div>© {new Date().getFullYear()} G7KAIH. Semua hak dilindungi.</div>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ActivitiesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
