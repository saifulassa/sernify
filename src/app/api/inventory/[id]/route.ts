import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { inventoryItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { invalidateEntity } from '@/lib/cache/cacheKeys';
import { logActivity } from '@/lib/services/auditLog';
import { logError } from '@/lib/utils/logError';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select({ id: inventoryItems.id, name: inventoryItems.name })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if ('name' in body) updateData.name = body.name;
    if ('quantity' in body) updateData.quantity = String(body.quantity);
    if ('unit' in body) updateData.unit = body.unit || null;
    if ('category' in body) updateData.category = body.category || null;
    if ('minStock' in body) updateData.minStock = String(body.minStock);
    if ('notes' in body) updateData.notes = body.notes || null;

    await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id));

    const [updated] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    await invalidateEntity('inventory');

    logActivity({
      userId: auth.userId,
      action: 'update',
      entityType: 'inventory_item',
      entityId: id,
      summary: `Updated stock: ${existing.name}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logError('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const [existing] = await db
      .select({ id: inventoryItems.id, name: inventoryItems.name })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id));

    await invalidateEntity('inventory');

    logActivity({
      userId: auth.userId,
      action: 'delete',
      entityType: 'inventory_item',
      entityId: id,
      summary: `Removed stock: ${existing.name}`,
    });

    return NextResponse.json({
      message: 'Inventory item deleted successfully',
      deletedItem: { id: existing.id, name: existing.name },
    });
  } catch (error) {
    logError('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
