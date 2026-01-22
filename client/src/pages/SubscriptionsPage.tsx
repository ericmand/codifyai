import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import {
  Bell,
  Trash2,
  Plus,
  Mail,
  Smartphone,
  Link2,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useUIStore } from '../store'
import clsx from 'clsx'

export default function SubscriptionsPage() {
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('id')
  const { activeWorkspaceId } = useUIStore()

  const subscriptions = useQuery(
    api.subscriptions.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const types = useQuery(
    api.types.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const createSubscription = useMutation(api.subscriptions.create)
  const updateSubscription = useMutation(api.subscriptions.update)
  const removeSubscription = useMutation(api.subscriptions.remove)
  const markAsRead = useMutation(api.subscriptions.markAsRead)

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTypeId, setNewTypeId] = useState('')

  const selectedSubscription = selectedId
    ? subscriptions.find(s => s._id === selectedId)
    : subscriptions[0]

  const subscriptionItems = useQuery(
    api.items.listByType,
    selectedSubscription?.typeId ? { typeId: selectedSubscription.typeId } : "skip"
  ) ?? []

  const handleCreate = async () => {
    if (!activeWorkspaceId || !newName.trim() || !newTypeId) return

    const type = types.find(t => t._id === newTypeId)
    await createSubscription({
      name: newName.trim(),
      query: `type:${type?.name || ''}`,
      typeId: newTypeId as Id<"types">,
      workspaceId: activeWorkspaceId,
      notifyOnNew: true,
      notifyChannels: ['app'],
    })
    setIsCreating(false)
    setNewName('')
    setNewTypeId('')
  }

  const handleDelete = async (id: Id<"subscriptions">) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      await removeSubscription({ id })
    }
  }

  const copyEndpoint = (subId: Id<"subscriptions">) => {
    const endpoint = `${window.location.origin}/api/subscriptions/${subId}/items`
    navigator.clipboard.writeText(endpoint)
    alert('API endpoint copied to clipboard!')
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Subscriptions</h2>
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Create Form */}
          {isCreating && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-3 mb-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Subscription name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <select
                value={newTypeId}
                onChange={(e) => setNewTypeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select type...</option>
                {types.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || !newTypeId}
                  className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subscription List */}
        <div className="flex-1 overflow-y-auto">
          {subscriptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No subscriptions yet
            </div>
          ) : (
            <div className="py-2">
              {subscriptions.map(sub => {
                const type = sub.typeId ? types.find(t => t._id === sub.typeId) : null
                const isSelected = sub._id === selectedSubscription?._id
                return (
                  <a
                    key={sub._id}
                    href={`?id=${sub._id}`}
                    onClick={() => markAsRead({ id: sub._id })}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: type ? type.color + '20' : '#f3f4f6',
                        color: type?.color || '#6b7280',
                      }}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {sub.name}
                        </span>
                        {sub.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                            {sub.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{sub.query}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedSubscription ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedSubscription.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {subscriptionItems.length} items matching "{selectedSubscription.query}"
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEndpoint(selectedSubscription._id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy API endpoint"
                  >
                    <Link2 className="w-4 h-4" />
                    API
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSubscription._id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSubscription.notifyOnNew}
                    onChange={(e) =>
                      updateSubscription({
                        id: selectedSubscription._id,
                        notifyOnNew: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Notify on new items</span>
                </label>
                <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
                  <span className="text-sm text-gray-500">Channels:</span>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSubscription.notifyChannels.includes('app')}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...selectedSubscription.notifyChannels, 'app' as const]
                          : selectedSubscription.notifyChannels.filter(c => c !== 'app')
                        updateSubscription({
                          id: selectedSubscription._id,
                          notifyChannels: channels,
                        })
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Smartphone className="w-4 h-4" />
                    App
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSubscription.notifyChannels.includes('email')}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...selectedSubscription.notifyChannels, 'email' as const]
                          : selectedSubscription.notifyChannels.filter(c => c !== 'email')
                        updateSubscription({
                          id: selectedSubscription._id,
                          notifyChannels: channels,
                        })
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-auto">
              {subscriptionItems.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No items match this subscription yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {subscriptionItems.map(item => (
                    <div key={item._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full flex-shrink-0" />
                        <div>
                          <p className="text-gray-900">{item.content || 'Untitled'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(item._creationTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a subscription to view details
          </div>
        )}
      </div>
    </div>
  )
}
