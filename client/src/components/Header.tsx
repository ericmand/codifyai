import { useState } from 'react'
import { Search, Settings, HelpCircle } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '../store'
import SearchModal from './SearchModal'

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { activeWorkspaceId } = useUIStore()

  const types = useQuery(
    api.types.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search items, types, or commands...</span>
            <kbd className="ml-auto px-2 py-0.5 text-xs bg-white rounded border border-gray-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        types={types}
        workspaceId={activeWorkspaceId}
      />
    </>
  )
}
