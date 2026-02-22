import { Checkbox, Slider } from 'antd';
import { useLocalStorage } from '../../hook/useLocalStorage';
import './ControlPanel.css';
import { useEffect } from 'react';

function ControlPanel({ 
  countCell: propCountCell, 
  setCountCell: propSetCountCell,
  sizeCell: propSizeCell, 
  setSizeCell: propSetSizeCell,
  showGrid: propShowGrid,
  setShowGrid: propSetShowGrid
}) {
  const [countCell, setCountCell] = useLocalStorage('countCell', propCountCell);
  const [sizeCell, setSizeCell] = useLocalStorage('sizeCell', propSizeCell);
  const [showGrid, setShowGrid] = useLocalStorage('showGrid', propShowGrid);

  useEffect(() => {
    propSetCountCell(countCell);
  }, [countCell, propSetCountCell]);

  useEffect(() => {
    propSetSizeCell(sizeCell);
  }, [sizeCell, propSetSizeCell]);

  useEffect(() => {
    propSetShowGrid(showGrid);
  }, [showGrid, propSetShowGrid]);

  useEffect(() => {
    if (countCell !== propCountCell) {
      setCountCell(propCountCell);
    }
  }, [propCountCell]);

  useEffect(() => {
    if (sizeCell !== propSizeCell) {
      setSizeCell(propSizeCell);
    }
  }, [propSizeCell]);

  useEffect(() => {
    if (showGrid !== propShowGrid) {
      setShowGrid(propShowGrid);
    }
  }, [propShowGrid]);

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
        <label>Количество ячеек: {countCell}x{countCell}</label>
        <Slider
          min={2}
          max={100}
          step={1}
          onChange={handleCountChange}
          value={typeof countCell === 'number' ? countCell : propCountCell}
        />
      </div>

      <div className="control-group">
        <label>Размер ячейки: {sizeCell?.toFixed(2)}</label>
        <Slider
          min={0.02}
          max={1.0}
          step={0.01}
          onChange={handleSizeChange}
          value={typeof sizeCell === 'number' ? sizeCell : propSizeCell}
        />
      </div>

      <div className="control-group">
        <div style={{display: "flex", gap: "7px"}}>
          <Checkbox 
            style={{display: "flex"}}
            checked={!!showGrid} 
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Отображать сетку
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;