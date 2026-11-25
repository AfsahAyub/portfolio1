
import { NextResponse, connection } from "next/server";
import { sql } from "../../../../../../lib/db";
import { isAuthenticated } from "../../../../../../lib/auth";

// Get information inside a section
export async function GET(request, { params }) {
  try {
    await connection();

    const { id } = await params;
    const sectionId = Number(id);

    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    const items = await sql`
      SELECT id, section_id, content, position
      FROM section_items
      WHERE section_id = ${sectionId}
      ORDER BY position, id
    `;

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Information load nahi hui" },
      { status: 500 }
    );
  }
}

// Add information
export async function POST(request, { params }) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectionId = Number(id);
    const body = await request.json();
    const name = body.name?.trim();

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      !name
    ) {
      return NextResponse.json(
        { error: "Valid information required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO section_items (section_id, content, position)
      VALUES (
        ${sectionId},
        ${JSON.stringify({ name })}::jsonb,
        (
          SELECT COALESCE(MAX(position), 0) + 1
          FROM section_items
          WHERE section_id = ${sectionId}
        )
      )
      RETURNING id, section_id, content, position
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("ADD ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Information add nahi hui" },
      { status: 500 }
    );
  }
}

// Edit existing information
export async function PATCH(request, { params }) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectionId = Number(id);
    const body = await request.json();

    // Frontend sends id; also accept itemId
    const itemId = Number(body.id ?? body.itemId);
    const name = body.name?.trim();

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      !Number.isSafeInteger(itemId) ||
      itemId <= 0 ||
      !name
    ) {
      return NextResponse.json(
        { error: "Valid information required" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE section_items
      SET content = jsonb_set(
        COALESCE(content, '{}'::jsonb),
        '{name}',
        to_jsonb(${name}::text),
        true
      )
      WHERE id = ${itemId}
        AND section_id = ${sectionId}
      RETURNING id, section_id, content, position
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("EDIT ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Information edit nahi hui" },
      { status: 500 }
    );
  }
}

// Delete information
export async function DELETE(request, { params }) {
  try {
    await connection();

    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sectionId = Number(id);
    const body = await request.json();

    // Accept both id and itemId
    const itemId = Number(body.id ?? body.itemId);

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      !Number.isSafeInteger(itemId) ||
      itemId <= 0
    ) {
      return NextResponse.json(
        { error: "Valid item ID required" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM section_items
      WHERE id = ${itemId}
        AND section_id = ${sectionId}
      RETURNING id
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Information delete nahi hui" },
      { status: 500 }
    );
  }
}
