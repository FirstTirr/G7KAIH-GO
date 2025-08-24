
import LogoutButton from '@/components/ui/logoutButton'
import { createClient } from '@/utils/supabase/server'

export default async function UnknownPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('username, roleid')
      .eq('userid', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Account Pending Approval
          </h1>
          
          <p className="text-gray-600 mb-4">
            Welcome <strong>{profile?.username || 'User'}</strong>! Your account has been created successfully.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
            <p className="text-sm text-yellow-800">
              Your account is currently under review. You will be notified once an administrator approves your access to the system.
            </p>
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            <p>Current Status: <span className="font-medium text-yellow-600">Pending Verification</span></p>
            <p>Email: {user?.email}</p>
          </div>
          
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}