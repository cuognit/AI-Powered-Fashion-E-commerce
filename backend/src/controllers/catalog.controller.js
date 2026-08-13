import Product from '../models/product.model.js'
import Brand from '../models/Brand.js'
import Attribute from '../models/Attribute.js'
import { ACTIVE_PRODUCT_FILTER, buildCatalogFilter, CatalogQueryError, metaFor, mongoSort, parseCatalogQuery } from '../utils/catalogQuery.js'

const fail = (res, error) => res.status(error instanceof CatalogQueryError ? 400 : 500).json({ success: false, message: error.message })

export async function getCatalogProducts(req, res) {
  try {
    const parsed = parseCatalogQuery(req.query)
    const filter = await buildCatalogFilter(parsed)
    const sort = parsed.sort === 'price_asc' ? { effective_price: 1, _id: 1 }
      : parsed.sort === 'price_desc' ? { effective_price: -1, _id: -1 }
        : mongoSort(parsed.sort)
    const [products, total] = await Promise.all([
      Product.aggregate([
        { $match: filter },
        { $addFields: { available_prices: { $map: { input: { $filter: { input: '$variants', as: 'v', cond: { $gt: ['$$v.stock', 0] } } }, as: 'v', in: { $ifNull: ['$$v.sale_price', { $ifNull: ['$$v.base_price', { $ifNull: ['$sale_price', '$base_price'] }] }] } } } } },
        { $addFields: { effective_price: { $ifNull: [{ $min: '$available_prices' }, { $ifNull: ['$sale_price', '$base_price'] }] }, maximum_price: { $ifNull: [{ $max: '$available_prices' }, { $ifNull: ['$sale_price', '$base_price'] }] } } },
        { $sort: sort },
        { $skip: parsed.skip },
        { $limit: parsed.limit },
        { $lookup: { from: 'categories', localField: 'category_id', foreignField: '_id', pipeline: [{ $project: { name: 1, slug: 1 } }], as: 'category_id' } },
        { $lookup: { from: 'brands', localField: 'brand_id', foreignField: '_id', pipeline: [{ $project: { name: 1, slug: 1 } }], as: 'brand_doc' } },
        { $set: { category_id: { $arrayElemAt: ['$category_id', 0] } } },
        { $set: { brand_id: { $arrayElemAt: ['$brand_doc', 0] }, brand: { $ifNull: [{ $arrayElemAt: ['$brand_doc.name', 0] }, '$brand'] }, min_price: '$effective_price', max_price: '$maximum_price' } },
        { $unset: ['effective_price', 'maximum_price', 'available_prices', 'brand_doc'] },
      ]).collation({ locale: 'vi', strength: 1 }),
      Product.countDocuments(filter),
    ])
    res.json({ success: true, data: products, meta: metaFor(total, parsed) })
  } catch (error) { fail(res, error) }
}

export async function getProductFacets(_req, res) {
  try {
    const [categories, brands, attributes, priceRange] = await Promise.all([
      Product.aggregate([
        { $match: ACTIVE_PRODUCT_FILTER },
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $match: { 'category.is_deleted': false } },
        { $project: { _id: '$category._id', name: '$category.name', slug: '$category.slug', count: 1 } },
        { $sort: { name: 1 } },
      ]),
      Brand.aggregate([{ $match: { is_deleted: false } }, { $lookup: { from: 'products', let: { id: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$brand_id', '$$id'] }, ...ACTIVE_PRODUCT_FILTER } }, { $count: 'count' }], as: 'usage' } }, { $project: { name: 1, slug: 1, count: { $ifNull: [{ $arrayElemAt: ['$usage.count', 0] }, 0] } } }, { $match: { count: { $gt: 0 } } }, { $sort: { name: 1 } }]),
      Attribute.aggregate([{ $match: { is_deleted: false } }, { $project: { name: 1, slug: 1, display_type: 1, values: { $filter: { input: '$values', as: 'value', cond: { $eq: ['$$value.is_deleted', false] } } } } }, { $sort: { name: 1 } }]),
      Product.aggregate([{ $match: ACTIVE_PRODUCT_FILTER }, { $unwind: '$variants' }, { $match: { 'variants.stock': { $gt: 0 } } }, { $project: { price: { $ifNull: ['$variants.sale_price', { $ifNull: ['$variants.base_price', { $ifNull: ['$sale_price', '$base_price'] }] }] } } }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
    ])
    res.json({ success: true, data: {
      categories,
      brands,
      attributes: attributes.map((attribute) => ({ ...attribute, values: attribute.values.map((value) => ({ _id: value._id, name: value.name, slug: value.slug, color_hex: value.color_hex })) })),
      sizes: attributes.find((item) => ['size', 'kich-thuoc'].includes(item.slug))?.values.map((item) => item.name) || [],
      colors: attributes.find((item) => ['mau', 'mau-sac', 'color'].includes(item.slug))?.values.map((item) => item.name) || [],
      price: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max, currency: 'VND' } : { min: 0, max: 0, currency: 'VND' },
    } })
  } catch (error) { fail(res, error) }
}
