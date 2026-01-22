import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const createTypeSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().optional(),
  workspaceId: z.string(),
})

const updateTypeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional(),
})

// Get all types for a workspace
router.get('/', async (req, res) => {
  const { workspaceId } = req.query

  const where: any = {}
  if (workspaceId) where.workspaceId = workspaceId

  const types = await req.prisma.dataType.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { items: true },
      },
    },
  })

  res.json(types)
})

// Get single type with items
router.get('/:id', async (req, res) => {
  const type = await req.prisma.dataType.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      _count: {
        select: { items: true },
      },
    },
  })

  if (!type) {
    return res.status(404).json({ error: 'Type not found' })
  }

  res.json(type)
})

// Get items by type (table view endpoint)
router.get('/:id/items', async (req, res) => {
  const { page = '1', limit = '25', sort = 'createdAt', order = 'desc', search } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)

  const where: any = { typeId: req.params.id }
  if (search) {
    where.content = { contains: search as string }
  }

  const [items, total] = await Promise.all([
    req.prisma.bulletItem.findMany({
      where,
      orderBy: { [sort as string]: order },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        parent: {
          select: { id: true, content: true },
        },
      },
    }),
    req.prisma.bulletItem.count({ where }),
  ])

  res.json({
    items,
    total,
    page: pageNum,
    pageSize: limitNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// Create type
router.post('/', async (req, res) => {
  const parsed = createTypeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  // Check for duplicate name in workspace
  const existing = await req.prisma.dataType.findFirst({
    where: {
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
    },
  })

  if (existing) {
    return res.status(400).json({ error: 'Type with this name already exists' })
  }

  const type = await req.prisma.dataType.create({
    data: parsed.data,
  })

  res.status(201).json(type)
})

// Update type
router.patch('/:id', async (req, res) => {
  const parsed = updateTypeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  // If renaming, check for duplicates
  if (parsed.data.name) {
    const currentType = await req.prisma.dataType.findUnique({
      where: { id: req.params.id },
    })

    if (currentType) {
      const existing = await req.prisma.dataType.findFirst({
        where: {
          workspaceId: currentType.workspaceId,
          name: parsed.data.name,
          id: { not: req.params.id },
        },
      })

      if (existing) {
        return res.status(400).json({ error: 'Type with this name already exists' })
      }
    }
  }

  const type = await req.prisma.dataType.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  // Update typeName on all items with this type
  if (parsed.data.name) {
    await req.prisma.bulletItem.updateMany({
      where: { typeId: req.params.id },
      data: { typeName: parsed.data.name },
    })
  }

  res.json(type)
})

// Delete type
router.delete('/:id', async (req, res) => {
  // Items will have typeId set to null via onDelete: SetNull
  await req.prisma.dataType.delete({
    where: { id: req.params.id },
  })

  res.status(204).send()
})

export default router
