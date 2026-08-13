import assert from 'node:assert/strict'
import test from 'node:test'
import Order from '../src/models/Order.js'
import User from '../src/models/User.js'
import adminUserRoutes from '../src/routes/adminUser.routes.js'
import { getCustomer, listCustomers } from '../src/services/adminUserService.js'

const CUSTOMER_ID = '64b000000000000000000001'

test('admin customer routes require authentication and admin access', () => {
  const layers = adminUserRoutes.stack
  assert.deepEqual(layers.slice(0, 2).map((layer) => layer.name), ['verifyToken', 'checkAdmin'])
  assert.equal(layers[2].route, undefined)
  assert.deepEqual(layers.slice(3).map((layer) => Object.keys(layer.route.methods)[0]), ['get', 'get', 'get'])
})

test('customer list excludes admins, escapes search and maps purchase statistics', async () => {
  const originalAggregate = User.aggregate
  const pipelines = []
  User.aggregate = async (pipeline) => {
    pipelines.push(pipeline)
    if (pipeline.at(-1)?.$count) return [{ total: 1 }]
    return [{
      _id: CUSTOMER_ID,
      name: 'An.*',
      email: 'an@example.com',
      phone: '0900000000',
      address: 'TP. Hồ Chí Minh',
      createdAt: new Date('2026-01-01'),
      orderCount: 3,
      activeOrders: 1,
      completedOrders: 2,
      totalSpent: 1250000,
      latestOrderAt: new Date('2026-08-01'),
    }]
  }
  try {
    const result = await listCustomers({ page: '1', limit: '15', search: 'An.*', sort: 'total_spent' })
    assert.equal(result.pagination.total, 1)
    assert.equal(result.data[0].id, CUSTOMER_ID)
    assert.equal(result.data[0].totalSpent, 1250000)
    assert.equal(pipelines[0][0].$match.role, 'customer')
    assert.equal(pipelines[0][0].$match.$or[0].name.source, 'An\\.\\*')
    assert.deepEqual(pipelines[0].find((stage) => stage.$sort).$sort, { totalSpent: -1, createdAt: -1 })
    assert.equal(pipelines[0].find((stage) => stage.$lookup).$lookup.from, Order.collection.name)
  } finally { User.aggregate = originalAggregate }
})

test('customer list validates search and sort inputs', async () => {
  await assert.rejects(() => listCustomers({ search: 'x'.repeat(101) }), (error) => error.statusCode === 400)
  await assert.rejects(() => listCustomers({ sort: 'password' }), (error) => error.statusCode === 400)
})

test('customer detail returns only public profile and completed-order spending', async () => {
  const originalFindOne = User.findOne
  const originalAggregate = Order.aggregate
  let userFilter
  let selectedFields
  User.findOne = (filter) => {
    userFilter = filter
    return { select(fields) { selectedFields = fields; return this }, lean: async () => ({ _id: CUSTOMER_ID, name: 'Lan', email: 'lan@example.com', phone: '', address: '', createdAt: new Date('2026-02-01') }) }
  }
  Order.aggregate = async () => [{ _id: null, orderCount: 4, activeOrders: 1, completedOrders: 2, totalSpent: 980000 }]
  try {
    const result = await getCustomer(CUSTOMER_ID)
    assert.deepEqual(userFilter, { _id: CUSTOMER_ID, role: 'customer' })
    assert.equal(selectedFields, 'name email phone address createdAt')
    assert.equal(result.id, CUSTOMER_ID)
    assert.equal(result.password, undefined)
    assert.equal(result.statistics.completedOrders, 2)
    assert.equal(result.statistics.totalSpent, 980000)
  } finally { User.findOne = originalFindOne; Order.aggregate = originalAggregate }
})

test('customer detail rejects malformed and unknown customer ids', async () => {
  await assert.rejects(() => getCustomer('not-an-id'), (error) => error.statusCode === 400)
  const originalFindOne = User.findOne
  User.findOne = () => ({ select() { return this }, lean: async () => null })
  try { await assert.rejects(() => getCustomer(CUSTOMER_ID), (error) => error.statusCode === 404) }
  finally { User.findOne = originalFindOne }
})
