import { useNavigate } from "react-router-dom";

export default function TopBar({ title, back = true }) {
  const nav = useNavigate();
  return (
    <div className="topbar">
      {back && <button className="topbar-back" onClick={() => nav(-1)}>&#8592; Atrás</button>}
      <h1 className="topbar-title">{title}</h1>
    </div>
  );
}
