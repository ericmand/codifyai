import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['personal', 'work', 'community']).default('personal'),
})

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['personal', 'work', 'community']).optional(),
})

// Get all workspaces
router.get('/', async (req, res) => {
  const workspaces = await req.prisma.workspace.findMany({
    orderBy: { createdAt: 'asc' },
  })
  res.json(workspaces)
})

// Get single workspace
router.get('/:id', async (req, res) => {
  const workspace = await req.prisma.workspace.findUnique({
    where: { id: req.params.id },
    include: {
      types: true,
      _count: {
        select: { items: true, subscriptions: true },
      },
    },
  })

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' })
  }

  res.json(workspace)
})

// Create workspace
router.post('/', async (req, res) => {
  const parsed = createWorkspaceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const workspace = await req.prisma.workspace.create({
    data: parsed.data,
  })

  res.status(201).json(workspace)
})

// Update workspace
router.patch('/:id', async (req, res) => {
  const parsed = updateWorkspaceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const workspace = await req.prisma.workspace.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  res.json(workspace)
})

// Delete workspace
router.delete('/:id', async (req, res) => {
  const workspace = await req.prisma.workspace.findUnique({
    where: { id: req.params.id },
  })

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' })
  }

  if (workspace.isDefault) {
    return res.status(400).json({ error: 'Cannot delete default workspace' })
  }

  await req.prisma.workspace.delete({
    where: { id: req.params.id },
  })

  res.status(204).send()
})

export default router
