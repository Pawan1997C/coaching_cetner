import { z } from 'zod';
import { SiteSettings } from '../models/SiteSettings';
import { asyncHandler } from '../utils/asyncHandler';

export const getSettings = () =>
  SiteSettings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true, setDefaultsOnInsert: true });

const EDITABLE = ['name', 'tagline', 'heroTitle', 'heroSubtitle', 'about', 'stats', 'highlights', 'faqs', 'contact', 'mapQuery', 'social'];

export const DISPLAY_FONTS = ['Young Serif', 'DM Serif Display', 'Fraunces', 'Playfair Display', 'Bricolage Grotesque', 'Poppins'] as const;
export const BODY_FONTS = ['Figtree', 'Inter', 'DM Sans', 'Nunito Sans', 'Poppins', 'Source Sans 3'] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like #1B2A7A');
const themeSchema = z.object({
  preset: z.string().max(30),
  brand: hex,
  accent: hex,
  highlight: hex,
  fontDisplay: z.enum(DISPLAY_FONTS),
  fontBody: z.enum(BODY_FONTS),
  radius: z.enum(['sharp', 'soft', 'round']),
  applyToAdmin: z.boolean(),
});
const chatbotSchema = z.object({
  enabled: z.boolean(),
  collectLeads: z.boolean().default(true),
  name: z.string().trim().min(1).max(30),
  greeting: z.string().trim().max(300),
  fallback: z.string().trim().max(300),
  replies: z.array(z.object({ keywords: z.string().trim().min(1).max(200), answer: z.string().trim().min(1).max(600) })).max(50),
});

export const get = asyncHandler(async (_req, res) => res.json(await getSettings()));

export const update = asyncHandler(async (req, res) => {
  const $set: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in req.body) $set[k] = req.body[k]; // images have their own endpoints
  if ('theme' in req.body) $set.theme = themeSchema.parse(req.body.theme);
  if ('chatbot' in req.body) $set.chatbot = chatbotSchema.parse(req.body.chatbot);
  await getSettings(); // make sure it exists
  res.json(await SiteSettings.findOneAndUpdate({ key: 'main' }, { $set }, { new: true, runValidators: true }));
});
