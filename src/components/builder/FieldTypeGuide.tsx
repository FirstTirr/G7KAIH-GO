"use client"
import { Clock, Code, Image, List, Type, Upload } from "lucide-react"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"

export function FieldTypeGuide() {
  const fieldTypes = [
    {
      type: "text",
      icon: <Type className="h-5 w-5" />,
      title: "Text Input",
      description: "Input teks standar untuk data string",
      example: { key: "nama", label: "Nama Lengkap", type: "text", required: true },
    },
    {
      type: "time",
      icon: <Clock className="h-5 w-5" />,
      title: "Time Input",
      description: "Input waktu dengan format HH:MM",
      example: { key: "jam_bangun", label: "Jam Bangun", type: "time", required: true },
    },
    {
      type: "image",
      icon: <Image className="h-5 w-5" />,
      title: "Image Upload",
      description: "Upload gambar tunggal",
      example: { key: "foto_profil", label: "Foto Profil", type: "image", required: false },
    },
    {
      type: "text_image",
      icon: <Upload className="h-5 w-5" />,
      title: "Text + Image",
      description: "Kombinasi input teks dengan upload gambar opsional",
      example: { key: "catatan_foto", label: "Catatan dengan Foto", type: "text_image", required: true },
    },
    {
      type: "multiselect",
      icon: <List className="h-5 w-5" />,
      title: "Multi Select",
      description: "Dropdown pilihan dengan opsi multiple",
      example: { key: "kategori", label: "Kategori", type: "multiselect", required: true, options: ["Opsi 1", "Opsi 2", "Opsi 3"] },
    },
  ]

  return (
    <div className="h-full overflow-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Panduan Tipe Field
          </CardTitle>
          <p className="text-gray-500">Pelajari berbagai tipe field yang tersedia untuk form Anda</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fieldTypes.map((fieldType, index) => (
              <div key={fieldType.type}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-700">{fieldType.icon}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{fieldType.title}</h3>
                      <Badge variant="outline">{fieldType.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{fieldType.description}</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium mb-2">Contoh Konfigurasi:</p>
                      <div className="text-xs space-y-1">
                        <div>
                          <strong>Label:</strong> {fieldType.example.label}
                        </div>
                        <div>
                          <strong>Key:</strong> {fieldType.example.key}
                        </div>
                        <div>
                          <strong>Wajib diisi:</strong> {fieldType.example.required ? "Ya" : "Tidak"}
                        </div>
                        {Array.isArray((fieldType.example as any).options) && (
                          <div>
                            <strong>Pilihan:</strong> {(fieldType.example as any).options.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {index < fieldTypes.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
