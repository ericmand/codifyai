import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("types")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }
    return await ctx.db.query("types").collect();
  },
});

export const get = query({
  args: { id: v.id("types") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithItems = query({
  args: { id: v.id("types") },
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.id);
    if (!type) return null;

    const items = await ctx.db
      .query("items")
      .withIndex("by_type", (q) => q.eq("typeId", args.id))
      .collect();

    return { ...type, items, itemCount: items.length };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Check for duplicate name
    const existing = await ctx.db
      .query("types")
      .withIndex("by_workspace_name", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Type with this name already exists");
    }

    return await ctx.db.insert("types", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("types"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const type = await ctx.db.get(id);
    if (!type) throw new Error("Type not found");

    // Check for duplicate name
    if (updates.name && updates.name !== type.name) {
      const existing = await ctx.db
        .query("types")
        .withIndex("by_workspace_name", (q) =>
          q.eq("workspaceId", type.workspaceId).eq("name", updates.name!)
        )
        .first();

      if (existing) {
        throw new Error("Type with this name already exists");
      }
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, cleanUpdates);

    // Update typeName on all items with this type
    if (updates.name) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_type", (q) => q.eq("typeId", id))
        .collect();

      for (const item of items) {
        await ctx.db.patch(item._id, { typeName: updates.name });
      }
    }

    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("types") },
  handler: async (ctx, args) => {
    // Remove type from items
    const items = await ctx.db
      .query("items")
      .withIndex("by_type", (q) => q.eq("typeId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.patch(item._id, { typeId: undefined, typeName: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
