import { logout } from '@/app/auth/actions'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C9A84C] mb-6">
          <span className="text-[#1A1A2E] font-bold text-2xl">A</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>

          <h2 className="text-white text-xl font-semibold mb-3">Account Pending Approval</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Your account has been created and is awaiting approval from an administrator.
            You will be able to access the platform once approved.
          </p>

          <form action={logout}>
            <button
              type="submit"
              className="text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
