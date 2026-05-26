import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export type PlaceResult = {
  id: string;
  name: string;
  formattedAddress?: string;
  lat: number;
  lng: number;
};

export const searchPlacesForCluster = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { textQuery: string; lat: number; lng: number; radiusMeters?: number }) => {
      if (!data?.textQuery || data.textQuery.length > 200) {
        throw new Error("Invalid textQuery");
      }
      if (
        typeof data.lat !== "number" ||
        typeof data.lng !== "number" ||
        Math.abs(data.lat) > 90 ||
        Math.abs(data.lng) > 180
      ) {
        throw new Error("Invalid coordinates");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<{ places: PlaceResult[] }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    const body = {
      textQuery: data.textQuery,
      maxResultCount: 15,
      locationBias: {
        circle: {
          center: { latitude: data.lat, longitude: data.lng },
          radius: data.radiusMeters ?? 15000,
        },
      },
    };

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
      }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      throw new Error(
        `Places search failed [${res.status}]: ${json?.error?.message ?? "unknown"}`,
      );
    }

    const places: PlaceResult[] = (json.places ?? [])
      .filter((p) => p.location?.latitude && p.location?.longitude)
      .map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "Unnamed",
        formattedAddress: p.formattedAddress,
        lat: p.location!.latitude,
        lng: p.location!.longitude,
      }));

    return { places };
  });
