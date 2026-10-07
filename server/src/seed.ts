import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Subject } from './models/Subject';
import { Batch } from './models/Batch';
import { Course } from './models/Course';
import { Review } from './models/Review';
import { Faculty } from './models/Faculty';
import { SiteSettings } from './models/SiteSettings';

(async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Admin', email, password, role: 'admin' });
    console.log(`Created admin ${email}`);
  } else {
    console.log(`Admin ${email} already exists`);
  }

  if ((await Subject.countDocuments()) === 0) {
    const subjects = await Subject.insertMany([
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Physics', code: 'PHY' },
      { name: 'Chemistry', code: 'CHEM' },
    ]);
    await Batch.create({ name: 'Class 10 - Morning', subjects: subjects.map((s) => s._id), schedule: 'Mon-Sat, 7:00-9:00 AM', monthlyFee: 2500 });
    console.log('Created sample subjects and a batch');
  }

  // Starter website content so the public site isn't empty. Edit or delete all of it from Admin > Website.
  if ((await Course.countDocuments()) === 0) {
    const subs = await Subject.find();
    await Course.create({ title: 'Class 10 Board Preparation', level: 'Class 10', description: 'Full syllabus coverage with weekly tests and doubt sessions.', subjects: subs.map((x) => x._id), schedule: 'Mon-Sat, 7-9 AM', duration: '10 months', fee: '₹2,500 / month', seats: 'Max 25 students', order: 1 });
    await Faculty.create({ name: 'Sample Teacher', designation: 'Senior Mathematics Teacher', qualification: 'M.Sc., B.Ed.', experience: '10 years', order: 1 });
    await Review.create({ name: 'Sample Parent', role: 'Parent of Class 10 student', rating: 5, text: 'My daughter\'s marks improved within two months. The weekly tests really help.' });
    await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { about: 'We are a neighbourhood coaching centre focused on strong basics, small batches and regular feedback.', stats: [{ value: '10+', label: 'Years of teaching' }, { value: '1,000+', label: 'Students taught' }], highlights: [{ title: 'Small batches', text: 'Every student gets personal attention.' }, { title: 'Weekly tests', text: 'Parents see progress every week.' }], faqs: [{ question: 'Do you offer a demo class?', answer: 'Yes. Send an enquiry and we will schedule a free demo.' }], contact: { phone: '+91 98765 43210', email: 'hello@example.com', address: 'Jaipur, Rajasthan', hours: 'Mon-Sat, 7 AM - 8 PM' }, mapQuery: 'Jaipur, Rajasthan' } },
      { upsert: true }
    );
    console.log('Created starter website content');
  }

  await mongoose.disconnect();
})();
