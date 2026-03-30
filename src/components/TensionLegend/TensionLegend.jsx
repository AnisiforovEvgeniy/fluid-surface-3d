import "./TensionLegend.css"

function TensionLegend() {
  return (
    <div className="tension-legend">
      <div className="tension-legend__title">Натяжение</div>

      <div className="tension-legend__scale" />

      <div className="tension-legend__labels">
        <span>Минимум</span>
        <span>Максимум</span>
      </div>

      <div className="tension-legend__description">
        Цвет показывает <b>интенсивность изменения поверхности</b>.
        <br />
        Холодные оттенки соответствуют плавному изменению функции,
        тёплые — резкому изменению и большей крутизне.
      </div>

      <div className="tension-legend__items">
        <div className="tension-legend__item">
          <span
            className="tension-legend__dot"
            style={{ background: "#19d36b" }}
          />
          Зелёный — слабое изменение
        </div>

        <div className="tension-legend__item">
          <span
            className="tension-legend__dot"
            style={{ background: "#ffd43b" }}
          />
          Жёлтый — средняя интенсивность
        </div>

        <div className="tension-legend__item">
          <span
            className="tension-legend__dot"
            style={{ background: "#ff3b30" }}
          />
          Красный — максимальная крутизна
        </div>
      </div>
    </div>
  );
}

export default TensionLegend