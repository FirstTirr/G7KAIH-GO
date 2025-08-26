import AktivitasTable from "@/components/aktivitas/AktivitasTable"

export default function Page() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Aktivitas</h1>
      <AktivitasTable />
    </div>
  )
}
