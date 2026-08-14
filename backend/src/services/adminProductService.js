import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Attribute from "../models/Attribute.js";
import Brand from "../models/Brand.js";
import Cart from "../models/Cart.js";
import Category from "../models/Category.js";
import Product from "../models/product.model.js";
import WishlistItem from "../models/WishlistItem.js";
import { buildProductEmbeddingText, getTextEmbedding } from "./ai.service.js";
import { AppError } from "../utils/AppError.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sortMap = {
  oldest: { createdAt: 1 },
  name: { name: 1 },
  price_asc: { min_price: 1 },
  price_desc: { min_price: -1 },
  stock: { total_stock: -1 },
};
const nullablePrice = (value) =>
  value === "" || value == null ? null : Number(value);
function pageOf(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}

function uploadedAssets(files = []) {
  return files.map((file, index) => ({
    _id: new mongoose.Types.ObjectId(),
    url: file.path || file.secure_url,
    public_id: file.filename || file.public_id || null,
    client_key: `new:${index}`,
  }));
}

export async function destroyAssets(assets = []) {
  await Promise.allSettled(
    assets
      .filter((asset) => asset && asset.public_id)
      .map((asset) => cloudinary.uploader.destroy(asset.public_id)),
  );
}

export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'fashion-ecommerce/products';
  const paramsToSign = {
    folder,
    timestamp,
  };

  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!secret || !apiKey || !cloudName) {
    throw new AppError('Cloudinary chưa được cấu hình trên hệ thống (thiếu API Key/Secret/Cloud Name)', 500);
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);

  return {
    signature,
    timestamp,
    folder,
    apiKey,
    cloudName,
  };
}

function parsePayload(body) {
  try {
    return typeof body.payload === "string"
      ? JSON.parse(body.payload)
      : body.payload || body;
  } catch {
    throw new AppError("Dữ liệu sản phẩm không đúng định dạng JSON", 400);
  }
}
const assetKey = (asset) => String(asset._id);
const effectivePrice = (variant, product) =>
  variant.sale_price ??
  variant.base_price ??
  product.sale_price ??
  product.base_price;

async function resolveBrand(payload) {
  if (mongoose.isValidObjectId(payload.brand_id)) {
    const brand = await Brand.findOne({
      _id: payload.brand_id,
      is_deleted: false,
    });
    if (brand) return brand;
  }
  if (String(payload.brand || "").trim()) {
    const brand = await Brand.findOne({
      name: new RegExp(`^${escapeRegex(String(payload.brand).trim())}$`, "i"),
      is_deleted: false,
    });
    if (brand) return brand;
  }
  const fallback = await Brand.findOne({ is_system: true, is_deleted: false });
  if (!fallback) throw new AppError("Vui lòng chọn thương hiệu", 400);
  return fallback;
}

async function normalizeOptions(payload) {
  const axes = Array.isArray(payload.option_axes) ? payload.option_axes : [];
  if (axes.length > 4)
    throw new AppError("Mỗi sản phẩm có tối đa 4 nhóm thuộc tính", 400);
  if (!axes.length) return { axes: [], lookup: new Map() };
  const ids = axes.map((axis) => String(axis.attribute_id || ""));
  if (
    ids.some((id) => !mongoose.isValidObjectId(id)) ||
    new Set(ids).size !== ids.length
  )
    throw new AppError("Nhóm thuộc tính không hợp lệ hoặc bị trùng", 400);
  const docs = await Attribute.find({ _id: { $in: ids }, is_deleted: false });
  if (docs.length !== ids.length)
    throw new AppError("Có nhóm thuộc tính không còn hoạt động", 400);
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  const lookup = new Map();
  const normalized = axes.map((axis) => {
    const doc = byId.get(String(axis.attribute_id));
    const values = [...new Set((axis.value_ids || []).map(String))];
    if (!values.length)
      throw new AppError(
        `Thuộc tính ${doc.name} phải có ít nhất một giá trị`,
        400,
      );
    const activeValues = new Map(
      doc.values
        .filter((value) => !value.is_deleted)
        .map((value) => [String(value._id), value]),
    );
    if (values.some((id) => !activeValues.has(id)))
      throw new AppError(
        `Giá trị của thuộc tính ${doc.name} không hợp lệ`,
        400,
      );
    values.forEach((id) =>
      lookup.set(`${doc._id}:${id}`, {
        attribute_id: doc._id,
        value_id: activeValues.get(id)._id,
        attribute_name: doc.name,
        attribute_slug: doc.slug,
        value_name: activeValues.get(id).name,
        value_slug: activeValues.get(id).slug,
        color_hex: activeValues.get(id).color_hex,
      }),
    );
    return {
      attribute_id: doc._id,
      attribute_name: doc.name,
      attribute_slug: doc.slug,
      value_ids: values,
    };
  });
  const combinations = normalized.reduce(
    (total, axis) => total * axis.value_ids.length,
    1,
  );
  if (combinations > 100)
    throw new AppError("Sản phẩm không được vượt quá 100 tổ hợp biến thể", 400);
  return { axes: normalized, lookup };
}

