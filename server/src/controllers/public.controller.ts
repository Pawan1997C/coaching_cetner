import { z } from 'zod';
import { Course } from '../models/Course';
import { Enquiry } from '../models/Enquiry';
import { Faculty } from '../models/Faculty';
import { Review } from '../models/Review';
import { asyncHandler } from '../utils/asyncHandler';
import { getSettings } from './site.controller';

// Everything the public website needs, in one request.
export const site = asyncHandler(async (_req, res) => {
  const [settings, courses, faculty, reviews] = await Promise.all([
    getSettings(),
    Course.find({ published: true }).sort('order createdAt').populate('subjects', 'name'),
    Faculty.find({ published: true }).sort('order createdAt'),
    Review.find({ status: 'published' }).sort('-createdAt').limit(60),
  ]);
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const publicSettings: any = settings.toObject();
  if (publicSettings.chatbot) delete publicSettings.chatbot.replies; // only used server-side to answer chat messages
  res.json({ settings: publicSettings, courses, faculty, reviews, rating: { average, count } });
});

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  interest: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
});

export const createEnquiry = asyncHandler(async (req, res) => {
  if (req.body.website) return res.status(201).json({ message: 'Thanks, we will call you soon.' }); // honeypot: bots fill hidden fields
  const data = enquirySchema.parse(req.body);
  await Enquiry.create({ ...data, email: data.email || undefined });
  res.status(201).json({ message: 'Thanks, we will call you soon.' });
});

const reviewSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  role: z.string().trim().max(80).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10, 'Write at least a sentence').max(600),
});

export const createReview = asyncHandler(async (req, res) => {
  if (req.body.website) return res.status(201).json({ message: 'Thanks for your review.' });
  const data = reviewSchema.parse(req.body);
  await Review.create({ ...data, status: 'pending', source: 'website' }); // admin approves before it shows
  res.status(201).json({ message: 'Thanks for your review. It will appear once approved.' });
});
