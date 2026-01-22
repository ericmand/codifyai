import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const listByType = query({
  args: {
    typeId: v.id("types"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_type", (q) => q.eq("typeId", args.typeId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithChildren = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const children = await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();

    return { ...item, children };
  },
});

export const getRelated = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return [];

    const related: Array<{ item: any; relationshipType: string }> = [];

    // Get parent
    if (item.parentId) {
      const parent = await ctx.db.get(item.parentId);
      if (parent) {
        related.push({ item: parent, relationshipType: "parent" });
      }
    }

    // Get children
    const children = await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();
    for (const child of children) {
      related.push({ item: child, relationshipType: "child" });
    }

    // Get items with same type (bidirectional relationship)
    if (item.typeId) {
      const sameType = await ctx.db
        .query("items")
        .withIndex("by_type", (q) => q.eq("typeId", item.typeId))
        .filter((q) => q.neq(q.field("_id"), args.id))
        .take(10);
      for (const s of sameType) {
        related.push({ item: s, relationshipType: "typed" });
      }
    }

    return related;
  },
});

export const search = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const lowerQuery = args.query.toLowerCase();
    return items.filter(
      (item) =>
        item.content.toLowerCase().includes(lowerQuery) ||
        item.typeName?.toLowerCase().includes(lowerQuery)
    );
  },
});

export const create = mutation({
  args: {
    content: v.optional(v.string()),
    parentId: v.optional(v.id("items")),
    typeId: v.optional(v.id("types")),
    typeName: v.optional(v.string()),
    indent: v.number(),
    order: v.number(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      content: args.content ?? "",
      parentId: args.parentId,
      typeId: args.typeId,
      typeName: args.typeName,
      indent: args.indent,
      order: args.order,
      workspaceId: args.workspaceId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    content: v.optional(v.string()),
    parentId: v.optional(v.union(v.id("items"), v.null())),
    typeId: v.optional(v.union(v.id("types"), v.null())),
    typeName: v.optional(v.union(v.string(), v.null())),
    indent: v.optional(v.number()),
    order: v.optional(v.number()),
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

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    // Recursively delete children
    const deleteChildren = async (parentId: Id<"items">) => {
      const children = await ctx.db
        .query("items")
        .withIndex("by_parent", (q) => q.eq("parentId", parentId))
        .collect();

      for (const child of children) {
        await deleteChildren(child._id);
        await ctx.db.delete(child._id);
      }
    };

    await deleteChildren(args.id);
    await ctx.db.delete(args.id);
  },
});

export const clearWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Create new empty item
    return await ctx.db.insert("items", {
      content: "",
      indent: 0,
      order: 0,
      workspaceId: args.workspaceId,
    });
  },
});
