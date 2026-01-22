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

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite database

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

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
cd ../server && npm install
```

3. Set up the database:
```bash
cd server
npx prisma generate
npx prisma db push
```

4. Start development servers:
```bash
# From root directory
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

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
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry
│   └── prisma/
│       └── schema.prisma   # Database schema
└── package.json            # Root package.json
```

## API Endpoints

### Items
- `GET /api/items` - List items (with pagination, filtering)
- `POST /api/items` - Create item
- `PATCH /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/:id/related` - Get related items

### Types
- `GET /api/types` - List types
- `POST /api/types` - Create type
- `GET /api/types/:id/items` - Get items by type (table view)

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id/items` - Query subscription items (API endpoint)

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace

## License

MIT
