import assert from 'node:assert/strict'
import test from 'node:test'
import Order from '../src/models/Order.js'
import RefreshToken from '../src/models/RefreshToken.js'
import User from '../src/models/User.js'
import adminUserRoutes from '../src/routes/adminUser.routes.js'
import { getCustomer, getUser, listCustomers, listUsers, updateUser } from '../src/services/adminUserService.js'
import { loginUser, refreshAccessToken } from '../src/services/authService.js'
import { verifyToken } from '../src/middlewares/verifyToken.js'
import jwt from 'jsonwebtoken'
import env from '../src/config/env.js'

const CUSTOMER_ID = '64b000000000000000000001'
const ADMIN_ID = '64b000000000000000000002'
const OTHER_ADMIN_ID = '64b000000000000000000003'

env.jwtAccessSecret = env.jwtAccessSecret || 'test-jwt-access-secret-key-32charslong!'
env.jwtRefreshSecret = env.jwtRefreshSecret || 'test-jwt-refresh-secret-key-32charslong!'

test('admin user routes require authentication, admin access and expose expected methods', () => {
  const layers = adminUserRoutes.stack
  assert.deepEqual(layers.slice(0, 2).map((layer) => layer.name), ['verifyToken', 'checkAdmin'])
  assert.equal(layers[2].route, undefined)
  assert.deepEqual(
    layers.slice(3).map((layer) => Object.keys(layer.route.methods)[0]),
    ['get', 'get', 'get', 'patch'],
  )
})

test('user list supports role filtering (all, customer, admin), escapes search and maps statistics and active status', async () => {
  const originalAggregate = User.aggregate
  const pipelines = []
  User.aggregate = async (pipeline) => {
    pipelines.push(pipeline)
    if (pipeline.at(-1)?.$count) return [{ total: 2 }]
    return [
      {
        _id: CUSTOMER_ID,
        name: 'An.*',
        email: 'an@example.com',
        phone: '0900000000',
        address: 'TP. Hồ Chí Minh',
        role: 'customer',
        createdAt: new Date('2026-01-01'),
        orderCount: 3,
        activeOrders: 1,
        completedOrders: 2,
        totalSpent: 1250000,
        latestOrderAt: new Date('2026-08-01'),
      },
      {
        _id: ADMIN_ID,
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '0901111111',
        address: 'Hà Nội',
        role: 'admin',
        isActive: false,
        createdAt: new Date('2026-01-02'),
        orderCount: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        latestOrderAt: null,
      },
    ]
  }

  try {
    // 1. Default (all roles)
    const resultAll = await listUsers({ page: '1', limit: '15', search: 'An.*', sort: 'total_spent' })
    assert.equal(resultAll.pagination.total, 2)
    assert.equal(resultAll.data[0].id, CUSTOMER_ID)
    assert.equal(resultAll.data[0].role, 'customer')
    assert.equal(resultAll.data[0].isActive, true) // Legacy user without isActive defaults to true
    assert.equal(resultAll.data[0].totalSpent, 1250000)
    assert.equal(resultAll.data[1].id, ADMIN_ID)
    assert.equal(resultAll.data[1].role, 'admin')
    assert.equal(resultAll.data[1].isActive, false)
    assert.deepEqual(pipelines[0][0].$match.role, { $in: ['customer', 'admin'] })
    assert.equal(pipelines[0][0].$match.$or[0].name.source, 'An\\.\\*')
    assert.deepEqual(pipelines[0].find((stage) => stage.$sort).$sort, { totalSpent: -1, createdAt: -1 })
    assert.equal(pipelines[0].find((stage) => stage.$lookup).$lookup.from, Order.collection.name)

    // 2. Customer role filter
    pipelines.length = 0
    await listUsers({ role: 'customer' })
    assert.equal(pipelines[0][0].$match.role, 'customer')

    // 3. Admin role filter
    pipelines.length = 0
    await listUsers({ role: 'admin' })
    assert.equal(pipelines[0][0].$match.role, 'admin')

    // 4. Status active filter
    pipelines.length = 0
    await listUsers({ status: 'active' })
    assert.deepEqual(pipelines[0][0].$match.isActive, { $ne: false })

    // 5. Status inactive filter
    pipelines.length = 0
    await listUsers({ status: 'inactive' })
    assert.equal(pipelines[0][0].$match.isActive, false)
  } finally {
    User.aggregate = originalAggregate
  }
})

