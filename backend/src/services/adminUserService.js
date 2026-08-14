import mongoose from "mongoose";
import Order from "../models/Order.js";
import RefreshToken from "../models/RefreshToken.js";
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
    throw new AppError("Người dùng không hợp lệ", 400);
}

function publicProfile(user) {
  return {
    id: String(user._id || user.id),
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    role: user.role || "customer",
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
  };
}

export async function listUsers(query = {}) {
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

  const roleParam = String(query.role || "all").trim().toLowerCase();
  const match = {};

  if (roleParam === "customer") {
    match.role = "customer";
  } else if (roleParam === "admin") {
    match.role = "admin";
  } else if (roleParam === "all" || roleParam === "") {
    match.role = { $in: ["customer", "admin"] };
  } else {
    throw new AppError("Vai trò không hợp lệ", 400);
  }

  const statusParam = String(query.status ?? query.isActive ?? "all").trim().toLowerCase();
  if (statusParam === "active") {
    match.isActive = { $ne: false };
  } else if (statusParam === "inactive") {
    match.isActive = false;
  } else if (statusParam !== "all" && statusParam !== "") {
    throw new AppError("Trạng thái không hợp lệ", 400);
  }

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

export const listCustomers = listUsers;

export async function getUser(userId) {
  assertUserId(userId);
  const user = await User.findById(userId)
    .select("name email phone address role isActive createdAt")
    .lean();
  if (!user) throw new AppError("Không tìm thấy người dùng", 404);

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

export const getCustomer = getUser;

export async function getUserOrders(userId, query = {}) {
  assertUserId(userId);
  if (!(await User.exists({ _id: userId })))
    throw new AppError("Không tìm thấy người dùng", 404);
  return listOrdersForAdmin({ ...query, view: "orders", customerId: userId });
}

export const getCustomerOrders = getUserOrders;

let adminActionMutex = Promise.resolve();

async function withAdminActionLock(fn) {
  let release;
  const nextLock = new Promise((resolve) => {
    release = resolve;
  });
  const currentLock = adminActionMutex;
  adminActionMutex = currentLock.then(() => nextLock, () => nextLock);

  await currentLock;
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function updateUser(adminUserId, targetUserId, payload = {}) {
  assertUserId(targetUserId);
  const { role, isActive } = payload;

  if (role === undefined && isActive === undefined) {
    throw new AppError("Dữ liệu cập nhật không hợp lệ", 400);
  }

  if (role !== undefined && !["customer", "admin"].includes(role)) {
    throw new AppError("Vai trò không hợp lệ", 400);
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw new AppError("Trạng thái hoạt động không hợp lệ", 400);
  }

  return withAdminActionLock(async () => {
    let session = null;

    try {
      if (mongoose.connection.readyState === 1 && typeof mongoose.startSession === "function") {
        session = await mongoose.startSession();
      }
    } catch {
      session = null;
    }

    const executeOperation = async (sess) => {
      const targetQuery = User.findById(targetUserId);
      if (sess && typeof targetQuery.session === "function") {
        targetQuery.session(sess);
      }
      const target = await targetQuery;

      if (!target) {
        throw new AppError("Không tìm thấy người dùng", 404);
      }

      const isSelf = String(adminUserId) === String(target._id);

      // Protection 1: Admin cannot deactivate self or demote self
      if (isSelf) {
        if (isActive === false) {
          throw new AppError("Không thể tự vô hiệu hóa tài khoản của chính mình", 400);
        }
        if (role !== undefined && role !== "admin") {
          throw new AppError("Không thể tự hạ quyền của chính mình", 400);
        }
      }

      // Protection 2: Cannot deactivate or demote the last active admin
      const isTargetActiveAdmin = target.role === "admin" && target.isActive !== false;
      const isDemotingOrDeactivating =
        (role !== undefined && role !== "admin") || isActive === false;

      if (isTargetActiveAdmin && isDemotingOrDeactivating) {
        const countQuery = User.countDocuments({
          _id: { $ne: target._id },
          role: "admin",
          isActive: { $ne: false },
        });
        if (sess && typeof countQuery.session === "function") {
          countQuery.session(sess);
        }
        const otherActiveAdminCount = await countQuery;

        if (otherActiveAdminCount < 1) {
          throw new AppError(
            "Không thể hạ quyền hoặc vô hiệu hóa quản trị viên duy nhất đang hoạt động",
            400,
          );
        }
      }

      if (role !== undefined) {
        target.role = role;
      }

      if (isActive !== undefined) {
        target.isActive = Boolean(isActive);
        if (target.isActive === false) {
          // Immediately revoke all active refresh tokens for the deactivated user
          const updateOptions = sess ? { session: sess } : {};
          await RefreshToken.updateMany(
            { user_id: target._id, revoked_at: null },
            { $set: { revoked_at: new Date() } },
            updateOptions,
          );
        }
      }

      if (sess && typeof target.save === "function") {
        await target.save({ session: sess });
      } else {
        await target.save();
      }
    };

    if (session && typeof session.withTransaction === "function") {
      try {
        await session.withTransaction(async () => {
          await executeOperation(session);
        });
      } catch (err) {
        if (err instanceof AppError) {
          throw err;
        }
        // Fallback if standalone MongoDB does not support transactions
        if (
          err?.message?.includes("Transaction numbers are only allowed on a replica set") ||
          err?.message?.includes("sessions are not supported")
        ) {
          await executeOperation(null);
        } else {
          throw err;
        }
      } finally {
        if (typeof session.endSession === "function") {
          await session.endSession();
        }
      }
    } else {
      if (session && typeof session.endSession === "function") {
        try {
          await session.endSession();
        } catch {}
      }
      await executeOperation(null);
    }

    return await getUser(targetUserId);
  });
}
