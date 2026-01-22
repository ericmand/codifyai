import { create } from 'zustand'
import { Id } from '../../../convex/_generated/dataModel'

interface UIStore {
  // Selection state
  selectedItemId: string | null
  focusedItemId: string | null

  // Modal state
  isTypeModalOpen: boolean
  typeModalItemId: string | null

  // Workspace state (active workspace ID)
  activeWorkspaceId: Id<"workspaces"> | null

  // Actions
  setSelectedItem: (id: string | null) => void
  setFocusedItem: (id: string | null) => void
  openTypeModal: (itemId: string) => void
  closeTypeModal: () => void
  setActiveWorkspace: (id: Id<"workspaces">) => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedItemId: null,
  focusedItemId: null,
  isTypeModalOpen: false,
  typeModalItemId: null,
  activeWorkspaceId: null,

  setSelectedItem: (id) => set({ selectedItemId: id }),
  setFocusedItem: (id) => set({ focusedItemId: id }),
  openTypeModal: (itemId) => set({ isTypeModalOpen: true, typeModalItemId: itemId }),
  closeTypeModal: () => set({ isTypeModalOpen: false, typeModalItemId: null }),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
}))