test('user list validates search, sort, role, and status inputs', async () => {
  await assert.rejects(() => listUsers({ search: 'x'.repeat(101) }), (error) => error.statusCode === 400)
  await assert.rejects(() => listUsers({ sort: 'password' }), (error) => error.statusCode === 400)
  await assert.rejects(() => listUsers({ role: 'superadmin' }), (error) => error.statusCode === 400)
  await assert.rejects(() => listUsers({ status: 'unknown_status' }), (error) => error.statusCode === 400)
})

test('user detail returns public profile, role, active status and completed-order spending', async () => {
  const originalFindById = User.findById
  const originalAggregate = Order.aggregate
  let selectedFields

  User.findById = (id) => {
    assert.equal(id, CUSTOMER_ID)
    return {
      select(fields) {
        selectedFields = fields
        return this
      },
      lean: async () => ({
        _id: CUSTOMER_ID,
        name: 'Lan',
        email: 'lan@example.com',
        phone: '',
        address: '',
        role: 'customer',
        createdAt: new Date('2026-02-01'),
      }),
    }
  }

  Order.aggregate = async () => [{ _id: null, orderCount: 4, activeOrders: 1, completedOrders: 2, totalSpent: 980000 }]

  try {
    const result = await getUser(CUSTOMER_ID)
    assert.equal(selectedFields, 'name email phone address role isActive createdAt')
    assert.equal(result.id, CUSTOMER_ID)
    assert.equal(result.role, 'customer')
    assert.equal(result.isActive, true) // legacy user defaults to true
    assert.equal(result.password, undefined)
    assert.equal(result.statistics.completedOrders, 2)
    assert.equal(result.statistics.totalSpent, 980000)

    // Check alias getCustomer
    const aliasResult = await getCustomer(CUSTOMER_ID)
    assert.equal(aliasResult.id, CUSTOMER_ID)
  } finally {
    User.findById = originalFindById
    Order.aggregate = originalAggregate
  }
})

test('user detail rejects malformed and unknown user ids', async () => {
  await assert.rejects(() => getUser('not-an-id'), (error) => error.statusCode === 400)
  const originalFindById = User.findById
  User.findById = () => ({
    select() {
      return this
    },
    lean: async () => null,
  })
  try {
    await assert.rejects(() => getUser(CUSTOMER_ID), (error) => error.statusCode === 404)
  } finally {
    User.findById = originalFindById
  }
})

test('updateUser validates input payload and prevents self-deactivation or self-demotion', async () => {
  await assert.rejects(
    () => updateUser(ADMIN_ID, CUSTOMER_ID, {}),
    (error) => error.statusCode === 400 && error.message.includes('Dữ liệu cập nhật không hợp lệ'),
  )

  await assert.rejects(
    () => updateUser(ADMIN_ID, CUSTOMER_ID, { role: 'invalid_role' }),
    (error) => error.statusCode === 400 && error.message.includes('Vai trò không hợp lệ'),
  )

  await assert.rejects(
    () => updateUser(ADMIN_ID, CUSTOMER_ID, { isActive: 'not_a_boolean' }),
    (error) => error.statusCode === 400 && error.message.includes('Trạng thái hoạt động không hợp lệ'),
  )

  const originalFindById = User.findById
  User.findById = async (id) => ({
    _id: id,
    role: 'admin',
    isActive: true,
    save: async () => {},
  })

  try {
    // Admin cannot deactivate self
    await assert.rejects(
      () => updateUser(ADMIN_ID, ADMIN_ID, { isActive: false }),
      (error) => error.statusCode === 400 && error.message.includes('Không thể tự vô hiệu hóa'),
    )

    // Admin cannot demote self
    await assert.rejects(
      () => updateUser(ADMIN_ID, ADMIN_ID, { role: 'customer' }),
      (error) => error.statusCode === 400 && error.message.includes('Không thể tự hạ quyền'),
    )
  } finally {
    User.findById = originalFindById
  }
})

