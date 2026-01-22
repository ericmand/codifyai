import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import workspacesRouter from './routes/workspaces.js'
import itemsRouter from './routes/items.js'
import typesRouter from './routes/types.js'
import subscriptionsRouter from './routes/subscriptions.js'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Make prisma available in request
app.use((req, res, next) => {
  req.prisma = prisma
  next()
})

// Routes
app.use('/api/workspaces', workspacesRouter)
app.use('/api/items', itemsRouter)
app.use('/api/types', typesRouter)
app.use('/api/subscriptions', subscriptionsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Initialize default workspace and types
async function initializeDefaults() {
  const defaultWorkspace = await prisma.workspace.findFirst({
    where: { isDefault: true },
  })

  if (!defaultWorkspace) {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Personal',
        description: 'Your personal workspace',
        type: 'personal',
        isDefault: true,
      },
    })

    // Create default types
    const defaultTypes = [
      { name: 'Person', color: '#3b82f6' },
      { name: 'Age', color: '#10b981' },
      { name: 'Location', color: '#f59e0b' },
      { name: 'Project', color: '#8b5cf6' },
      { name: 'Task', color: '#ef4444' },
      { name: 'Note', color: '#6b7280' },
    ]

    for (const type of defaultTypes) {
      await prisma.dataType.create({
        data: {
          ...type,
          workspaceId: workspace.id,
        },
      })
    }

    // Create initial item
    await prisma.bulletItem.create({
      data: {
        content: '',
        workspaceId: workspace.id,
        order: 0,
      },
    })

    console.log('Default workspace and types initialized')
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeDefaults()
  console.log(`Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient
    }
  }
}

export { app, prisma }
