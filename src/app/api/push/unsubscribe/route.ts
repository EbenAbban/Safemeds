import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const UnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Signed-in callers may only drop their own endpoints. Anonymous callers are
  // matched on the endpoint alone — possession of the exact endpoint URL is
  // the only credential such a subscription ever had.
  await prisma.pushSubscription.deleteMany({
    where: userId ? { endpoint: parsed.data.endpoint, userId } : { endpoint: parsed.data.endpoint, userId: null },
  });

  return NextResponse.json({ ok: true });
}
