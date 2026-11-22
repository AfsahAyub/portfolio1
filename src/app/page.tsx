
import { Suspense } from "react";
import { connection } from "next/server";
import { sql } from "../../lib/db";
import PortfolioView from "../components/PortfolioView";

async function PortfolioData() {
  await connection();

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
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B1026] text-[#E9C99B]">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#E9C99B] border-t-transparent" />
            <h1 className="font-serif text-3xl font-bold">
              Afsah Ayub
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Loading portfolio...
            </p>
          </div>
        </div>
      }
    >
      <PortfolioData />
    </Suspense>
  );
}
