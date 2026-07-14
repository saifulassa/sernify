import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { inventoryItems, users } from '@/lib/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { invalidateEntity } from '@/lib/cache/cacheKeys';
import { logActivity } from '@/lib/services/auditLog';
import { formatInventoryItemRow } from '@/lib/utils/formatters';
import { logError } from '@/lib/utils/logError';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'name';

    const query = db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        quantity: inventoryItems.quantity,
        unit: inventoryItems.unit,
        category: inventoryItems.category,
        minStock: inventoryItems.minStock,
        shoppingItemId: inventoryItems.shoppingItemId,
        notes: inventoryItems.notes,
        purchasedAt: inventoryItems.purchasedAt,
        addedById: users.id,
        addedByName: users.name,
        addedByColor: users.color,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
      })
      .from(inventoryItems)
      .leftJoin(users, eq(inventoryItems.addedBy, users.id))
      .orderBy(
        sort === 'category'
          ? sql`${inventoryItems.category} ASC NULLS FIRST, ${inventoryItems.name} ASC`
          : sort === 'stock'
          ? sql`${inventoryItems.quantity} ASC, ${inventoryItems.name} ASC`
          : sql`${inventoryItems.name} ASC`
      );

    const conditions = [];
    if (category) conditions.push(eq(inventoryItems.category, category));

    const results = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return NextResponse.json({ items: results.map(formatInventoryItemRow) });
  } catch (error) {
    logError('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: [{ message: 'name is required' }] },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        name: body.name,
        quantity: body.quantity ?? '0',
        unit: body.unit || null,
        category: body.category || null,
        minStock: body.minStock ?? '0',
        shoppingItemId: body.shoppingItemId || null,
        addedBy: auth.userId,
        notes: body.notes || null,
        purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
      })
      .returning();

    if (!newItem) {
      return NextResponse.json(
        { error: 'Failed to create inventory item' },
        { status: 500 }
      );
    }

    await invalidateEntity('inventory');

    logActivity({
      userId: auth.userId,
      action: 'create',
      entityType: 'inventory_item',
      entityId: newItem.id,
      summary: `Added stock: ${newItem.name} (${newItem.quantity} ${newItem.unit || ''})`,
    });

    return NextResponse.json({ ...newItem, quantity: String(newItem.quantity), minStock: String(newItem.minStock) }, { status: 201 });
  } catch (error) {
    logError('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
