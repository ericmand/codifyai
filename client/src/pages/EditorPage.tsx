import { Trash2 } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import BulletEditor from '../components/BulletEditor'
import { useUIStore } from '../store'

export default function EditorPage() {
  const { activeWorkspaceId } = useUIStore()

  const workspaces = useQuery(api.workspaces.list) ?? []
  const items = useQuery(
    api.items.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const clearWorkspace = useMutation(api.items.clearWorkspace)

  const workspace = workspaces.find(w => w._id === activeWorkspaceId)

  const handleClearWorkspace = async () => {
    if (!activeWorkspaceId) return
    if (window.confirm('Are you sure you want to clear all items? This cannot be undone.')) {
      await clearWorkspace({ workspaceId: activeWorkspaceId })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {workspace?.name || 'Editor'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} • Start typing to add content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearWorkspace}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Tips */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <strong>Tips:</strong> Press <kbd className="px-1.5 py-0.5 bg-blue-100 rounded">Enter</kbd> to create new items,{' '}
            <kbd className="px-1.5 py-0.5 bg-blue-100 rounded">Tab</kbd> to indent,{' '}
            <kbd className="px-1.5 py-0.5 bg-blue-100 rounded">Shift+Enter</kbd> to assign types.
          </div>

          <BulletEditor />
        </div>
      </div>
    </div>
  )
}
