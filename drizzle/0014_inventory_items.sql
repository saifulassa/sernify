-- 0014_inventory_items.sql
--
-- Adds inventory/stock tracking table. Supports manual entry and
-- import from shopping list (via shopping_item_id FK).
--
-- Idempotent via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  quantity decimal(10,2) DEFAULT '0' NOT NULL,
  unit varchar(50),
  category varchar(50),
  min_stock decimal(10,2) DEFAULT '0' NOT NULL,
  shopping_item_id uuid REFERENCES shopping_items(id) ON DELETE SET NULL,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  purchased_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON inventory_items(category);
CREATE INDEX IF NOT EXISTS inventory_items_shopping_item_idx ON inventory_items(shopping_item_id);
CREATE INDEX IF NOT EXISTS inventory_items_added_by_idx ON inventory_items(added_by);
