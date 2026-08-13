import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Product from "../models/product.model.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex, pageOf, slugify } from "../utils/catalogAdmin.js";

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || "thuong-hieu";
  let slug = base;
  let suffix = 2;
  while (
    await Brand.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })
  )
    slug = `${base}-${suffix++}`;
  return slug;
}
function payloadOf(payload) {
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  if (name.length < 2 || name.length > 80)
    throw new AppError("Tên thương hiệu phải có từ 2 đến 80 ký tự", 400);
  if (description.length > 500)
    throw new AppError("Mô tả thương hiệu không được vượt quá 500 ký tự", 400);
  return { name, description };
}
export async function listBrands(query = {}) {
  const { page, limit, skip } = pageOf(query);
  const filter = { is_deleted: query.trash === "true" };
  if (query.search?.trim())
    filter.name = { $regex: escapeRegex(query.search.trim()), $options: "i" };
  const [rows, total, counts] = await Promise.all([
    Brand.find(filter)
      .sort({ is_system: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Brand.countDocuments(filter),
    Product.aggregate([{ $group: { _id: "$brand_id", count: { $sum: 1 } } }]),
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
export async function createBrand(payload, adminId) {
  const data = payloadOf(payload);
  return (
    await Brand.create({
      ...data,
      slug: await uniqueSlug(data.name),
      created_by: adminId,
      updated_by: adminId,
    })
  ).toObject();
}
export async function updateBrand(id, payload, adminId) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Thương hiệu không hợp lệ", 400);
  const brand = await Brand.findOne({ _id: id, is_deleted: false });
  if (!brand) throw new AppError("Không tìm thấy thương hiệu", 404);
  const data = payloadOf(payload);
  brand.set({
    ...data,
    slug: await uniqueSlug(data.name, id),
    updated_by: adminId,
  });
  await brand.save();
  await Product.updateMany(
    { brand_id: brand._id },
    { $set: { brand: brand.name } },
  );
  return brand.toObject();
}
export async function trashBrand(id, adminId) {
  const brand = await Brand.findOne({ _id: id, is_deleted: false });
  if (!brand) throw new AppError("Không tìm thấy thương hiệu", 404);
  if (brand.is_system)
    throw new AppError("Không thể xóa thương hiệu hệ thống", 409);
  const count = await Product.countDocuments({ brand_id: id });
  if (count)
    throw new AppError(
      `Không thể xóa thương hiệu đang có ${count} sản phẩm`,
      409,
    );
  brand.set({ is_deleted: true, deletedAt: new Date(), updated_by: adminId });
  await brand.save();
}
export async function restoreBrand(id, adminId) {
  const row = await Brand.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, deletedAt: null, updated_by: adminId },
    { new: true },
  );
  if (!row)
    throw new AppError("Không tìm thấy thương hiệu trong thùng rác", 404);
  return row;
}
export async function purgeBrand(id) {
  const row = await Brand.findOne({ _id: id, is_deleted: true });
  if (!row)
    throw new AppError("Không tìm thấy thương hiệu trong thùng rác", 404);
  if (row.is_system || (await Product.exists({ brand_id: id })))
    throw new AppError(
      "Không thể xóa vĩnh viễn thương hiệu đang được sử dụng",
      409,
    );
  await row.deleteOne();
}
