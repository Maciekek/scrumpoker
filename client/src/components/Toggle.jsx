export default function Toggle({ on, label, onClick }) {
  return (
    <div className="menu-toggle" onClick={onClick}>
      <span>{label}</span>
      <div className={`toggle-track ${on ? "toggle-track--on" : "toggle-track--off"}`}>
        <div className={`toggle-knob ${on ? "toggle-knob--on" : "toggle-knob--off"}`} />
      </div>
    </div>
  );
}
