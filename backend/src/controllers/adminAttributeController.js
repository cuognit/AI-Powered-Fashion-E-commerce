import * as service from '../services/adminAttributeService.js'
const send = (fn, status = 200) => async (req, res, next) => { try { const data = await fn(req); res.status(status).json(data === undefined ? { message: 'Đã xử lý thuộc tính' } : { data }) } catch (error) { next(error) } }
export const list = async (req, res, next) => { try { res.json(await service.listAttributes(req.query)) } catch (error) { next(error) } }
export const create = send((req) => service.createAttribute(req.body, req.user.sub), 201)
export const update = send((req) => service.updateAttribute(req.params.id, req.body, req.user.sub))
export const addValue = send((req) => service.addValue(req.params.id, req.body, req.user.sub), 201)
export const updateValue = send((req) => service.updateValue(req.params.id, req.params.valueId, req.body, req.user.sub))
export const trashValue = send((req) => service.trashValue(req.params.id, req.params.valueId, req.user.sub))
export const restoreValue = send((req) => service.restoreValue(req.params.id, req.params.valueId, req.user.sub))
export const trash = send((req) => service.trashAttribute(req.params.id, req.user.sub))
export const restore = send((req) => service.restoreAttribute(req.params.id, req.user.sub))
export const purge = send((req) => service.purgeAttribute(req.params.id))
