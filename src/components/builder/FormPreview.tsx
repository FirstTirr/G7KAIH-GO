"use client"
import { Clock, Eye, Image, List, Type, Upload } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export interface FormField {
  key: string
  label: string
  type: "text" | "time" | "image" | "text_image" | "multiselect"
  required?: boolean
  options?: string[]
}

export function FormPreview({ fields }: { fields: FormField[] }) {
  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />
      case "time":
        return <Clock className="h-4 w-4" />
      case "image":
        return <Image className="h-4 w-4" />
      case "text_image":
        return <Upload className="h-4 w-4" />
      case "multiselect":
        return <List className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  const renderFieldInput = (field: FormField, fieldId: string) => {
    switch (field.type) {
      case "text":
        return <Input id={fieldId} type="text" placeholder={`Masukkan ${field.label.toLowerCase()}`} required={field.required} />
      case "time":
        return <Input id={fieldId} type="time" required={field.required} />
      case "image":
        return (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
            <input id={fieldId} type="file" accept="image/*" className="hidden" required={field.required} />
          </div>
        )
      case "text_image":
        return (
          <div className="space-y-3">
            <Input type="text" placeholder={`Masukkan ${field.label.toLowerCase()}`} required={field.required} />
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Upload gambar (opsional)</p>
              <input type="file" accept="image/*" className="hidden" />
            </div>
          </div>
        )
      case "multiselect":
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={`Pilih ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || ["Opsi 1", "Opsi 2", "Opsi 3"]).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return <Input id={fieldId} type="text" placeholder={`Masukkan ${field.label.toLowerCase()}`} required={field.required} />
    }
  }

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.key}`
    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Badge variant="outline" className="text-xs">
            {field.type}
          </Badge>
        </div>
        {renderFieldInput(field, fieldId)}
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Eye className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada preview</h3>
          <p className="text-gray-500">Masukkan konfigurasi JSON yang valid di tab Editor untuk melihat preview form</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>Preview Form</CardTitle>
          <p className="text-sm text-gray-500">Ini adalah tampilan form berdasarkan konfigurasi JSON Anda</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map(renderField)}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">Submit Form</Button>
            <Button type="button" variant="outline">Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
