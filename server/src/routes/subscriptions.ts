import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string(),
  typeId: z.string().optional(),
  filters: z.string().optional(), // JSON string
  workspaceId: z.string(),
  notifyOnNew: z.boolean().default(false),
  notifyChannels: z.string().default('[]'), // JSON array
})

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  query: z.string().optional(),
  typeId: z.string().nullable().optional(),
  filters: z.string().nullable().optional(),
  notifyOnNew: z.boolean().optional(),
  notifyChannels: z.string().optional(),
  unreadCount: z.number().optional(),
})

// Get all subscriptions for a workspace
router.get('/', async (req, res) => {
  const { workspaceId } = req.query

  const where: any = {}
  if (workspaceId) where.workspaceId = workspaceId

  const subscriptions = await req.prisma.subscription.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      type: {
        select: { id: true, name: true, color: true },
      },
    },
  })

  // Parse JSON fields
  const parsed = subscriptions.map(sub => ({
    ...sub,
    filters: sub.filters ? JSON.parse(sub.filters) : null,
    notifyChannels: JSON.parse(sub.notifyChannels),
  }))

  res.json(parsed)
})

// Get single subscription
router.get('/:id', async (req, res) => {
  const subscription = await req.prisma.subscription.findUnique({
    where: { id: req.params.id },
    include: {
      type: true,
    },
  })

  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' })
  }

  res.json({
    ...subscription,
    filters: subscription.filters ? JSON.parse(subscription.filters) : null,
    notifyChannels: JSON.parse(subscription.notifyChannels),
  })
})

// Get items for a subscription (API endpoint for external use)
router.get('/:id/items', async (req, res) => {
  const { page = '1', limit = '25' } = req.query

  const subscription = await req.prisma.subscription.findUnique({
    where: { id: req.params.id },
  })

  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' })
  }

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)

  // Build query based on subscription
  const where: any = { workspaceId: subscription.workspaceId }

  if (subscription.typeId) {
    where.typeId = subscription.typeId
  }

  // Parse and apply filters
  if (subscription.filters) {
    const filters = JSON.parse(subscription.filters)
    for (const filter of filters) {
      switch (filter.operator) {
        case 'equals':
          where[filter.field] = filter.value
          break
        case 'contains':
          where[filter.field] = { contains: filter.value }
          break
        case 'startsWith':
          where[filter.field] = { startsWith: filter.value }
          break
        case 'endsWith':
          where[filter.field] = { endsWith: filter.value }
          break
      }
    }
  }

  const [items, total] = await Promise.all([
    req.prisma.bulletItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    req.prisma.bulletItem.count({ where }),
  ])

  res.json({
    subscription: {
      id: subscription.id,
      name: subscription.name,
      query: subscription.query,
    },
    items,
    total,
    page: pageNum,
    pageSize: limitNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// Create subscription
router.post('/', async (req, res) => {
  const parsed = createSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const subscription = await req.prisma.subscription.create({
    data: parsed.data,
  })

  res.status(201).json({
    ...subscription,
    filters: subscription.filters ? JSON.parse(subscription.filters) : null,
    notifyChannels: JSON.parse(subscription.notifyChannels),
  })
})

// Update subscription
router.patch('/:id', async (req, res) => {
  const parsed = updateSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const subscription = await req.prisma.subscription.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  res.json({
    ...subscription,
    filters: subscription.filters ? JSON.parse(subscription.filters) : null,
    notifyChannels: JSON.parse(subscription.notifyChannels),
  })
})

// Mark subscription as read
router.post('/:id/read', async (req, res) => {
  const subscription = await req.prisma.subscription.update({
    where: { id: req.params.id },
    data: { unreadCount: 0 },
  })

  res.json(subscription)
})

// Delete subscription
router.delete('/:id', async (req, res) => {
  await req.prisma.subscription.delete({
    where: { id: req.params.id },
  })

  res.status(204).send()
})

export default router
