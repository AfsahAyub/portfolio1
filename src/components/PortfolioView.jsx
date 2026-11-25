
"use client";

import { useState } from "react";

function cleanText(value) {
  return String(value ?? "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function itemText(content) {
  if (!content || typeof content !== "object") return "";
  if (content.name) return cleanText(content.name);

  return Object.entries(content)
    .filter(([key, value]) =>
      key !== "field" && typeof value === "string"
    )
    .map(([, value]) => cleanText(value))
    .join("\n");
}

function iconFor(title) {
  const name = title.toLowerCase();
  if (name.includes("skill")) return "✦";
  if (name.includes("education")) return "🎓";
  if (name.includes("experience")) return "💼";
  if (name.includes("certificate")) return "🏅";
  if (name.includes("project")) return "🔬";
  if (name.includes("award")) return "🏆";
  return "✧";
}

function EditorBox({
  editing,
  value,
  setValue,
  busy,
  save,
  cancelEdit,
}) {
  return (
    <div
      id="portfolio-editor"
      className="rounded-2xl border border-[#E9C99B]/40 bg-[#302943] p-5"
    >
      <h4 className="mb-4 font-semibold text-[#E9C99B]">
        {editing?.type?.toLowerCase().includes("section")
          ? "Edit Section"
          : "Edit Information"}
      </h4>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        spellCheck={true}
        placeholder="Write your information here..."
        className="w-full rounded-xl border border-white/20 bg-[#0B1026] p-4 text-white outline-none focus:border-[#E9C99B]"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-xl bg-[#E9C99B] px-6 py-3 font-bold text-[#0B1026] disabled:opacity-50"
        >
          {busy ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={cancelEdit}
          className="rounded-xl bg-slate-600 px-6 py-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PortfolioView({
  sections: initialSections = [],
  items: initialItems = [],
  isAdmin = false,
}) {
  const [sections, setSections] = useState(initialSections);
  const [items, setItems] = useState(initialItems);
  const [preview, setPreview] = useState(true);
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const editingEnabled = isAdmin && !preview;

  async function api(url, method = "GET", body) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Server error (${response.status}). Check terminal.`
      );
    }

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function refreshData() {
    const allSections = await api("/api/sections");

    const allItems = await Promise.all(
      allSections.map((section) =>
        api(`/api/sections/${section.id}/items`)
      )
    );

    const updatedItems = allItems.flat();

    setSections(allSections);
    setItems(updatedItems);

    return {
      sections: allSections,
      items: updatedItems,
    };
  }

  function startEdit(type, sectionId, itemId, text = "") {
    setEditing({ type, sectionId, itemId });
    setValue(text);
    setError("");

    setTimeout(() => {
      document.getElementById("portfolio-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  function cancelEdit() {
    setEditing(null);
    setValue("");
  }

  async function save() {
    if (busy || !editingEnabled || !editing) return;

    if (!value.trim()) {
      setError("Please enter information.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { type, sectionId, itemId } = editing;
      const savedValue = value.trim();

      const previousSectionIds = new Set(
        sections.map((section) => String(section.id))
      );

      const previousItemIds = new Set(
        items
          .filter(
            (item) =>
              String(item.section_id) === String(sectionId)
          )
          .map((item) => String(item.id))
      );

      if (type === "addSection") {
        await api("/api/sections", "POST", {
          title: savedValue,
        });
      }

      if (type === "editSection") {
        await api("/api/sections", "PATCH", {
          id: sectionId,
          title: savedValue,
        });
      }

      if (type === "addItem") {
        await api(`/api/sections/${sectionId}/items`, "POST", {
          name: savedValue,
        });
      }

      if (type === "editItem") {
        await api(`/api/sections/${sectionId}/items`, "PATCH", {
          id: itemId,
          name: savedValue,
        });
      }

      const updatedData = await refreshData();

      let targetSectionId = sectionId;
      let targetItemId = itemId;

      if (type === "addSection") {
        const newSection = updatedData.sections.find(
          (section) =>
            !previousSectionIds.has(String(section.id))
        );

        targetSectionId = newSection?.id;
      }

      if (type === "addItem") {
        const newItem = updatedData.items.find(
          (item) =>
            String(item.section_id) === String(sectionId) &&
            !previousItemIds.has(String(item.id))
        );

        targetItemId = newItem?.id;
      }

      cancelEdit();

      setTimeout(() => {
        const target = targetItemId
          ? document.getElementById(`item-${targetItemId}`)
          : targetSectionId
            ? document.getElementById(`section-${targetSectionId}`)
            : document.getElementById("portfolio");

        (target || document.getElementById("portfolio"))
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSection(id) {
    if (!editingEnabled || busy) return;

    if (
      !window.confirm(
        "Poora section aur uski information delete ho jayegi. Continue?"
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api("/api/sections", "DELETE", { id });
      await refreshData();
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(sectionId, itemId) {
    if (!editingEnabled || busy) return;

    if (!window.confirm("Ye information delete karni hai?")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api(`/api/sections/${sectionId}/items`, "DELETE", {
  itemId: itemId,
});

      setItems((previous) =>
        previous.filter((item) => item.id !== itemId)
      );

      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const aboutSection = sections.find(
    (s) => s.title.toLowerCase().trim() === "about me"
  );

  const aboutItems = items.filter(
    (item) => item.section_id === aboutSection?.id
  );

  return (
    <main className="min-h-screen bg-[#0B1026] text-[#F4F0EA]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1026]/95 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a href="#home" className="font-serif text-2xl font-bold">
            AFSAH<span className="text-[#C7797E]">.</span>
          </a>

          <div className="flex flex-wrap gap-5 text-sm text-slate-300">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#portfolio">Portfolio</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setPreview(!preview);
                  cancelEdit();
                }}
                className="rounded-full border border-[#E9C99B]/40 px-5 py-2 text-sm text-[#E9C99B]"
              >
                {preview ? "Enable Editing" : "Visitor Preview"}
              </button>
            )}

            <a
              href={isAdmin ? "/logout" : "/login"}
              className="rounded-full bg-[#E9C99B] px-5 py-2 text-sm font-bold text-[#0B1026]"
            >
              {isAdmin ? "Logout" : "Login"}
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=85')",
          }}
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1026] via-[#0B1026]/95 to-[#26213E]/70" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-28 lg:grid-cols-2">
          <div>
            <p className="mb-6 text-sm uppercase tracking-[0.2em] text-[#E9C99B]">
              Plant Sciences • Research • Innovation
            </p>

            <h1 className="font-serif text-6xl font-bold leading-tight md:text-8xl">
              Afsah
              <span className="block italic text-[#C7797E]">
                Ayub.
              </span>
            </h1>

            <h2 className="mt-7 text-2xl font-semibold">
              PhD Research Scholar
            </h2>

            <p className="mt-3 text-lg text-[#E9C99B]">
              Botany & Plant Biotechnology
            </p>

            <p className="mt-6 max-w-xl leading-8 text-[#DDD6DB]">
              Exploring the science of life through plant
              biotechnology, molecular research, environmental
              studies and sustainable innovation.
            </p>

            <a
              href="#portfolio"
              className="mt-9 inline-block rounded-full bg-gradient-to-r from-[#C7797E] to-[#E9C99B] px-8 py-4 font-bold text-[#0B1026]"
            >
              Explore My Portfolio →
            </a>
          </div>

          <div className="relative rounded-[2.5rem] border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
            <div
              className="flex h-80 items-end rounded-[2rem] bg-cover bg-center p-7"
              style={{
                backgroundImage:
                  "linear-gradient(to top,rgba(11,16,38,0.95),transparent),url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1100&q=85')",
              }}
            >
              <h3 className="font-serif text-3xl font-bold">
                Inspired by Nature.
                <br />
                Driven by Discovery.
              </h3>
            </div>

            <div className="mt-4 rounded-xl bg-[#26213E] p-5">
              <p className="font-serif text-2xl text-[#E9C99B]">
                Research & Innovation
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Plant Sciences • Biotechnology • Environmental Research
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#E9C99B]/15 bg-[#26213E] p-8 md:p-12">
          <p className="text-sm uppercase tracking-widest text-[#C7797E]">
            Discover My Story
          </p>

          <h2 className="mt-4 font-serif text-4xl font-bold">
            Science & Discovery
          </h2>

          <p className="mt-5 max-w-3xl leading-8 text-[#DDD6DB]">
            {aboutItems.length
              ? itemText(aboutItems[0].content)
              : "A passionate researcher in plant sciences and biotechnology."}
          </p>

          <a
            href="#portfolio"
            className="mt-5 inline-block text-sm text-[#E9C99B] underline"
          >
            Explore my detailed information below
          </a>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="bg-[#10142D] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-widest text-[#C7797E]">
              Academic Journey
            </p>

            <h2 className="mt-4 font-serif text-4xl font-bold md:text-5xl">
              My Professional
              <span className="block italic text-[#E9C99B]">
                Portfolio
              </span>
            </h2>
          </div>

          {error && (
            <p className="mb-6 rounded-xl border border-red-400/40 bg-red-900/40 p-4 text-red-200">
              {error}
            </p>
          )}

          {editingEnabled && (
            <div className="mb-8">
              {editing?.type === "addSection" ? (
                <EditorBox
                  editing={editing}
                  value={value}
                  setValue={setValue}
                  busy={busy}
                  save={save}
                  cancelEdit={cancelEdit}
                />
              ) : (
                <button
                  onClick={() =>
                    startEdit("addSection", null, null)
                  }
                  className="rounded-xl bg-[#C7797E] px-6 py-3 font-bold text-white"
                >
                  + Add New Section
                </button>
              )}
            </div>
          )}

          <div className="space-y-10">
            {sections.map((section, index) => {
              const sectionItems = items.filter(
                (item) => item.section_id === section.id
              );

              const isSkills = section.title
                .toLowerCase()
                .includes("skill");

              return (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  className="overflow-hidden rounded-[2rem] border border-[#E9C99B]/15 bg-[#1B1D3B]"
                >
                  {/* SECTION HEADING */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#30243F] to-[#1B1D3B] p-7">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E9C99B]/30 bg-[#E9C99B]/10 text-2xl text-[#E9C99B]">
                        {iconFor(section.title)}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-widest text-[#C7797E]">
                          Chapter {String(index + 1).padStart(2, "0")}
                        </p>

                        <h3 className="mt-1 font-serif text-3xl font-bold">
                          {section.title}
                        </h3>
                      </div>
                    </div>

                    {editingEnabled && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            startEdit("addItem", section.id, null)
                          }
                          className="rounded-lg bg-[#C7797E] px-4 py-2 text-sm font-semibold"
                        >
                          + Add
                        </button>

                        <button
                          onClick={() =>
                            startEdit(
                              "editSection",
                              section.id,
                              null,
                              section.title
                            )
                          }
                          className="rounded-lg bg-[#E9C99B]/20 px-4 py-2 text-sm text-[#E9C99B]"
                        >
                          ✎ Edit
                        </button>

                        <button
                          disabled={busy}
                          onClick={() => deleteSection(section.id)}
                          className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 p-6 md:p-9">
                    {editing?.sectionId === section.id &&
                      editingEnabled &&
                      ["addItem", "editSection"].includes(editing.type) && (
                        <EditorBox
                          editing={editing}
                          value={value}
                          setValue={setValue}
                          busy={busy}
                          save={save}
                          cancelEdit={cancelEdit}
                        />
                      )}

                    <div
                      className={
                        isSkills
                          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                          : "grid gap-5 md:grid-cols-2"
                      }
                    >
                      {sectionItems.map((item, itemIndex) => (
                        <article
                          key={item.id}
                          id={`item-${item.id}`}
                          className="rounded-2xl border border-[#E9C99B]/15 bg-[#26213E] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#C7797E]/50"
                        >
                          {editingEnabled &&
                          editing?.type === "editItem" &&
                          editing.itemId === item.id ? (
                            <EditorBox
                              editing={editing}
                              value={value}
                              setValue={setValue}
                              busy={busy}
                              save={save}
                              cancelEdit={cancelEdit}
                            />
                          ) : (
                            <>
                              <p className="font-serif text-xl text-[#E9C99B]">
                                {String(itemIndex + 1).padStart(2, "0")}
                              </p>

                              <p className="mt-4 whitespace-pre-line break-words leading-8 text-[#E5DFE4]">
                                {itemText(item.content)}
                              </p>

                              {editingEnabled && (
                                <div className="mt-5 flex gap-3 border-t border-white/10 pt-4">
                                  <button
                                    onClick={() =>
                                      startEdit(
                                        "editItem",
                                        section.id,
                                        item.id,
                                        itemText(item.content)
                                      )
                                    }
                                    className="rounded-lg bg-[#E9C99B]/20 px-4 py-2 text-sm text-[#E9C99B]"
                                  >
                                    ✎ Edit
                                  </button>

                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      deleteItem(section.id, item.id)
                                    }
                                    className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </article>
                      ))}
                    </div>

                    {sectionItems.length === 0 && (
                      <p className="text-slate-400">
                        No information added yet.
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="bg-gradient-to-br from-[#36233F] via-[#1B1B37] to-[#0B1026] px-6 py-24 text-center"
      >
        <h2 className="font-serif text-4xl font-bold md:text-5xl">
          Let's Create
          <span className="block italic text-[#C7797E]">
            Something Meaningful.
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-[#DDD6DB]">
          Open to academic collaborations and professional
          research opportunities.
        </p>

        <a
          href="mailto:afsahayub45@gmail.com"
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-[#C7797E] to-[#E9C99B] px-8 py-4 font-bold text-[#0B1026]"
        >
          Send Me an Email →
        </a>
      </section>

      <footer className="border-t border-white/10 p-7 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Afsah Ayub. All rights reserved.
      </footer>
    </main>
  );
}
