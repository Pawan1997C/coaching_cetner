# Coaching Platform (MERN + Cloudinary)

React (Vite, TypeScript, Tailwind) + Express + MongoDB (Mongoose) + Cloudinary file storage.

## Modules

| Module | What it covers | API prefix |
| --- | --- | --- |
| Analytics | Performance, attendance and fee charts, student report cards | `/api/analytics` |
| Student management | Profiles (with photo), batches, subjects | `/api/students`, `/api/batches`, `/api/subjects` |
| Attendance | Daily sheet per batch, range reports with % | `/api/attendance` |
| Fee management | Assign fees, record payments, pending list, printable receipts | `/api/fees` |
| Examination | Tests, bulk marks entry, grades, pass/fail, rank | `/api/exams` |
| Study materials | PDF, Word and image uploads to Cloudinary | `/api/materials` |
| Website CMS | Site details, classes, faculty, reviews, enquiries | `/api/site`, `/api/courses`, `/api/faculty`, `/api/reviews`, `/api/enquiries` |

## Public website

The public site lives at `/` and the admin panel at `/admin` (there is no public link to it; staff open `/admin` directly).
Visitors never need to log in. All content is managed from **Admin > Website** and **Admin > Enquiries**:

| Public section | Managed in |
| --- | --- |
| Home headline, logo, photo, numbers, About, Why choose us, FAQ, contact details, map, social links | Website > Site details |
| Classes and subjects (subjects come from Students > Subjects) | Website > Classes and subjects |
| Teachers | Website > Faculty |
| Reviews (visitor-submitted reviews wait for approval) | Website > Reviews |
| Enquiry form submissions | Enquiries (status: new, contacted, enrolled, closed) |

Public endpoints (`/api/public/*`) are rate-limited (8 per hour per IP) and use a hidden honeypot field against bots.
The map uses a keyless Google Maps embed built from the address or `lat,lng` you enter.

## Chatbot

A rule-based chat assistant appears at the bottom right of the website. **No AI service or API key is used.** Configure it in **Admin > Website > Chatbot**: turn it on or off, set its name and opening message, add your own replies, and test questions right there.

How it answers, in order:
1. **Your replies**: if the visitor's message contains one of your trigger words (for example "admission date, last date"), your answer is sent.
2. **Your FAQs** from Site details, when most of an FAQ's key words appear in the question.
3. **Built-in topics** built from your website content: fees, timings, classes and subjects, teachers, location, contact, demo and admission, reviews. It understands class numbers ("10th fees" shows only Class 10) and common Hinglish words ("kitni fees").
4. **Fallback**: a friendly message asking the visitor to call or request a call back.

**Guided enquiries.** When a visitor asks for a demo, admission or a call back ("I want to join class 10", "Request a call back"), the assistant asks for their name, mobile number, the class they want (pre-filled if they already mentioned it) and an optional note, shows a summary, and saves it as an entry in **Enquiries** (marked "via chat") only after they confirm. They can cancel any time, and can ask other questions mid-way without losing progress. Switch it off with "Let the assistant take enquiry details". Everything is validated again on the server, duplicate submissions of the same number within 10 minutes are ignored, and each connection can submit at most 5 chat enquiries per hour. `POST /api/public/chat` is rate-limited (40 messages per 15 minutes per IP).

## Theme

**Admin > Website > Theme** controls the look of the site: colour presets or custom colours (main, accent, highlight), heading and body fonts, corner style, and whether the admin panel uses the theme too. Changes preview live and go public on Save. Everything is driven by CSS variables (`src/lib/theme.ts`, `tailwind.config.js`), and the last theme is cached so pages paint with the right colours immediately.

## Client state and feedback

- `context/SiteContext.tsx` is the global store for website data (settings, classes, faculty, reviews). The public site and the admin header read from it, admin edits push changes into it, and the last response is cached in sessionStorage so repeat visits render instantly.
- `lib/toast.ts` + `components/Toaster.tsx` provide app-wide toasts: `toast.success('Saved')` / `toast.error(msg)` from anywhere.
- `components/SiteLoader.tsx` is the skeleton shown while the website loads for the first time (with a retry screen on failure).

## API URL (client)

The React app calls the API through `src/lib/api.ts`, which reads `VITE_API_URL` (see `client/.env.example`).

| Situation | What to do |
| --- | --- |
| Local development | Nothing. Leave `VITE_API_URL` empty; `/api` is proxied to `http://localhost:5000`. To use another port or machine, set `VITE_PROXY_TARGET` in `client/.env`. |
| Production, API on another domain | Set `VITE_API_URL=https://api.yourcentre.com/api` where you build the client (Vercel, Netlify, CI), then rebuild. Also add the website's address to `CLIENT_URL` in `server/.env` (comma-separated for several) so CORS allows it. |
| Production, same domain | Leave it empty and make your web server forward `/api` to the Node server. |

Vite bakes `VITE_*` values into the build, so changing one needs a new build, not just a restart.

## Setup

`server/` and `client/` are two independent projects. Each has its own `package.json`, `package-lock.json` and `node_modules`, so they can be installed, built and deployed separately.

1. API: `cd server && npm install`, then `cp .env.example .env` and fill in `MONGO_URI`, `JWT_SECRET` and the three Cloudinary values
2. Create the admin and starter data: `npm run seed` (still inside `server/`; the admin comes from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
3. Start the API: `npm run dev` (port 5000)
4. Web app, in a second terminal: `cd client && npm install && npm run dev` (port 5173; optional `client/.env`, see "API URL" above)

In CI or on a host, use `npm ci` inside each folder.

## Project layout

```
server/src
  config/       env (zod-validated), db, cloudinary (upload + delete helpers)
  middleware/   auth (JWT + roles), upload (multer, type/size limits), error
  models/       User, Subject, Batch, Student, Attendance, Fee, Exam, Result, Material
  controllers/  auth, student, attendance, fee, exam, material, analytics
  routes/       one router per module, mounted in routes/index.ts
  utils/        crud factory, ApiError, asyncHandler, grade
client/src
  pages/        Login, Dashboard, Students, Attendance, Fees, Exams, Materials
  components/   Layout (sidebar + auth guard), ui helpers
  context/      AuthContext
  lib/          axios instance, useFetch hook
```

## File uploads

Files are received with multer (memory storage, never written to disk) and streamed to Cloudinary.

- Images (JPG, PNG, WebP) are stored as Cloudinary `image` resources. Limits: 3 MB for student photos, 15 MB for materials.
- PDF and Word (.doc, .docx) are stored as `raw` resources, which sidesteps Cloudinary's default block on delivering PDFs stored as images.
- Each Material keeps `publicId` and `resourceType`, so deleting a record also deletes the file from Cloudinary.

## Batches and subjects

Admins can add, edit and delete both under **Students > Batches / Subjects**. A batch has a name, timing, monthly fee, seats, start and end dates, its subjects, and an Active switch (inactive batches stay in your records but are hidden when adding new students and exams). A batch with students or exams, or a subject still used by a batch, class, exam or student, cannot be deleted, and the message says what to move first.

## Roles

- `admin`: everything, including fees, deleting records, and creating users (`POST /api/auth/register`)
- `teacher`: students, attendance, exams, materials. No fee access.

## Ideas for next steps

- Parent/student portal (read-only role scoped to their own record)
- SMS or WhatsApp reminders for absentees and pending fees
- Fee schedules that generate monthly fees per batch automatically
- CSV/PDF export for reports, pagination on the attendance and fees tables
- Tests (Vitest + supertest) and a Dockerfile / deploy config
