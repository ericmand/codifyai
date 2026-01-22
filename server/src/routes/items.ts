import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const createItemSchema = z.object({
  content: z.string().default(''),
  parentId: z.string().nullable().optional(),
  typeId: z.string().nullable().optional(),
  typeName: z.string().nullable().optional(),
  indent: z.number().min(0).max(10).default(0),
  order: z.number().default(0),
  workspaceId: z.string(),
})

const updateItemSchema = z.object({
  content: z.string().optional(),
  parentId: z.string().nullable().optional(),
  typeId: z.string().nullable().optional(),
  typeName: z.string().nullable().optional(),
  indent: z.number().min(0).max(10).optional(),
  order: z.number().optional(),
})

// Get all items for a workspace
router.get('/', async (req, res) => {
  const { workspaceId, typeId, search, page = '1', limit = '100' } = req.query

  const where: any = {}
  if (workspaceId) where.workspaceId = workspaceId
  if (typeId) where.typeId = typeId
  if (search) {
    where.content = {
      contains: search as string,
    }
  }

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)

  const [items, total] = await Promise.all([
    req.prisma.bulletItem.findMany({
      where,
      orderBy: [{ indent: 'asc' }, { order: 'asc' }],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
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

// Get single item with children
router.get('/:id', async (req, res) => {
  const item = await req.prisma.bulletItem.findUnique({
    where: { id: req.params.id },
    include: {
      children: {
        orderBy: { order: 'asc' },
      },
      parent: true,
      type: true,
    },
  })

  if (!item) {
    return res.status(404).json({ error: 'Item not found' })
  }

  res.json(item)
})

// Get related items (bidirectional relationships)
router.get('/:id/related', async (req, res) => {
  const item = await req.prisma.bulletItem.findUnique({
    where: { id: req.params.id },
  })

  if (!item) {
    return res.status(404).json({ error: 'Item not found' })
  }

  const related = []

  // Get parent
  if (item.parentId) {
    const parent = await req.prisma.bulletItem.findUnique({
      where: { id: item.parentId },
    })
    if (parent) {
      related.push({ ...parent, relationshipType: 'parent' })
    }
  }

  // Get children
  const children = await req.prisma.bulletItem.findMany({
    where: { parentId: item.id },
    orderBy: { order: 'asc' },
  })
  related.push(...children.map(c => ({ ...c, relationshipType: 'child' })))

  // Get items with same type (bidirectional)
  if (item.typeId) {
    const sameType = await req.prisma.bulletItem.findMany({
      where: {
        typeId: item.typeId,
        id: { not: item.id },
      },
      take: 10,
    })
    related.push(...sameType.map(s => ({ ...s, relationshipType: 'typed' })))
  }

  res.json(related)
})

// Create item
router.post('/', async (req, res) => {
  const parsed = createItemSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const item = await req.prisma.bulletItem.create({
    data: parsed.data,
  })

  res.status(201).json(item)
})

// Bulk create items
router.post('/bulk', async (req, res) => {
  const items = z.array(createItemSchema).safeParse(req.body)
  if (!items.success) {
    return res.status(400).json({ error: items.error.errors })
  }

  const created = await req.prisma.bulletItem.createMany({
    data: items.data,
  })

  res.status(201).json({ count: created.count })
})

// Update item
router.patch('/:id', async (req, res) => {
  const parsed = updateItemSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const item = await req.prisma.bulletItem.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  res.json(item)
})

// Delete item (cascades to children)
router.delete('/:id', async (req, res) => {
  await req.prisma.bulletItem.delete({
    where: { id: req.params.id },
  })

  res.status(204).send()
})

// Delete all items in workspace (clear workspace)
router.delete('/workspace/:workspaceId', async (req, res) => {
  await req.prisma.bulletItem.deleteMany({
    where: { workspaceId: req.params.workspaceId },
  })

  // Create a new empty item
  const item = await req.prisma.bulletItem.create({
    data: {
      content: '',
      workspaceId: req.params.workspaceId,
      order: 0,
    },
  })

  res.json(item)
})

export default router
