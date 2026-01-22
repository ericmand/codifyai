import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from 'convex/react'
import {
  FileText,
  Table,
  Bell,
  Plus,
  Home,
  Briefcase,
  Users
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { useUIStore } from '../store'
import clsx from 'clsx'

export default function Sidebar() {
  const location = useLocation()
  const { activeWorkspaceId, setActiveWorkspace } = useUIStore()

  const workspaces = useQuery(api.workspaces.list) ?? []
  const types = useQuery(
    api.types.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []
  const subscriptions = useQuery(
    api.subscriptions.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []
  const totalUnread = useQuery(
    api.subscriptions.getTotalUnread,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? 0

  // Set initial workspace
  useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      const defaultWs = workspaces.find(w => w.isDefault) ?? workspaces[0]
      setActiveWorkspace(defaultWs._id)
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace])

  const workspaceIcons: Record<string, typeof Home> = {
    personal: Home,
    work: Briefcase,
    community: Users,
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Workspace Selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Workspace
        </label>
        <div className="space-y-1">
          {workspaces.map(workspace => {
            const Icon = workspaceIcons[workspace.type] ?? Home
            const isActive = workspace._id === activeWorkspaceId
            return (
              <button
                key={workspace._id}
                onClick={() => setActiveWorkspace(workspace._id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{workspace.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main Actions */}
        <div>
          <Link
            to="/"
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              location.pathname === '/'
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Editor</span>
          </Link>
        </div>

        {/* Types / Table Views */}
        <div>
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Types
          </h3>
          <div className="space-y-1">
            {types.map(type => (
              <Link
                key={type._id}
                to={`/table/${type._id}`}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  location.pathname === `/table/${type._id}`
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Table className="w-4 h-4" />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span>{type.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Subscriptions
            </h3>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {subscriptions.map(sub => (
              <Link
                key={sub._id}
                to={`/subscriptions?id=${sub._id}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>{sub.name}</span>
                </div>
                {sub.unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {sub.unreadCount}
                  </span>
                )}
              </Link>
            ))}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors w-full">
              <Plus className="w-4 h-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="font-medium text-gray-700">Codify</p>
          <p>Structured Text Editor</p>
        </div>
      </div>
    </aside>
  )
}
