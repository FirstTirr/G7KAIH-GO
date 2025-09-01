"use client"
import { Clock, GripVertical, Image, List, Sparkles, Trash2, Type, Upload } from "lucide-react"
import React, { useState } from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Separator } from "../ui/separator"
import { Switch } from "../ui/switch"
import { Textarea } from "../ui/textarea"

export interface FormField {
  id: string
  key: string
  label: string
  type: "text" | "time" | "image" | "text_image" | "multiselect"
  required?: boolean
  options?: string[]
}

export function VisualFormBuilder({ onFieldsChange, initialFields = [] as FormField[] }: { onFieldsChange: (fields: FormField[]) => void; initialFields?: FormField[] }) {
  const [fields, setFields] = useState<FormField[]>(
    initialFields.length > 0 ? initialFields.map((field, index) => ({ ...field, id: field.id || `field-${index}` })) : []
  )
  const [editingField, setEditingField] = useState<string | null>(null)

  // Keep local state in sync if parent passes a new set of fields (e.g., when opening builder for another category)
  React.useEffect(() => {
    setFields(initialFields.length > 0 ? initialFields.map((field, index) => ({ ...field, id: field.id || `field-${index}` })) : [])
  }, [initialFields])

  const fieldTypes = [
    { value: "text", label: "Teks", icon: <Type className="h-4 w-4" />, description: "Input teks biasa" },
    { value: "time", label: "Waktu", icon: <Clock className="h-4 w-4" />, description: "Pilih waktu" },
    { value: "image", label: "Gambar", icon: <Image className="h-4 w-4" />, description: "Upload gambar" },
    { value: "text_image", label: "Teks + Gambar", icon: <Upload className="h-4 w-4" />, description: "Teks dengan gambar opsional" },
    { value: "multiselect", label: "Pilihan", icon: <List className="h-4 w-4" />, description: "Dropdown pilihan" },
  ]

  const templateFields = [
    { key: "teks", label: "Teks Kosong", type: "text" as const, required: true },
    // { key: "email", label: "Email", type: "text" as const, required: true },
    { key: "jam", label: "Jam", type: "time" as const, required: true },
    { key: "Gambar", label: "Image", type: "image" as const, required: false },
    { key: "text-gambar", label: "text_gambar", type: "text_image" as const, required: false },
    { key: "multi select", label: "multi select", type: "multiselect" as const, required: true, options: ["Senang", "Biasa", "Sedih", "Semangat"] },
  ]

  const updateFields = (newFields: FormField[]) => {
    setFields(newFields)
    onFieldsChange(newFields)
  }

  // Removed manual "Tambah Field" button per request. Users can add fields via templates above.

  const addTemplateField = (template: typeof templateFields[0]) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      ...template,
    }
    updateFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = fields.map((field) => (field.id === id ? { ...field, ...updates } : field))
    updateFields(newFields)
  }

  const deleteField = (id: string) => {
    updateFields(fields.filter((field) => field.id !== id))
    if (editingField === id) {
      setEditingField(null)
    }
  }

  const moveField = (id: string, direction: "up" | "down") => {
    const currentIndex = fields.findIndex((field) => field.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)
    updateFields(newFields)
  }

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find((ft) => ft.value === type)
    return fieldType?.icon || <Type className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Template Field Siap Pakai
          </CardTitle>
          <p className="text-sm text-gray-500">Klik field di bawah untuk menambahkannya ke form Anda</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {templateFields.map((template, index) => (
              <Button key={index} variant="outline" onClick={() => addTemplateField(template)} className="h-auto p-3 justify-start">
                <div className="flex items-center gap-2">
                  {getFieldIcon(template.type)}
                  <div className="text-left">
                    <div className="font-medium">{template.label}</div>
                    <div className="text-xs text-gray-500">{template.type}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Form ({fields.length})</CardTitle>
              <p className="text-sm text-gray-500">Kelola field yang akan muncul di form Anda</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada field. Klik "Tambah Field" untuk memulai.</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={field.id}>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="cursor-move text-gray-400">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex items-center gap-2">
                    {getFieldIcon(field.type)}
                    <Badge variant="outline">{field.type}</Badge>
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-gray-500">
                      Key: {field.key} {field.required && "• Wajib diisi"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveField(field.id, "up")} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveField(field.id, "down")} disabled={index === fields.length - 1}>
                      ↓
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingField(editingField === field.id ? null : field.id)}>
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteField(field.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingField === field.id && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`label-${field.id}`}>Label</Label>
                        <Input id={`label-${field.id}`} value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="Masukkan label field" />
                      </div>
                      <div>
                        <Label htmlFor={`key-${field.id}`}>Key (ID)</Label>
                        <Input id={`key-${field.id}`} value={field.key} onChange={(e) => updateField(field.id, { key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="field_key" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`type-${field.id}`}>Tipe Field</Label>
                        <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {type.icon}
                                  <div>
                                    <div>{type.label}</div>
                                    <div className="text-xs text-gray-500">{type.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch id={`required-${field.id}`} checked={field.required || false} onCheckedChange={(checked) => updateField(field.id, { required: checked })} />
                        <Label htmlFor={`required-${field.id}`}>Wajib diisi</Label>
                      </div>
                    </div>

                    {field.type === "multiselect" && (
                      <div>
                        <Label htmlFor={`options-${field.id}`}>Pilihan (satu per baris)</Label>
                        <Textarea
                          id={`options-${field.id}`}
                          value={field.options?.join("\n") || ""}
                          onChange={(e) => updateField(field.id, { options: e.target.value.split("\n").filter((option) => option.trim()) })}
                          onKeyDown={(e) => {
                            // Allow newline and prevent parent handlers (e.g., selects or dialogs) from intercepting Enter
                            e.stopPropagation()
                          }}
                          placeholder={"Opsi 1\nOpsi 2\nOpsi 3"}
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => setEditingField(null)}>
                        Selesai Edit
                      </Button>
                    </div>
                  </div>
                )}

                {index < fields.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
