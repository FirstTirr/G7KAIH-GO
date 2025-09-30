"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, AlertCircle, CheckCircle, X } from "lucide-react"
import React, { useState, useRef } from "react"

type CSVRow = {
  username: string
  email: string
  kelas: string
  password: string
  roleid: string
  rowNumber: number
  errors: string[]
}

type ImportResult = {
  success: number
  failed: number
  errors: Array<{ row: number; username?: string; error: string }>
  tempPasswords?: Array<{ username: string; email: string; password: string }>
}

export default function CSVImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file')
  const [pasteData, setPasteData] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getRoleName = (roleid: string): string => {
    const roles: { [key: string]: string } = {
      '1': 'unknown',
      '2': 'teacher', 
      '3': 'admin',
      '4': 'parent',
      '5': 'student',
      '6': 'guruwali'
    }
    return roles[roleid] || 'invalid'
  }

  const validateRow = (row: any, rowNumber: number): CSVRow => {
    const errors: string[] = []
    const username = (row.username || '').toString().trim()
    const email = (row.email || '').toString().trim()
    const kelas = (row.kelas || '').toString().trim()
    const password = (row.password || '').toString().trim()
    const roleid = (row.roleid || '').toString().trim()

    if (!username) errors.push('Username tidak boleh kosong')
    if (!email) errors.push('Email tidak boleh kosong')
    if (!password) errors.push('Password tidak boleh kosong')
    if (!roleid) errors.push('Role ID tidak boleh kosong')
    
    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Format email tidak valid')
    }

    // Validate password length
    if (password && password.length < 6) {
      errors.push('Password minimal 6 karakter')
    }

    // Validate roleid is a valid number
    const roleIdNum = parseInt(roleid)
    if (roleid && (isNaN(roleIdNum) || roleIdNum < 1 || roleIdNum > 6)) {
      errors.push('Role ID harus berupa angka 1-6 (1=unknown, 2=teacher, 3=admin, 4=parent, 5=student, 6=guruwali)')
    }

    // Note: kelas is now optional, no validation needed

    return {
      username,
      email,
      kelas,
      password,
      roleid,
      rowNumber,
      errors
    }
  }

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Check if required headers exist
    const requiredHeaders = ['username', 'email', 'password', 'roleid']
    const optionalHeaders = ['kelas']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Header yang diperlukan tidak ditemukan: ${missingHeaders.join(', ')}. Header wajib: ${requiredHeaders.join(', ')}. Header opsional: ${optionalHeaders.join(', ')}`)
    }

    const data: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const rowData: any = {}
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ''
      })
      
      data.push(validateRow(rowData, i + 1))
    }
    
    return data
  }

  const parsePasteData = (pastedText: string): CSVRow[] => {
    if (!pastedText.trim()) {
      throw new Error('Data yang di-paste kosong')
    }

    const lines = pastedText.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      throw new Error('Tidak ada data yang valid')
    }

    // Detect separator (tab or comma)
    const firstLine = lines[0]
    const hasTab = firstLine.includes('\t')
    const separator = hasTab ? '\t' : ','
    
    // Parse first line as headers or data
    let headers: string[] = []
    let startDataIndex = 0
    
    const firstLineValues = firstLine.split(separator).map(v => v.trim().toLowerCase())
    
    // Check if first line contains headers
    const requiredHeaders = ['username', 'email', 'password', 'roleid']
    const hasHeaders = requiredHeaders.every(h => firstLineValues.includes(h))
    
    if (hasHeaders) {
      headers = firstLineValues
      startDataIndex = 1
    } else {
      // Assume order: username, email, kelas, password, roleid
      headers = ['username', 'email', 'kelas', 'password', 'roleid']
      startDataIndex = 0
    }

    const data: CSVRow[] = []
    
    for (let i = startDataIndex; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim())
      const rowData: any = {}
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ''
      })
      
      data.push(validateRow(rowData, i + 1))
    }
    
    return data
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Hanya file CSV yang diizinkan')
      return
    }

    setFile(selectedFile)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = parseCSV(text)
        setCsvData(parsed)
        setShowPreview(true)
        setImportResult(null)
      } catch (error: any) {
        alert(`Error parsing CSV: ${error.message}`)
        setFile(null)
        setCsvData([])
      }
    }
    reader.readAsText(selectedFile)
  }

  const handlePasteData = () => {
    if (!pasteData.trim()) {
      alert('Silakan paste data terlebih dahulu')
      return
    }

    try {
      const parsed = parsePasteData(pasteData)
      setCsvData(parsed)
      setShowPreview(true)
      setImportResult(null)
      setFile(null) // Clear file if any
    } catch (error: any) {
      alert(`Error parsing data: ${error.message}`)
      setCsvData([])
    }
  }

  const handleImport = async () => {
    if (!csvData.length) return
    
    setIsProcessing(true)
    try {
      const response = await fetch('/api/users/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: csvData })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimpor data')
      }
      
      setImportResult(result)
      setShowPreview(false)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadPasswords = () => {
    if (!importResult?.tempPasswords?.length) return
    
    const csvContent = "username,email,password\n" + 
      importResult.tempPasswords.map(p => `${p.username},${p.email},${p.password}`).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user_passwords.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const csvContent = "username,email,kelas,password,roleid\ncontoh_username,contoh@email.com,12 RPL 1,password123,5\nuser_teacher,teacher@email.com,,teacherpass456,2\nuser_admin,admin@email.com,,adminpass789,3\n"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_users.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setFile(null)
    setPasteData('')
    setCsvData([])
    setShowPreview(false)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validRows = csvData.filter(row => row.errors.length === 0)
  const invalidRows = csvData.filter(row => row.errors.length > 0)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Users dari CSV</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload file CSV untuk menambahkan multiple users sekaligus dengan role yang berbeda
            </p>
          </div>
          <Button 
            onClick={downloadTemplate} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        {/* Role Information */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Informasi Role ID:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-800">
            <div>• <strong>1</strong> = unknown</div>
            <div>• <strong>2</strong> = teacher</div>
            <div>• <strong>3</strong> = admin</div>
            <div>• <strong>4</strong> = parent</div>
            <div>• <strong>5</strong> = student</div>
            <div>• <strong>6</strong> = guruwali</div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Note:</strong> Kolom kelas opsional - bisa dikosongkan untuk role selain student
          </p>
        </div>

        <div className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex items-center gap-4">
            <Label className="font-medium">Metode Input:</Label>
            <div className="flex border rounded-lg p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setInputMode('file')
                  setPasteData('')
                  setCsvData([])
                  setShowPreview(false)
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'file' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload File CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('paste')
                  setFile(null)
                  setCsvData([])
                  setShowPreview(false)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'paste' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Copy & Paste
              </button>
            </div>
          </div>

          {inputMode === 'file' ? (
            <div>
              <Label htmlFor="csvFile">Pilih File CSV</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                File harus berformat CSV dengan kolom: username, email, kelas (opsional), password, roleid
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="pasteArea">Copy & Paste Data</Label>
              <div className="mt-2 space-y-2">
                <textarea
                  id="pasteArea"
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Paste data dari Excel/Google Sheets atau ketik manual:&#10;username1&#9;email1@example.com&#9;12 RPL 1&#9;password123&#9;5&#10;teacher1&#9;teacher@example.com&#9;&#9;teacherpass&#9;2&#10;&#10;Atau dengan format CSV:&#10;username,email,kelas,password,roleid&#10;username1,email1@example.com,12 RPL 1,password123,5&#10;teacher1,teacher@example.com,,teacherpass,2&#10;&#10;Role ID: 1=unknown, 2=teacher, 3=admin, 4=parent, 5=student, 6=guruwali"
                  rows={10}
                  className="w-full border rounded-md px-3 py-2 text-sm font-mono resize-y"
                />
                <Button 
                  onClick={handlePasteData} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={!pasteData.trim()}
                >
                  <Upload className="w-4 h-4" />
                  Proses Data
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p>• Bisa paste langsung dari Excel/Google Sheets (otomatis detect tab separator)</p>
                <p>• Atau ketik manual dengan format: username,email,kelas,password,roleid (satu baris per user)</p>
                <p>• Header opsional - jika tidak ada header, asumsi urutan: username, email, kelas, password, roleid</p>
                <p>• Password minimal 6 karakter untuk setiap user</p>
                <p>• Kelas boleh kosong (untuk role selain student)</p>
                <p>• Role ID: 1=unknown, 2=teacher, 3=admin, 4=parent, 5=student, 6=guruwali</p>
              </div>
            </div>
          )}

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  File terpilih: {file.name} ({csvData.length} baris data)
                </span>
              </div>
            </div>
          )}

          {inputMode === 'paste' && pasteData && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Data paste siap diproses ({pasteData.split('\n').filter(l => l.trim()).length} baris)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Preview Data</h3>
            <Button onClick={resetForm} variant="outline" size="sm">
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Data Valid</p>
                  <p className="text-sm text-green-600">{validRows.length} baris</p>
                </div>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Data Error</p>
                    <p className="text-sm text-red-600">{invalidRows.length} baris</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Baris</th>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Kelas</th>
                  <th className="px-4 py-2 text-left">Password</th>
                  <th className="px-4 py-2 text-left">Role ID</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index} className={row.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                    <td className="px-4 py-2">{row.rowNumber}</td>
                    <td className="px-4 py-2">{row.username}</td>
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">{row.kelas || <span className="text-gray-400 italic">kosong</span>}</td>
                    <td className="px-4 py-2">
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        {row.password ? '•'.repeat(Math.min(row.password.length, 8)) : ''}
                      </code>
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                        {row.roleid} ({getRoleName(row.roleid)})
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row.errors.length > 0 ? (
                        <div className="text-red-600">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">Error</span>
                          </div>
                          <ul className="text-xs mt-1 list-disc list-inside">
                            {row.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validRows.length > 0 && (
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={handleImport} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isProcessing ? 'Memproses...' : `Import ${validRows.length} User`}
              </Button>
              
              {invalidRows.length > 0 && (
                <p className="text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {invalidRows.length} baris akan diabaikan karena error
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {importResult && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Hasil Import</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Berhasil</p>
                  <p className="text-sm text-green-600">{importResult.success} user</p>
                </div>
              </div>
            </div>

            {importResult.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Gagal</p>
                    <p className="text-sm text-red-600">{importResult.failed} user</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-800 mb-2">Detail Error:</h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-48 overflow-auto">
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>
                      Baris {error.row} {error.username && `(${error.username})`}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {importResult.tempPasswords && importResult.tempPasswords.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">Password User:</h4>
                <Button 
                  onClick={downloadPasswords} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Download CSV
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-h-48 overflow-auto">
                <p className="text-sm text-blue-700 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Berikut adalah daftar password yang telah ditetapkan untuk user baru.
                </p>
                <div className="space-y-2">
                  {importResult.tempPasswords.map((temp, index) => (
                    <div key={index} className="text-sm text-blue-800 bg-white p-2 rounded border">
                      <div className="grid grid-cols-3 gap-2">
                        <div><strong>Username:</strong> {temp.username}</div>
                        <div><strong>Email:</strong> {temp.email}</div>
                        <div><strong>Password:</strong> <code className="bg-blue-100 px-1 rounded">{temp.password}</code></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button onClick={resetForm} variant="outline">
              Import File Baru
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}