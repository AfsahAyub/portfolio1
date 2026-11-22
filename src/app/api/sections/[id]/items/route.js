
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { sql } from "../../../../../../lib/db";

// Get section items
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
      SELECT * FROM section_items
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
    const { id } = await params;
    const sectionId = Number(id);
    const { name } = await request.json();

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      typeof name !== "string" ||
      !name.replace(/<[^>]*>/g, "").trim()
    ) {
      return NextResponse.json(
        { error: "Valid information required" },
        { status: 400 }
      );
    }

    const content = JSON.stringify({ name: name.trim() });

    const result = await sql`
      INSERT INTO section_items (section_id, content)
      VALUES (${sectionId}, ${content}::jsonb)
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("ADD ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Information add nahi hui" },
      { status: 500 }
    );
  }
}

// Edit individual information
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const sectionId = Number(id);
    const { itemId, name } = await request.json();
    const itemNumber = Number(itemId);

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      !Number.isSafeInteger(itemNumber) ||
      itemNumber <= 0 ||
      typeof name !== "string" ||
      !name.replace(/<[^>]*>/g, "").trim()
    ) {
      return NextResponse.json(
        { error: "Valid information required" },
        { status: 400 }
      );
    }

    const content = JSON.stringify({ name: name.trim() });

    const result = await sql`
      UPDATE section_items
      SET content = content || ${content}::jsonb
      WHERE id = ${itemNumber}
      AND section_id = ${sectionId}
      RETURNING *
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Information not found" },
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

// Delete individual information
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const sectionId = Number(id);
    const { itemId } = await request.json();
    const itemNumber = Number(itemId);

    if (
      !Number.isSafeInteger(sectionId) ||
      sectionId <= 0 ||
      !Number.isSafeInteger(itemNumber) ||
      itemNumber <= 0
    ) {
      return NextResponse.json(
        { error: "Valid item ID required" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM section_items
      WHERE id = ${itemNumber}
      AND section_id = ${sectionId}
      RETURNING id
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Information not found" },
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
