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

The public site lives at `/` and the admin panel at `/admin` (staff login link is in the site footer).
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

## Setup

1. `npm install` (installs both workspaces)
2. `cp server/.env.example server/.env` and fill in `MONGO_URI`, `JWT_SECRET` and the three Cloudinary values
3. `npm run seed` creates an admin (from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`), sample subjects, a batch and starter website content
4. `npm run dev` starts the API on :5000 and the web app on :5173

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

## Roles

- `admin`: everything, including fees, deleting records, and creating users (`POST /api/auth/register`)
- `teacher`: students, attendance, exams, materials. No fee access.

## Ideas for next steps

- Parent/student portal (read-only role scoped to their own record)
- SMS or WhatsApp reminders for absentees and pending fees
- Fee schedules that generate monthly fees per batch automatically
- CSV/PDF export for reports, pagination on the attendance and fees tables
- Tests (Vitest + supertest) and a Dockerfile / deploy config
