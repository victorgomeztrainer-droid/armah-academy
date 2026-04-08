import { register } from '@/app/auth/actions'

const BRANCHES = [
  'Optimo Malqa',
  'Optimo Hittin',
  'Optimo Rawdah',
  'B_Fit Jeddah',
  'B_Fit Riyadh',
  'Other',
]

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C9A84C] mb-4">
            <span className="text-[#1A1A2E] font-bold text-2xl">A</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">Armah Academy</h1>
          <p className="text-white/50 text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-6">Register</h2>

          {searchParams.error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {searchParams.error}
            </div>
          )}

          <form action={register} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors"
                placeholder="you@armah.com"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Branch
              </label>
              <select
                name="branch"
                required
                className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C9A84C] transition-colors"
              >
                <option value="" className="text-white/30">Select your branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#C9A84C] hover:bg-[#E8C96D] text-[#1A1A2E] font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-[#C9A84C] hover:text-[#E8C96D] transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
