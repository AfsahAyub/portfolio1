
"use client";

import { useState } from "react";

export default function EditableSection({
  section,
  items: initialItems,
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = `/api/sections/${section.id}/items`;

  function getText(item) {
    const content = item.content || {};
    return content.name || content.title || "";
  }

  async function save() {
    if (!text.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(apiUrl, {
        method: editingId === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId === "new"
            ? { name: text }
            : { itemId: editingId, name: text }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      if (editingId === "new") {
        setItems((prev) => [...prev, data]);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingId ? data : item
          )
        );
      }

      setEditingId(null);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Ye information delete karni hai?")) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setItems((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => {
          setEditingId("new");
          setText("");
        }}
        className="rounded-lg bg-[#C7797E] px-5 py-3 font-semibold text-white"
      >
        + Add Information
      </button>

      {error && (
        <p className="rounded-lg bg-red-900/40 p-3 text-red-200">
          {error}
        </p>
      )}

      {editingId !== null && (
        <div className="rounded-2xl border border-[#E9C99B]/30 bg-[#26213E] p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-white/20 bg-[#0B1026] p-4 text-white outline-none"
            placeholder="Information likhein..."
          />

          <div className="mt-4 flex gap-3">
            <button
              disabled={busy}
              onClick={save}
              className="rounded-lg bg-[#E9C99B] px-5 py-2 font-semibold text-[#0B1026]"
            >
              Save
            </button>

            <button
              onClick={() => setEditingId(null)}
              className="rounded-lg bg-slate-600 px-5 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#E9C99B]/15 bg-[#26213E] p-6"
          >
            <p className="whitespace-pre-line break-words leading-8 text-[#E5DFE4]">
              {String(getText(item)).replace(/<[^>]*>/g, "")}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setEditingId(item.id);
                  setText(getText(item));
                }}
                className="rounded-lg bg-[#E9C99B]/15 px-4 py-2 text-sm text-[#E9C99B]"
              >
                ✏️ Edit
              </button>

              <button
                disabled={busy}
                onClick={() => remove(item.id)}
                className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300"
              >
                🗑️ Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
