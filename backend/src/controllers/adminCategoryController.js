import * as service from '../services/adminCategoryService.js'

export const list = async (req, res, next) => { try { res.json(await service.listCategories(req.query)) } catch (error) { next(error) } }
export const create = async (req, res, next) => { try { res.status(201).json({ data: await service.createCategory(req.body, req.user.sub) }) } catch (error) { next(error) } }
export const update = async (req, res, next) => { try { res.json({ data: await service.updateCategory(req.params.id, req.body, req.user.sub) }) } catch (error) { next(error) } }
export const trash = async (req, res, next) => { try { await service.trashCategory(req.params.id, req.user.sub); res.json({ message: 'Đã chuyển danh mục vào thùng rác' }) } catch (error) { next(error) } }
export const restore = async (req, res, next) => { try { res.json({ data: await service.restoreCategory(req.params.id, req.user.sub) }) } catch (error) { next(error) } }
export const purge = async (req, res, next) => { try { await service.purgeCategory(req.params.id); res.json({ message: 'Đã xóa vĩnh viễn danh mục' }) } catch (error) { next(error) } }
