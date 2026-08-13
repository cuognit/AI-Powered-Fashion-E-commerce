import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/order.js";
import { listOrdersForAdmin } from "./orderService.js";

const ACTIVE_STATUSES = ["pending", "processing", "ready_to_ship", "shipped"];

function paginationOf(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}

function assertUserId(userId) {
  if (!mongoose.isValidObjectId(userId))
    throw new AppError("Khách hàng không hợp lệ", 400);
}

function publicProfile(user) {
  return {
    id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    createdAt: user.createdAt,
  };
}

export async function listCustomers(query = {}) {
  const { page, limit, skip } = paginationOf(query);
  const search = String(query.search || "").trim();
  if (search.length > 100) throw new AppError("Từ khóa tìm kiếm quá dài", 400);
  const sortKey = query.sort || "newest";
  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    order_count: { orderCount: -1, createdAt: -1 },
    total_spent: { totalSpent: -1, createdAt: -1 },
  };
  if (!sorts[sortKey]) throw new AppError("Kiểu sắp xếp không hợp lệ", 400);
  const match = { role: "customer" };
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    match.$or = [
      { name: expression },
      { email: expression },
      { phone: expression },
    ];
  }

  const base = [
    { $match: match },
    {
      $lookup: {
        from: Order.collection.name,
        localField: "_id",
        foreignField: "user_id",
        as: "orders",
      },
    },
    {
      $addFields: {
        orderCount: { $size: "$orders" },
        activeOrders: {
          $size: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $in: ["$$order.status", ACTIVE_STATUSES] },
            },
          },
        },
        completedOrders: {
          $size: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $eq: ["$$order.status", "completed"] },
            },
          },
        },
        totalSpent: {
          $sum: {
            $map: {
              input: "$orders",
              as: "order",
              in: {
                $cond: [
                  { $eq: ["$$order.status", "completed"] },
                  "$$order.total_amount",
                  0,
                ],
              },
            },
          },
        },
        latestOrderAt: { $max: "$orders.createdAt" },
      },
    },
  ];
  const [rows, totals] = await Promise.all([
    User.aggregate([
      ...base,
      { $sort: sorts[sortKey] },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          orders: 0,
          password: 0,
          passwordChangedAt: 0,
          passwordChangeCount: 0,
        },
      },
    ]),
    User.aggregate([{ $match: match }, { $count: "total" }]),
  ]);
  const total = totals[0]?.total || 0;
  return {
    data: rows.map((user) => ({
      ...publicProfile(user),
      orderCount: user.orderCount,
      activeOrders: user.activeOrders,
      completedOrders: user.completedOrders,
      totalSpent: user.totalSpent,
      latestOrderAt: user.latestOrderAt || null,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCustomer(userId) {
  assertUserId(userId);
  const user = await User.findOne({ _id: userId, role: "customer" })
    .select("name email phone address createdAt")
    .lean();
  if (!user) throw new AppError("Không tìm thấy khách hàng", 404);
  const rows = await Order.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        activeOrders: {
          $sum: { $cond: [{ $in: ["$status", ACTIVE_STATUSES] }, 1, 0] },
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        totalSpent: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, "$total_amount", 0],
          },
        },
      },
    },
  ]);
  return {
    ...publicProfile(user),
    statistics: {
      orderCount: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      ...(rows[0] || {}),
      _id: undefined,
    },
  };
}

export async function getCustomerOrders(userId, query = {}) {
  assertUserId(userId);
  if (!(await User.exists({ _id: userId, role: "customer" })))
    throw new AppError("Không tìm thấy khách hàng", 404);
  return listOrdersForAdmin({ ...query, view: "orders", customerId: userId });
}
