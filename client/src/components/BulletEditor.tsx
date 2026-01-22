import { useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store'
import BulletItem from './BulletItem'
import TypeModal from './TypeModal'
import RelatedItemsPreview from './RelatedItemsPreview'
import type { BulletItem as BulletItemType } from '../types'

export default function BulletEditor() {
  const {
    items,
    focusedItemId,
    isTypeModalOpen,
    typeModalItemId,
    addItem,
    updateItem,
    deleteItem,
    indentItem,
    outdentItem,
    setFocusedItem,
    closeTypeModal,
    openTypeModal,
    assignType,
    types,
    getRelatedItems,
  } = useEditorStore()

  const editorRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  // Build tree structure from flat items
  const buildTree = useCallback((parentId: string | null = null): BulletItemType[] => {
    return items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        ...item,
        children: buildTree(item.id),
      }))
  }, [items])

  const rootItems = buildTree(null)

  // Focus management
  const focusItem = useCallback((itemId: string) => {
    const input = itemRefs.current.get(itemId)
    if (input) {
      input.focus()
      // Move cursor to end
      const length = input.value.length
      input.setSelectionRange(length, length)
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, item: BulletItemType) => {
    const input = e.target as HTMLInputElement
    const cursorPosition = input.selectionStart || 0

    // ENTER: Create new item
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const newId = addItem(item.parentId, item.id)
      setTimeout(() => focusItem(newId), 0)
    }

    // SHIFT+ENTER: Open type modal
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      openTypeModal(item.id)
    }

    // TAB: Indent
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      indentItem(item.id)
    }

    // SHIFT+TAB: Outdent
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      outdentItem(item.id)
    }

    // BACKSPACE at start: Delete or merge
    if (e.key === 'Backspace' && cursorPosition === 0 && item.content === '') {
      e.preventDefault()
      // Find previous item to focus
      const flatItems = items.sort((a, b) => {
        if (a.indent !== b.indent) return a.indent - b.indent
        return a.order - b.order
      })
      const currentIndex = flatItems.findIndex(i => i.id === item.id)
      const prevItem = flatItems[currentIndex - 1]

      if (items.length > 1) {
        deleteItem(item.id)
        if (prevItem) {
          setTimeout(() => focusItem(prevItem.id), 0)
        }
      }
    }

    // ARROW UP: Navigate up
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const flatItems = getAllFlatItems()
      const currentIndex = flatItems.findIndex(i => i.id === item.id)
      if (currentIndex > 0) {
        const prevItem = flatItems[currentIndex - 1]
        focusItem(prevItem.id)
      }
    }

    // ARROW DOWN: Navigate down
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const flatItems = getAllFlatItems()
      const currentIndex = flatItems.findIndex(i => i.id === item.id)
      if (currentIndex < flatItems.length - 1) {
        const nextItem = flatItems[currentIndex + 1]
        focusItem(nextItem.id)
      }
    }
  }, [items, addItem, deleteItem, indentItem, outdentItem, openTypeModal, focusItem])

  // Get all items in display order (flattened tree)
  const getAllFlatItems = useCallback((): BulletItemType[] => {
    const result: BulletItemType[] = []
    const traverse = (items: BulletItemType[]) => {
      for (const item of items) {
        result.push(item)
        if (item.children) traverse(item.children)
      }
    }
    traverse(rootItems)
    return result
  }, [rootItems])

  // Register item ref
  const registerItemRef = useCallback((id: string, ref: HTMLInputElement | null) => {
    if (ref) {
      itemRefs.current.set(id, ref)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  // Handle content change
  const handleContentChange = useCallback((id: string, content: string) => {
    updateItem(id, { content })
  }, [updateItem])

  // Handle focus change
  const handleFocus = useCallback((id: string) => {
    setFocusedItem(id)
  }, [setFocusedItem])

  // Get related items for preview
  const relatedItems = focusedItemId ? getRelatedItems(focusedItemId) : []
  const focusedItem = focusedItemId ? items.find(i => i.id === focusedItemId) : null

  // Render items recursively
  const renderItems = (items: BulletItemType[]) => {
    return items.map(item => (
      <div key={item.id}>
        <BulletItem
          item={item}
          onKeyDown={handleKeyDown}
          onChange={handleContentChange}
          onFocus={handleFocus}
          registerRef={registerItemRef}
          types={types}
          onOpenTypeModal={() => openTypeModal(item.id)}
        />
        {item.children && item.children.length > 0 && (
          <div className="ml-6">
            {renderItems(item.children)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="relative">
      <div ref={editorRef} className="min-h-[400px] py-4">
        {renderItems(rootItems)}
      </div>

      {/* Related Items Preview */}
      {focusedItem && relatedItems.length > 0 && (
        <RelatedItemsPreview
          item={focusedItem}
          relatedItems={relatedItems}
          types={types}
        />
      )}

      {/* Type Assignment Modal */}
      <TypeModal
        isOpen={isTypeModalOpen}
        onClose={closeTypeModal}
        onSelectType={(typeId, typeName) => {
          if (typeModalItemId) {
            assignType(typeModalItemId, typeId, typeName)
          }
        }}
        types={types}
      />
    </div>
  )
}
