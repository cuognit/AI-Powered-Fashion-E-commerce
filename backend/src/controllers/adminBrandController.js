import * as service from '../services/adminBrandService.js'
export const list = async (req, res, next) => { try { res.json(await service.listBrands(req.query)) } catch (error) { next(error) } }
export const create = async (req, res, next) => { try { res.status(201).json({ data: await service.createBrand(req.body, req.user.sub) }) } catch (error) { next(error) } }
export const update = async (req, res, next) => { try { res.json({ data: await service.updateBrand(req.params.id, req.body, req.user.sub) }) } catch (error) { next(error) } }
export const trash = async (req, res, next) => { try { await service.trashBrand(req.params.id, req.user.sub); res.json({ message: 'Đã chuyển thương hiệu vào thùng rác' }) } catch (error) { next(error) } }
export const restore = async (req, res, next) => { try { res.json({ data: await service.restoreBrand(req.params.id, req.user.sub) }) } catch (error) { next(error) } }
export const purge = async (req, res, next) => { try { await service.purgeBrand(req.params.id); res.json({ message: 'Đã xóa vĩnh viễn thương hiệu' }) } catch (error) { next(error) } }
