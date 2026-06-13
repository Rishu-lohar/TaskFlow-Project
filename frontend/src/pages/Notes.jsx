import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/notes.css";

const NOTE_COLORS = [
  { label: "Blue",   value: "#58a6ff" },
  { label: "Green",  value: "#3fb950" },
  { label: "Red",    value: "#f85149" },
  { label: "Amber",  value: "#d29922" },
  { label: "Purple", value: "#a371f7" },
  { label: "Pink",   value: "#f778ba" },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

const stripHtml = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobilePanelView, setMobilePanelView] = useState("list");

  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const savedSelRef = useRef(null); // stores saved selection range

  const getAuthHeader = () => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${u.token}` } };
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!u.token) { navigate("/login"); return; }
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await axios.get("/api/notes", getAuthHeader());
      setNotes(data);
      if (data.length > 0) setActiveId(data[0]._id);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const activeNote = notes.find(n => n._id === activeId) || null;

  // Load content into editor when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
      // Enable CSS-based styling (so execCommand generates inline CSS instead of <font> tags)
      document.execCommand("styleWithCSS", false, true);
    }
  }, [activeId]);

  // ── Selection save/restore (critical for color pickers) ──
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelRef.current) {
      editorRef.current?.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelRef.current);
    }
  }, []);

  // ── Auto-save ──
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(), 1500);
  }, [activeId]);

  const saveNote = async () => {
    if (!activeId || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    setSaving(true);
    try {
      const { data } = await axios.put(`/api/notes/${activeId}`, { content }, getAuthHeader());
      setNotes(prev => prev.map(n => n._id === activeId ? { ...n, ...data } : n));
    } catch {}
    setSaving(false);
  };

  // ── CRUD ──
  const createNote = async () => {
    try {
      const { data } = await axios.post("/api/notes", { content: "", color: "#58a6ff" }, getAuthHeader());
      setNotes(prev => [data, ...prev]);
      setActiveId(data._id);
      setMobilePanelView("editor");
      setTimeout(() => {
        editorRef.current?.focus();
        document.execCommand("styleWithCSS", false, true);
      }, 60);
    } catch {}
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notes/${id}`, getAuthHeader());
      const updated = notes.filter(n => n._id !== id);
      setNotes(updated);
      if (activeId === id) {
        setActiveId(updated[0]?._id || null);
        setMobilePanelView("list");
      }
    } catch {}
  };

  const changeColor = async (color) => {
    if (!activeId) return;
    setNotes(prev => prev.map(n => n._id === activeId ? { ...n, color } : n));
    try { await axios.put(`/api/notes/${activeId}`, { color }, getAuthHeader()); } catch {}
  };

  // ── Toolbar commands ──
  const exec = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, value);
    scheduleSave();
  }, [scheduleSave]);

  const applyBlock = useCallback((tag) => {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    scheduleSave();
  }, [scheduleSave]);

  // Apply font size as actual pixels using span wrapping
  const applyFontSize = useCallback((px) => {
    restoreSelection();
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // No selection — use execCommand trick then patch the font element
      document.execCommand("fontSize", false, "7");
      editorRef.current.querySelectorAll("font[size='7']").forEach(el => {
        el.removeAttribute("size");
        el.style.fontSize = px + "px";
      });
    } else {
      const span = document.createElement("span");
      span.style.fontSize = px + "px";
      try {
        range.surroundContents(span);
      } catch {
        // Selection spans multiple elements — fallback
        document.execCommand("fontSize", false, "7");
        editorRef.current.querySelectorAll("font[size='7']").forEach(el => {
          el.removeAttribute("size");
          el.style.fontSize = px + "px";
        });
      }
    }
    scheduleSave();
  }, [restoreSelection, scheduleSave]);

  // Apply text foreground color (requires saved selection)
  const applyForeColor = useCallback((color) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, color);
    scheduleSave();
  }, [restoreSelection, scheduleSave]);

  // Apply text background/highlight color (requires saved selection)
  const applyHiliteColor = useCallback((color) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("hiliteColor", false, color);
    scheduleSave();
  }, [restoreSelection, scheduleSave]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-secondary)" }}><i className="bi bi-arrow-clockwise me-2" />Loading notes…</span>
      </div>
    );
  }

  return (
    <div className="notes-page">
      {/* TOP BAR */}
      <div className="notes-topbar">
        <button className="notes-back-btn" onClick={() => navigate("/dashboard")}>
          <i className="bi bi-arrow-left me-2" />Dashboard
        </button>
        <div className="notes-topbar-title">
          <i className="bi bi-journal-text me-2" style={{ color: "var(--blue)" }} />Notes
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {saving && <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Saving…</span>}
          <button className="notes-new-btn" onClick={createNote}>
            <i className="bi bi-plus-lg me-1" />New Note
          </button>
        </div>
      </div>

      <div className="notes-layout">
        {/* LEFT: NOTE LIST */}
        <div className={`notes-sidebar ${mobilePanelView === "editor" ? "notes-sidebar--hidden" : ""}`}>
          {notes.length === 0 ? (
            <div className="notes-empty-list">
              <div style={{ fontSize: "2.5rem", marginBottom: "12px", opacity: 0.35 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "12px" }}>No notes yet</div>
              <button className="notes-new-btn" onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />Create first note
              </button>
            </div>
          ) : notes.map(note => (
            <div
              key={note._id}
              className={`notes-list-item ${activeId === note._id ? "active" : ""}`}
              onClick={() => { setActiveId(note._id); setMobilePanelView("editor"); }}
              style={{ "--note-accent": note.color }}
            >
              <div className="notes-list-accent" style={{ background: note.color }} />
              <div className="notes-list-body">
                <div className="notes-list-title">{note.title || "Untitled Note"}</div>
                <div className="notes-list-preview">{stripHtml(note.content).slice(0, 55) || "No content"}</div>
                <div className="notes-list-date">{formatTime(note.updatedAt)}</div>
              </div>
              <button className="notes-list-delete" onClick={e => deleteNote(note._id, e)} title="Delete">
                <i className="bi bi-trash" />
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT: EDITOR */}
        <div className={`notes-editor-panel ${mobilePanelView === "list" ? "notes-editor-panel--hidden" : ""}`}>
          {!activeNote ? (
            <div className="notes-no-selection">
              <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.25 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>Select a note or create a new one</div>
              <button className="notes-new-btn" style={{ marginTop: "16px" }} onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />New Note
              </button>
            </div>
          ) : (
            <>
              {/* Mobile back */}
              <button className="notes-mobile-back" onClick={() => { saveNote(); setMobilePanelView("list"); }}>
                <i className="bi bi-chevron-left me-1" />All Notes
              </button>

              {/* ── TOOLBAR ── */}
              <div className="notes-toolbar">

                {/* Bold / Italic / Underline / Strikethrough */}
                <div className="tb-group">
                  <button className="tb-btn" title="Bold (Ctrl+B)" onMouseDown={e => { e.preventDefault(); exec("bold"); }}>
                    <strong>B</strong>
                  </button>
                  <button className="tb-btn tb-italic" title="Italic (Ctrl+I)" onMouseDown={e => { e.preventDefault(); exec("italic"); }}>
                    <em>I</em>
                  </button>
                  <button className="tb-btn tb-underline" title="Underline (Ctrl+U)" onMouseDown={e => { e.preventDefault(); exec("underline"); }}>
                    <u>U</u>
                  </button>
                  <button className="tb-btn" title="Strikethrough" onMouseDown={e => { e.preventDefault(); exec("strikeThrough"); }}>
                    <s>S</s>
                  </button>
                </div>

                <div className="tb-sep" />

                {/* Text style */}
                <select className="tb-select" title="Text style"
                  onChange={e => { if (e.target.value) { applyBlock(e.target.value); e.target.value = ""; } }}>
                  <option value="">Style</option>
                  <option value="p">Normal</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="blockquote">Quote</option>
                  <option value="pre">Code block</option>
                </select>

                {/* Font size — numeric px values */}
                <select className="tb-select" title="Font size"
                  onMouseDown={saveSelection}
                  onChange={e => { if (e.target.value) { applyFontSize(Number(e.target.value)); e.target.value = ""; } }}>
                  <option value="">Size</option>
                  {FONT_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className="tb-sep" />

                {/* Lists */}
                <div className="tb-group">
                  <button className="tb-btn" title="Bullet list" onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }}>
                    <i className="bi bi-list-ul" />
                  </button>
                  <button className="tb-btn" title="Numbered list" onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }}>
                    <i className="bi bi-list-ol" />
                  </button>
                </div>

                <div className="tb-sep" />

                {/* Alignment */}
                <div className="tb-group">
                  <button className="tb-btn" title="Align left" onMouseDown={e => { e.preventDefault(); exec("justifyLeft"); }}>
                    <i className="bi bi-text-left" />
                  </button>
                  <button className="tb-btn" title="Center" onMouseDown={e => { e.preventDefault(); exec("justifyCenter"); }}>
                    <i className="bi bi-text-center" />
                  </button>
                  <button className="tb-btn" title="Align right" onMouseDown={e => { e.preventDefault(); exec("justifyRight"); }}>
                    <i className="bi bi-text-right" />
                  </button>
                </div>

                <div className="tb-sep" />

                {/* Text color — save selection on mousedown so blur doesn't lose it */}
                <div className="tb-group" style={{ alignItems: "center", gap: "6px" }}>
                  <div className="tb-color-wrap" title="Text color (select text first)">
                    <span className="tb-color-label">A</span>
                    <input type="color" className="tb-color-input"
                      defaultValue="#e6edf3"
                      onMouseDown={saveSelection}
                      onChange={e => applyForeColor(e.target.value)} />
                  </div>
                  <div className="tb-color-wrap" title="Highlight color (select text first)">
                    <span className="tb-color-label" style={{ background: "linear-gradient(135deg,#58a6ff,#3fb950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>H</span>
                    <input type="color" className="tb-color-input"
                      defaultValue="#ffeb3b"
                      onMouseDown={saveSelection}
                      onChange={e => applyHiliteColor(e.target.value)} />
                  </div>
                </div>

                <div className="tb-sep" />

                {/* Note accent colors */}
                <div className="tb-group" style={{ alignItems: "center", gap: "4px" }}>
                  {NOTE_COLORS.map(c => (
                    <button key={c.value} title={c.label}
                      onMouseDown={e => { e.preventDefault(); changeColor(c.value); }}
                      className={`tb-dot ${activeNote.color === c.value ? "tb-dot--active" : ""}`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>

                <div className="tb-sep" />

                {/* Clear formatting */}
                <button className="tb-btn" title="Clear all formatting"
                  onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }}>
                  <i className="bi bi-eraser" />
                </button>
              </div>

              {/* ── EDITOR AREA ── */}
              <div
                ref={editorRef}
                className="notes-editor"
                contentEditable
                suppressContentEditableWarning
                onInput={scheduleSave}
                onBlur={saveSelection}
                data-placeholder="Start writing your note…"
                style={{ "--accent": activeNote.color }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;
