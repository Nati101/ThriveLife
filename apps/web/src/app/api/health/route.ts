import { NextResponse } from "next/server";
import {
  FIXTURE_BATTERIES,
  FIXTURE_ALL_ITEMS,
  FIXTURE_INSTRUMENTS,
} from "@thrivelife/shared";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "thrivelife-web",
    timestamp: new Date().toISOString(),
    fixtures: {
      batteries: FIXTURE_BATTERIES.length,
      instruments: FIXTURE_INSTRUMENTS.length,
      items: FIXTURE_ALL_ITEMS.length,
    },
  });
}