function normalizeVariants(payload, optionData, basePrice) {
  if (
    !Array.isArray(payload.variants) ||
    !payload.variants.length ||
    payload.variants.length > 100
  )
    throw new AppError("Sản phẩm phải có từ 1 đến 100 biến thể", 400);
  const variants = payload.variants.map((raw) => {
    const sku = String(raw.sku || "")
      .trim()
      .toUpperCase();
    const stock = Number(raw.stock);
    const variantBase = nullablePrice(raw.base_price);
    const variantSale = nullablePrice(raw.sale_price);
    if (!sku || !Number.isInteger(stock) || stock < 0)
      throw new AppError("SKU hoặc tồn kho không hợp lệ", 400);
    if (
      variantBase !== null &&
      (!Number.isInteger(variantBase) || variantBase < 0)
    )
      throw new AppError(`Giá gốc của SKU ${sku} không hợp lệ`, 400);
    const priceCeiling = variantBase ?? basePrice;
    if (
      variantSale !== null &&
      (!Number.isInteger(variantSale) ||
        variantSale < 0 ||
        variantSale > priceCeiling)
    )
      throw new AppError(`Giá khuyến mãi của SKU ${sku} không hợp lệ`, 400);
    let optionValues = [];
    if (optionData.axes.length) {
      const pairs = Array.isArray(raw.option_values) ? raw.option_values : [];
      if (pairs.length !== optionData.axes.length)
        throw new AppError(`SKU ${sku} chưa chọn đủ thuộc tính`, 400);
      optionValues = pairs.map((pair) =>
        optionData.lookup.get(`${pair.attribute_id}:${pair.value_id}`),
      );
      if (
        optionValues.some((value) => !value) ||
        new Set(optionValues.map((value) => String(value.attribute_id)))
          .size !== optionData.axes.length
      )
        throw new AppError(`Thuộc tính của SKU ${sku} không hợp lệ`, 400);
    }
    const color =
      optionValues.find((value) =>
        ["mau", "mau-sac", "color"].includes(value.attribute_slug),
      )?.value_name || String(raw.color || "");
    const size =
      optionValues.find((value) =>
        ["size", "kich-thuoc"].includes(value.attribute_slug),
      )?.value_name || String(raw.size || "");
    return {
      sku,
      stock,
      base_price: variantBase,
      sale_price: variantSale,
      option_values: optionValues,
      color,
      size,
      image_asset_ids: (raw.image_asset_ids || []).map(String),
    };
  });
  if (new Set(variants.map((variant) => variant.sku)).size !== variants.length)
    throw new AppError("SKU trong sản phẩm không được trùng nhau", 400);
  const keys = variants
    .map((variant) =>
      variant.option_values
        .map((value) => `${value.attribute_id}:${value.value_id}`)
        .sort()
        .join("|"),
    )
    .filter(Boolean);
  if (new Set(keys).size !== keys.length)
    throw new AppError("Tổ hợp thuộc tính không được trùng nhau", 400);
  if (
    optionData.axes.length &&
    variants.length !==
      optionData.axes.reduce((total, axis) => total * axis.value_ids.length, 1)
  )
    throw new AppError(
      "Danh sách SKU phải chứa đầy đủ các tổ hợp thuộc tính",
      400,
    );
  return variants;
}

