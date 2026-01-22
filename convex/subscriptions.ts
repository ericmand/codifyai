import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("subscriptions")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }
    return await ctx.db.query("subscriptions").collect();
  },
});

export const get = query({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithItems = query({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.id);
    if (!subscription) return null;

    let items: any[] = [];

    if (subscription.typeId) {
      items = await ctx.db
        .query("items")
        .withIndex("by_type", (q) => q.eq("typeId", subscription.typeId))
        .collect();
    }

    return { ...subscription, items };
  },
});

export const getTotalUnread = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  handler: async (ctx, args) => {
    let subs;
    if (args.workspaceId) {
      subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    } else {
      subs = await ctx.db.query("subscriptions").collect();
    }

    return subs.reduce((total, sub) => total + sub.unreadCount, 0);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    query: v.string(),
    typeId: v.optional(v.id("types")),
    filters: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    notifyOnNew: v.optional(v.boolean()),
    notifyChannels: v.optional(v.array(v.union(v.literal("app"), v.literal("email")))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", {
      name: args.name,
      query: args.query,
      typeId: args.typeId,
      filters: args.filters,
      workspaceId: args.workspaceId,
      notifyOnNew: args.notifyOnNew ?? false,
      notifyChannels: args.notifyChannels ?? [],
      unreadCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.optional(v.string()),
    query: v.optional(v.string()),
    typeId: v.optional(v.union(v.id("types"), v.null())),
    filters: v.optional(v.union(v.string(), v.null())),
    notifyOnNew: v.optional(v.boolean()),
    notifyChannels: v.optional(v.array(v.union(v.literal("app"), v.literal("email")))),
    unreadCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values and handle null conversion
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value === null ? undefined : value;
      }
    }

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

export const markAsRead = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { unreadCount: 0 });
    return await ctx.db.get(args.id);
  },
});

export const incrementUnread = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (sub) {
      await ctx.db.patch(args.id, { unreadCount: sub.unreadCount + 1 });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
