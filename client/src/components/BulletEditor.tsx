import { useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Doc, Id } from '../../../convex/_generated/dataModel'
import { useUIStore } from '../store'
import BulletItem from './BulletItem'
import TypeModal from './TypeModal'
import RelatedItemsPreview from './RelatedItemsPreview'

type ItemWithChildren = Doc<"items"> & { children?: ItemWithChildren[] }

export default function BulletEditor() {
  const {
    focusedItemId,
    isTypeModalOpen,
    typeModalItemId,
    activeWorkspaceId,
    setFocusedItem,
    openTypeModal,
    closeTypeModal,
  } = useUIStore()

  const items = useQuery(
    api.items.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const types = useQuery(
    api.types.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const relatedItems = useQuery(
    api.items.getRelated,
    focusedItemId ? { id: focusedItemId as Id<"items"> } : "skip"
  )

  const createItem = useMutation(api.items.create)
  const updateItem = useMutation(api.items.update)
  const removeItem = useMutation(api.items.remove)
  const createType = useMutation(api.types.create)

  const editorRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  // Build tree structure from flat items
  const buildTree = useCallback((parentId: Id<"items"> | null = null): ItemWithChildren[] => {
    return items
      .filter(item => (item.parentId ?? null) === parentId)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        ...item,
        children: buildTree(item._id),
      }))
  }, [items])

  const rootItems = useMemo(() => buildTree(null), [buildTree])

  // Get all items in display order (flattened tree)
  const getAllFlatItems = useCallback((): ItemWithChildren[] => {
    const result: ItemWithChildren[] = []
    const traverse = (items: ItemWithChildren[]) => {
      for (const item of items) {
        result.push(item)
        if (item.children) traverse(item.children)
      }
    }
    traverse(rootItems)
    return result
  }, [rootItems])

  // Focus management
  const focusItem = useCallback((itemId: string) => {
    setTimeout(() => {
      const input = itemRefs.current.get(itemId)
      if (input) {
        input.focus()
        const length = input.value.length
        input.setSelectionRange(length, length)
      }
    }, 50)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent, item: ItemWithChildren) => {
    if (!activeWorkspaceId) return

    const input = e.target as HTMLInputElement
    const cursorPosition = input.selectionStart || 0

    // ENTER: Create new item
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const newId = await createItem({
        content: '',
        parentId: item.parentId ?? undefined,
        indent: item.indent,
        order: item.order + 1,
        workspaceId: activeWorkspaceId,
      })
      focusItem(newId)
    }

    // SHIFT+ENTER: Open type modal
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      openTypeModal(item._id)
    }

    // TAB: Indent
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (item.indent < 8) {
        const siblings = items
          .filter(i => (i.parentId ?? null) === (item.parentId ?? null) && i._id !== item._id)
          .sort((a, b) => a.order - b.order)
        const prevSibling = siblings.find(s => s.order < item.order)
        if (prevSibling) {
          await updateItem({
            id: item._id,
            parentId: prevSibling._id,
            indent: item.indent + 1,
          })
        }
      }
    }

    // SHIFT+TAB: Outdent
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (item.indent > 0 && item.parentId) {
        const parent = items.find(i => i._id === item.parentId)
        if (parent) {
          await updateItem({
            id: item._id,
            parentId: parent.parentId ?? null,
            indent: Math.max(0, item.indent - 1),
          })
        }
      }
    }

    // BACKSPACE at start: Delete or merge
    if (e.key === 'Backspace' && cursorPosition === 0 && item.content === '') {
      e.preventDefault()
      const flatItems = getAllFlatItems()
      const currentIndex = flatItems.findIndex(i => i._id === item._id)
      const prevItem = flatItems[currentIndex - 1]

      if (items.length > 1) {
        await removeItem({ id: item._id })
        if (prevItem) {
          focusItem(prevItem._id)
        }
      }
    }

    // ARROW UP: Navigate up
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const flatItems = getAllFlatItems()
      const currentIndex = flatItems.findIndex(i => i._id === item._id)
      if (currentIndex > 0) {
        const prevItem = flatItems[currentIndex - 1]
        focusItem(prevItem._id)
      }
    }

    // ARROW DOWN: Navigate down
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const flatItems = getAllFlatItems()
      const currentIndex = flatItems.findIndex(i => i._id === item._id)
      if (currentIndex < flatItems.length - 1) {
        const nextItem = flatItems[currentIndex + 1]
        focusItem(nextItem._id)
      }
    }
  }, [items, activeWorkspaceId, createItem, updateItem, removeItem, openTypeModal, focusItem, getAllFlatItems])

  // Register item ref
  const registerItemRef = useCallback((id: string, ref: HTMLInputElement | null) => {
    if (ref) {
      itemRefs.current.set(id, ref)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  // Handle content change
  const handleContentChange = useCallback(async (id: Id<"items">, content: string) => {
    await updateItem({ id, content })
  }, [updateItem])

  // Handle focus change
  const handleFocus = useCallback((id: string) => {
    setFocusedItem(id)
  }, [setFocusedItem])

  // Handle type assignment
  const handleAssignType = useCallback(async (itemId: string, typeId: Id<"types"> | null, typeName: string | null) => {
    await updateItem({
      id: itemId as Id<"items">,
      typeId: typeId ?? null,
      typeName: typeName ?? null,
    })
    closeTypeModal()
  }, [updateItem, closeTypeModal])

  // Handle type creation
  const handleCreateType = useCallback(async (name: string, color: string) => {
    if (!activeWorkspaceId) return null
    const newTypeId = await createType({
      name,
      color,
      workspaceId: activeWorkspaceId,
    })
    return { id: newTypeId, name, color }
  }, [createType, activeWorkspaceId])

  // Get focused item for preview
  const focusedItem = focusedItemId ? items.find(i => i._id === focusedItemId) : null

  // Render items recursively
  const renderItems = (itemList: ItemWithChildren[]) => {
    return itemList.map(item => (
      <div key={item._id}>
        <BulletItem
          item={item}
          onKeyDown={handleKeyDown}
          onChange={handleContentChange}
          onFocus={handleFocus}
          registerRef={registerItemRef}
          types={types}
          onOpenTypeModal={() => openTypeModal(item._id)}
        />
        {item.children && item.children.length > 0 && (
          <div className="ml-6">
            {renderItems(item.children)}
          </div>
        )}
      </div>
    ))
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={editorRef} className="min-h-[400px] py-4">
        {renderItems(rootItems)}
      </div>

      {/* Related Items Preview */}
      {focusedItem && relatedItems && relatedItems.length > 0 && (
        <RelatedItemsPreview
          item={focusedItem}
          relatedItems={relatedItems.map(r => r.item)}
          types={types}
        />
      )}

      {/* Type Assignment Modal */}
      <TypeModal
        isOpen={isTypeModalOpen}
        onClose={closeTypeModal}
        onSelectType={(typeId, typeName) => {
          if (typeModalItemId) {
            handleAssignType(typeModalItemId, typeId, typeName)
          }
        }}
        onCreateType={handleCreateType}
        types={types}
      />
    </div>
  )
}
