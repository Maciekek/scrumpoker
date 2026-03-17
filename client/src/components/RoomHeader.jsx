import { useState, useCallback } from "react";
import AvatarMenu from "./AvatarMenu";
import QRModal from "./QRModal";
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
  const [showQR, setShowQR] = useState(false);
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
        <button className="btn-small" onClick={() => setShowQR(true)}>
          {t("qrCode")}
        </button>
      </div>
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
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
