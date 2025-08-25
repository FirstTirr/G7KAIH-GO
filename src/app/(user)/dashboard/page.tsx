
import PendingAccounts from "@/components/users/pending-accounts"
import UsersTable from "@/components/users/users-table"

export default function Page() {
  return (
    <div className="p-4 space-y-8">
      <PendingAccounts />
      <UsersTable />
    </div>
  )
}
