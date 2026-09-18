import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "doc1", title: "Founders Agreement.pdf", type: "pdf", size: "2.1MB" },
      { id: "doc2", title: "Cap Table.xlsx", type: "spreadsheet", size: "450KB" }
    ],
    meta: { status: 200, message: "Success" }
  });
}
