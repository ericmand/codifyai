import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("personal"), v.literal("work"), v.literal("community")),
    isDefault: v.boolean(),
  }),

  items: defineTable({
    content: v.string(),
    parentId: v.optional(v.id("items")),
    typeId: v.optional(v.id("types")),
    typeName: v.optional(v.string()),
    indent: v.number(),
    order: v.number(),
    workspaceId: v.id("workspaces"),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_parent", ["parentId"])
    .index("by_type", ["typeId"])
    .index("by_workspace_order", ["workspaceId", "indent", "order"]),

  types: defineTable({
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_name", ["workspaceId", "name"]),

  subscriptions: defineTable({
    name: v.string(),
    query: v.string(),
    typeId: v.optional(v.id("types")),
    filters: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    notifyOnNew: v.boolean(),
    notifyChannels: v.array(v.union(v.literal("app"), v.literal("email"))),
    unreadCount: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_type", ["typeId"]),
});