test('updateUser prevents deactivating or demoting the last active admin', async () => {
  const originalFindById = User.findById
  const originalCountDocuments = User.countDocuments

  User.findById = (id) => ({
    _id: id,
    role: 'admin',
    isActive: true,
    session() {
      return this
    },
    save: async () => {},
  })

  // Simulate 0 other active admins in system (target is the only active admin)
  User.countDocuments = () => ({
    session() {
      return this
    },
    then(resolve) {
      return resolve(0)
    },
  })

  try {
    // Demoting the last active admin
    await assert.rejects(
      () => updateUser(ADMIN_ID, OTHER_ADMIN_ID, { role: 'customer' }),
      (error) => error.statusCode === 400 && error.message.includes('quản trị viên duy nhất'),
    )

    // Deactivating the last active admin
    await assert.rejects(
      () => updateUser(ADMIN_ID, OTHER_ADMIN_ID, { isActive: false }),
      (error) => error.statusCode === 400 && error.message.includes('quản trị viên duy nhất'),
    )
  } finally {
    User.findById = originalFindById
    User.countDocuments = originalCountDocuments
  }
})

test('updateUser prevents race condition when two admins concurrently demote each other', async () => {
  const originalFindById = User.findById
  const originalCountDocuments = User.countDocuments
  const originalAggregate = Order.aggregate

  // 2 active admins in database
  const dbAdmins = {
    [ADMIN_ID]: { _id: ADMIN_ID, role: 'admin', isActive: true },
    [OTHER_ADMIN_ID]: { _id: OTHER_ADMIN_ID, role: 'admin', isActive: true },
  }

  User.findById = (id) => {
    const user = dbAdmins[id]
    if (!user) return null
    return {
      ...user,
      select() {
        return this
      },
      session() {
        return this
      },
      async lean() {
        return { ...user }
      },
      async save() {
        dbAdmins[id].role = this.role
        dbAdmins[id].isActive = this.isActive
        return this
      },
    }
  }

  User.countDocuments = (filter = {}) => {
    // Filter other active admins
    const excludedId = filter._id?.$ne
    const count = Object.values(dbAdmins).filter(
      (u) => String(u._id) !== String(excludedId) && u.role === 'admin' && u.isActive !== false,
    ).length

    return {
      session() {
        return this
      },
      then(resolve) {
        return resolve(count)
      },
    }
  }

  Order.aggregate = async () => []

  try {
    // Both admins try to demote each other at the exact same moment
    const [result1, result2] = await Promise.allSettled([
      updateUser(ADMIN_ID, OTHER_ADMIN_ID, { role: 'customer' }),
      updateUser(OTHER_ADMIN_ID, ADMIN_ID, { role: 'customer' }),
    ])

    // Exactly one should succeed and one should fail because the mutex & counter protect the last active admin
    const successes = [result1, result2].filter((r) => r.status === 'fulfilled')
    const failures = [result1, result2].filter((r) => r.status === 'rejected')

    assert.equal(successes.length, 1)
    assert.equal(failures.length, 1)
    assert.ok(failures[0].reason.message.includes('quản trị viên duy nhất'))

    // Verify exactly 1 active admin remains
    const remainingAdmins = Object.values(dbAdmins).filter((u) => u.role === 'admin' && u.isActive)
    assert.equal(remainingAdmins.length, 1)
  } finally {
    User.findById = originalFindById
    User.countDocuments = originalCountDocuments
    Order.aggregate = originalAggregate
  }
})

test('updateUser successfully updates role, deactivates account, and revokes all refresh tokens', async () => {
  const originalFindById = User.findById
  const originalCountDocuments = User.countDocuments
  const originalUpdateMany = RefreshToken.updateMany
  const originalAggregate = Order.aggregate

  let targetSaved = false
  let revokedTokensQuery = null
  let updatedRole = null
  let updatedIsActive = null

  const targetUserObj = {
    _id: CUSTOMER_ID,
    name: 'Customer One',
    email: 'cust1@example.com',
    role: 'customer',
    isActive: true,
    select() {
      return this
    },
    async lean() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isActive: this.isActive !== false,
        createdAt: new Date(),
      }
    },
    async save() {
      targetSaved = true
      return this
    },
  }

  User.findById = (id) => {
    if (id === CUSTOMER_ID) {
      return targetUserObj
    }
    return null
  }

  User.countDocuments = async () => 3
  RefreshToken.updateMany = async (filter, update) => {
    revokedTokensQuery = { filter, update }
    return { modifiedCount: 2 }
  }
  Order.aggregate = async () => []

  try {
    // 1. Promote customer to admin
    targetSaved = false
    const res1 = await updateUser(ADMIN_ID, CUSTOMER_ID, { role: 'admin' })
    assert.equal(targetSaved, true)
    assert.equal(targetUserObj.role, 'admin')
    assert.equal(res1.role, 'admin')

    // 2. Deactivate user -> triggers RefreshToken revocation
    targetSaved = false
    const res2 = await updateUser(ADMIN_ID, CUSTOMER_ID, { isActive: false })
    assert.equal(targetSaved, true)
    assert.equal(targetUserObj.isActive, false)
    assert.equal(res2.isActive, false)
    assert.deepEqual(revokedTokensQuery.filter, { user_id: CUSTOMER_ID, revoked_at: null })
    assert.ok(revokedTokensQuery.update.$set.revoked_at instanceof Date)
  } finally {
    User.findById = originalFindById
    User.countDocuments = originalCountDocuments
    RefreshToken.updateMany = originalUpdateMany
    Order.aggregate = originalAggregate
  }
})

