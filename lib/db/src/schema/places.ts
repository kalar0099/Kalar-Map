import { pgTable, text, serial, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cityEnum = ["kalar", "kifre", "rizgari"] as const;
export const categoryEnum = [
  "mosque",
  "school",
  "government",
  "hospital",
  "market",
  "university",
  "institute",
  "shop",
  "stadium",
  "park",
  "cemetery",
  "hotel",
  "restaurant",
  "cafe",
  "recreation",
] as const;

export const placesTable = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameKurdish: text("name_kurdish").notNull(),
  city: text("city").notNull().$type<(typeof cityEnum)[number]>(),
  category: text("category").notNull().$type<(typeof categoryEnum)[number]>(),
  description: text("description"),
  phone: text("phone"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placeImagesTable = pgTable("place_images", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id")
    .notNull()
    .references(() => placesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
});

export const insertPlaceSchema = createInsertSchema(placesTable).omit({ id: true, createdAt: true });
export const insertPlaceImageSchema = createInsertSchema(placeImagesTable).omit({ id: true });

export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof placesTable.$inferSelect;
export type InsertPlaceImage = z.infer<typeof insertPlaceImageSchema>;
export type PlaceImage = typeof placeImagesTable.$inferSelect;
