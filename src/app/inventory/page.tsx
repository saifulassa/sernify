import { Suspense } from 'react';
import { InventoryView } from './InventoryView';

export const metadata = {
  title: 'Stock',
  description: 'Manage your inventory and stock levels.',
};

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryView />
      </Suspense>
    </main>
  );
}

function InventorySkeleton() {
  return (
    <div className="h-screen flex flex-col p-4 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-6" />
      <div className="flex gap-2 mb-4">
        <div className="h-9 w-24 bg-muted rounded-full" />
        <div className="h-9 w-24 bg-muted rounded-full" />
        <div className="h-9 w-24 bg-muted rounded-full" />
      </div>
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
