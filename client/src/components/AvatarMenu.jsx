import { useState, useEffect, useRef } from "react";
import Toggle from "./Toggle";
import { useTranslation } from "../i18n";

export default function AvatarMenu({
  userName,
  isSpectator,
  onChangeName,
  onToggleSpectator,
  onLeave,
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const ref = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = () => {
    if (nameInput.trim()) {
      onChangeName(nameInput.trim());
      setEditing(false);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div
        className="avatar"
        onClick={() => { setOpen((v) => !v); setEditing(false); }}
      >
        {userName ? userName[0] : "?"}
      </div>

      {open && (
        <div className="dropdown">
          {editing ? (
            <div style={{ padding: 4 }}>
              <input
                className="input"
                style={{ marginBottom: 8 }}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                placeholder={t("newName")}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-primary"
                  style={{ padding: 8, fontSize: 13 }}
                  onClick={handleSave}
                >
                  {t("save")}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: 8, fontSize: 13 }}
                  onClick={() => setEditing(false)}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="dropdown-header">{userName}</div>
              <button
                className="menu-item"
                onClick={() => { setNameInput(userName); setEditing(true); }}
              >
                {t("changeName")}
              </button>
              <Toggle
                on={isSpectator}
                label={t("spectator")}
                onClick={onToggleSpectator}
              />
              <button
                className="menu-item menu-item--danger"
                onClick={() => { setOpen(false); onLeave(); }}
              >
                {t("leaveRoom")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
