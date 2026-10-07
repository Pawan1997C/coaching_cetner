import type { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: InstanceType<typeof User>;
    }
  }
}
export {};
