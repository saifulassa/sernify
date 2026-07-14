'use client';

import { PageWrapper } from '@/components/layout';
import { InventoryWidget } from '@/components/widgets/InventoryWidget';

export function InventoryView() {
  return (
    <PageWrapper>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Stock</h1>
        <InventoryWidget fullPage />
      </div>
    </PageWrapper>
  );
}
