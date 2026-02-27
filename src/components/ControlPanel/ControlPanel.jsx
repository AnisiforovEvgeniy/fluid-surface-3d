import { Button, Checkbox, Slider } from "antd";
import { useControlPanel } from "../../context/controlPanelContext";
import "./ControlPanel.css";

function ControlPanel() {
  const {settings} = useControlPanel();
  
  const handleCountChange = (value) => {
    if (Number.isNaN(value)) return;
    settings.setCountCell(value);
  };

  const handleSizeChange = (value) => {
    if (Number.isNaN(value)) return;
    settings.setSizeCell(value);
  };

  return (
    <div className="control-panel">
      <h3>Параметры сетки</h3>

      <div className="control-group">
        <label>
          Количество ячеек: {settings.countCell}x{settings.countCell}
        </label>
        <Slider
          min={2}
          max={100}
          step={1}
          onChange={handleCountChange}
          value={typeof settings.countCell === "number" ? settings.countCell : null}
        />
      </div>

      <div className="control-group">
        <label>Размер ячейки: {settings.sizeCell?.toFixed(2)}</label>
        <Slider
          min={0.02}
          max={1.0}
          step={0.01}
          onChange={handleSizeChange}
          value={typeof settings.sizeCell === "number" ? settings.sizeCell : null}
        />
      </div>

      <div className="control-group">
        <div style={{ display: "flex", gap: "7px" }}>
          <Checkbox
            style={{ display: "flex" }}
            checked={!!settings.showGrid}
            onChange={(e) => settings.setShowGrid(e.target.checked)}
          />
          Отображать сетку
        </div>
      </div>

      <div className="control-group" style={{textAlign: "center", marginBottom: "0"}}>
        <Button onClick={() => settings.resetValue()} color="primary" variant="solid">
          Сбросить значения
        </Button>
      </div>
    </div>
  );
}

export default ControlPanel;
