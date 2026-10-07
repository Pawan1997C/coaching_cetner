import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as P from '../controllers/public.controller';
import { chat } from '../controllers/chat.controller';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again in an hour.' },
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You are sending messages very quickly. Please wait a few minutes or call us.' },
});

const r = Router();
r.get('/site', P.site);
r.post('/enquiries', limiter, P.createEnquiry);
r.post('/reviews', limiter, P.createReview);
r.post('/chat', chatLimiter, chat);
export default r;
