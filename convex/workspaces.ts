import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workspaces").collect();
  },
});

export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("personal"), v.literal("work"), v.literal("community")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workspaces", {
      ...args,
      isDefault: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("personal"), v.literal("work"), v.literal("community"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (workspace?.isDefault) {
      throw new Error("Cannot delete default workspace");
    }

    // Delete all items in workspace
    const items = await ctx.db
      .query("items")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete all types in workspace
    const types = await ctx.db
      .query("types")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .collect();
    for (const type of types) {
      await ctx.db.delete(type._id);
    }

    // Delete all subscriptions in workspace
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .collect();
    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Initialize default workspace and types
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create default workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "Personal",
      description: "Your personal workspace",
      type: "personal",
      isDefault: true,
    });

    // Create work workspace
    await ctx.db.insert("workspaces", {
      name: "Work",
      description: "Work-related items",
      type: "work",
      isDefault: false,
    });

    // Create default types
    const defaultTypes = [
      { name: "Person", color: "#3b82f6" },
      { name: "Age", color: "#10b981" },
      { name: "Location", color: "#f59e0b" },
      { name: "Project", color: "#8b5cf6" },
      { name: "Task", color: "#ef4444" },
      { name: "Note", color: "#6b7280" },
    ];

    for (const type of defaultTypes) {
      await ctx.db.insert("types", {
        ...type,
        workspaceId,
      });
    }

    // Create initial empty item
    await ctx.db.insert("items", {
      content: "",
      indent: 0,
      order: 0,
      workspaceId,
    });

    return workspaceId;
  },
});
