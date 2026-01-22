import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Hash, X } from 'lucide-react'
import type { BulletItem, DataType } from '../types'
import clsx from 'clsx'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchItems: (query: string) => BulletItem[]
  types: DataType[]
}

export default function SearchModal({ isOpen, onClose, searchItems, types }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BulletItem[]>([])
  const [matchingTypes, setMatchingTypes] = useState<DataType[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setMatchingTypes([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim()) {
      const itemResults = searchItems(query)
      setResults(itemResults.slice(0, 10))

      const typeResults = types.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
      )
      setMatchingTypes(typeResults)
      setSelectedIndex(0)
    } else {
      setResults([])
      setMatchingTypes([])
    }
  }, [query, searchItems, types])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = matchingTypes.length + results.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => (i + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => (i - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // Handle selection
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search items, types, or commands..."
            className="flex-1 outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">Start typing to search...</p>
              <p className="text-xs mt-2">
                Search for items by content, type name, or use <kbd className="px-1 py-0.5 bg-gray-100 rounded">type:</kbd> to filter by type
              </p>
            </div>
          ) : (
            <>
              {/* Types */}
              {matchingTypes.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase">
                    Types
                  </div>
                  {matchingTypes.map((type, index) => (
                    <button
                      key={type.id}
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
                      <span className="ml-auto text-xs text-gray-500">View all</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Items */}
              {results.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase">
                    Items
                  </div>
                  {results.map((item, index) => (
                    <button
                      key={item.id}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                        selectedIndex === matchingTypes.length + index
                          ? 'bg-primary-50'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.content || 'Empty item'}</p>
                        {item.typeName && (
                          <p className="text-xs text-gray-500">Type: {item.typeName}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchingTypes.length === 0 && results.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-4 text-xs text-gray-500">
          <span><kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
