import { useState, useEffect, useRef } from 'react'
import { Hash, Plus, X, Check } from 'lucide-react'
import { Doc, Id } from '../../../convex/_generated/dataModel'
import clsx from 'clsx'

interface TypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (typeId: Id<"types"> | null, typeName: string | null) => void
  onCreateType: (name: string, color: string) => Promise<{ id: Id<"types">; name: string; color: string } | null>
  types: Doc<"types">[]
}

const TYPE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
]

export default function TypeModal({ isOpen, onClose, onSelectType, onCreateType, types }: TypeModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeColor, setNewTypeColor] = useState(TYPE_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredTypes = types.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
      setIsCreating(false)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredTypes.length))
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex < filteredTypes.length) {
        const type = filteredTypes[selectedIndex]
        onSelectType(type._id, type.name)
      } else if (selectedIndex === filteredTypes.length && query.trim()) {
        setIsCreating(true)
        setNewTypeName(query)
      }
    }
  }

  const handleCreateType = async () => {
    if (newTypeName.trim()) {
      const newType = await onCreateType(newTypeName.trim(), newTypeColor)
      if (newType) {
        onSelectType(newType.id, newType.name)
      }
    }
  }

  const handleClearType = () => {
    onSelectType(null, null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {!isCreating ? (
          <>
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Hash className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or create type..."
                className="flex-1 outline-none"
              />
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type List */}
            <div className="max-h-64 overflow-y-auto py-2">
              {/* Clear Type Option */}
              <button
                onClick={handleClearType}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                  'text-gray-500 hover:bg-gray-50'
                )}
              >
                <X className="w-4 h-4" />
                <span>Remove type</span>
              </button>

              {filteredTypes.map((type, index) => (
                <button
                  key={type._id}
                  onClick={() => onSelectType(type._id, type.name)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                    selectedIndex === index
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: type.color + '20', color: type.color }}
                  >
                    <Hash className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{type.name}</span>
                  {selectedIndex === index && (
                    <Check className="w-4 h-4 ml-auto text-primary-600" />
                  )}
                </button>
              ))}

              {/* Create New Type Option */}
              {query.trim() && !filteredTypes.some(t => t.name.toLowerCase() === query.toLowerCase()) && (
                <button
                  onClick={() => {
                    setIsCreating(true)
                    setNewTypeName(query)
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                    selectedIndex === filteredTypes.length
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Plus className="w-5 h-5 text-primary-500" />
                  <span>Create type "<strong>{query}</strong>"</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <span><kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> Navigate</span>
              <span className="ml-4"><kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd> Select</span>
            </div>
          </>
        ) : (
          <>
            {/* Create New Type Form */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Create New Type</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type Name
                  </label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {TYPE_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTypeColor(color)}
                        className={clsx(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          newTypeColor === color
                            ? 'border-gray-900 scale-110'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateType}
                disabled={!newTypeName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                Create Type
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
