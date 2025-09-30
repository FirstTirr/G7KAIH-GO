
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import fs from "node:fs/promises"
import path from "node:path"

export default async function TermsOfServicePage() {
  const tosPath = path.join(process.cwd(), "src/app/tos/tos.txt")
  let tosContent = "Dokumen Syarat dan Ketentuan belum tersedia."

  try {
    tosContent = await fs.readFile(tosPath, "utf-8")
  } catch (error) {
    console.error("Failed to load tos.txt", error)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Link>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Syarat dan Ketentuan Penggunaan</h1>
            <h2 className="text-xl text-blue-600 font-semibold">Aplikasi Web G7KAIH SMKN 4 Payakumbuh</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-gray-600">
              <span>
                <strong>Versi:</strong> 1.0
              </span>
              <span>
                <strong>Tanggal Berlaku:</strong> Saat aplikasi diluncurkan
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <article className="prose max-w-none whitespace-pre-wrap text-gray-800">
            {tosContent}
          </article>
        </div>
      </div>
    </div>
  )
}