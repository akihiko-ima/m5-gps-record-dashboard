import { isTrackError } from "@/lib/errors";
import { getTrackService } from "@/server/track-service";

export async function GET(_request: Request, ctx: RouteContext<"/api/tracks/[id]/geojson">) {
  const { id } = await ctx.params;
  try {
    const body = getTrackService().getTrackGeoJson(id);
    return new Response(body, {
      headers: { "Content-Type": "application/geo+json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (isTrackError(e) && e.code === "NOT_FOUND") {
      return Response.json({ message: e.message }, { status: 404 });
    }
    throw e;
  }
}
