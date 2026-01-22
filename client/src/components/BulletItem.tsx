import { useRef, useEffect } from 'react'
import { Circle, Hash } from 'lucide-react'
import type { BulletItem as BulletItemType, DataType } from '../types'
import clsx from 'clsx'

interface BulletItemProps {
  item: BulletItemType
  onKeyDown: (e: React.KeyboardEvent, item: BulletItemType) => void
  onChange: (id: string, content: string) => void
  onFocus: (id: string) => void
  registerRef: (id: string, ref: HTMLInputElement | null) => void
  types: DataType[]
  onOpenTypeModal: () => void
}

export default function BulletItem({
  item,
  onKeyDown,
  onChange,
  onFocus,
  registerRef,
  types,
  onOpenTypeModal,
}: BulletItemProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const type = item.typeId ? types.find(t => t.id === item.typeId) : null

  useEffect(() => {
    registerRef(item.id, inputRef.current)
    return () => registerRef(item.id, null)
  }, [item.id, registerRef])

  return (
    <div
      className={clsx(
        'bullet-item group flex items-start gap-2 py-1 px-2 rounded-lg transition-colors',
        'hover:bg-gray-50'
      )}
    >
      {/* Bullet point */}
      <div className="flex-shrink-0 mt-2">
        {type ? (
          <div
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ backgroundColor: type.color + '30', color: type.color }}
            title={type.name}
          >
            <Hash className="w-3 h-3" />
          </div>
        ) : (
          <Circle className="w-2 h-2 text-gray-400 mt-1" fill="currentColor" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={item.content}
          onChange={(e) => onChange(item.id, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, item)}
          onFocus={() => onFocus(item.id)}
          placeholder="Type here..."
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
        />

        {/* Type Badge */}
        {type && (
          <button
            onClick={onOpenTypeModal}
            className="type-badge text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: type.color + '20',
              color: type.color,
            }}
          >
            {type.name}
          </button>
        )}

        {/* Actions (shown on hover) */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={onOpenTypeModal}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
            title="Assign type (Shift+Enter)"
          >
            <Hash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
