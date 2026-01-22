import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Workspace } from '../types'

interface WorkspaceStore {
  workspaces: Workspace[]
  activeWorkspaceId: string

  setActiveWorkspace: (id: string) => void
  addWorkspace: (name: string, type: Workspace['type'], description?: string) => Workspace
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void
  deleteWorkspace: (id: string) => void
  getActiveWorkspace: () => Workspace | undefined
}

const defaultWorkspaces: Workspace[] = [
  {
    id: 'personal-workspace',
    name: 'Personal',
    description: 'Your personal workspace',
    type: 'personal',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'work-workspace',
    name: 'Work',
    description: 'Work-related items',
    type: 'work',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: defaultWorkspaces,
  activeWorkspaceId: 'personal-workspace',

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  addWorkspace: (name, type, description) => {
    const newWorkspace: Workspace = {
      id: uuidv4(),
      name,
      description,
      type,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set(state => ({ workspaces: [...state.workspaces, newWorkspace] }))
    return newWorkspace
  },

  updateWorkspace: (id, updates) => {
    set(state => ({
      workspaces: state.workspaces.map(ws =>
        ws.id === id
          ? { ...ws, ...updates, updatedAt: new Date() }
          : ws
      ),
    }))
  },

  deleteWorkspace: (id) => {
    const workspace = get().workspaces.find(ws => ws.id === id)
    if (workspace?.isDefault) return // Can't delete default workspace

    set(state => {
      const filtered = state.workspaces.filter(ws => ws.id !== id)
      const newActiveId = state.activeWorkspaceId === id
        ? state.workspaces.find(ws => ws.isDefault)?.id || filtered[0]?.id
        : state.activeWorkspaceId
      return { workspaces: filtered, activeWorkspaceId: newActiveId }
    })
  },

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get()
    return workspaces.find(ws => ws.id === activeWorkspaceId)
  },
}))
