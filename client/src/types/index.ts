// Core data types for Codify

export interface BulletItem {
  id: string
  content: string
  parentId: string | null
  typeId: string | null
  typeName: string | null
  indent: number
  order: number
  workspaceId: string
  createdAt: Date
  updatedAt: Date
  children?: BulletItem[]
}

export interface DataType {
  id: string
  name: string
  color: string
  icon?: string
  workspaceId: string
  createdAt: Date
}

export interface Workspace {
  id: string
  name: string
  description?: string
  type: 'personal' | 'work' | 'community'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  name: string
  query: string
  typeId?: string
  filters?: FilterCondition[]
  workspaceId: string
  notifyOnNew: boolean
  notifyChannels: ('app' | 'email')[]
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string | number
}

export interface QueryResult {
  items: BulletItem[]
  total: number
  page: number
  pageSize: number
}

export interface RelatedItem {
  item: BulletItem
  relationshipType: 'parent' | 'child' | 'sibling' | 'typed'
}

export interface SearchResult {
  items: BulletItem[]
  types: DataType[]
}

// Store state types
export interface EditorState {
  items: BulletItem[]
  selectedItemId: string | null
  focusedItemId: string | null
  isTypeModalOpen: boolean
  typeModalItemId: string | null
}

export interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}

export interface TypeState {
  types: DataType[]
}

export interface SubscriptionState {
  subscriptions: Subscription[]
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