async function validateProduct(body, { currentId } = {}) {
  const payload = parsePayload(body);
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const basePrice = Number(payload.base_price);
  const salePrice = nullablePrice(payload.sale_price);
  if (name.length < 2 || name.length > 160)
    throw new AppError("Tên sản phẩm phải có từ 2 đến 160 ký tự", 400);
  if (description.length > 3000)
    throw new AppError("Mô tả sản phẩm quá dài", 400);
  if (
    !mongoose.isValidObjectId(payload.category_id) ||
    !(await Category.exists({ _id: payload.category_id, is_deleted: false }))
  )
    throw new AppError("Danh mục không hợp lệ", 400);
  if (
    !Number.isInteger(basePrice) ||
    basePrice < 0 ||
    (salePrice !== null &&
      (!Number.isInteger(salePrice) || salePrice < 0 || salePrice > basePrice))
  )
    throw new AppError("Giá sản phẩm không hợp lệ", 400);
  const brand = await resolveBrand(payload);
  const optionData = await normalizeOptions(payload);
  const variants = normalizeVariants(payload, optionData, basePrice);
  const duplicate = await Product.exists({
    "variants.sku": { $in: variants.map((variant) => variant.sku) },
    ...(currentId && { _id: { $ne: currentId } }),
  });
  if (duplicate) throw new AppError("SKU đã tồn tại ở sản phẩm khác", 409);
  return {
    payload,
    data: {
      name,
      brand_id: brand._id,
      brand: brand.name,
      description,
      category_id: payload.category_id,
      base_price: basePrice,
      sale_price: salePrice,
      option_axes: optionData.axes,
      variants,
      business_enabled: payload.business_enabled !== false,
    },
  };
}

function normalizeAsset(raw, index) {
  if (typeof raw === 'string') {
    return {
      _id: new mongoose.Types.ObjectId(),
      url: raw.trim(),
      public_id: null,
      client_key: `new:${index}`,
    };
  }
  const idStr = raw._id || raw.id;
  return {
    _id: mongoose.isValidObjectId(idStr)
      ? new mongoose.Types.ObjectId(idStr)
      : new mongoose.Types.ObjectId(),
    url: String(raw.url || '').trim(),
    public_id: raw.public_id ? String(raw.public_id).trim() : null,
    client_key: raw.client_key || raw.id || `new:${index}`,
  };
}

function mergeImages(payload, existing = [], fresh = []) {
  const manifest = Array.isArray(payload.media_manifest)
    ? payload.media_manifest
    : Array.isArray(payload.image_manifest)
      ? payload.image_manifest
      : null;

  const existingMap = new Map(
    existing.flatMap((asset) => [
      [String(asset._id), asset],
      [asset.url, asset],
      ...(asset.client_key ? [[asset.client_key, asset]] : []),
    ]),
  );

  let assets = [];
  if (manifest && fresh.length > 0) {
    assets = manifest
      .map((item) =>
        item.type === "new"
          ? fresh[Number(item.index)]
          : existingMap.get(String(item.id || item.url)),
      )
      .filter(Boolean);
  } else if (Array.isArray(payload.image_assets) && payload.image_assets.length > 0) {
    assets = payload.image_assets
      .map((item, idx) => normalizeAsset(item, idx))
      .filter((asset) => Boolean(asset.url));
  } else if (Array.isArray(payload.images) && payload.images.length > 0) {
    assets = payload.images
      .map((url, idx) => normalizeAsset(url, idx))
      .filter((asset) => Boolean(asset.url));
  } else {
    assets = [...existing, ...fresh];
  }

  if (!assets.length || assets.length > 30)
    throw new AppError("Sản phẩm phải có từ 1 đến 30 ảnh", 400);
  return assets;
}

