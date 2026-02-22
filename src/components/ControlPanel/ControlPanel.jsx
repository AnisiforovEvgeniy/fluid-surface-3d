import './ControlPanel.css';

function ControlPanel({ 
  countCell, 
  setCountCell, 
  sizeCell, 
  setSizeCell,
  onApply 
}) {
  return (
    <div className="control-panel">
      <h3>Параметры сетки</h3>
      
      <div className="control-group">
        <label htmlFor="countCell">
          Количество ячеек: {countCell}x{countCell}
        </label>
        <input
          type="range"
          id="countCell"
          min="2"
          max="100"
          step="1"
          value={countCell}
          onChange={(e) => setCountCell(parseInt(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label htmlFor="sizeCell">
          Размер ячейки: {sizeCell.toFixed(2)}
        </label>
        <input
          type="range"
          id="sizeCell"
          min="0.02"
          max="1.0"
          step="0.05"
          value={sizeCell}
          onChange={(e) => setSizeCell(parseFloat(e.target.value))}
        />
      </div>

      <button className="apply-btn" onClick={onApply}>
        Применить изменения
      </button>
    </div>
  );
}

export default ControlPanel;