import { Model } from 'mongoose';
import { asyncHandler } from './asyncHandler';
import { ApiError } from './ApiError';

interface CrudOptions {
  populate?: any;
  search?: string[]; // fields matched by ?q=
  filters?: string[]; // query params copied into the Mongo filter
  sort?: string;
  afterRemove?: (doc: any) => Promise<unknown>; // e.g. delete Cloudinary files
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Generic list/get/create/update/remove handlers used by the simpler modules. */
export const makeCrud = (M: Model<any>, o: CrudOptions = {}) => ({
  list: asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
    const filter: Record<string, any> = {};
    o.filters?.forEach((k) => {
      if (req.query[k]) filter[k] = String(req.query[k]); // String() blocks operator injection
    });
    const q = req.query.q ? String(req.query.q) : '';
    if (q && o.search?.length) {
      filter.$or = o.search.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } }));
    }
    const [items, total] = await Promise.all([
      M.find(filter)
        .populate(o.populate ?? [])
        .sort(o.sort ?? '-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      M.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  }),

  get: asyncHandler(async (req, res) => {
    const doc = await M.findById(req.params.id).populate(o.populate ?? []);
    if (!doc) throw new ApiError(404, 'Not found');
    res.json(doc);
  }),

  create: asyncHandler(async (req, res) => {
    const doc = await M.create(req.body);
    res.status(201).json(doc);
  }),

  update: asyncHandler(async (req, res) => {
    const doc = await M.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
      o.populate ?? []
    );
    if (!doc) throw new ApiError(404, 'Not found');
    res.json(doc);
  }),

  remove: asyncHandler(async (req, res) => {
    const doc = await M.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, 'Not found');
    await o.afterRemove?.(doc);
    res.json({ message: 'Deleted' });
  }),
});
