import CSVImportForm from "@/components/users/csv-import-form"

export default function ImportUsersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import Users</h1>
          <p className="text-gray-600 mt-1">Import multiple users at once using CSV file or copy-paste data</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <CSVImportForm />
          </div>
        </div>
      </div>
    </div>
  )
}