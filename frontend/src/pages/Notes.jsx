import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/notes.css";

const COLORS = [
  { label: "Blue",   value: "#58a6ff" },
  { label: "Green",  value: "#3fb950" },
  { label: "Red",    value: "#f85149" },
  { label: "Amber",  value: "#d29922" },
  { label: "Purple", value: "#a371f7" },
  { label: "Pink",   value: "#f778ba" },
];

const FONT_SIZES = ["12px","14px","16px","18px","20px","24px","28px","32px","40px"];

const stripHtml = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobilePanelView, setMobilePanelView] = useState("list"); // "list" | "editor"
  const editorRef = useRef(null);
  const saveTimer = useRef(null);

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

  // Sync editor content when active note changes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || "";
      editorRef.current.focus();
    }
  }, [activeId]);

  // Auto-save with debounce
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(), 1500);
  }, [activeId, notes]);

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

  const createNote = async () => {
    try {
      const { data } = await axios.post("/api/notes", { content: "", color: "#58a6ff" }, getAuthHeader());
      setNotes(prev => [data, ...prev]);
      setActiveId(data._id);
      setMobilePanelView("editor");
      setTimeout(() => editorRef.current?.focus(), 50);
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
    try {
      await axios.put(`/api/notes/${activeId}`, { color }, getAuthHeader());
    } catch {}
  };

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    scheduleSave();
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-secondary)" }}><i className="bi bi-arrow-clockwise me-2" />Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="notes-page">
      {/* ── TOP NAV ── */}
      <div className="notes-topbar">
        <button className="notes-back-btn" onClick={() => navigate("/dashboard")}>
          <i className="bi bi-arrow-left me-2" />Dashboard
        </button>
        <div className="notes-topbar-title">
          <i className="bi bi-journal-text me-2" style={{ color: "var(--blue)" }} />
          Notes
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {saving && <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Saving…</span>}
          <button className="notes-new-btn" onClick={createNote}>
            <i className="bi bi-plus-lg me-1" />New Note
          </button>
        </div>
      </div>

      <div className="notes-layout">
        {/* ── LEFT: NOTE LIST ── */}
        <div className={`notes-sidebar ${mobilePanelView === "editor" ? "notes-sidebar--hidden" : ""}`}>
          {notes.length === 0 ? (
            <div className="notes-empty-list">
              <div style={{ fontSize: "2.5rem", marginBottom: "12px", opacity: 0.4 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No notes yet</div>
              <button className="notes-new-btn" style={{ marginTop: "14px" }} onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />Create your first note
              </button>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note._id}
                className={`notes-list-item ${activeId === note._id ? "active" : ""}`}
                onClick={() => { setActiveId(note._id); setMobilePanelView("editor"); }}
                style={{ "--note-accent": note.color }}
              >
                <div className="notes-list-accent" style={{ background: note.color }} />
                <div className="notes-list-body">
                  <div className="notes-list-title">{note.title || "Untitled Note"}</div>
                  <div className="notes-list-preview">
                    {stripHtml(note.content).slice(0, 60) || "No content"}
                  </div>
                  <div className="notes-list-date">{formatTime(note.updatedAt)}</div>
                </div>
                <button className="notes-list-delete" onClick={e => deleteNote(note._id, e)} title="Delete note">
                  <i className="bi bi-trash" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── RIGHT: EDITOR ── */}
        <div className={`notes-editor-panel ${mobilePanelView === "list" ? "notes-editor-panel--hidden" : ""}`}>
          {!activeNote ? (
            <div className="notes-no-selection">
              <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.3 }}>📝</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Select a note or create a new one</div>
              <button className="notes-new-btn" style={{ marginTop: "16px" }} onClick={createNote}>
                <i className="bi bi-plus-lg me-1" />New Note
              </button>
            </div>
          ) : (
            <>
              {/* Mobile back */}
              <button className="notes-mobile-back" onClick={() => { saveNote(); setMobilePanelView("list"); }}>
                <i className="bi bi-arrow-left me-1" />Notes
              </button>

              {/* ── TOOLBAR ── */}
              <div className="notes-toolbar">
                {/* Text style */}
                <div className="toolbar-group">
                  <button className="tb-btn" title="Bold" onClick={() => exec("bold")}><i className="bi bi-type-bold" /></button>
                  <button className="tb-btn" title="Italic" onClick={() => exec("italic")}><i className="bi bi-type-italic" /></button>
                  <button className="tb-btn" title="Underline" onClick={() => exec("underline")}><i className="bi bi-type-underline" /></button>
                  <button className="tb-btn" title="Strikethrough" onClick={() => exec("strikeThrough")}><i className="bi bi-type-strikethrough" /></button>
                </div>

                <div className="toolbar-sep" />

                {/* Heading */}
                <div className="toolbar-group">
                  <select className="tb-select" title="Heading" onChange={e => { exec("formatBlock", e.target.value); e.target.value = ""; }}>
                    <option value="">Style</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="p">Normal</option>
                  </select>
                </div>

                {/* Font size */}
                <div className="toolbar-group">
                  <select className="tb-select" title="Font size" onChange={e => { exec("fontSize", e.target.value); e.target.value = ""; }}>
                    <option value="">Size</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">X-Large</option>
                    <option value="6">XX-Large</option>
                  </select>
                </div>

                <div className="toolbar-sep" />

                {/* Lists */}
                <div className="toolbar-group">
                  <button className="tb-btn" title="Bullet list" onClick={() => exec("insertUnorderedList")}><i className="bi bi-list-ul" /></button>
                  <button className="tb-btn" title="Numbered list" onClick={() => exec("insertOrderedList")}><i className="bi bi-list-ol" /></button>
                </div>

                <div className="toolbar-sep" />

                {/* Align */}
                <div className="toolbar-group">
                  <button className="tb-btn" title="Align left" onClick={() => exec("justifyLeft")}><i className="bi bi-text-left" /></button>
                  <button className="tb-btn" title="Center" onClick={() => exec("justifyCenter")}><i className="bi bi-text-center" /></button>
                  <button className="tb-btn" title="Align right" onClick={() => exec("justifyRight")}><i className="bi bi-text-right" /></button>
                </div>

                <div className="toolbar-sep" />

                {/* Text color */}
                <div className="toolbar-group" style={{ alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Text</span>
                  <input type="color" className="tb-color" title="Text color"
                    defaultValue="#e6edf3"
                    onChange={e => exec("foreColor", e.target.value)} />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>BG</span>
                  <input type="color" className="tb-color" title="Highlight color"
                    defaultValue="#58a6ff"
                    onChange={e => exec("hiliteColor", e.target.value)} />
                </div>

                <div className="toolbar-sep" />

                {/* Note accent color */}
                <div className="toolbar-group" style={{ alignItems: "center", gap: "5px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Label</span>
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => changeColor(c.value)}
                      style={{
                        width: "16px", height: "16px", borderRadius: "50%",
                        background: c.value, border: activeNote.color === c.value ? "2px solid #fff" : "2px solid transparent",
                        cursor: "pointer", padding: 0, flexShrink: 0,
                      }}
                    />
                  ))}
                </div>

                <div className="toolbar-sep" />

                {/* Clear formatting */}
                <button className="tb-btn" title="Clear formatting" onClick={() => exec("removeFormat")}>
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
