import {Checkbox, Slider } from 'antd';
import './ControlPanel.css';

function ControlPanel({ countCell, setCountCell, sizeCell, setSizeCell, showGrid, setShowGrid}) {

  const handleCountChange = (value) => {
    if (Number.isNaN(value)) return;
    setCountCell(value);
  };

  const handleSizeChange = (value) => {
    if (Number.isNaN(value)) return;
    setSizeCell(value);
  };


  return (
    <div className="control-panel">
      <h3>Параметры сетки</h3>
      
      <div className="control-group">
        <label htmlFor="countCell">Количество ячеек: {countCell}x{countCell}</label>
        <Slider
          min={2}
          max={100}
          step={1}
          onChange={handleCountChange}
          value={typeof countCell === 'number' ? countCell : 4}
        />
      </div>

      <div className="control-group">
        <label htmlFor="sizeCell">Размер ячейки: {sizeCell.toFixed(2)}</label>
        <Slider
          min={0.02}
          max={1.0}
          step={0.01}
          onChange={handleSizeChange}
          value={typeof sizeCell === 'number' ? sizeCell : 0.2}
        />
      </div>

      <div className="control-group">
        <div style={{display: "flex", gap: "7px"}}>
          <Checkbox style={{display: "flex"}} checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)}/>
          Отображать сетку
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;