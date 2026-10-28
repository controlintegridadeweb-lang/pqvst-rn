import { connection } from "next/server";
import { readPublicDashboard } from "@/infrastructure/publication/public-dashboard";

export async function GET() {
  await connection();
  const model = await readPublicDashboard();
  return Response.json(model, {
    headers: { "cache-control": "no-store" },
  });
}
