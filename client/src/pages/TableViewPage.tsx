import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useUIStore } from '../store'

type SortDirection = 'asc' | 'desc' | null
type SortField = 'content' | '_creationTime'

export default function TableViewPage() {
  const { typeId } = useParams<{ typeId: string }>()
  const { activeWorkspaceId } = useUIStore()

  const types = useQuery(
    api.types.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const allItems = useQuery(
    api.items.list,
    activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
  ) ?? []

  const typeItems = useQuery(
    api.items.listByType,
    typeId ? { typeId: typeId as Id<"types"> } : "skip"
  ) ?? []

  const type = types.find(t => t._id === typeId)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting
  const [sortField, setSortField] = useState<SortField>('_creationTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filtering
  const [filterQuery, setFilterQuery] = useState('')

  // Computed data
  const filteredItems = useMemo(() => {
    let result = [...typeItems]

    if (filterQuery) {
      result = result.filter(item =>
        item.content.toLowerCase().includes(filterQuery.toLowerCase())
      )
    }

    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]

        if (sortField === '_creationTime') {
          return sortDirection === 'asc'
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number)
        }

        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }

    return result
  }, [typeItems, filterQuery, sortField, sortDirection])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const totalPages = Math.ceil(filteredItems.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField('_creationTime')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getParentInfo = (parentId: Id<"items"> | undefined) => {
    if (!parentId) return null
    const parent = allItems.find(i => i._id === parentId)
    return parent ? parent.content || 'Untitled' : null
  }

  const handleExport = () => {
    const headers = ['Content', 'Parent', 'Created']
    const rows = filteredItems.map(item => [
      item.content,
      getParentInfo(item.parentId) || '',
      new Date(item._creationTime).toISOString(),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!type) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Type not found</p>
          <Link to="/" className="text-primary-600 hover:underline mt-2 inline-block">
            Back to Editor
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: type.color + '20', color: type.color }}
            >
              <span className="text-lg font-bold">{type.name[0]}</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{type.name}</h1>
              <p className="text-sm text-gray-500">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by content..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('content')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Content
                  {sortField === 'content' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('_creationTime')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Created
                  {sortField === '_creationTime' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            ) : (
              paginatedItems.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{item.content || 'Untitled'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {getParentInfo(item.parentId) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(item._creationTime).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