test('verifyToken rejects deactivated users and reflects fresh DB role immediately', async () => {
  const originalFindById = User.findById
  const token = jwt.sign({ sub: CUSTOMER_ID, role: 'customer', type: 'access' }, env.jwtAccessSecret, { expiresIn: '1h' })

  // 1. Deactivated user
  User.findById = () => ({
    select: () => ({
      _id: CUSTOMER_ID,
      role: 'customer',
      isActive: false,
      passwordChangedAt: null,
    }),
  })

  let nextCalled = false
  let errorCaught = null

  const req = { headers: { authorization: `Bearer ${token}` } }
  await verifyToken(req, {}, (err) => {
    nextCalled = true
    errorCaught = err
  })

  assert.equal(nextCalled, true)
  assert.equal(errorCaught?.statusCode, 401)
  assert.ok(errorCaught?.message.includes('vô hiệu hóa'))

  // 2. User promoted in DB from customer to admin: verifyToken assigns new DB role
  User.findById = () => ({
    select: () => ({
      _id: CUSTOMER_ID,
      role: 'admin',
      isActive: true,
      passwordChangedAt: null,
    }),
  })

  nextCalled = false
  errorCaught = null

  await verifyToken(req, {}, (err) => {
    nextCalled = true
    errorCaught = err
  })

  assert.equal(nextCalled, true)
  assert.equal(errorCaught, undefined)
  assert.equal(req.user.role, 'admin')
  assert.equal(req.user.isActive, true)

  User.findById = originalFindById
})

test('auth service rejects login and refresh for deactivated accounts', async () => {
  const originalFindOne = User.findOne
  const originalFindById = User.findById
  const originalRefreshTokenFindOne = RefreshToken.findOne

  // Deactivated user on login
  User.findOne = () => ({
    select: () => ({
      _id: CUSTOMER_ID,
      email: 'deactivated@example.com',
      password: '$2a$12$dummyhashedpassword',
      isActive: false,
    }),
  })

  // We test that login rejects inactive user
  // (Note: bcrypt.compare mock or test logic)
  const bcrypt = await import('bcryptjs')
  const originalCompare = bcrypt.default.compare
  bcrypt.default.compare = async () => true

  try {
    await assert.rejects(
      () => loginUser({ email: 'deactivated@example.com', password: 'password123' }),
      (error) => error.statusCode === 403 && error.message.includes('vô hiệu hóa'),
    )

    // Refresh token rejects inactive user
    const refreshToken = jwt.sign({ sub: CUSTOMER_ID, type: 'refresh' }, env.jwtRefreshSecret, { expiresIn: '7d' })
    let tokenRevoked = false
    RefreshToken.findOne = async () => ({
      user_id: CUSTOMER_ID,
      save: async () => {
        tokenRevoked = true
      },
    })
    User.findById = () => ({
      select: () => ({
        _id: CUSTOMER_ID,
        role: 'customer',
        isActive: false,
        passwordChangedAt: null,
      }),
    })

    await assert.rejects(
      () => refreshAccessToken(refreshToken),
      (error) => error.statusCode === 401 && error.message.includes('vô hiệu hóa'),
    )
    assert.equal(tokenRevoked, true)
  } finally {
    User.findOne = originalFindOne
    User.findById = originalFindById
    RefreshToken.findOne = originalRefreshTokenFindOne
    bcrypt.default.compare = originalCompare
  }
})
