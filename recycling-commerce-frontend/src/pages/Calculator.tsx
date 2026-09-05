import { useMemo, useState } from "react";
import {
  Check,
  Droplets,
  Globe2,
  Leaf,
  RotateCcw,
  Shirt,
  TreePine,
  Waves,
  Zap,
} from "lucide-react";

type Unit = "g" | "kg";
type Material = "paper" | "textiles";

const PAPER_PER_TREE_KG = 60;
const PAPER_CO2_PER_KG = 1.2;
const PAPER_ENERGY_PER_KG = 4;
const PAPER_WATER_PER_KG = 18;

const TEXTILE_CO2_PER_KG = 8;
const TEXTILE_ENERGY_PER_KG = 15;
const TEXTILE_WATER_PER_KG = 150;
const TEXTILE_MATERIAL_REUSED_FACTOR = 1;

const formatValue = (
  value: number,
  maximumFractionDigits = 3,
): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
  }).format(value);

export default function Calculator() {
  const [material, setMaterial] =
    useState<Material>("paper");
  const [amount, setAmount] = useState("500");
  const [unit, setUnit] = useState<Unit>("g");
  const [calculated, setCalculated] = useState(false);

  const impact = useMemo(() => {
    const numericAmount = Number(amount) || 0;

    const kg =
      unit === "g"
        ? numericAmount / 1000
        : numericAmount;

    if (material === "paper") {
      return {
        kg,
        trees: kg / PAPER_PER_TREE_KG,
        co2: kg * PAPER_CO2_PER_KG,
        energy: kg * PAPER_ENERGY_PER_KG,
        water: kg * PAPER_WATER_PER_KG,
        materialReused: kg,
      };
    }

    return {
      kg,
      trees: 0,
      co2: kg * TEXTILE_CO2_PER_KG,
      energy: kg * TEXTILE_ENERGY_PER_KG,
      water: kg * TEXTILE_WATER_PER_KG,
      materialReused:
        kg * TEXTILE_MATERIAL_REUSED_FACTOR,
    };
  }, [amount, unit, material]);

  const calculateImpact = () => {
    if (impact.kg > 0) {
      setCalculated(true);
    }
  };

  const resetCalculator = () => {
    setAmount("");
    setUnit("g");
    setMaterial("paper");
    setCalculated(false);
  };

  const handleMaterialChange = (
    nextMaterial: Material,
  ) => {
    setMaterial(nextMaterial);
    setCalculated(false);
  };

  const handleUnitChange = (nextUnit: Unit) => {
    const current = Number(amount);

    if (!current) {
      setUnit(nextUnit);
      setCalculated(false);
      return;
    }

    if (unit === "g" && nextUnit === "kg") {
      setAmount(String(current / 1000));
    }

    if (unit === "kg" && nextUnit === "g") {
      setAmount(String(current * 1000));
    }

    setUnit(nextUnit);
    setCalculated(false);
  };

  const isPaper = material === "paper";
  const materialName = isPaper ? "paper" : "textiles";

  return (
    <main className="calculator-page">
      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="calculator-hero">
        <div className="calculator-orbit calculator-orbit-one" />
        <div className="calculator-orbit calculator-orbit-two" />

        <div className="calculator-hero-glow" />

        <div className="calculator-globe" aria-hidden="true">
          <Globe2 size={118} strokeWidth={0.8} />
          <Leaf size={39} />
        </div>

        <div className="calculator-hero-inner">
          <span className="calculator-eyebrow">
            <span />
            SMALL ACTIONS. BIGGER TOMORROWS.
          </span>

          <h1>
            Calculate
            <br />
            Your <em>Impact</em>
          </h1>

          <p>
            See how much difference your recycled
            materials can make to the environment.
          </p>
        </div>
      </section>

      {/* =====================================================
          CALCULATOR
          ===================================================== */}
      <section className="calculator-workspace">
        <div className="calculator-workspace-inner">
          <div className="calculator-panel calculator-input-panel">
            <div className="calculator-panel-top">
              <div className="calculator-step-number">01</div>

              <div>
                <span className="calculator-mini-label">
                  MATERIAL
                </span>
                <h2>What did you recycle?</h2>
                <p>
                  Choose a material to see its
                  environmental impact.
                </p>
              </div>
            </div>

            <div className="calculator-materials">
              <button
                type="button"
                className={`calculator-material ${
                  isPaper ? "selected" : ""
                }`}
                aria-pressed={isPaper}
                onClick={() =>
                  handleMaterialChange("paper")
                }
              >
                <span className="calculator-material-icon">
                  <Leaf size={23} />
                </span>

                <span className="calculator-material-copy">
                  <strong>Paper</strong>
                  <small>
                    Newspapers, cardboard and paper
                  </small>
                </span>

                <span className="calculator-selection">
                  {isPaper && <Check size={14} />}
                </span>
              </button>

              <button
                type="button"
                className={`calculator-material ${
                  !isPaper ? "selected" : ""
                }`}
                aria-pressed={!isPaper}
                onClick={() =>
                  handleMaterialChange("textiles")
                }
              >
                <span className="calculator-material-icon">
                  <Shirt size={23} />
                </span>

                <span className="calculator-material-copy">
                  <strong>Textiles</strong>
                  <small>
                    Clothing, fabric and textile materials
                  </small>
                </span>

                <span className="calculator-selection">
                  {!isPaper && <Check size={14} />}
                </span>
              </button>
            </div>

            <div className="calculator-divider" />

            <div className="calculator-panel-top calculator-amount-top">
              <div className="calculator-step-number">02</div>

              <div>
                <span className="calculator-mini-label">
                  AMOUNT
                </span>
                <h2>How much did you recycle?</h2>
                <p>
                  Enter the amount and choose your unit.
                </p>
              </div>
            </div>

            <div className="calculator-amount-box">
              <input
                aria-label={`Amount of ${materialName} recycled`}
                type="number"
                min="0"
                step="0.1"
                value={amount}
                placeholder="0"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setCalculated(false);
                }}
              />

              <div className="calculator-unit-toggle">
                <button
                  type="button"
                  className={unit === "g" ? "active" : ""}
                  onClick={() => handleUnitChange("g")}
                >
                  g
                </button>

                <button
                  type="button"
                  className={unit === "kg" ? "active" : ""}
                  onClick={() => handleUnitChange("kg")}
                >
                  kg
                </button>
              </div>
            </div>

            <p className="calculator-conversion">
              {impact.kg > 0
                ? unit === "g"
                  ? `${formatValue(
                      Number(amount) || 0,
                    )} g = ${formatValue(
                      impact.kg,
                      3,
                    )} kg`
                  : `${formatValue(
                      Number(amount) || 0,
                    )} kg = ${formatValue(
                      impact.kg * 1000,
                      1,
                    )} g`
                : `Enter the amount of ${materialName} you recycled.`}
            </p>

            <button
              type="button"
              className="calculator-primary-button"
              disabled={impact.kg <= 0}
              onClick={calculateImpact}
            >
              {isPaper ? (
                <Leaf size={18} />
              ) : (
                <Shirt size={18} />
              )}

              <span>Calculate my impact</span>

              <span className="calculator-arrow">→</span>
            </button>

            <button
              type="button"
              className="calculator-reset"
              onClick={resetCalculator}
            >
              <RotateCcw size={13} />
              Reset calculator
            </button>
          </div>

          {/* =================================================
              RESULTS
              ================================================= */}
          <div className="calculator-panel calculator-result-panel">
            <div className="calculator-result-heading">
              <div className="calculator-result-symbol">
                {isPaper ? (
                  <Leaf size={26} />
                ) : (
                  <Shirt size={26} />
                )}
              </div>

              <div>
                <span className="calculator-mini-label">
                  YOUR IMPACT
                </span>

                <h2>
                  {calculated && impact.kg > 0
                    ? "Great choice. You're making a difference."
                    : "Ready to calculate"}
                </h2>

                <p>
                  {calculated && impact.kg > 0
                    ? `Estimated impact of recycling ${formatValue(
                        Number(amount) || 0,
                      )} ${unit} of ${materialName}.`
                    : `Enter your recycled ${materialName} amount to see your impact.`}
                </p>
              </div>
            </div>

            <div className="calculator-result-line">
              <span />
              <small>
                {isPaper
                  ? "PAPER RECYCLING"
                  : "TEXTILE RECYCLING"}
              </small>
              <span />
            </div>

            {calculated && impact.kg > 0 ? (
              <>
                <div className="calculator-metrics">
                  {isPaper ? (
                    <>
                      <article className="calculator-metric">
                        <div>
                          <TreePine size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.trees)}
                        </strong>
                        <span>Trees saved</span>
                        <small>
                          1 tree ≈ 60 kg paper
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Leaf size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.co2)} kg
                        </strong>
                        <span>CO₂ avoided</span>
                        <small>
                          Estimated emissions reduction
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Zap size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.energy)} kWh
                        </strong>
                        <span>Energy saved</span>
                        <small>
                          Estimated energy conservation
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Droplets size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.water)} L
                        </strong>
                        <span>Water saved</span>
                        <small>
                          Estimated water conservation
                        </small>
                      </article>
                    </>
                  ) : (
                    <>
                      <article className="calculator-metric">
                        <div>
                          <Shirt size={21} />
                        </div>
                        <strong>
                          {formatValue(
                            impact.materialReused,
                            3,
                          )}{" "}
                          kg
                        </strong>
                        <span>Material reused</span>
                        <small>
                          Kept in circulation
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Leaf size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.co2)} kg
                        </strong>
                        <span>CO₂e avoided</span>
                        <small>
                          Estimated emissions reduction
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Droplets size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.water)} L
                        </strong>
                        <span>Water saved</span>
                        <small>
                          Estimated water conservation
                        </small>
                      </article>

                      <article className="calculator-metric">
                        <div>
                          <Zap size={21} />
                        </div>
                        <strong>
                          {formatValue(impact.energy)} kWh
                        </strong>
                        <span>Energy saved</span>
                        <small>
                          Estimated energy conservation
                        </small>
                      </article>
                    </>
                  )}
                </div>

                <div className="calculator-impact-message">
                  <div className="calculator-impact-icon">
                    {isPaper ? (
                      <TreePine size={27} />
                    ) : (
                      <Shirt size={27} />
                    )}
                  </div>

                  <div>
                    <strong>
                      {isPaper
                        ? `You've helped save ${formatValue(
                            impact.trees,
                          )} trees.`
                        : `You've kept ${formatValue(
                            impact.materialReused,
                            3,
                          )} kg of textiles in circulation.`}
                    </strong>

                    <p>
                      {isPaper
                        ? `Recycling ${formatValue(
                            impact.kg,
                            3,
                          )} kg of paper helps reduce demand for fresh timber and supports healthier forests.`
                        : `Recycling ${formatValue(
                            impact.kg,
                            3,
                          )} kg of textiles helps keep useful materials in circulation and reduces pressure on new resources.`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="calculator-empty">
                <div className="calculator-empty-orbit">
                  {isPaper ? (
                    <Leaf size={43} />
                  ) : (
                    <Shirt size={43} />
                  )}
                </div>

                <h3>Your impact starts here.</h3>

                <p>
                  Choose your recycled {materialName} amount
                  and calculate the environmental
                  difference you are helping create.
                </p>
              </div>
            )}

            <p className="calculator-disclaimer">
              Estimates are based on average illustrative
              impact factors and may vary by material type,
              region, and recycling process.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY RECYCLE
          ===================================================== */}
      <section className="calculator-why">
        <div className="calculator-why-inner">
          <div className="calculator-why-heading">
            <span>
              {isPaper
                ? "WHY RECYCLE PAPER?"
                : "WHY RECYCLE TEXTILES?"}
            </span>

            <h2>
              {isPaper
                ? "Every sheet can make a difference."
                : "Every piece of fabric can make a difference."}
            </h2>

            <p>
              {isPaper
                ? "Recycling paper helps conserve forests, save water and energy, and reduce greenhouse gas emissions."
                : "Recycling textiles helps keep materials in circulation, reduce resource use, and lower environmental pressure."}
            </p>
          </div>

          <div className="calculator-benefits">
            {isPaper ? (
              <>
                <article>
                  <div>
                    <TreePine size={23} />
                  </div>
                  <span>01</span>
                  <h3>Save Trees</h3>
                  <p>
                    Recycling paper reduces demand for new
                    timber, helping protect forests and
                    wildlife.
                  </p>
                </article>

                <article>
                  <div>
                    <Waves size={23} />
                  </div>
                  <span>02</span>
                  <h3>Conserve Resources</h3>
                  <p>
                    Recycled paper can reduce the water and
                    energy needed compared with producing
                    paper from virgin materials.
                  </p>
                </article>

                <article>
                  <div>
                    <Leaf size={23} />
                  </div>
                  <span>03</span>
                  <h3>Reduce Impact</h3>
                  <p>
                    Keeping paper in circulation helps
                    reduce waste and supports a more circular
                    material economy.
                  </p>
                </article>
              </>
            ) : (
              <>
                <article>
                  <div>
                    <Shirt size={23} />
                  </div>
                  <span>01</span>
                  <h3>Keep Materials in Use</h3>
                  <p>
                    Recycling textiles keeps useful fibers
                    and fabrics in circulation instead of
                    treating them as waste.
                  </p>
                </article>

                <article>
                  <div>
                    <Droplets size={23} />
                  </div>
                  <span>02</span>
                  <h3>Conserve Water</h3>
                  <p>
                    Textile production can require
                    significant water resources, so recycling
                    can help reduce pressure on fresh water.
                  </p>
                </article>

                <article>
                  <div>
                    <Zap size={23} />
                  </div>
                  <span>03</span>
                  <h3>Save Energy</h3>
                  <p>
                    Keeping textile materials in circulation
                    can reduce the need for energy-intensive
                    production of new materials.
                  </p>
                </article>
              </>
            )}

            <aside>
              <span className="calculator-quote-mark">“</span>

              <blockquote>
                A cleaner planet
                <br />
                starts with <em>your choices.</em>
              </blockquote>

              <p>
                Recycle today.
                <br />
                Brighter tomorrow.
              </p>

              <Leaf size={74} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
