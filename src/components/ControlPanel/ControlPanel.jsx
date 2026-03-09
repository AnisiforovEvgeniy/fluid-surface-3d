import { useEffect, useState } from "react";
import { useControlPanel } from "../../context/controlPanelContext";
import { Button, Checkbox, Slider, Collapse, Radio } from "antd";
import "./ControlPanel.css";



function ControlPanel() {
  const {settings, camera, formSurface} = useControlPanel();
  const [valueFormSurface, setValueFormSurface] = useState(1);

  const onChange = (e) => {
    setValueFormSurface(e.target.value);
  };

  useEffect(()=> {
    formSurface.setformSurface(valueFormSurface)
  }, [valueFormSurface])
  
  const handleCountChange = (value) => {
    if (Number.isNaN(value)) return;
    settings.setCountCell(value);
  };

  const handleSizeChange = (value) => {
    if (Number.isNaN(value)) return;
    settings.setSizeCell(value);
  };

  const handleRadiusCameraChange = (value) => {
    if (Number.isNaN(value)) return;
    camera.setRadiusCamera(value);
  };

  const items = [
    {
      key: '1',
      label: 'Настройки сетки',
      children: 
        <div>
          <div className="control-group">
              <label>
                Количество ячеек: {settings.countCell}x{settings.countCell}
              </label>
              <Slider
                min={2}
                max={150}
                step={1}
                onChange={handleCountChange}
                value={typeof settings.countCell === "number" ? settings.countCell : null}
              />
            </div>

            <div className="control-group">
              <label>Размер ячейки: {settings.sizeCell?.toFixed(2)}</label>
              <Slider
                min={0.2}
                max={1.0}
                step={0.01}
                onChange={handleSizeChange}
                value={typeof settings.sizeCell === "number" ? settings.sizeCell : null}
              />
            </div>

            <div className="control-group" style={{ marginBottom: "0"}}>
              <div style={{ display: "flex", gap: "7px", color: "#ffffff" }}>
                <Checkbox
                  style={{ display: "flex" }}
                  checked={!!settings.showGrid}
                  onChange={(e) => settings.setShowGrid(e.target.checked)}
                />
                Отображать сетку
              </div>
            </div>
        </div>
    },
    {
      key: '2',
      label: 'Настройки формы поверхности',
      children: 
        <Radio.Group
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
          onChange={onChange}
          value={valueFormSurface}
          options={[
            { value: 1, label: 'x' },
            { value: 2, label: 'x²' },
            { value: 3, label: 'x³' },
            { value: 4, label: '|x|' },
            { value: 5, label: '√x' },
            { value: 6, label: '1/x' },
            { value: 7, label: 'sin(x)' },
          ]}
        />
    },
    {
      key: '3',
      label: 'Настройки камеры',
      children: 
        <div>
          <div className="control-group">
          <label>Вращение вокруг оси Y: {Math.round((camera.azimuthCamera * 180) / Math.PI)}°</label>
          <Slider
            min={0}
            max={360}
            step={0.5}
            value={typeof camera.azimuthCamera === "number" 
              ? (camera.azimuthCamera * 180 / Math.PI) % 360 
              : 0}
            onChange={(degrees) => {
              const radians = degrees * Math.PI / 180;
              camera.setAzimuthCamera(radians);
            }}
            tooltip={{ formatter: (val) => `${Math.round(val)}°` }}
          />
        </div>

          <div className="control-group">
            <label>Расстояние камеры</label>
            <Slider
              min={1}
              max={40}
              step={1}
              onChange={handleRadiusCameraChange}
              value={typeof camera.radiusCamera === "number" ? camera.radiusCamera : null}
            />
          </div>
        </div>
    }
  ];

  return (
    <>
      <div className="control-panel">
        <h3>Настройки</h3>

        <Collapse ghost items={items} />

        <div className="control-group" style={{textAlign: "center", marginBottom: "0"}}>
          <Button onClick={() => settings.resetValue()} color="primary" variant="solid">
            Сбросить значения
          </Button>
        </div>
      </div>
    </>
  );
}

export default ControlPanel;
