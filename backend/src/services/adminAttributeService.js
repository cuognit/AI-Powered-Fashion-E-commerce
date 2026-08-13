import mongoose from "mongoose";
import Attribute from "../models/Attribute.js";
import Product from "../models/product.model.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex, pageOf, slugify } from "../utils/catalogAdmin.js";

const validId = (id) => {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Thuộc tính không hợp lệ", 400);
};
async function uniqueSlug(Model, name, excludeId) {
  const base = slugify(name) || "thuoc-tinh";
  let slug = base;
  let suffix = 2;
  while (
    await Model.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })
  )
    slug = `${base}-${suffix++}`;
  return slug;
}
function attributePayload(payload) {
  const name = String(payload.name || "").trim();
  const display_type = payload.display_type === "color" ? "color" : "text";
  if (name.length < 2 || name.length > 60)
    throw new AppError("Tên thuộc tính phải có từ 2 đến 60 ký tự", 400);
  return { name, display_type };
}
function valuePayload(payload, displayType) {
  const name = String(payload.name || "").trim();
  const color_hex = payload.color_hex
    ? String(payload.color_hex).trim().toUpperCase()
    : null;
  if (!name || name.length > 60)
    throw new AppError("Tên giá trị không hợp lệ", 400);
  if (displayType === "color" && color_hex && !/^#[0-9A-F]{6}$/.test(color_hex))
    throw new AppError("Mã màu phải có dạng #RRGGBB", 400);
  return { name, color_hex };
}

export async function listAttributes(query = {}) {
  const { page, limit, skip } = pageOf(query);
  const filter = { is_deleted: query.trash === "true" };
  if (query.search?.trim())
    filter.name = { $regex: escapeRegex(query.search.trim()), $options: "i" };
  const [rows, total] = await Promise.all([
    Attribute.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Attribute.countDocuments(filter),
  ]);
  const used = await Product.aggregate([
    { $unwind: "$option_axes" },
    { $group: { _id: "$option_axes.attribute_id", count: { $sum: 1 } } },
  ]);
  const map = new Map(used.map((row) => [String(row._id), row.count]));
  return {
    data: rows.map((row) => ({
      ...row,
      values: row.values.filter((value) =>
        query.trash === "true" ? value.is_deleted : !value.is_deleted,
      ),
      product_count: map.get(String(row._id)) || 0,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
export async function createAttribute(payload, adminId) {
  const data = attributePayload(payload);
  return (
    await Attribute.create({
      ...data,
      slug: await uniqueSlug(Attribute, data.name),
      created_by: adminId,
      updated_by: adminId,
    })
  ).toObject();
}
export async function updateAttribute(id, payload, adminId) {
  validId(id);
  const row = await Attribute.findOne({ _id: id, is_deleted: false });
  if (!row) throw new AppError("Không tìm thấy thuộc tính", 404);
  const data = attributePayload(payload);
  row.set({
    ...data,
    slug: await uniqueSlug(Attribute, data.name, id),
    updated_by: adminId,
  });
  await row.save();
  return row.toObject();
}
export async function addValue(id, payload, adminId) {
  validId(id);
  const row = await Attribute.findOne({ _id: id, is_deleted: false });
  if (!row) throw new AppError("Không tìm thấy thuộc tính", 404);
  const data = valuePayload(payload, row.display_type);
  let slug = slugify(data.name) || "gia-tri";
  let suffix = 2;
  const allSlugs = new Set(row.values.map((value) => value.slug));
  while (allSlugs.has(slug)) slug = `${slugify(data.name)}-${suffix++}`;
  row.values.push({ ...data, slug });
  row.updated_by = adminId;
  await row.save();
  return row.toObject();
}
export async function updateValue(id, valueId, payload, adminId) {
  validId(id);
  validId(valueId);
  const row = await Attribute.findOne({ _id: id, is_deleted: false });
  const value = row?.values.id(valueId);
  if (!value || value.is_deleted)
    throw new AppError("Không tìm thấy giá trị thuộc tính", 404);
  const data = valuePayload(payload, row.display_type);
  value.set(data);
  row.updated_by = adminId;
  await row.save();
  await Product.updateMany(
    {
      variants: {
        $elemMatch: {
          option_values: {
            $elemMatch: { attribute_id: row._id, value_id: value._id },
          },
        },
      },
    },
    {
      $set: {
        "variants.$[].option_values.$[option].value_name": value.name,
        "variants.$[].option_values.$[option].color_hex": value.color_hex,
      },
    },
    { arrayFilters: [{ "option.value_id": value._id }] },
  );
  return row.toObject();
}
export async function trashValue(id, valueId, adminId) {
  validId(id);
  validId(valueId);
  if (await Product.exists({ "variants.option_values.value_id": valueId }))
    throw new AppError("Không thể xóa giá trị đang được sản phẩm sử dụng", 409);
  const row = await Attribute.findById(id);
  const value = row?.values.id(valueId);
  if (!value || value.is_deleted)
    throw new AppError("Không tìm thấy giá trị thuộc tính", 404);
  value.set({ is_deleted: true, deletedAt: new Date() });
  row.updated_by = adminId;
  await row.save();
}
export async function restoreValue(id, valueId, adminId) {
  validId(id);
  validId(valueId);
  const row = await Attribute.findById(id);
  const value = row?.values.id(valueId);
  if (!value?.is_deleted)
    throw new AppError("Không tìm thấy giá trị trong thùng rác", 404);
  value.set({ is_deleted: false, deletedAt: null });
  row.updated_by = adminId;
  await row.save();
  return row.toObject();
}
export async function trashAttribute(id, adminId) {
  validId(id);
  if (await Product.exists({ "option_axes.attribute_id": id }))
    throw new AppError(
      "Không thể xóa thuộc tính đang được sản phẩm sử dụng",
      409,
    );
  const row = await Attribute.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true, deletedAt: new Date(), updated_by: adminId },
    { new: true },
  );
  if (!row) throw new AppError("Không tìm thấy thuộc tính", 404);
}
export async function restoreAttribute(id, adminId) {
  validId(id);
  const row = await Attribute.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, deletedAt: null, updated_by: adminId },
    { new: true },
  );
  if (!row)
    throw new AppError("Không tìm thấy thuộc tính trong thùng rác", 404);
  return row;
}
export async function purgeAttribute(id) {
  validId(id);
  if (await Product.exists({ "option_axes.attribute_id": id }))
    throw new AppError(
      "Không thể xóa vĩnh viễn thuộc tính đang được sử dụng",
      409,
    );
  const result = await Attribute.deleteOne({ _id: id, is_deleted: true });
  if (!result.deletedCount)
    throw new AppError("Không tìm thấy thuộc tính trong thùng rác", 404);
}
