import { Button, Checkbox, Slider, Collapse, Radio } from "antd";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hook/useStore";
import "./ControlPanel.css";

function ControlPanel() {
  const store = useStore();
  const { settings, camera, formSurface, fluid } = store;

  const handleFormModeChange = (e) => {
    formSurface.setformSurface(e.target.value);
  };

  const handleColorModeChange = (e) => {
    const newValue = e.target.checked ? 1 : 0;
    settings.setColorMode(newValue);
  };

  const handleFluidModeChange = (e) => { 
    fluid.setFluidMode(e.target.checked);
  };

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
      key: "1",
      label: "Общие настройки",
      children: (
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
              value={
                typeof settings.countCell === "number"
                  ? settings.countCell
                  : null
              }
            />
          </div>

          <div className="control-group">
            <label>Размер ячейки: {settings.sizeCell?.toFixed(2)}</label>
            <Slider
              min={0.2}
              max={1.0}
              step={0.01}
              onChange={handleSizeChange}
              value={
                typeof settings.sizeCell === "number" ? settings.sizeCell : null
              }
            />
          </div>

          <div className="control-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", gap: "7px", color: "#ffffff" }}>
              <Checkbox
                style={{ display: "flex" }}
                checked={!!settings.showGrid}
                onChange={(e) => settings.setShowGrid(e.target.checked)}
              />
              Отображать сетку
            </div>
          </div>

          <div className="control-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", gap: "7px", color: "#ffffff" }}>
              <Checkbox
                style={{ display: "flex" }}
                checked={settings.colorMode}
                onChange={handleColorModeChange}
              />
              Режим натяжения
            </div>
          </div>

          <div className="control-group" style={{ marginBottom: "0" }}>
            <div style={{ display: "flex", gap: "7px", color: "#ffffff" }}>
              <Checkbox
                style={{ display: "flex" }}
                checked={!!settings.showAxes}
                onChange={(e) => settings.setShowAxes(e.target.checked)}
              />
              Отображать оси XYZ
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: "Настройки формы поверхности",
      children: (
        <Radio.Group
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
          onChange={handleFormModeChange}
          value={formSurface.formSurface}
          options={[
            { value: 1, label: "x" },
            { value: 2, label: "x²" },
            { value: 3, label: "x³" },
            { value: 4, label: "|x|" },
            { value: 5, label: "√x" },
            { value: 6, label: "1/x" },
            { value: 7, label: "sin(x)" },
          ]}
        />
      ),
    },
    {
      key: "3",
      label: "Настройки жидкости",
      children: (
        <div>
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "7px", color: "#ffffff" }}>
              <Checkbox
                style={{ display: "flex" }}
                checked={fluid.fluidMode}
                onChange={handleFluidModeChange}
              />
              Включить жидкость
            </div>
          </div>

          <div className="control-group">
            <label style={{ color: "#ffffff" }}>Режим жидкости</label>

            <Radio.Group
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                marginTop: "8px",
              }}
              value={fluid.fluidEngine}
              onChange={(e) => fluid.setFluidEngine(e.target.value)}
              options={[
                { value: "simple", label: "Simple — текущая система" },
                { value: "hydra", label: "Hydra — новая вода" },
              ]}
            />
          </div>

          {fluid.fluidEngine === "hydra" && (
            <>
              <div className="control-group">
                <label>
                  Интенсивность потока: {fluid.hydraSpawnRate}
                </label>

                <Slider
                  min={100}
                  max={3000}
                  step={50}
                  value={fluid.hydraSpawnRate}
                  onChange={(value) => fluid.setHydraSpawnRate(value)}
                />
              </div>

              <div className="control-group">
                <label>
                  Время жизни частиц: {fluid.hydraLifetime.toFixed(1)} сек
                </label>

                <Slider
                  min={1}
                  max={12}
                  step={0.5}
                  value={fluid.hydraLifetime}
                  onChange={(value) => fluid.setHydraLifetime(value)}
                />
              </div>

              <div className="control-group">
                <label>
                  Сила гравитации: {fluid.hydraGravity.toFixed(2)}
                </label>

                <Slider
                  min={1}
                  max={25}
                  step={0.1}
                  tooltip={{ open: false }}
                  value={fluid.hydraGravity}
                  onChange={(value) => fluid.setHydraGravity(value)}
                />
              </div>

              <div className="control-group" style={{ marginBottom: "0" }}>
                <label>
                  Прозрачность воды: {fluid.hydraAlpha.toFixed(2)}
                </label>

                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={fluid.hydraAlpha}
                  onChange={(value) => fluid.setHydraAlpha(value)}
                />
              </div>
            </>
          )}
        </div>
      )
    },
    {
      key: "4",
      label: "Настройки камеры",
      children: (
        <div>
          <div className="control-group">
            <label>
              Вращение вокруг оси Y:{" "}
              {Math.round((camera.azimuthCamera * 180) / Math.PI)}°
            </label>
            <Slider
              min={0}
              max={360}
              step={0.5}
              value={
                typeof camera.azimuthCamera === "number"
                  ? ((camera.azimuthCamera * 180) / Math.PI) % 360
                  : 0
              }
              onChange={(degrees) => {
                const radians = (degrees * Math.PI) / 180;
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
              value={
                typeof camera.radiusCamera === "number"
                  ? camera.radiusCamera
                  : null
              }
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="control-panel">
        <h3>Настройки</h3>

        <Collapse ghost items={items} />

        <div
          className="control-group"
          style={{ textAlign: "center", marginBottom: "0" }}
        >
          <Button
            onClick={() => {
              settings.resetValue();
              fluid.reset();
            }}
            color="primary"
            variant="solid"
          >
            Сбросить значения
          </Button>
        </div>
      </div>
    </>
  );
}

export default observer(ControlPanel);
