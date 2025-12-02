import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "queue.json");

export async function GET() {
  const raw = await fs.readFile(filePath, "utf8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  const body = await req.json();

  const raw = await fs.readFile(filePath, "utf8");
  const json = JSON.parse(raw);

  json.tickets.push(body);

  await fs.writeFile(filePath, JSON.stringify(json, null, 2));

  return NextResponse.json({ success: true });
}
