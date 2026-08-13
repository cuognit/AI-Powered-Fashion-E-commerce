export const variantPrice = (product, variant) => variant?.sale_price ?? variant?.base_price ?? product.sale_price ?? product.base_price
export function assetUrl(product, variant) {
  const ids = variant?.image_asset_ids?.length ? variant.image_asset_ids : product.gallery_asset_ids
  const wanted = new Set((ids || []).map(String)); const match = (product.image_assets || []).find((asset) => wanted.has(String(asset._id)))
  return match?.url || product.images?.[0] || product.image_assets?.[0]?.url || ''
}
export const selectedOptions = (variant) => variant?.option_values?.length ? variant.option_values.map((option) => ({ attribute_name: option.attribute_name, attribute_slug: option.attribute_slug, value_name: option.value_name, value_slug: option.value_slug })) : [{ attribute_name: 'Màu sắc', attribute_slug: 'mau-sac', value_name: variant?.color || '', value_slug: variant?.color || '' }, { attribute_name: 'Kích thước', attribute_slug: 'kich-thuoc', value_name: variant?.size || '', value_slug: variant?.size || '' }].filter((option) => option.value_name)
