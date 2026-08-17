import { nanoid } from "nanoid";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auditLogs, clients, inventoryMovements, inventoryStocks, locations, retailProducts, retailSaleLines, retailSales } from "../../drizzle/schema";
import { inventoryAdjustSchema, organizationScopeSchema, retailProductCreateSchema, retailSaleCreateSchema } from "../../shared/validation";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function requireLocation(db: Awaited<ReturnType<typeof requireDb>>, organizationId: string, locationId: string) {
  const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, locationId), eq(locations.organizationId, organizationId), eq(locations.status, "ACTIVE"))).limit(1);
  if (!location) throw new Error("არჩეული ფილიალი მიუწვდომელია.");
}

export const posRouter = router({
  listInventory: protectedProcedure.input(organizationScopeSchema.extend({ locationId: organizationScopeSchema.shape.organizationId })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    return db.select({ product: retailProducts, stock: inventoryStocks }).from(retailProducts).leftJoin(inventoryStocks, and(eq(inventoryStocks.productId, retailProducts.id), eq(inventoryStocks.locationId, input.locationId))).where(and(eq(retailProducts.organizationId, input.organizationId), eq(retailProducts.status, "ACTIVE"))).orderBy(retailProducts.nameKa);
  }),

  listSales: protectedProcedure.input(organizationScopeSchema.extend({ locationId: organizationScopeSchema.shape.organizationId })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb();
    return db.select().from(retailSales).where(and(eq(retailSales.organizationId, input.organizationId), eq(retailSales.locationId, input.locationId))).orderBy(desc(retailSales.createdAt)).limit(30);
  }),

  createProduct: protectedProcedure.input(retailProductCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "pos:manage");
    const db = await requireDb(); await requireLocation(db, input.organizationId, input.locationId);
    const id = nanoid(21); const stockId = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(retailProducts).values({ id, organizationId: input.organizationId, nameKa: input.nameKa, sku: input.sku || null, retailPriceTetri: input.retailPriceTetri, costTetri: input.costTetri });
      await tx.insert(inventoryStocks).values({ id: stockId, productId: id, locationId: input.locationId, currentQuantity: input.openingQuantity, reorderLevel: input.reorderLevel });
      if (input.openingQuantity > 0) await tx.insert(inventoryMovements).values({ id: nanoid(21), productId: id, locationId: input.locationId, changeQuantity: input.openingQuantity, type: "OPENING", reason: "საწყისი მარაგი", recordedByUserId: ctx.user.id });
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "RETAIL_PRODUCT_CREATED", entityType: "retail_product", entityId: id, afterState: { locationId: input.locationId, nameKa: input.nameKa, openingQuantity: input.openingQuantity, retailPriceTetri: input.retailPriceTetri } });
    });
    return { id };
  }),

  adjustStock: protectedProcedure.input(inventoryAdjustSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "pos:manage");
    const db = await requireDb();
    const [row] = await db.select({ stock: inventoryStocks, product: retailProducts }).from(inventoryStocks).innerJoin(retailProducts, eq(inventoryStocks.productId, retailProducts.id)).where(and(eq(inventoryStocks.productId, input.productId), eq(inventoryStocks.locationId, input.locationId), eq(retailProducts.organizationId, input.organizationId))).limit(1);
    if (!row) throw new Error("ამ ფილიალზე პროდუქტის მარაგი ვერ მოიძებნა.");
    const nextQuantity = row.stock.currentQuantity + input.quantityDelta; if (nextQuantity < 0) throw new Error("მარაგი ნულზე ნაკლები ვერ გახდება.");
    await db.transaction(async tx => { await tx.update(inventoryStocks).set({ currentQuantity: nextQuantity }).where(eq(inventoryStocks.id, row.stock.id)); await tx.insert(inventoryMovements).values({ id: nanoid(21), productId: input.productId, locationId: input.locationId, changeQuantity: input.quantityDelta, type: "ADJUSTMENT", reason: input.reason, recordedByUserId: ctx.user.id }); await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "INVENTORY_ADJUSTED", entityType: "inventory_stock", entityId: row.stock.id, beforeState: { currentQuantity: row.stock.currentQuantity }, afterState: { currentQuantity: nextQuantity, reason: input.reason } }); });
    return { productId: input.productId, currentQuantity: nextQuantity };
  }),

  createSale: protectedProcedure.input(retailSaleCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "pos:manage");
    const db = await requireDb(); await requireLocation(db, input.organizationId, input.locationId);
    if (input.clientId) { const [client] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, input.clientId), eq(clients.organizationId, input.organizationId), eq(clients.status, "ACTIVE"))).limit(1); if (!client) throw new Error("არჩეული კლიენტი მიუწვდომელია."); }
    const productIds = input.lines.map(line => line.productId);
    const products = await db.select().from(retailProducts).where(and(eq(retailProducts.organizationId, input.organizationId), eq(retailProducts.status, "ACTIVE"), inArray(retailProducts.id, productIds)));
    if (products.length !== productIds.length) throw new Error("ერთი ან მეტი პროდუქტი მიუწვდომელია.");
    const stocks = await db.select().from(inventoryStocks).where(and(eq(inventoryStocks.locationId, input.locationId), inArray(inventoryStocks.productId, productIds)));
    if (stocks.length !== productIds.length) throw new Error("არჩეული პროდუქტის ფილიალური მარაგი ვერ მოიძებნა.");
    const productById = new Map(products.map(product => [product.id, product])); const stockByProductId = new Map(stocks.map(stock => [stock.productId, stock]));
    for (const line of input.lines) { const stock = stockByProductId.get(line.productId); if (!stock || stock.currentQuantity < line.quantity) throw new Error("არჩეული რაოდენობა მარაგში აღარ არის."); }
    const saleId = nanoid(21); const subtotalTetri = input.lines.reduce((sum, line) => sum + (productById.get(line.productId)?.retailPriceTetri ?? 0) * line.quantity, 0);
    await db.transaction(async tx => {
      await tx.insert(retailSales).values({ id: saleId, organizationId: input.organizationId, locationId: input.locationId, clientId: input.clientId, subtotalTetri, totalTetri: subtotalTetri, method: input.method, collectedByUserId: ctx.user.id, note: input.note });
      for (const line of input.lines) { const product = productById.get(line.productId)!; const stock = stockByProductId.get(line.productId)!; const lineTotalTetri = product.retailPriceTetri * line.quantity; await tx.insert(retailSaleLines).values({ id: nanoid(21), saleId, productId: product.id, productNameSnapshot: product.nameKa, quantity: line.quantity, unitPriceTetri: product.retailPriceTetri, lineTotalTetri }); await tx.update(inventoryStocks).set({ currentQuantity: stock.currentQuantity - line.quantity }).where(eq(inventoryStocks.id, stock.id)); await tx.insert(inventoryMovements).values({ id: nanoid(21), productId: product.id, locationId: input.locationId, saleId, changeQuantity: -line.quantity, type: "SALE", reason: "POS გაყიდვა", recordedByUserId: ctx.user.id }); }
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "RETAIL_SALE_COMPLETED", entityType: "retail_sale", entityId: saleId, afterState: { locationId: input.locationId, clientId: input.clientId ?? null, totalTetri: subtotalTetri, lineCount: input.lines.length, method: input.method } });
    });
    return { id: saleId, totalTetri: subtotalTetri };
  }),
});
