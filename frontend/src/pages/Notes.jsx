import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/notes.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_LABEL_COLORS = [
  { label: "Blue",   v: "#58a6ff" },
  { label: "Green",  v: "#3fb950" },
  { label: "Red",    v: "#f85149" },
  { label: "Amber",  v: "#d29922" },
  { label: "Purple", v: "#a371f7" },
  { label: "Pink",   v: "#f778ba" },
];

const TEXT_COLORS = [
  { label: "Default", v: "#e6edf3" },
  { label: "Red",     v: "#f85149" },
  { label: "Orange",  v: "#fb8f44" },
  { label: "Yellow",  v: "#e3b341" },
  { label: "Green",   v: "#3fb950" },
  { label: "Blue",    v: "#58a6ff" },
  { label: "Purple",  v: "#bc8cff" },
  { label: "Pink",    v: "#f778ba" },
  { label: "Black",   v: "#0d1117" },
];

const HL_COLORS = [
  { label: "Yellow", v: "#ffe566" },
  { label: "Green",  v: "#b5f5b5" },
  { label: "Blue",   v: "#b5d8ff" },
  { label: "Pink",   v: "#ffb5d5" },
  { label: "Orange", v: "#ffcc88" },
  { label: "Red",    v: "#ffaaaa" },
  { label: "Purple", v: "#e5ccff" },
];

const FONT_SIZES   = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
const FONT_FAMILIES = ["Poppins", "Inter", "Roboto", "Montserrat"];

const STYLE_OPTIONS = [
  { label: "Normal Text", value: "p" },
  { label: "Title",       value: "h1" },
  { label: "Subtitle",    value: "h2" },
  { label: "Important",   value: "h3" },
  { label: "Callout",     value: "blockquote" },
  { label: "Checklist",   value: "checklist" },
];

