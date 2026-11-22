
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { sql } from "../../../../lib/db";

// All sections
export async function GET() {
  try {
    await connection();

    const sections = await sql`
      SELECT * FROM sections
      ORDER BY position, id
    `;

    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET SECTIONS ERROR:", error);

    return NextResponse.json(
      { error: "Sections load nahi hue" },
      { status: 500 }
    );
  }
}

// Add new section
export async function POST(request) {
  try {
    const { title } = await request.json();

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Section name required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO sections (title, type)
      VALUES (${title.trim()}, 'custom')
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("ADD SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section add nahi hua" },
      { status: 500 }
    );
  }
}

// Edit section name
export async function PATCH(request) {
  try {
    const { id, title } = await request.json();
    const sectionId = Number(id);

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        { error: "Valid section information required" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE sections
      SET title = ${title.trim()}
      WHERE id = ${sectionId}
      RETURNING *
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("EDIT SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section edit nahi hua" },
      { status: 500 }
    );
  }
}

// Delete section
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const sectionId = Number(id);

    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
      return NextResponse.json(
        { error: "Valid section ID required" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM sections
      WHERE id = ${sectionId}
      RETURNING id
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section delete nahi hua" },
      { status: 500 }
    );
  }
}
