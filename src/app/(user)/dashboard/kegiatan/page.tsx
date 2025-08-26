import CategoryTable from "@/components/kegiatan/CategoryTable"
import KegiatanTable from "@/components/kegiatan/KegiatanTable"

export default function KegiatanPage() {
  return (
    <div className="p-4 space-y-8">
      <KegiatanTable />
      <CategoryTable />
    </div>
  )
}
