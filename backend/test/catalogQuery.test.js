import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCatalogFilter, escapeRegex, metaFor, parseCatalogQuery } from '../src/utils/catalogQuery.js'

test('catalog query validates paging, price and sort safely', () => {
  assert.throws(() => parseCatalogQuery({ page: '0' }), /page/)
  assert.throws(() => parseCatalogQuery({ limit: '1000' }), /limit/)
  assert.throws(() => parseCatalogQuery({ sort: 'drop_table' }), /sort/)
  assert.throws(() => parseCatalogQuery({ minPrice: '200', maxPrice: '100' }), /minPrice/)
  assert.equal(escapeRegex('a.*(b)'), 'a\\.\\*\\(b\\)')
})

test('catalog query parses combined filters and produces accurate pagination meta', async () => {
  const parsed = parseCatalogQuery({ page: '3', limit: '12', brands: 'Nike,Adidas,Nike', size: '42', color: 'Đen', minPrice: '100000', maxPrice: '2000000', sort: 'price_asc' })
  assert.deepEqual(parsed.brands, ['Nike', 'Adidas'])
  assert.equal(parsed.skip, 24)
  const filter = await buildCatalogFilter(parsed)
  assert.equal(filter.status, 'available')
  assert.equal(filter.business_enabled.$ne, false)
  assert.equal(filter.variants.$elemMatch.stock.$gt, 0)
  assert.ok(filter.$expr.$and)
  assert.deepEqual(metaFor(100, parsed), { total_items: 100, current_page: 3, total_pages: 9, limit: 12 })
})
