import * as service from '../services/adminProductService.js'

export const getUploadSignature = async (_req, res, next) => {
  try {
    res.json({ success: true, data: service.generateUploadSignature() })
  } catch (error) {
    next(error)
  }
}

export const list = async (req, res, next) => { try { res.json(await service.listProducts(req.query)) } catch (error) { next(error) } }
export const get = async (req, res, next) => { try { res.json({ data: await service.getProduct(req.params.id) }) } catch (error) { next(error) } }
export const create = async (req, res, next) => { try { res.status(201).json({ data: await service.createProduct(req.body, req.files || [], req.user.sub) }) } catch (error) { next(error) } }
export const update = async (req, res, next) => { try { res.json({ data: await service.updateProduct(req.params.id, req.body, req.files || [], req.user.sub) }) } catch (error) { next(error) } }
export const business = async (req, res, next) => { try { res.json({ data: await service.setBusiness(req.params.id, req.body.enabled, req.user.sub) }) } catch (error) { next(error) } }
export const trash = async (req, res, next) => { try { await service.trashProduct(req.params.id, req.user.sub); res.json({ message: 'Đã chuyển sản phẩm vào thùng rác' }) } catch (error) { next(error) } }
export const restore = async (req, res, next) => { try { res.json({ data: await service.restoreProduct(req.params.id, req.user.sub) }) } catch (error) { next(error) } }
export const purge = async (req, res, next) => { try { await service.purgeProduct(req.params.id); res.json({ message: 'Đã xóa vĩnh viễn sản phẩm' }) } catch (error) { next(error) } }

