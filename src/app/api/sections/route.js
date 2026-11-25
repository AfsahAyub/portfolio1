
import { NextResponse, connection } from "next/server";
import { sql } from "../../../../lib/db";
import { isAuthenticated } from "../../../../lib/auth";

// Get all sections
export async function GET() {
  try {
    await connection();

    const sections = await sql`
      SELECT id, title, position
      FROM sections
      ORDER BY position, id
    `;

    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET SECTIONS ERROR:", error);

    return NextResponse.json(
      { error: "Sections load nahi huay." },
      { status: 500 }
    );
  }
}

// Add section
export async function POST(request) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json(
        { error: "Section title is required." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO sections (title, position)
      VALUES (
        ${title},
        (SELECT COALESCE(MAX(position), 0) + 1 FROM sections)
      )
      RETURNING id, title, position
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("ADD SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section add nahi hua." },
      { status: 500 }
    );
  }
}

// Edit section
export async function PATCH(request) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const title = body.title?.trim();

    if (!Number.isSafeInteger(id) || id <= 0 || !title) {
      return NextResponse.json(
        { error: "Section ID and title are required." },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE sections
      SET title = ${title}
      WHERE id = ${id}
      RETURNING id, title, position
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Section not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("EDIT SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section edit nahi hua." },
      { status: 500 }
    );
  }
}

// Delete section
export async function DELETE(request) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Valid section ID is required." },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM section_items
      WHERE section_id = ${id}
    `;

    const result = await sql`
      DELETE FROM sections
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Section not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SECTION ERROR:", error);

    return NextResponse.json(
      { error: "Section delete nahi hua." },
      { status: 500 }
    );
  }
}
