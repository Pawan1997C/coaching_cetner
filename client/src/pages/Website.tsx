import { useState } from 'react';
import { PageHeader } from '../components/ui';
import SettingsTab from './website/SettingsTab';
import CoursesTab from './website/CoursesTab';
import FacultyTab from './website/FacultyTab';
import ReviewsTab from './website/ReviewsTab';
import ThemeTab from './website/ThemeTab';
import ChatbotTab from './website/ChatbotTab';

const TABS = [
  ['settings', 'Site details'],
  ['courses', 'Classes and subjects'],
  ['faculty', 'Faculty'],
  ['reviews', 'Reviews'],
  ['theme', 'Theme'],
  ['chatbot', 'Chatbot'],
] as const;

export default function Website() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('settings');
  return (
    <>
      <PageHeader title="Website content" sub="Everything visitors see on your public site">
        <a className="btn" href="/" target="_blank" rel="noreferrer">View live site</a>
      </PageHeader>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-brand text-ink' : 'border-transparent text-mute'}`}>{label}</button>
        ))}
      </div>
      {tab === 'settings' && <SettingsTab />}
      {tab === 'courses' && <CoursesTab />}
      {tab === 'faculty' && <FacultyTab />}
      {tab === 'reviews' && <ReviewsTab />}
      {tab === 'theme' && <ThemeTab />}
      {tab === 'chatbot' && <ChatbotTab />}
    </>
  );
}