const stripHtml = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notes() {
  const navigate    = useNavigate();
  const editorRef   = useRef(null);
  const saveTimer   = useRef(null);
  const savedRange  = useRef(null);   // snapshot of caret/selection

  const textColorBtnRef = useRef(null);
  const hlColorBtnRef   = useRef(null);

  const [notes,         setNotes]         = useState([]);
  const [activeId,      setActiveId]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [mobileView,    setMobileView]    = useState("list"); // "list" | "editor"
  const [colorPicker,   setColorPicker]   = useState(null);  // "text" | "hl" | null

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const auth = () => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${u.token}` } };
  };

  // ─── Load notes ─────────────────────────────────────────────────────────────
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

  // Sync editor when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
    }
  }, [activeId]);

  // Close color picker on outside click
  useEffect(() => {
    if (!colorPicker) return;
    const ref = colorPicker === "text" ? textColorBtnRef : hlColorBtnRef;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setColorPicker(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorPicker]);

  // ─── Selection helpers ───────────────────────────────────────────────────────
  // Save snapshot: call on editor blur (select focus change) or before opening picker
  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0)
      savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  // Restore snapshot + re-focus editor (for select onChange etc.)
  const restoreRange = useCallback(() => {
    if (!savedRange.current) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
  }, []);

  // ─── Save ───────────────────────────────────────────────────────────────────
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

  // ─── CRUD ────────────────────────────────────────────────────────────────────
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

  // ─── Editor commands ─────────────────────────────────────────────────────────
  //
  // RULE 1: All toolbar BUTTONS must use  onMouseDown + e.preventDefault()
  //         → keeps editor focused, selection intact, zero cursor reset.
  // RULE 2: Never call editorRef.current.focus() inside run() — it collapses selection.
  // RULE 3: <select> elements steal focus; use saveRange (onMouseDown) +
  //         restoreRange (in onChange) around them.
  //
  const run = useCallback((command, value = null) => {
    // Focus is preserved by e.preventDefault() on buttons — don't call focus() here.
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    scheduleSave();
  }, [scheduleSave]);

  // After a select-change (focus was lost), restore selection then run command
  const runAfterSelect = useCallback((command, value = null) => {
    restoreRange();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    scheduleSave();
  }, [restoreRange, scheduleSave]);

  // Apply block style — includes special "checklist" case
  const applyStyle = useCallback((value) => {
    if (value === "checklist") {
      restoreRange();
      // Insert a checkbox item at the cursor
      document.execCommand("insertHTML", false,
        '<div class="note-check-item"><input type="checkbox" class="note-check-box" /><span class="note-check-text">\u00A0</span></div>');
      scheduleSave();
      return;
    }
    runAfterSelect("formatBlock", value);
  }, [restoreRange, runAfterSelect, scheduleSave]);

  // Apply font size in real pixels via span wrapping
  const applySize = useCallback((px) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // No selection: font-size trick for future typing
      document.execCommand("fontSize", false, "7");
      editorRef.current?.querySelectorAll("font[size='7']").forEach(el => {
        el.removeAttribute("size");
        el.style.fontSize = px + "px";
      });
    } else {
      const span = document.createElement("span");
      span.style.fontSize = px + "px";
      try {
        range.surroundContents(span);
      } catch {
        document.execCommand("fontSize", false, "7");
        editorRef.current?.querySelectorAll("font[size='7']").forEach(el => {
          el.removeAttribute("size");
          el.style.fontSize = px + "px";
        });
      }
    }
    scheduleSave();
  }, [restoreRange, scheduleSave]);

  // Apply font family via span wrapping
  const applyFont = useCallback((family) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      document.execCommand("fontName", false, family);
      editorRef.current?.querySelectorAll("font[face]").forEach(el => {
        const span = document.createElement("span");
        span.style.fontFamily = el.getAttribute("face");
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode.replaceChild(span, el);
      });
    } else {
      const span = document.createElement("span");
      span.style.fontFamily = family;
      try {
        range.surroundContents(span);
      } catch {
        document.execCommand("fontName", false, family);
      }
    }
    scheduleSave();
  }, [restoreRange, scheduleSave]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--text-secondary)" }}>
        <i className="bi bi-arrow-clockwise me-2" />Loading notes…
      </span>
    </div>
  );

  return (
    <div className="notes-page">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="notes-topbar">
        <button className="notes-back-btn" onClick={() => navigate("/dashboard")}>
          <i className="bi bi-arrow-left me-2" />Dashboard
        </button>

        <div className="notes-topbar-center">
          <i className="bi bi-journal-text" style={{ color: "var(--blue)" }} />
          <span className="notes-topbar-title">Notes</span>
          {/* Note label color (belongs to the note card, not the text) */}
          {activeNote && (
            <div className="notes-label-group">
              {NOTE_LABEL_COLORS.map(c => (
                <button key={c.v} title={`Label: ${c.label}`}
                  className={`notes-label-dot ${activeNote.color === c.v ? "on" : ""}`}
                  style={{ background: c.v }}
                  onClick={() => setLabelColor(c.v)}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {saving && <span className="notes-saving">Saving…</span>}
          <button className="notes-new-btn" onClick={createNote}>
            <i className="bi bi-plus-lg me-1" />New Note
          </button>
        </div>
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────────────── */}
      <div className="notes-layout">

        {/* ── SIDEBAR ── */}
        <div className={`notes-sidebar ${mobileView === "editor" ? "notes-sidebar--hidden" : ""}`}>
          {notes.length === 0 ? (
            <div className="notes-empty-list">
              <div style={{ fontSize: "2.4rem", marginBottom: "10px", opacity: 0.3 }}>📝</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", margin: "0 0 12px" }}>No notes yet</p>
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
                <div className="notes-list-preview">{stripHtml(note.content).slice(0, 60) || "No content"}</div>
                <div className="notes-list-date">{fmtTime(note.updatedAt)}</div>
              </div>
              <button className="notes-list-del" onClick={e => deleteNote(note._id, e)} title="Delete note">
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
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                Select a note or create a new one
              </p>
              <button className="notes-new-btn" style={{ marginTop: "16px" }} onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />New Note
              </button>
            </div>
          ) : (<>

            {/* Mobile back */}
            <button className="notes-mobile-back" onClick={() => { saveNow(); setMobileView("list"); }}>
              <i className="bi bi-chevron-left me-1" />All Notes
            </button>

            {/* ── TOOLBAR ─────────────────────────────────────────── */}
            <div className="notes-toolbar">

              {/* 1. Bold / Italic / Underline / Strikethrough */}
              <div className="tb-grp">
                <button className="tb-btn" title="Bold (Ctrl+B)"
                  onMouseDown={e => { e.preventDefault(); run("bold"); }}>
                  <b>B</b>
                </button>
                <button className="tb-btn tb-i" title="Italic (Ctrl+I)"
                  onMouseDown={e => { e.preventDefault(); run("italic"); }}>
                  <i>I</i>
                </button>
                <button className="tb-btn tb-u" title="Underline (Ctrl+U)"
                  onMouseDown={e => { e.preventDefault(); run("underline"); }}>
                  <u>U</u>
                </button>
                <button className="tb-btn tb-s" title="Strikethrough"
                  onMouseDown={e => { e.preventDefault(); run("strikeThrough"); }}>
                  <s>S</s>
                </button>
              </div>

              <span className="tb-sep" />

              {/* 2. Style (block format) */}
              <select className="tb-sel tb-sel-wide" title="Text style"
                onMouseDown={saveRange}
                onChange={e => {
                  if (!e.target.value) return;
                  applyStyle(e.target.value);
                  e.target.value = "";
                }}>
                <option value="">Style</option>
                {STYLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* 3. Font family */}
              <select className="tb-sel tb-sel-font" title="Font family"
                onMouseDown={saveRange}
                onChange={e => {
                  if (!e.target.value) return;
                  applyFont(e.target.value);
                  e.target.value = "";
                }}>
                <option value="">Font</option>
                {FONT_FAMILIES.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>

              {/* 4. Font size */}
              <select className="tb-sel tb-sel-size" title="Font size"
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

              {/* 5. List controls */}
              <div className="tb-grp">
                <button className="tb-btn" title="Bullet list"
                  onMouseDown={e => { e.preventDefault(); run("insertUnorderedList"); }}>
                  <i className="bi bi-list-ul" />
                </button>
                <button className="tb-btn" title="Numbered list"
                  onMouseDown={e => { e.preventDefault(); run("insertOrderedList"); }}>
                  <i className="bi bi-list-ol" />
                </button>
                <button className="tb-btn" title="Checklist"
                  onMouseDown={e => {
                    e.preventDefault();
                    run("insertHTML",
                      '<div class="note-check-item"><input type="checkbox" class="note-check-box" /><span class="note-check-text">\u00A0</span></div>');
                  }}>
                  <i className="bi bi-check2-square" />
                </button>
              </div>

              <span className="tb-sep" />

              {/* 6. Alignment */}
              <div className="tb-grp">
                <button className="tb-btn" title="Align left"
                  onMouseDown={e => { e.preventDefault(); run("justifyLeft"); }}>
                  <i className="bi bi-text-left" />
                </button>
                <button className="tb-btn" title="Center"
                  onMouseDown={e => { e.preventDefault(); run("justifyCenter"); }}>
                  <i className="bi bi-text-center" />
                </button>
                <button className="tb-btn" title="Align right"
                  onMouseDown={e => { e.preventDefault(); run("justifyRight"); }}>
                  <i className="bi bi-text-right" />
                </button>
              </div>

              <span className="tb-sep" />

              {/* 7. Text color picker */}
              <div className="tb-color-picker" ref={textColorBtnRef}>
                <button className="tb-btn tb-color-trigger" title="Text color"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setColorPicker(p => p === "text" ? null : "text");
                  }}>
                  <span className="tb-color-icon">
                    <i className="bi bi-fonts" />
                    <span className="tb-color-bar" style={{ background: "#e6edf3" }} />
                  </span>
                </button>
                {colorPicker === "text" && (
                  <div className="tb-color-popup" onMouseDown={e => e.preventDefault()}>
                    <div className="tb-color-grid">
                      {TEXT_COLORS.map(c => (
                        <button key={c.v}
                          className="tb-color-swatch"
                          style={{ background: c.v }}
                          title={c.label}
                          onMouseDown={e => {
                            e.preventDefault();
                            run("foreColor", c.v);
                            setColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Highlight picker */}
              <div className="tb-color-picker" ref={hlColorBtnRef}>
                <button className="tb-btn tb-color-trigger" title="Highlight color"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setColorPicker(p => p === "hl" ? null : "hl");
                  }}>
                  <span className="tb-color-icon">
                    <i className="bi bi-highlighter" />
                    <span className="tb-color-bar" style={{ background: "#ffe566" }} />
                  </span>
                </button>
                {colorPicker === "hl" && (
                  <div className="tb-color-popup" onMouseDown={e => e.preventDefault()}>
                    <div className="tb-color-grid">
                      {HL_COLORS.map(c => (
                        <button key={c.v}
                          className="tb-color-swatch"
                          style={{ background: c.v }}
                          title={c.label}
                          onMouseDown={e => {
                            e.preventDefault();
                            run("hiliteColor", c.v);
                            setColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="tb-sep" />

              {/* 9. Clear formatting */}
              <button className="tb-btn" title="Clear all formatting"
                onMouseDown={e => { e.preventDefault(); run("removeFormat"); }}>
                <i className="bi bi-eraser" />
              </button>

            </div>
            {/* ── END TOOLBAR ── */}

            {/* ── EDITOR ── */}
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
