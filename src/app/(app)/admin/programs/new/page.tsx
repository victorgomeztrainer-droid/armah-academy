import { createProgram } from '@/app/admin/actions'
import Link from 'next/link'

export default function NewProgramPage() {
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <Link href="/admin/programs" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Programs
      </Link>

      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-8">New Program</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <form action={createProgram} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Title *</label>
              <input name="title" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" placeholder="e.g. CORE" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Slug *</label>
              <input name="slug" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" placeholder="e.g. core" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Description</label>
            <textarea name="description" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" placeholder="Program description..." />
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Category</label>
              <input name="category" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" placeholder="e.g. Group Fitness" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Difficulty</label>
              <select name="difficulty" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white">
                <option value="">Select...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Est. Hours</label>
              <input name="estimated_hours" type="number" step="0.5" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors" placeholder="e.g. 4" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" name="is_published" id="is_published" className="w-4 h-4 accent-[#C9A84C]" />
            <label htmlFor="is_published" className="text-sm font-medium text-[#1A1A2E]">Publish immediately</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-50">
            <Link href="/admin/programs" className="flex-1 text-center border border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl text-sm transition-colors">
              Cancel
            </Link>
            <button type="submit" className="flex-1 bg-[#1A1A2E] hover:bg-[#16213E] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
