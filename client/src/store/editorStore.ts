import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { BulletItem, DataType } from '../types'

interface EditorStore {
  items: BulletItem[]
  types: DataType[]
  selectedItemId: string | null
  focusedItemId: string | null
  isTypeModalOpen: boolean
  typeModalItemId: string | null

  // Item actions
  addItem: (parentId: string | null, afterItemId?: string | null, content?: string) => string
  updateItem: (id: string, updates: Partial<BulletItem>) => void
  deleteItem: (id: string) => void
  indentItem: (id: string) => void
  outdentItem: (id: string) => void
  moveItem: (id: string, newParentId: string | null, newOrder: number) => void

  // Selection actions
  setSelectedItem: (id: string | null) => void
  setFocusedItem: (id: string | null) => void

  // Type actions
  openTypeModal: (itemId: string) => void
  closeTypeModal: () => void
  assignType: (itemId: string, typeId: string | null, typeName: string | null) => void
  addType: (name: string, color: string) => DataType

  // Bulk actions
  setItems: (items: BulletItem[]) => void
  setTypes: (types: DataType[]) => void
  clearWorkspace: () => void

  // Query helpers
  getItemsByType: (typeId: string) => BulletItem[]
  getItemsByParent: (parentId: string | null) => BulletItem[]
  getItemWithChildren: (id: string) => BulletItem | null
  searchItems: (query: string) => BulletItem[]
  getRelatedItems: (itemId: string) => BulletItem[]
}

const DEFAULT_WORKSPACE_ID = 'default-workspace'

