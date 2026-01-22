import { Hash, ArrowRight, ChevronDown } from 'lucide-react'
import { Doc } from '../../../convex/_generated/dataModel'

interface RelatedItemsPreviewProps {
  item: Doc<"items">
  relatedItems: Doc<"items">[]
  types: Doc<"types">[]
}

export default function RelatedItemsPreview({
  item,
  relatedItems,
  types,
}: RelatedItemsPreviewProps) {
  const type = item.typeId ? types.find(t => t._id === item.typeId) : null

  // Group related items by relationship type
  const parents = relatedItems.filter(i => i._id === item.parentId)
  const children = relatedItems.filter(i => i.parentId === item._id)
  const sameType = relatedItems.filter(
    i => i.typeId === item.typeId && i._id !== item._id && i._id !== item.parentId && i.parentId !== item._id
  )

  if (relatedItems.length === 0) return null

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
        <ChevronDown className="w-4 h-4" />
        <span>Related Items</span>
        {type && (
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: type.color + '20', color: type.color }}
          >
            {type.name}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Parent */}
        {parents.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Parent</div>
            {parents.map(p => (
              <RelatedItemCard key={p._id} item={p} types={types} />
            ))}
          </div>
        )}

        {/* Children */}
        {children.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">
              Children ({children.length})
            </div>
            <div className="space-y-1">
              {children.slice(0, 5).map(c => (
                <RelatedItemCard key={c._id} item={c} types={types} />
              ))}
              {children.length > 5 && (
                <div className="text-xs text-gray-500 pl-6">
                  +{children.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Same Type (Bidirectional) */}
        {sameType.length > 0 && type && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">
              Other {type.name}s ({sameType.length})
            </div>
            <div className="space-y-1">
              {sameType.slice(0, 5).map(s => (
                <RelatedItemCard key={s._id} item={s} types={types} />
              ))}
              {sameType.length > 5 && (
                <div className="text-xs text-gray-500 pl-6">
                  +{sameType.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RelatedItemCard({ item, types }: { item: Doc<"items">; types: Doc<"types">[] }) {
  const type = item.typeId ? types.find(t => t._id === item.typeId) : null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer">
      {type ? (
        <div
          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: type.color + '30', color: type.color }}
        >
          <Hash className="w-3 h-3" />
        </div>
      ) : (
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </div>
      )}
      <span className="text-sm truncate flex-1">
        {item.content || 'Empty item'}
      </span>
      {type && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: type.color + '15', color: type.color }}
        >
          {type.name}
        </span>
      )}
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  )
}
