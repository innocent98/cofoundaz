import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: {
      logo_url: "https://placehold.co/128x128.png",
    },
    meta: null,
  });
}