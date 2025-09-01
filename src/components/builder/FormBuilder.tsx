"use client"
import { Eye, Info, RotateCcw, Save, Settings, X } from "lucide-react"
import React, { useState } from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { FieldTypeGuide } from "./FieldTypeGuide"
import { FormPreview } from "./FormPreview"
import { FormField as BuilderField, VisualFormBuilder } from "./VisualFormBuilder"

export function FormBuilder({
  categoryName,
  initial,
  isOpen,
  onClose,
  onSave,
}: {
  categoryName: string
  initial: BuilderField[]
  isOpen: boolean
  onClose: () => void
  onSave: (fields: BuilderField[]) => void
}) {
  const [activeTab, setActiveTab] = useState("builder")
  const [fields, setFields] = useState<BuilderField[]>(initial)

  // Keep local fields in sync whenever the modal opens for a different category
  // or when parent passes a new initial value.
  React.useEffect(() => {
    if (!isOpen) return
    setFields(Array.isArray(initial) ? initial : [])
    setActiveTab("builder")
  }, [isOpen, initial])

  const handleFieldsChange = (newFields: BuilderField[]) => setFields(newFields)
  const handleReset = () => {
    setFields([
      { id: "field-1", key: "jam", label: "Jam", type: "time", required: true },
      { id: "field-2", key: "catatan", label: "Catatan", type: "text", required: false },
    ])
    setActiveTab("builder")
  }

  if (!isOpen) return null

  // Convert to API schema (without local id) when saving
  const toApi = fields.map((f, idx) => ({ key: f.key, label: f.label, type: f.type, required: !!f.required, order: idx, config: f.options ? { options: f.options } : undefined }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Kelola Input untuk: {categoryName}
                <Badge variant="secondary">Form Builder</Badge>
              </CardTitle>
              <p className="text-gray-500 mt-1">Buat dan kelola field form dengan mudah menggunakan interface visual</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-6 pt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Buat Field
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Panduan
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="flex-1 overflow-hidden p-6">
            <TabsContent value="builder" className="h-full overflow-auto">
              <VisualFormBuilder onFieldsChange={handleFieldsChange} initialFields={initial} />
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <FormPreview fields={fields.map(({ id, ...rest }) => rest)} />
            </TabsContent>

            <TabsContent value="guide" className="h-full">
              <FieldTypeGuide />
            </TabsContent>
          </CardContent>
        </Tabs>

        <div className="flex-shrink-0 border-t p-6 bg-gray-50">
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
              <Button type="button" onClick={() => onSave(fields)} disabled={fields.length === 0} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Simpan Input
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
