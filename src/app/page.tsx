import { Suspense } from "react";
import { connection } from "next/server";
import { sql } from "../../lib/db";
import { isAuthenticated } from "../../lib/auth";
import PortfolioView from "../components/PortfolioView";

async function PortfolioData() {
  await connection();

  const isAdmin = await isAuthenticated();

  const sections = await sql`
    SELECT id, title, type, position, is_visible
    FROM sections
    WHERE is_visible = true
    ORDER BY position, id
  `;

  const items = await sql`
    SELECT id, section_id, content, position
    FROM section_items
    ORDER BY position, id
  `;

  return (
    <PortfolioView
      sections={sections as never[]}
      items={items as never[]}
      isAdmin={isAdmin}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PortfolioData />
    </Suspense>
  );
}