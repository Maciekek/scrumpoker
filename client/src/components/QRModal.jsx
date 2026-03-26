import { useTranslation } from "../i18n";

export default function QRModal({ onClose }) {
  const { t } = useTranslation();
  const url = window.location.href;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-card" onClick={(e) => e.stopPropagation()}>
        <button className="qr-close" onClick={onClose}>
          ✕
        </button>
        <p className="qr-title">{t("scanToJoin")}</p>
        <img className="qr-image" src={qrSrc} alt="QR Code" width={500} height={500} />
        <p className="qr-url">{url}</p>
      </div>
    </div>
  );
}
