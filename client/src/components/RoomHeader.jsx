import { useState, useCallback } from "react";
import AvatarMenu from "./AvatarMenu";
import { copyToClipboard } from "../clipboard";
import { useTranslation } from "../i18n";

export default function RoomHeader({
  roomCode,
  userName,
  isAdmin,
  isSpectator,
  onChangeName,
  onToggleAdmin,
  onToggleSpectator,
  onLeave,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopyLink = useCallback(() => {
    copyToClipboard(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, []);

  return (
    <div className="room-header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="room-code">{roomCode}</span>
        <button
          className={`btn-small ${linkCopied ? "link-copied" : ""}`}
          onClick={handleCopyLink}
        >
          {linkCopied ? t("copied") : t("copyLink")}
        </button>
      </div>
      <AvatarMenu
        userName={userName}
        isAdmin={isAdmin}
        isSpectator={isSpectator}
        onChangeName={onChangeName}
        onToggleAdmin={onToggleAdmin}
        onToggleSpectator={onToggleSpectator}
        onLeave={onLeave}
      />
    </div>
  );
}
