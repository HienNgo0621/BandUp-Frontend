import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicHeader } from '../components/layout/PublicHeader';
import { GuestLockModal } from '../pages/AuthPages';
import { Modal } from '../components/ui/Modal';

const LEGAL_COPY = {
  privacy: { title: 'Privacy', points: ['Your learning activity and preferences are handled according to the BandUp IELTS privacy policy.', 'Keep your account information secure and sign out on shared devices.'] },
  guidelines: { title: 'Community Guidelines', points: ['Be kind: give feedback you would want to receive.', 'Do not share personal contact details in tasks or discussions.', 'Use the Report button for anything unkind or unsafe.'] },
} as const;

export function PublicLayout() {
  const [legal, setLegal] = useState<keyof typeof LEGAL_COPY | null>(null); const content = legal ? LEGAL_COPY[legal] : null;
  return <div className="public-layout"><PublicHeader/><main id="content" className="public-main"><Outlet/></main><PublicFooter onOpenLegal={setLegal}/><GuestLockModal/><Modal open={Boolean(content)} title={content?.title ?? ''} onClose={() => setLegal(null)}><ul className="legal-points">{content?.points.map((point) => <li key={point}>{point}</li>)}</ul><p className="legal-disclaimer">For account-specific questions, please contact the BandUp IELTS team.</p></Modal></div>;
}
