import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
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

const TEXT_SIZES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48,
];

const TEXT_STYLES = [
  {
    label: "Normal",
    style: {
      fontSize: "16px",
      fontWeight: "400",
      fontStyle: "normal",
      textDecoration: "none",
      color: "inherit",
      backgroundColor: "transparent",
      fontFamily: "inherit",
      lineHeight: "1.8",
    },
  },
  {
    label: "Title",
    style: {
      fontSize: "32px",
      fontWeight: "700",
      lineHeight: "1.25",
      color: "var(--text-primary)",
    },
  },
  {
    label: "Subtitle",
    style: {
      fontSize: "22px",
      fontWeight: "600",
      lineHeight: "1.35",
      color: "var(--text-secondary)",
    },
  },
  {
    label: "Quote",
    style: {
      fontStyle: "italic",
      color: "var(--text-secondary)",
      borderLeft: "3px solid var(--blue)",
      paddingLeft: "10px",
    },
  },
  {
    label: "Code",
    style: {
      fontFamily: "'SFMono-Regular', Consolas, monospace",
      fontSize: "14px",
      backgroundColor: "var(--bg-input)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      padding: "2px 6px",
      whiteSpace: "pre-wrap",
    },
  },
];

const stripHtml = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ─── Component ────────────────────────────────────────────────────────────
export default function Notes() {
  const navigate   = useNavigate();
  const editorRef  = useRef(null);
  const saveTimer  = useRef(null);
  const savedRange = useRef(null);    // snapshot of caret / selection
  const colorBtnRef = useRef(null);   // wrapper for outside-click detection
  const sizeBtnRef = useRef(null);
  const styleBtnRef = useRef(null);

  const [notes,       setNotes]       = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [mobileView,  setMobileView]  = useState("list"); // "list" | "editor"
  const [colorOpen,   setColorOpen]   = useState(false);
  const [sizeOpen,    setSizeOpen]    = useState(false);
  const [styleOpen,   setStyleOpen]   = useState(false);

  // ── Auth header ──────────────────────────────────────────────────────────
  const auth = useCallback(() => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${u.token}` } };
  }, []);

  // ── Load notes ───────────────────────────────────────────────────────────
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!u.token) { navigate("/login"); return; }
    api.get("/api/notes", auth())
      .then(({ data }) => {
        setNotes(data);
        if (data.length) setActiveId(data[0]._id);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [auth, navigate]);

  const activeNote = notes.find(n => n._id === activeId) ?? null;

  // Sync editor HTML when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
    }
  // Only sync on note switches; syncing after saves rewrites the editor DOM and moves the caret.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Close toolbar popups on outside click
  useEffect(() => {
    if (!colorOpen && !sizeOpen && !styleOpen) return;
    const handler = (e) => {
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target))
        setColorOpen(false);
      if (sizeBtnRef.current && !sizeBtnRef.current.contains(e.target))
        setSizeOpen(false);
      if (styleBtnRef.current && !styleBtnRef.current.contains(e.target))
        setStyleOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorOpen, sizeOpen, styleOpen]);

  // ── Selection helpers ────────────────────────────────────────────────────
  const getEditorRange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return null;
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return null;
    return range;
  }, []);

  const saveRange = useCallback(() => {
    const range = getEditorRange();
    if (range) savedRange.current = range.cloneRange();
  }, [getEditorRange]);

  const restoreRange = useCallback(() => {
    if (!savedRange.current || !editorRef.current) return null;
    if (!editorRef.current.contains(savedRange.current.commonAncestorContainer)) return null;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
    return savedRange.current;
  }, []);

  const getFormattingRange = useCallback(() => {
    const liveRange = getEditorRange();
    if (liveRange) {
      savedRange.current = liveRange.cloneRange();
      return liveRange;
    }
    return restoreRange();
  }, [getEditorRange, restoreRange]);

  useEffect(() => {
    const handler = () => saveRange();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [saveRange]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    if (!activeId || !editorRef.current) return;
    setSaving(true);
    try {
      const { data } = await api.put(
        `/api/notes/${activeId}`,
        { content: editorRef.current.innerHTML },
        auth()
      );
      setNotes(p => p.map(n => n._id === activeId ? { ...n, ...data } : n));
    } catch (error) {
      console.error("Failed to save note", error);
    }
    setSaving(false);
  }, [activeId, auth]);

  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 1500);
  }, [saveNow]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const createNote = async () => {
    try {
      const { data } = await api.post("/api/notes", { content: "" }, auth());
      setNotes(p => [data, ...p]);
      setActiveId(data._id);
      setMobileView("editor");
      setTimeout(() => editorRef.current?.focus(), 80);
    } catch (error) {
      console.error("Failed to create note", error);
    }
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notes/${id}`, auth());
      const rest = notes.filter(n => n._id !== id);
      setNotes(rest);
      if (activeId === id) { setActiveId(rest[0]?._id ?? null); setMobileView("list"); }
    } catch (error) {
      console.error("Failed to delete note", error);
    }
  };

  const selectNote = (id) => {
    if (activeId && activeId !== id) saveNow();
    savedRange.current = null;
    setColorOpen(false);
    setSizeOpen(false);
    setStyleOpen(false);
    setActiveId(id);
    setMobileView("editor");
  };

  // ── Toolbar commands ──────────────────────────────────────────────────────
  //
  // CRITICAL RULES (do NOT change):
  //   1. Every toolbar button uses  onMouseDown + e.preventDefault()
  //      → keeps editor focus and selection alive (browser won't reset caret).
  //   2. NEVER call editorRef.current.focus() inside run() or any toolbar handler
  //      → calling focus() on a contentEditable collapses the selection in Chrome/Edge.
  //
  const saveAfterFormat = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveNow();
  }, [saveNow]);

  const run = useCallback((cmd, value = null) => {
    const range = getFormattingRange();
    if (!range) return;
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, value);
    saveRange();
    saveAfterFormat();
  }, [getFormattingRange, saveAfterFormat, saveRange]);

  const applySpanStyle = useCallback((style) => {
    const range = getFormattingRange();
    const sel = window.getSelection();
    if (!range || range.collapsed || !sel || !editorRef.current) return;

    const span = document.createElement("span");
    Object.assign(span.style, style);
    span.appendChild(range.extractContents());
    range.insertNode(span);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(nextRange);
    savedRange.current = nextRange.cloneRange();
    saveAfterFormat();
  }, [getFormattingRange, saveAfterFormat]);

  const applyCssFormat = useCallback((style) => {
    applySpanStyle(style);
    saveRange();
  }, [applySpanStyle, saveRange]);

  const handleEditorInput = useCallback(() => {
    saveRange();
    scheduleSave();
  }, [saveRange, scheduleSave]);

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
              onClick={() => selectNote(note._id)}>
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

              {/* Text size */}
              <div className="tb-menu-wrap" ref={sizeBtnRef}>
                <button className="tb-btn tb-menu-btn" title="Text size"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setSizeOpen(p => !p);
                    setColorOpen(false);
                    setStyleOpen(false);
                  }}>
                  <i className="bi bi-textarea-t" />
                </button>
                {sizeOpen && (
                  <div className="tb-menu-popup" onMouseDown={e => e.preventDefault()}>
                    {TEXT_SIZES.map(size => (
                      <button key={size} className="tb-menu-item"
                        onMouseDown={e => {
                          e.preventDefault();
                          applyCssFormat({ fontSize: `${size}px` });
                          setSizeOpen(false);
                        }}>
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text style */}
              <div className="tb-menu-wrap" ref={styleBtnRef}>
                <button className="tb-btn tb-menu-btn" title="Text style"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setStyleOpen(p => !p);
                    setColorOpen(false);
                    setSizeOpen(false);
                  }}>
                  <i className="bi bi-type" />
                </button>
                {styleOpen && (
                  <div className="tb-menu-popup" onMouseDown={e => e.preventDefault()}>
                    {TEXT_STYLES.map(textStyle => (
                      <button key={textStyle.label} className="tb-menu-item"
                        onMouseDown={e => {
                          e.preventDefault();
                          applyCssFormat(textStyle.style);
                          setStyleOpen(false);
                        }}>
                        {textStyle.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="tb-sep" />

              {/* Text color popup */}
              <div className="tb-color-wrap" ref={colorBtnRef}>
                <button className="tb-btn tb-color-btn" title="Text color"
                  onMouseDown={e => {
                    e.preventDefault();
                    saveRange();
                    setColorOpen(p => !p);
                    setSizeOpen(false);
                    setStyleOpen(false);
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
              onInput={handleEditorInput}
              onKeyUp={saveRange}
              onMouseUp={saveRange}
              onBlur={saveRange}
              data-placeholder="Start writing your note…"
            />

          </>)}
        </div>
      </div>
    </div>
  );
}
