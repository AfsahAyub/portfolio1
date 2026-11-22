
import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sections = await sql`
      SELECT id, title
      FROM sections
      ORDER BY id
    `;

    return NextResponse.json({
      success: true,
      message: "NeonDB connected successfully",
      totalSections: sections.length,
      sections,
    });
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}
