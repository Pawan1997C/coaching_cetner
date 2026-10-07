import { Schema, model } from 'mongoose';

const img = { url: String, publicId: String };

// Singleton document (key = 'main') holding everything editable on the public website.
const siteSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    name: { type: String, default: 'Your Coaching Centre' },
    tagline: { type: String, default: 'Focused coaching for school and competitive exams' },
    logo: img,
    heroTitle: { type: String, default: 'Learn with clarity. Score with confidence.' },
    heroSubtitle: { type: String, default: 'Small batches, experienced teachers and weekly tests that show exactly where you stand.' },
    heroImage: img,
    about: { type: String, default: '' },
    stats: [{ _id: false, label: String, value: String }], // e.g. { label: 'Students taught', value: '2,500+' }
    highlights: [{ _id: false, title: String, text: String }], // "Why choose us" points
    faqs: [{ _id: false, question: String, answer: String }],
    contact: { phone: String, whatsapp: String, email: String, address: String, hours: String },
    mapQuery: String, // address or "lat,lng" used for the Google Maps embed
    social: { facebook: String, instagram: String, youtube: String },
    // Look and feel, applied to the website and (optionally) the admin panel.
    theme: {
      preset: { type: String, default: 'pen-blue' },
      brand: { type: String, default: '#1B2A7A' },
      accent: { type: String, default: '#D63B2F' },
      highlight: { type: String, default: '#FFE066' },
      fontDisplay: { type: String, default: 'Young Serif' },
      fontBody: { type: String, default: 'Figtree' },
      radius: { type: String, enum: ['sharp', 'soft', 'round'], default: 'soft' },
      applyToAdmin: { type: Boolean, default: true },
    },
    chatbot: {
      enabled: { type: Boolean, default: true },
      collectLeads: { type: Boolean, default: true }, // let the bot take enquiry details in the chat
      name: { type: String, default: 'Assistant' },
      greeting: { type: String, default: 'Hi! Ask me about classes, fees, timings or admissions.' },
      fallback: { type: String, default: '' }, // what to say when nothing matches (optional)
      // Custom replies: if the visitor's message contains any of the comma-separated keywords, the answer is sent.
      replies: [{ _id: false, keywords: String, answer: String }],
    },
  },
  { timestamps: true }
);

export const SiteSettings = model('SiteSettings', siteSchema);