function applyMedia(payload, data, assets) {
  const aliases = new Map(
    assets.flatMap((asset) => {
      const canonical = assetKey(asset);
      return [
        [canonical, canonical],
        [asset.url, canonical],
        ...(asset.client_key ? [[asset.client_key, canonical]] : []),
        ...(asset.public_id ? [[asset.public_id, canonical]] : []),
      ];
    }),
  );

  const fallbackGallery = assets.slice(0, 5).map(assetKey);
  const requestedGallery = (Array.isArray(payload.gallery_asset_ids) && payload.gallery_asset_ids.length > 0)
    ? payload.gallery_asset_ids
    : fallbackGallery;

  const resolve = (ids) => (ids || []).map((id) => aliases.get(String(id))).filter(Boolean);
  const gallery = resolve(requestedGallery);

  if (!gallery.length || gallery.length > 5)
    throw new AppError("Thư viện ảnh chính không hợp lệ (cần từ 1 đến 5 ảnh)", 400);

  data.gallery_asset_ids = gallery;
  data.variants.forEach((variant) => {
    const requested = variant.image_asset_ids;
    variant.image_asset_ids = resolve(requested);
    if (requested && requested.length > 5)
      throw new AppError(`Ảnh của SKU ${variant.sku} không được vượt quá 5 ảnh`, 400);
  });
}

function serialize(product) {
  const row = product.toObject ? product.toObject() : product;
  const assets = new Map(
    (row.image_assets || []).map((asset) => [String(asset._id), asset.url]),
  );
  const prices = (row.variants || [])
    .filter((variant) => variant.stock > 0)
    .map((variant) => effectivePrice(variant, row));
  const gallery = (row.gallery_asset_ids || [])
    .map((id) => assets.get(String(id)))
    .filter(Boolean);
  return {
    ...row,
    images: gallery.length ? gallery : row.images,
    total_stock: (row.variants || []).reduce(
      (sum, variant) => sum + Number(variant.stock || 0),
      0,
    ),
    min_price: prices.length
      ? Math.min(...prices)
      : (row.sale_price ?? row.base_price),
    max_price: prices.length
      ? Math.max(...prices)
      : (row.sale_price ?? row.base_price),
  };
}

export async function listProducts(query = {}) {
  const { page, limit, skip } = pageOf(query);
  const filter = { is_deleted: query.trash === "true" };
  if (
    query.status &&
    ["available", "hidden", "out_of_stock"].includes(query.status)
  )
    filter.status = query.status;
  if (query.categoryId) {
    if (!mongoose.isValidObjectId(query.categoryId))
      throw new AppError("Danh mục không hợp lệ", 400);
    filter.category_id = query.categoryId;
  }
  if (query.brandId) {
    if (!mongoose.isValidObjectId(query.brandId))
      throw new AppError("Thương hiệu không hợp lệ", 400);
    filter.brand_id = query.brandId;
  }
  if (query.stock === "in") filter["variants.stock"] = { $gt: 0 };
  if (query.stock === "out") filter.total_stock = { $lte: 0 };
  if (query.search?.trim()) {
    const term = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [{ name: term }, { "variants.sku": term }, { brand: term }];
  }
  const sort = sortMap[query.sort] || { createdAt: -1 };
  const [rows, total, available, hidden, outOfStock] = await Promise.all([
    Product.find(filter)
      .populate("category_id", "name slug")
      .populate("brand_id", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    Product.countDocuments({ is_deleted: false, status: "available" }),
    Product.countDocuments({ is_deleted: false, status: "hidden" }),
    Product.countDocuments({ is_deleted: false, status: "out_of_stock" }),
  ]);
  const counts = {
    available,
    hidden,
    out_of_stock: outOfStock,
  };
  return {
    data: rows.map(serialize),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      counts,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    },
  };
}

export async function getProduct(id) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Sản phẩm không hợp lệ", 400);
  const product = await Product.findById(id)
    .populate("category_id", "name slug")
    .populate("brand_id", "name slug")
    .lean();
  if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
  return serialize(product);
}

