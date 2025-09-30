
import { SubmissionWindowToggle } from "@/components/dashboard/SubmissionWindowToggle"
import PendingAccounts from "@/components/users/pending-accounts"
import UsersTable from "@/components/users/users-table"

export default function Page() {
  return (
    <div className="p-4 space-y-8">
      <SubmissionWindowToggle />
      <PendingAccounts />
      <UsersTable />
    </div>
  )
}
