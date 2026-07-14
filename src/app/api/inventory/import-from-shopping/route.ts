import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { inventoryItems, shoppingItems, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateEntity } from '@/lib/cache/cacheKeys';
import { logActivity } from '@/lib/services/auditLog';
import { formatInventoryItemRow } from '@/lib/utils/formatters';
import { logError } from '@/lib/utils/logError';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    if (!body.shoppingItemIds || !Array.isArray(body.shoppingItemIds) || body.shoppingItemIds.length === 0) {
      return NextResponse.json(
        { error: 'shoppingItemIds array is required' },
        { status: 400 }
      );
    }

    // Fetch checked shopping items with their list id
    const items = await db
      .select({
        id: shoppingItems.id,
        name: shoppingItems.name,
        quantity: shoppingItems.quantity,
        unit: shoppingItems.unit,
        category: shoppingItems.category,
        listId: shoppingItems.listId,
      })
      .from(shoppingItems)
      .where(
        and(
          ...body.shoppingItemIds.map((id: string) => eq(shoppingItems.id, id)),
          eq(shoppingItems.checked, true)
        )
      );

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No checked shopping items found' },
        { status: 400 }
      );
    }

    // Insert each as inventory item
    const inserted = [];
    for (const item of items) {
      const [newItem] = await db
        .insert(inventoryItems)
        .values({
          name: item.name,
          quantity: String(item.quantity ?? 1),
          unit: item.unit || null,
          category: item.category || null,
          shoppingItemId: item.id,
          addedBy: auth.userId,
          purchasedAt: new Date(),
        })
        .returning();

      if (newItem) {
        inserted.push(newItem);
      }
    }

    await invalidateEntity('inventory');

    logActivity({
      userId: auth.userId,
      action: 'create',
      entityType: 'inventory_item',
      entityId: inserted[0]?.id || 'batch',
      summary: `Imported ${inserted.length} stock item(s) from shopping list`,
    });

    return NextResponse.json({
      imported: inserted.length,
      items: inserted.map(i => ({
        id: i.id,
        name: i.name,
        quantity: String(i.quantity),
        unit: i.unit,
        category: i.category,
      })),
    }, { status: 201 });
  } catch (error) {
    logError('Error importing from shopping:', error);
    return NextResponse.json(
      { error: 'Failed to import from shopping list' },
      { status: 500 }
    );
  }
}
