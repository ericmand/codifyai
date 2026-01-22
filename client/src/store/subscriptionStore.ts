import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Subscription, FilterCondition } from '../types'

interface SubscriptionStore {
  subscriptions: Subscription[]

  addSubscription: (
    name: string,
    query: string,
    workspaceId: string,
    options?: {
      typeId?: string
      filters?: FilterCondition[]
      notifyOnNew?: boolean
      notifyChannels?: ('app' | 'email')[]
    }
  ) => Subscription
  updateSubscription: (id: string, updates: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
  markAsRead: (id: string) => void
  incrementUnread: (id: string) => void
  getSubscriptionsByWorkspace: (workspaceId: string) => Subscription[]
  getTotalUnreadCount: () => number
}

const defaultSubscriptions: Subscription[] = [
  {
    id: 'sub-all-tasks',
    name: 'All Tasks',
    query: 'type:Task',
    typeId: 'type-task',
    workspaceId: 'personal-workspace',
    notifyOnNew: true,
    notifyChannels: ['app'],
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sub-people',
    name: 'People',
    query: 'type:Person',
    typeId: 'type-person',
    workspaceId: 'personal-workspace',
    notifyOnNew: false,
    notifyChannels: [],
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscriptions: defaultSubscriptions,

  addSubscription: (name, query, workspaceId, options = {}) => {
    const newSubscription: Subscription = {
      id: uuidv4(),
      name,
      query,
      typeId: options.typeId,
      filters: options.filters,
      workspaceId,
      notifyOnNew: options.notifyOnNew ?? false,
      notifyChannels: options.notifyChannels ?? [],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set(state => ({ subscriptions: [...state.subscriptions, newSubscription] }))
    return newSubscription
  },

  updateSubscription: (id, updates) => {
    set(state => ({
      subscriptions: state.subscriptions.map(sub =>
        sub.id === id
          ? { ...sub, ...updates, updatedAt: new Date() }
          : sub
      ),
    }))
  },

  deleteSubscription: (id) => {
    set(state => ({
      subscriptions: state.subscriptions.filter(sub => sub.id !== id),
    }))
  },

  markAsRead: (id) => {
    set(state => ({
      subscriptions: state.subscriptions.map(sub =>
        sub.id === id ? { ...sub, unreadCount: 0 } : sub
      ),
    }))
  },

  incrementUnread: (id) => {
    set(state => ({
      subscriptions: state.subscriptions.map(sub =>
        sub.id === id ? { ...sub, unreadCount: sub.unreadCount + 1 } : sub
      ),
    }))
  },

  getSubscriptionsByWorkspace: (workspaceId) => {
    return get().subscriptions.filter(sub => sub.workspaceId === workspaceId)
  },

  getTotalUnreadCount: () => {
    return get().subscriptions.reduce((total, sub) => total + sub.unreadCount, 0)
  },
}))
