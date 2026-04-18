import { Router } from "express";
import { db, placesTable, placeImagesTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import {
  CreatePlaceBody,
  UpdatePlaceBody,
  AddPlaceImageBody,
  ListPlacesQueryParams,
  GetPlaceParams,
  UpdatePlaceParams,
  DeletePlaceParams,
  AddPlaceImageParams,
  DeletePlaceImageParams,
} from "@workspace/api-zod";

const router = Router();

async function getPlaceWithImages(id: number) {
  const places = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, id));

  if (places.length === 0) return null;

  const images = await db
    .select()
    .from(placeImagesTable)
    .where(eq(placeImagesTable.placeId, id));

  return { ...places[0], images };
}

router.get("/places", async (req, res) => {
  const parsed = ListPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { city, category, search } = parsed.data;

  const conditions = [];
  if (city) conditions.push(eq(placesTable.city, city));
  if (category) conditions.push(eq(placesTable.category, category));
  if (search) {
    conditions.push(
      sql`(${ilike(placesTable.name, `%${search}%`)} OR ${ilike(placesTable.nameKurdish, `%${search}%`)})`
    );
  }

  const places = await db
    .select()
    .from(placesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(placesTable.createdAt);

  const placeIds = places.map((p) => p.id);
  const images =
    placeIds.length > 0
      ? await db
          .select()
          .from(placeImagesTable)
          .where(sql`${placeImagesTable.placeId} = ANY(${sql.raw(`ARRAY[${placeIds.join(",")}]::integer[]`)})`)
      : [];

  const imagesByPlaceId = images.reduce(
    (acc, img) => {
      if (!acc[img.placeId]) acc[img.placeId] = [];
      acc[img.placeId].push(img);
      return acc;
    },
    {} as Record<number, typeof images>
  );

  const result = places.map((p) => ({
    ...p,
    images: imagesByPlaceId[p.id] || [],
  }));

  res.json(result);
});

router.post("/places", async (req, res) => {
  const parsed = CreatePlaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error });
    return;
  }

  const { imageUrl, ...placeData } = parsed.data;

  const [place] = await db.insert(placesTable).values(placeData).returning();

  let images: typeof placeImagesTable.$inferSelect[] = [];
  if (imageUrl) {
    const [img] = await db
      .insert(placeImagesTable)
      .values({ placeId: place.id, url: imageUrl })
      .returning();
    images = [img];
  }

  res.status(201).json({ ...place, images });
});

router.get("/places/stats/summary", async (req, res) => {
  const allPlaces = await db.select().from(placesTable);

  const byCity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const place of allPlaces) {
    byCity[place.city] = (byCity[place.city] || 0) + 1;
    byCategory[place.category] = (byCategory[place.category] || 0) + 1;
  }

  res.json({
    totalPlaces: allPlaces.length,
    byCity,
    byCategory,
  });
});

router.get("/places/:id", async (req, res) => {
  const parsed = GetPlaceParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const place = await getPlaceWithImages(parsed.data.id);
  if (!place) {
    res.status(404).json({ error: "Place not found" });
    return;
  }

  res.json(place);
});

router.put("/places/:id", async (req, res) => {
  const paramParsed = UpdatePlaceParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdatePlaceBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body", details: bodyParsed.error });
    return;
  }

  const [updated] = await db
    .update(placesTable)
    .set(bodyParsed.data)
    .where(eq(placesTable.id, paramParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Place not found" });
    return;
  }

  const place = await getPlaceWithImages(updated.id);
  res.json(place);
});

router.delete("/places/:id", async (req, res) => {
  const parsed = DeletePlaceParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(placesTable).where(eq(placesTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/places/:id/images", async (req, res) => {
  const paramParsed = AddPlaceImageParams.safeParse(req.params);
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = AddPlaceImageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body", details: bodyParsed.error });
    return;
  }

  const place = await db
    .select()
    .from(placesTable)
    .where(eq(placesTable.id, paramParsed.data.id));
  if (place.length === 0) {
    res.status(404).json({ error: "Place not found" });
    return;
  }

  const [image] = await db
    .insert(placeImagesTable)
    .values({
      placeId: paramParsed.data.id,
      url: bodyParsed.data.url,
      caption: bodyParsed.data.caption ?? null,
    })
    .returning();

  res.status(201).json(image);
});

router.delete("/places/:id/images/:imageId", async (req, res) => {
  const parsed = DeletePlaceImageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db
    .delete(placeImagesTable)
    .where(
      and(
        eq(placeImagesTable.id, parsed.data.imageId),
        eq(placeImagesTable.placeId, parsed.data.id)
      )
    );

  res.status(204).send();
});

export default router;
