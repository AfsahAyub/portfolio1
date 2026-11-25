import { NextResponse, connection } from "next/server";
import { sql } from "../../../../../../lib/db";
import { isAuthenticated } from "../../../../../../lib/auth";

export async function GET(request, { params }) {
  await connection();

  const { id } = await params;

  const items = await sql`
    SELECT id, section_id, content, position
    FROM section_items
    WHERE section_id = ${id}
    ORDER BY position, id
  `;

  return NextResponse.json(items);
}

export async function POST(request, { params }) {
  await connection();

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Please login first." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Item name is required." },
      { status: 400 }
    );
  }

  const result = await sql`
    INSERT INTO section_items (section_id, content, position)
    VALUES (
      ${id},
      ${JSON.stringify({ name })}::jsonb,
      (
        SELECT COALESCE(MAX(position), 0) + 1
        FROM section_items
        WHERE section_id = ${id}
      )
    )
    RETURNING id, section_id, content, position
  `;

  return NextResponse.json(result[0], { status: 201 });
}

export async function PATCH(request, { params }) {
  await connection();

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Please login first." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const itemId = body.id;
  const name = body.name?.trim();

  if (!itemId || !name) {
    return NextResponse.json(
      { error: "Item ID and name are required." },
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
      AND section_id = ${id}
    RETURNING id, section_id, content, position
  `;

  if (!result.length) {
    return NextResponse.json(
      { error: "Item not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(request, { params }) {
  await connection();

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Please login first." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Item ID is required." },
      { status: 400 }
    );
  }

  await sql`
    DELETE FROM section_items
    WHERE id = ${body.id}
      AND section_id = ${id}
  `;

  return NextResponse.json({ success: true });
}