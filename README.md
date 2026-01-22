# Codify - Structured Text Editor

Codify is a low-code text editor combining document expressiveness with database structure. Users can organize information as bullet points while the system automatically structures data for aggregation and querying.

## Features

### Core Capabilities
- **No constraints on entry** - The cursor is always on a bullet point; type freely without validation rules
- **Relationships via nesting** - Create parent-child connections through indentation
- **Type system** - Assign data types (Person, Age, Task, etc.) using `Shift+Enter`
- **Bidirectional relationships** - Access data from both directions (e.g., Eric → Age, or all people aged 37)

### Query & Search
- **Autocomplete search** - Start typing to find instances and types (`Cmd/Ctrl+K`)
- **Preview functionality** - Related data appears automatically below entries
- **Table view** - View items by type with sorting, filtering, and pagination
- **Export** - Download data as CSV

### Advanced Features
- **Subscriptions** - Create persistent links to specific views with badge notifications
- **API endpoints** - Views become queryable API endpoints for external integration
- **Multi-workspace support** - Personal, work, and community workspaces
- **Real-time sync** - Changes sync instantly across all clients

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for UI state management
- React Router for navigation

### Backend
- [Convex](https://convex.dev) - Real-time backend-as-a-service
- TypeScript
- Automatic real-time sync

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Convex account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd codifyai
```

2. Install dependencies:
```bash
npm install
cd client && npm install
```

3. Set up Convex:
```bash
# Login to Convex (creates account if needed)
npx convex login

# Initialize Convex project (from root directory)
npx convex dev
```

This will create a `.env.local` file in your client directory with your Convex URL.

4. Start the development server:
```bash
cd client
npm run dev
```

The app will be available at http://localhost:5173

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Create new bullet item |
| `Shift+Enter` | Assign/change type |
| `Tab` | Indent item (nest under previous) |
| `Shift+Tab` | Outdent item |
| `Backspace` (empty item) | Delete item |
| `↑/↓` | Navigate between items |
| `Cmd/Ctrl+K` | Open search |

## Project Structure

```
codifyai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand UI store
│   │   └── utils/          # Utility functions
│   └── ...
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── items.ts            # Item queries/mutations
│   ├── types.ts            # Type queries/mutations
│   ├── workspaces.ts       # Workspace queries/mutations
│   └── subscriptions.ts    # Subscription queries/mutations
└── package.json            # Root package.json
```

## Convex Functions

### Items
- `items.list` - List items by workspace
- `items.listByType` - List items by type (for table view)
- `items.get` - Get single item
- `items.getWithChildren` - Get item with nested children
- `items.getRelated` - Get related items (same type, bidirectional)
- `items.search` - Full-text search
- `items.create` - Create item
- `items.update` - Update item
- `items.remove` - Delete item

### Types
- `types.list` - List types by workspace
- `types.get` - Get single type
- `types.create` - Create type
- `types.update` - Update type
- `types.remove` - Delete type

### Subscriptions
- `subscriptions.list` - List subscriptions
- `subscriptions.get` - Get subscription
- `subscriptions.getWithItems` - Get subscription with matching items
- `subscriptions.getTotalUnread` - Get total unread count
- `subscriptions.create` - Create subscription
- `subscriptions.update` - Update subscription
- `subscriptions.markAsRead` - Mark as read
- `subscriptions.remove` - Delete subscription

### Workspaces
- `workspaces.list` - List workspaces
- `workspaces.get` - Get workspace
- `workspaces.initialize` - Initialize default workspace
- `workspaces.create` - Create workspace
- `workspaces.update` - Update workspace
- `workspaces.remove` - Delete workspace

## License

MIT
