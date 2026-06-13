import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/notes.css";

// ── Palette constants ──────────────────────────────────────────────────────
const NOTE_COLORS = [
  { label: "Blue",   v: "#58a6ff" },
  { label: "Green",  v: "#3fb950" },
  { label: "Red",    v: "#f85149" },
  { label: "Amber",  v: "#d29922" },
  { label: "Purple", v: "#a371f7" },
  { label: "Pink",   v: "#f778ba" },
];

const TEXT_COLORS = [
  { label: "White",  v: "#e6edf3" },
  { label: "Red",    v: "#f85149" },
  { label: "Orange", v: "#fb8f44" },
  { label: "Yellow", v: "#e3b341" },
  { label: "Green",  v: "#3fb950" },
  { label: "Blue",   v: "#58a6ff" },
  { label: "Purple", v: "#bc8cff" },
  { label: "Pink",   v: "#f778ba" },
];

const HL_COLORS = [
  { label: "Yellow", v: "#ffe566" },
  { label: "Green",  v: "#b5f5b5" },
  { label: "Blue",   v: "#b5d8ff" },
  { label: "Pink",   v: "#ffb5d5" },
  { label: "Orange", v: "#ffcc88" },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
const stripHtml = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ── Component ──────────────────────────────────────────────────────────────
export default function Notes() {
  const navigate   = useNavigate();
  const editorRef  = useRef(null);
  const saveTimer  = useRef(null);
  const savedRange = useRef(null);   // snapshot of selection

  const [notes,          setNotes]          = useState([]);
  const [activeId,       setActiveId]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [mobileView,     setMobileView]     = useState("list"); // "list" | "editor"

  const auth = () => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${u.token}` } };
  };

  // ── Load ───────────────────────────────────────────────────────────────
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

  // Sync editor HTML when active note switches
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
    }
  }, [activeId]);

  // ── Selection helpers ──────────────────────────────────────────────────
  // Call this ANY time the editor might be about to lose focus
  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0)
      savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  // Call this before applying a format after focus was lost (select onChange, etc.)
  const restoreRange = () => {
    if (!savedRange.current) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
  };

  // ── Save ───────────────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 1500);
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

  // ── CRUD ───────────────────────────────────────────────────────────────
  const createNote = async () => {
    try {
      const { data } = await axios.post("/api/notes", { content: "", color: "#58a6ff" }, auth());
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

  const setLabelColor = async (color) => {
    if (!activeId) return;
    setNotes(p => p.map(n => n._id === activeId ? { ...n, color } : n));
    try { await axios.put(`/api/notes/${activeId}`, { color }, auth()); } catch {}
  };

  // ── Toolbar commands ────────────────────────────────────────────────────
  //
  // CRITICAL RULES:
  //   1. All <button> toolbar handlers use  onMouseDown + e.preventDefault()
  //      → this keeps editor focus + selection intact (no reset!)
  //   2. Do NOT call editorRef.current.focus() inside a button handler —
  //      it collapses the selection in Chrome/Edge.
  //   3. <select> handlers MUST call restoreRange() first because opening a
  //      select always steals focus from the contentEditable.
  //
  const run = (command, value = null) => {
    // No focus() here — focus is kept via e.preventDefault() on the button
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    scheduleSave();
  };

  // Used after a select change (focus was lost → must restore first)
  const runAfterSelect = (command, value = null) => {
    restoreRange();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    scheduleSave();
  };

  const applySize = (px) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // No text selected — use fontSize trick so next typed text gets the size
      document.execCommand("fontSize", false, "7");
      editorRef.current?.querySelectorAll("font[size='7']").forEach(el => {
        el.removeAttribute("size");
        el.style.fontSize = px + "px";
      });
    } else {
      // Wrap selected text in a span with explicit px size
      const span = document.createElement("span");
      span.style.fontSize = px + "px";
      try {
        range.surroundContents(span);
      } catch {
        // Selection crosses element boundaries — fall back to font trick
        document.execCommand("fontSize", false, "7");
        editorRef.current?.querySelectorAll("font[size='7']").forEach(el => {
          el.removeAttribute("size");
          el.style.fontSize = px + "px";
        });
      }
    }
    scheduleSave();
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--text-secondary)" }}><i className="bi bi-arrow-clockwise me-2" />Loading notes…</span>
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
          <i className="bi bi-journal-text me-2" style={{ color: "var(--blue)" }} />Notes
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {saving && <span style={{ color: "var(--text-muted)", fontSize: "0.73rem" }}>Saving…</span>}
          <button className="notes-new-btn" onClick={createNote}>
            <i className="bi bi-plus-lg me-1" />New Note
          </button>
        </div>
      </div>

      <div className="notes-layout">

        {/* ── NOTE LIST ── */}
        <div className={`notes-sidebar ${mobileView === "editor" ? "notes-sidebar--hidden" : ""}`}>
          {notes.length === 0 ? (
            <div className="notes-empty-list">
              <div style={{ fontSize: "2.4rem", marginBottom: "10px", opacity: 0.3 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.86rem", marginBottom: "12px" }}>No notes yet</div>
              <button className="notes-new-btn" onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />Create first note
              </button>
            </div>
          ) : notes.map(note => (
            <div key={note._id}
              className={`notes-list-item ${activeId === note._id ? "active" : ""}`}
              onClick={() => { setActiveId(note._id); setMobileView("editor"); }}
              style={{ "--na": note.color }}>
              <div className="notes-list-bar" style={{ background: note.color }} />
              <div className="notes-list-body">
                <div className="notes-list-title">{note.title || "Untitled Note"}</div>
                <div className="notes-list-preview">{stripHtml(note.content).slice(0, 55) || "No content"}</div>
                <div className="notes-list-date">{fmtTime(note.updatedAt)}</div>
              </div>
              <button className="notes-list-del" onClick={e => deleteNote(note._id, e)} title="Delete">
                <i className="bi bi-trash" />
              </button>
            </div>
          ))}
        </div>

        {/* ── EDITOR PANEL ── */}
        <div className={`notes-editor-panel ${mobileView === "list" ? "notes-editor-panel--hidden" : ""}`}>
          {!activeNote ? (
            <div className="notes-no-sel">
              <div style={{ fontSize: "3rem", marginBottom: "14px", opacity: 0.2 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Select a note or create a new one</div>
              <button className="notes-new-btn" style={{ marginTop: "16px" }} onClick={createNote}>
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

              {/* Bold / Italic / Underline / Strike */}
              <div className="tb-grp">
                <button className="tb-btn" title="Bold"
                  onMouseDown={e => { e.preventDefault(); run("bold"); }}>
                  <b>B</b>
                </button>
                <button className="tb-btn tb-it" title="Italic"
                  onMouseDown={e => { e.preventDefault(); run("italic"); }}>
                  <i>I</i>
                </button>
                <button className="tb-btn tb-un" title="Underline"
                  onMouseDown={e => { e.preventDefault(); run("underline"); }}>
                  <u>U</u>
                </button>
                <button className="tb-btn tb-st" title="Strikethrough"
                  onMouseDown={e => { e.preventDefault(); run("strikeThrough"); }}>
                  <s>S</s>
                </button>
              </div>

              <span className="tb-sep" />

              {/* Style dropdown */}
              <select className="tb-sel" title="Text style"
                onMouseDown={saveRange}
                onChange={e => {
                  if (!e.target.value) return;
                  runAfterSelect("formatBlock", e.target.value);
                  e.target.value = "";
                }}>
                <option value="">Style</option>
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="blockquote">Quote</option>
                <option value="pre">Code</option>
              </select>

              {/* Size dropdown */}
              <select className="tb-sel" title="Font size"
                onMouseDown={saveRange}
                onChange={e => {
                  const px = Number(e.target.value);
                  if (!px) return;
                  applySize(px);
                  e.target.value = "";
                }}>
                <option value="">Size</option>
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <span className="tb-sep" />

              {/* Lists */}
              <div className="tb-grp">
                <button className="tb-btn" title="Bullet list"
                  onMouseDown={e => { e.preventDefault(); run("insertUnorderedList"); }}>
                  <i className="bi bi-list-ul" />
                </button>
                <button className="tb-btn" title="Numbered list"
                  onMouseDown={e => { e.preventDefault(); run("insertOrderedList"); }}>
                  <i className="bi bi-list-ol" />
                </button>
              </div>

              <span className="tb-sep" />

              {/* Alignment */}
              <div className="tb-grp">
                <button className="tb-btn" title="Left"
                  onMouseDown={e => { e.preventDefault(); run("justifyLeft"); }}>
                  <i className="bi bi-text-left" />
                </button>
                <button className="tb-btn" title="Center"
                  onMouseDown={e => { e.preventDefault(); run("justifyCenter"); }}>
                  <i className="bi bi-text-center" />
                </button>
                <button className="tb-btn" title="Right"
                  onMouseDown={e => { e.preventDefault(); run("justifyRight"); }}>
                  <i className="bi bi-text-right" />
                </button>
              </div>

              <span className="tb-sep" />

              {/* Text color swatches */}
              <div className="tb-grp">
                <span className="tb-label">A</span>
                {TEXT_COLORS.map(c => (
                  <button key={c.v} title={`Text color: ${c.label}`}
                    className="tb-swatch"
                    style={{ background: c.v }}
                    onMouseDown={e => { e.preventDefault(); run("foreColor", c.v); }}
                  />
                ))}
              </div>

              <span className="tb-sep" />

              {/* Highlight color swatches */}
              <div className="tb-grp">
                <span className="tb-label">H</span>
                {HL_COLORS.map(c => (
                  <button key={c.v} title={`Highlight: ${c.label}`}
                    className="tb-swatch"
                    style={{ background: c.v }}
                    onMouseDown={e => { e.preventDefault(); run("hiliteColor", c.v); }}
                  />
                ))}
              </div>

              <span className="tb-sep" />

              {/* Note label colors */}
              <div className="tb-grp">
                {NOTE_COLORS.map(c => (
                  <button key={c.v} title={`Label: ${c.label}`}
                    className={`tb-dot ${activeNote.color === c.v ? "on" : ""}`}
                    style={{ background: c.v }}
                    onMouseDown={e => { e.preventDefault(); setLabelColor(c.v); }}
                  />
                ))}
              </div>

              <span className="tb-sep" />

              {/* Clear formatting */}
              <button className="tb-btn" title="Clear all formatting"
                onMouseDown={e => { e.preventDefault(); run("removeFormat"); }}>
                <i className="bi bi-eraser" />
              </button>

            </div>

            {/* ── CONTENT EDITABLE ── */}
            <div
              ref={editorRef}
              className="notes-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={scheduleSave}
              onBlur={saveRange}
              data-placeholder="Start writing your note…"
              style={{ "--accent": activeNote.color }}
            />

          </>)}
        </div>
      </div>
    </div>
  );
}
