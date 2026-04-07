import { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [sound, setSound] = useState(true);
  const [maxSum, setMaxSum] = useState('54');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSound(localStorage.getItem('sound') !== 'false');
    setMaxSum(localStorage.getItem('maxSum') || '54');
  }, []);

  function handleSave() {
    localStorage.setItem('sound', String(sound));
    localStorage.setItem('maxSum', maxSum);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-content" style={{ maxWidth: '600px' }}>
      <div className="config-item">
        <span>Sonido</span>
        <div className="toggle-group">
          <button className={`toggle-btn${sound ? ' active' : ''}`} onClick={() => setSound(true)}>ON</button>
          <button className={`toggle-btn${!sound ? ' active' : ''}`} onClick={() => setSound(false)}>OFF</button>
        </div>
      </div>

      <div className="config-item">
        <span>Máxima Suma</span>
        <input type="number" className="config-input" value={maxSum}
          onChange={e => setMaxSum(e.target.value)} min={10} max={100} />
      </div>

      <button className="btn" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
        onClick={handleSave}>
        {saved ? '¡Guardado!' : 'Guardar cambios'}
      </button>
    </div>
  );
}