export async function createProduct(body, filesOrAdminId, maybeAdminId) {
  const files = Array.isArray(filesOrAdminId) ? filesOrAdminId : [];
  const adminId = Array.isArray(filesOrAdminId) ? maybeAdminId : filesOrAdminId;
  const fresh = uploadedAssets(files);
  try {
    const { payload, data } = await validateProduct(body);
    const existingAssets = (payload.image_assets || [])
      .map((item, idx) => normalizeAsset(item, idx))
      .filter((asset) => Boolean(asset.url));
    const assets = mergeImages(payload, existingAssets, fresh);
    applyMedia(payload, data, assets);
    const product = new Product({
      ...data,
      image_assets: assets,
      created_by: adminId,
      updated_by: adminId,
    });
    const vector = await getTextEmbedding(buildProductEmbeddingText(product));
    if (vector?.length === 384) product.embedding_vector = vector;
    await product.save();
    return serialize(product);
  } catch (error) {
    await destroyAssets(fresh);
    throw error;
  }
}

export async function updateProduct(id, body, filesOrAdminId, maybeAdminId) {
  const files = Array.isArray(filesOrAdminId) ? filesOrAdminId : [];
  const adminId = Array.isArray(filesOrAdminId) ? maybeAdminId : filesOrAdminId;
  const fresh = uploadedAssets(files);
  try {
    if (!mongoose.isValidObjectId(id))
      throw new AppError("Sản phẩm không hợp lệ", 400);
    const product = await Product.findOne({ _id: id, is_deleted: false });
    if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
    const { payload, data } = await validateProduct(body, { currentId: id });
    const oldAssets = product.image_assets?.length
      ? product.image_assets.map((asset) => asset.toObject ? asset.toObject() : asset)
      : [];

    let baseAssets = oldAssets;
    if (Array.isArray(payload.image_assets) && payload.image_assets.length > 0) {
      baseAssets = payload.image_assets
        .map((item, idx) => normalizeAsset(item, idx))
        .filter((asset) => Boolean(asset.url));
    }

    const assets = mergeImages(payload, baseAssets, fresh);
    applyMedia(payload, data, assets);
    product.set({ ...data, image_assets: assets, updated_by: adminId });
    const vector = await getTextEmbedding(buildProductEmbeddingText(product));
    if (vector?.length === 384) product.embedding_vector = vector;
    await product.save();

    const retainedUrls = new Set(assets.map((asset) => asset.url));
    const retainedPublicIds = new Set(assets.map((asset) => asset.public_id).filter(Boolean));
    const assetsToDestroy = oldAssets.filter(
      (asset) => asset && asset.public_id && !retainedUrls.has(asset.url) && !retainedPublicIds.has(asset.public_id),
    );
    await destroyAssets(assetsToDestroy);

    return serialize(product);
  } catch (error) {
    await destroyAssets(fresh);
    throw error;
  }
}

export async function setBusiness(id, enabled, adminId) {
  const product = await Product.findOne({ _id: id, is_deleted: false });
  if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
  product.business_enabled = Boolean(enabled);
  product.updated_by = adminId;
  await product.save();
  return serialize(product);
}
export async function trashProduct(id, adminId) {
  const product = await Product.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true, deletedAt: new Date(), updated_by: adminId },
    { new: true },
  );
  if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
}

export async function restoreProduct(id, adminId) {
  const product = await Product.findOne({ _id: id, is_deleted: true });
  if (!product)
    throw new AppError("Không tìm thấy sản phẩm trong thùng rác", 404);
  if (
    !(await Category.exists({ _id: product.category_id, is_deleted: false })) ||
    !(await Brand.exists({ _id: product.brand_id, is_deleted: false }))
  )
    throw new AppError(
      "Danh mục hoặc thương hiệu của sản phẩm không còn hoạt động",
      409,
    );
  product.set({
    is_deleted: false,
    deletedAt: null,
    business_enabled: false,
    updated_by: adminId,
  });
  await product.save();
  return serialize(product);
}

export async function purgeProduct(id) {
  const product = await Product.findOne({ _id: id, is_deleted: true });
  if (!product)
    throw new AppError("Không tìm thấy sản phẩm trong thùng rác", 404);
  await Promise.all([
    Cart.updateMany({}, { $pull: { items: { product_id: product._id } } }),
    WishlistItem.deleteMany({ product_id: product._id }),
  ]);
  await product.deleteOne();
  await destroyAssets(product.image_assets || []);
}
