import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/product.model.js";
import { AppError } from "../utils/AppError.js";

const slugify = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || "danh-muc";
  let slug = base;
  let suffix = 2;
  while (
    await Category.exists({
      slug,
      ...(excludeId && { _id: { $ne: excludeId } }),
    })
  )
    slug = `${base}-${suffix++}`;
  return slug;
}

function validatePayload(payload) {
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  if (name.length < 2 || name.length > 80)
    throw new AppError("Tên danh mục phải có từ 2 đến 80 ký tự", 400);
  if (description.length > 500)
    throw new AppError("Mô tả danh mục không được vượt quá 500 ký tự", 400);
  return { name, description };
}

export async function listCategories(query = {}) {
  const { page, limit, skip } = pagination(query);
  const trash = query.trash === "true";
  const filter = { is_deleted: trash };
  if (query.search?.trim())
    filter.name = { $regex: escapeRegex(query.search.trim()), $options: "i" };
  const [rows, total] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);
  const counts = await Product.aggregate([
    { $group: { _id: "$category_id", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  return {
    data: rows.map((row) => ({
      ...row,
      product_count: countMap.get(String(row._id)) || 0,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createCategory(payload, adminId) {
  const data = validatePayload(payload);
  const category = await Category.create({
    ...data,
    slug: await uniqueSlug(data.name),
    created_by: adminId,
    updated_by: adminId,
  });
  return category.toObject();
}

export async function updateCategory(id, payload, adminId) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Danh mục không hợp lệ", 400);
  const data = validatePayload(payload);
  const category = await Category.findOne({ _id: id, is_deleted: false });
  if (!category) throw new AppError("Không tìm thấy danh mục", 404);
  category.set({
    ...data,
    slug: await uniqueSlug(data.name, id),
    updated_by: adminId,
  });
  await category.save();
  return category.toObject();
}

export async function trashCategory(id, adminId) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Danh mục không hợp lệ", 400);
  const productCount = await Product.countDocuments({ category_id: id });
  if (productCount)
    throw new AppError(
      `Không thể xóa danh mục đang có ${productCount} sản phẩm`,
      409,
    );
  const category = await Category.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true, deletedAt: new Date(), updated_by: adminId },
    { new: true },
  );
  if (!category) throw new AppError("Không tìm thấy danh mục", 404);
}

export async function restoreCategory(id, adminId) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Danh mục không hợp lệ", 400);
  const category = await Category.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, deletedAt: null, updated_by: adminId },
    { new: true },
  );
  if (!category)
    throw new AppError("Không tìm thấy danh mục trong thùng rác", 404);
  return category.toObject();
}

export async function purgeCategory(id) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Danh mục không hợp lệ", 400);
  if (await Product.exists({ category_id: id }))
    throw new AppError(
      "Không thể xóa vĩnh viễn danh mục đang được sử dụng",
      409,
    );
  const result = await Category.deleteOne({ _id: id, is_deleted: true });
  if (!result.deletedCount)
    throw new AppError("Không tìm thấy danh mục trong thùng rác", 404);
}
