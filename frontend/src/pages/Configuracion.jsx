import { useState } from "react";
import TopBar from "../components/TopBar";

export default function Configuracion() {
  const [sound, setSound] = useState(
    () => localStorage.getItem("sound") !== "false"
  );
  const [maxSum, setMaxSum] = useState(
    () => localStorage.getItem("maxSum") || "54"
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("sound", sound);
    localStorage.setItem("maxSum", maxSum);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <TopBar title="Configuración" />
      <div className="content">
        <div className="config-item">
          <span>Sonido</span>
          <div className="toggle-group">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                className={`toggle-btn ${sound === v ? "active" : ""}`}
                onClick={() => setSound(v)}
              >
                {v ? "ON" : "OFF"}
              </button>
            ))}
          </div>
        </div>

        <div className="config-item">
          <span>Máxima Suma</span>
          <input
            type="number"
            className="config-input"
            value={maxSum}
            onChange={(e) => setMaxSum(e.target.value)}
            min={10}
            max={100}
          />
        </div>

        <button className="btn btn-full" onClick={handleSave} style={{ marginTop: "2rem" }}>
          {saved ? "¡Guardado!" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