const createDefaultItem = (): BulletItem => ({
  id: uuidv4(),
  content: '',
  parentId: null,
  typeId: null,
  typeName: null,
  indent: 0,
  order: 0,
  workspaceId: DEFAULT_WORKSPACE_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const defaultTypes: DataType[] = [
  { id: 'type-person', name: 'Person', color: '#3b82f6', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
  { id: 'type-age', name: 'Age', color: '#10b981', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
  { id: 'type-location', name: 'Location', color: '#f59e0b', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
  { id: 'type-project', name: 'Project', color: '#8b5cf6', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
  { id: 'type-task', name: 'Task', color: '#ef4444', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
  { id: 'type-note', name: 'Note', color: '#6b7280', workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date() },
]

export const useEditorStore = create<EditorStore>((set, get) => ({
  items: [createDefaultItem()],
  types: defaultTypes,
  selectedItemId: null,
  focusedItemId: null,
  isTypeModalOpen: false,
  typeModalItemId: null,

  addItem: (parentId, afterItemId = null, content = '') => {
    const newId = uuidv4()
    const { items } = get()

    // Calculate indent based on parent
    let indent = 0
    if (parentId) {
      const parent = items.find(i => i.id === parentId)
      if (parent) {
        indent = parent.indent + 1
      }
    }

    // Calculate order
    let order = 0
    if (afterItemId) {
      const afterItem = items.find(i => i.id === afterItemId)
      if (afterItem) {
        order = afterItem.order + 1
        indent = afterItem.indent
        // Use the same parentId as the afterItem
        parentId = afterItem.parentId
      }
    } else {
      const siblings = items.filter(i => i.parentId === parentId)
      order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0
    }

    const newItem: BulletItem = {
      id: newId,
      content,
      parentId,
      typeId: null,
      typeName: null,
      indent,
      order,
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set(state => {
      // Shift orders of items that come after
      const updatedItems = state.items.map(item => {
        if (item.parentId === parentId && item.order >= order && item.id !== newId) {
          return { ...item, order: item.order + 1 }
        }
        return item
      })
      return { items: [...updatedItems, newItem] }
    })

    return newId
  },

  updateItem: (id, updates) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      ),
    }))
  },

  deleteItem: (id) => {
    set(state => {
      // Get all descendant IDs
      const getDescendantIds = (parentId: string): string[] => {
        const children = state.items.filter(i => i.parentId === parentId)
        return children.flatMap(child => [child.id, ...getDescendantIds(child.id)])
      }

      const idsToDelete = new Set([id, ...getDescendantIds(id)])
      return { items: state.items.filter(item => !idsToDelete.has(item.id)) }
    })
  },

  indentItem: (id) => {
    set(state => {
      const item = state.items.find(i => i.id === id)
      if (!item || item.indent >= 8) return state

      // Find the previous sibling to become the new parent
      const siblings = state.items
        .filter(i => i.parentId === item.parentId && i.id !== id)
        .sort((a, b) => a.order - b.order)

      const prevSibling = siblings.find(s => s.order < item.order)
      if (!prevSibling) return state // Can't indent if no previous sibling

      // Update the item and all its children
      const updateIndent = (items: BulletItem[], itemId: string, newParentId: string): BulletItem[] => {
        return items.map(i => {
          if (i.id === itemId) {
            return { ...i, parentId: newParentId, indent: i.indent + 1, updatedAt: new Date() }
          }
          if (i.parentId === itemId) {
            return { ...i, indent: i.indent + 1, updatedAt: new Date() }
          }
          return i
        })
      }

      return { items: updateIndent(state.items, id, prevSibling.id) }
    })
  },

  outdentItem: (id) => {
    set(state => {
      const item = state.items.find(i => i.id === id)
      if (!item || item.indent <= 0 || !item.parentId) return state

      const parent = state.items.find(i => i.id === item.parentId)
      if (!parent) return state

      // Update the item and all its children
      const updateIndent = (items: BulletItem[], itemId: string, newParentId: string | null): BulletItem[] => {
        return items.map(i => {
          if (i.id === itemId) {
            return { ...i, parentId: newParentId, indent: Math.max(0, i.indent - 1), updatedAt: new Date() }
          }
          if (i.parentId === itemId) {
            return { ...i, indent: Math.max(0, i.indent - 1), updatedAt: new Date() }
          }
          return i
        })
      }

      return { items: updateIndent(state.items, id, parent.parentId) }
    })
  },

  moveItem: (id, newParentId, newOrder) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === id
          ? { ...item, parentId: newParentId, order: newOrder, updatedAt: new Date() }
          : item
      ),
    }))
  },

  setSelectedItem: (id) => set({ selectedItemId: id }),
  setFocusedItem: (id) => set({ focusedItemId: id }),

  openTypeModal: (itemId) => set({ isTypeModalOpen: true, typeModalItemId: itemId }),
  closeTypeModal: () => set({ isTypeModalOpen: false, typeModalItemId: null }),

  assignType: (itemId, typeId, typeName) => {
    set(state => ({
      items: state.items.map(item =>
        item.id === itemId
          ? { ...item, typeId, typeName, updatedAt: new Date() }
          : item
      ),
      isTypeModalOpen: false,
      typeModalItemId: null,
    }))
  },

  addType: (name, color) => {
    const newType: DataType = {
      id: uuidv4(),
      name,
      color,
      workspaceId: DEFAULT_WORKSPACE_ID,
      createdAt: new Date(),
    }
    set(state => ({ types: [...state.types, newType] }))
    return newType
  },

  setItems: (items) => set({ items }),
  setTypes: (types) => set({ types }),

  clearWorkspace: () => {
    set({ items: [createDefaultItem()], selectedItemId: null, focusedItemId: null })
  },

  getItemsByType: (typeId) => {
    return get().items.filter(item => item.typeId === typeId)
  },

  getItemsByParent: (parentId) => {
    return get().items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  },

  getItemWithChildren: (id) => {
    const { items } = get()
    const item = items.find(i => i.id === id)
    if (!item) return null

    const getChildren = (parentId: string): BulletItem[] => {
      return items
        .filter(i => i.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(child => ({
          ...child,
          children: getChildren(child.id),
        }))
    }

    return {
      ...item,
      children: getChildren(id),
    }
  },

  searchItems: (query) => {
    const { items, types } = get()
    const lowerQuery = query.toLowerCase()

    return items.filter(item => {
      // Search in content
      if (item.content.toLowerCase().includes(lowerQuery)) return true

      // Search in type name
      if (item.typeName?.toLowerCase().includes(lowerQuery)) return true

      // Search in type
      const type = types.find(t => t.id === item.typeId)
      if (type?.name.toLowerCase().includes(lowerQuery)) return true

      return false
    })
  },

  getRelatedItems: (itemId) => {
    const { items } = get()
    const item = items.find(i => i.id === itemId)
    if (!item) return []

    const related: BulletItem[] = []

    // Get parent
    if (item.parentId) {
      const parent = items.find(i => i.id === item.parentId)
      if (parent) related.push(parent)
    }

    // Get children
    const children = items.filter(i => i.parentId === itemId)
    related.push(...children)

    // Get items with same type (bidirectional relationship)
    if (item.typeId) {
      const sameType = items.filter(i => i.typeId === item.typeId && i.id !== itemId)
      related.push(...sameType)
    }

    return related
  },
}))
