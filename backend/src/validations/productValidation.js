import { z } from 'zod'

const variantSchema = z.object({
  sku: z.string().trim().min(1),
  color: z.string().trim().min(1),
  size: z.string().trim().min(1),
  stock: z.number().int().nonnegative(),
})

export const productSchema = z
  .object({
    name: z.string().trim().min(2),
    category_id: z.string().optional(),
    brand: z.string().trim().optional(),
    base_price: z.number().nonnegative(),
    sale_price: z.number().nonnegative().nullable().default(null),
    images: z.array(z.url()).default([]),
    variants: z.array(variantSchema).default([]),
    status: z.enum(['available', 'hidden', 'out_of_stock']).default('available'),
    embedding_vector: z.array(z.number()).optional(),
  })
  .refine(
    ({ base_price, sale_price }) => sale_price === null || sale_price <= base_price,
    { message: 'Giá khuyến mãi không được lớn hơn giá gốc', path: ['sale_price'] },
  )
