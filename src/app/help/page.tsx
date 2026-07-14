import { HelpView } from './HelpView';

export const metadata = {
  title: 'Help - Sernify',
  description: 'User guide for Sernify family dashboard.',
  robots: { index: false },
};

export default function HelpPage() {
  return <HelpView />;
}
