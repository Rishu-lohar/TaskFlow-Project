import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/notes.css";

// ─── Text color palette ────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: "Default", v: "#e6edf3" },
  { label: "Red",     v: "#f85149" },
  { label: "Orange",  v: "#fb8f44" },
  { label: "Yellow",  v: "#e3b341" },
  { label: "Green",   v: "#3fb950" },
  { label: "Blue",    v: "#58a6ff" },
  { label: "Purple",  v: "#bc8cff" },
  { label: "Pink",    v: "#f778ba" },
];

const stripHtml = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ─── Component ────────────────────────────────────────────────────────────
export default function Notes() {
  const navigate   = useNavigate();
  const editorRef  = useRef(null);
  const saveTimer  = useRef(null);
  const savedRange = useRef(null);    // snapshot of caret / selection
  const colorBtnRef = useRef(null);   // wrapper for outside-click detection

  const [notes,       setNotes]       = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [mobileView,  setMobileView]  = useState("list"); // "list" | "editor"
  const [colorOpen,   setColorOpen]   = useState(false);

  // ── Auth header ──────────────────────────────────────────────────────────
  const auth = () => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${u.token}` } };
  };

  // ── Load notes ───────────────────────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!u.token) { navigate("/login"); return; }
    axios.get("/api/notes", auth())
      .then(({ data }) => {
        setNotes(data);
        if (data.length) setActiveId(data[0]._id);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  const activeNote = notes.find(n => n._id === activeId) ?? null;

  // Sync editor HTML when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
    }
  }, [activeId]);

  // Close color popup on outside click
  useEffect(() => {
    if (!colorOpen) return;
    const handler = (e) => {
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target))
        setColorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorOpen]);

  // ── Selection helpers ────────────────────────────────────────────────────
  // Save the current selection. Called on editor blur and before opening color picker.
  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0)
      savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  // Restore the saved selection back into the editor.
  const restoreRange = useCallback(() => {
    if (!savedRange.current) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const saveNow = async () => {
    if (!activeId || !editorRef.current) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        `/api/notes/${activeId}`,
        { content: editorRef.current.innerHTML },
        auth()
      );
      setNotes(p => p.map(n => n._id === activeId ? { ...n, ...data } : n));
    } catch {}
    setSaving(false);
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const createNote = async () => {
    try {
      const { data } = await axios.post("/api/notes", { content: "" }, auth());
      setNotes(p => [data, ...p]);
      setActiveId(data._id);
      setMobileView("editor");
      setTimeout(() => editorRef.current?.focus(), 80);
    } catch {}
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notes/${id}`, auth());
      const rest = notes.filter(n => n._id !== id);
      setNotes(rest);
      if (activeId === id) { setActiveId(rest[0]?._id ?? null); setMobileView("list"); }
    } catch {}
  };

  // ── Toolbar commands ──────────────────────────────────────────────────────
  //
  // CRITICAL RULES (do NOT change):
  //   1. Every toolbar button uses  onMouseDown + e.preventDefault()
  //      → keeps editor focus and selection alive (browser won't reset caret).
  //   2. NEVER call editorRef.current.focus() inside run() or any toolbar handler
  //      → calling focus() on a contentEditable collapses the selection in Chrome/Edge.
  //
  const run = useCallback((cmd, value = null) => {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, value);
    scheduleSave();
  }, [scheduleSave]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="notes-loading">
      <i className="bi bi-arrow-clockwise me-2" />Loading notes…
    </div>
  );

  return (
    <div className="notes-page">

      {/* ── TOP BAR ── */}
      <div className="notes-topbar">
        <button className="notes-back-btn" onClick={() => navigate("/dashboard")}>
          <i className="bi bi-arrow-left me-2" />Dashboard
        </button>

        <div className="notes-topbar-title">
          <i className="bi bi-journal-text me-2" style={{ color: "var(--blue)" }} />
          Notes
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {saving && <span className="notes-saving-badge">Saving…</span>}
          <button className="notes-new-btn" onClick={createNote}>
            <i className="bi bi-plus-lg me-1" />New Note
          </button>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className="notes-layout">

        {/* ── SIDEBAR ── */}
        <div className={`notes-sidebar ${mobileView === "editor" ? "notes-sidebar--hidden" : ""}`}>
          {notes.length === 0 ? (
            <div className="notes-empty">
              <div className="notes-empty-icon">📝</div>
              <p>No notes yet</p>
              <button className="notes-new-btn" onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />Create first note
              </button>
            </div>
          ) : notes.map(note => (
            <div key={note._id}
              className={`notes-list-item ${activeId === note._id ? "active" : ""}`}
              onClick={() => { setActiveId(note._id); setMobileView("editor"); }}>
              <div className="notes-list-body">
                <div className="notes-list-title">{note.title || "Untitled Note"}</div>
                <div className="notes-list-preview">{stripHtml(note.content).slice(0, 60) || "No content"}</div>
                <div className="notes-list-date">{fmtTime(note.updatedAt)}</div>
              </div>
              <button className="notes-list-del" title="Delete" onClick={e => deleteNote(note._id, e)}>
                <i className="bi bi-trash" />
              </button>
            </div>
          ))}
        </div>

        {/* ── EDITOR PANEL ── */}
        <div className={`notes-editor-panel ${mobileView === "list" ? "notes-editor-panel--hidden" : ""}`}>
          {!activeNote ? (
            <div className="notes-no-sel">
              <div className="notes-empty-icon">📝</div>
              <p>Select a note or create a new one</p>
              <button className="notes-new-btn" onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />New Note
              </button>
            </div>
          ) : (<>

            {/* Mobile back */}
            <button className="notes-mobile-back" onClick={() => { saveNow(); setMobileView("list"); }}>
              <i className="bi bi-chevron-left me-1" />All Notes
            </button>

            {/* ── TOOLBAR ── */}
            <div className="notes-toolbar">

              {/* Bold */}
              <button className="tb-btn" title="Bold" onMouseDown={e => { e.preventDefault(); run("bold"); }}>
                <strong>B</strong>
              </button>

              {/* Italic */}
              <button className="tb-btn tb-italic" title="Italic" onMouseDown={e => { e.preventDefault(); run("italic"); }}>
                <em>I</em>
              </button>

              {/* Underline */}
              <button className="tb-btn tb-underline" title="Underline" onMouseDown={e => { e.preventDefault(); run("underline"); }}>
                <span style={{ textDecoration: "underline" }}>U</span>
              </button>

              <span className="tb-sep" />

              {/* Bullet list */}
              <button className="tb-btn" title="Bullet list" onMouseDown={e => { e.preventDefault(); run("insertUnorderedList"); }}>
                <i className="bi bi-list-ul" />
              </button>

              {/* Numbered list */}
              <button className="tb-btn" title="Numbered list" onMouseDown={e => { e.preventDefault(); run("insertOrderedList"); }}>
                <i className="bi bi-list-ol" />
              </button>

              <span className="tb-sep" />

              {/* Text color popup */}
              <div className="tb-color-wrap" ref={colorBtnRef}>
                <button className="tb-btn tb-color-btn" title="Text color"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setColorOpen(p => !p);
                  }}>
                  <i className="bi bi-fonts" />
                  <span className="tb-color-underbar" />
                </button>
                {colorOpen && (
                  <div className="tb-color-popup" onMouseDown={e => e.preventDefault()}>
                    {TEXT_COLORS.map(c => (
                      <button key={c.v} className="tb-swatch" title={c.label}
                        style={{ background: c.v }}
                        onMouseDown={e => {
                          e.preventDefault();
                          restoreRange();
                          run("foreColor", c.v);
                          setColorOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
            {/* ── END TOOLBAR ── */}

            {/* ── CONTENT EDITABLE ── */}
            <div
              ref={editorRef}
              className="notes-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={scheduleSave}
              onBlur={saveRange}
              data-placeholder="Start writing your note…"
            />

          </>)}
        </div>
      </div>
    </div>
  );
}
