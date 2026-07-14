import { Suspense } from 'react';
import { EventsView } from './EventsView';

export const metadata = {
  title: 'Events',
  description: 'Manage birthdays, anniversaries, and milestones.',
};

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<EventsSkeleton />}>
        <EventsView />
      </Suspense>
    </main>
  );
}

function EventsSkeleton() {
  return (
    <div className="h-screen flex flex-col p-4 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-6" />
      <div className="h-10 w-36 bg-muted rounded mb-4" />
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
