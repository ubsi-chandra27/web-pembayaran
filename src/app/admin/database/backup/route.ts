import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const fileStat = await stat(dbPath);
  const file = await readFile(dbPath);
  const timestamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(" ", "-")
    .replace(":", "");

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `attachment; filename="azkia-backup-${timestamp}.db"`,
    },
  });
}
