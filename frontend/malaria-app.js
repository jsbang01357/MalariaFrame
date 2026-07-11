import { assessMalaria, calculateMedicationPlan } from "./malaria-engine.js";

const clinicalForm = document.querySelector("#clinical-form");
const assessButton = document.querySelector("#assess-button");
const clinicianConfirmed = document.querySelector("#clinician-confirmed");
const emptyResult = document.querySelector("#empty-result");
const resultContent = document.querySelector("#result-content");
const resultPanel = document.querySelector("#result-panel");
const calculatorForm = document.querySelector("#medication-calculator-form");
const calculatorOutput = document.querySelector("#calculator-output");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function diagnosisLabel(level) {
  return {
    confirmed: "확인진단",
    presumptive: "추정진단",
    emergency: "응급",
    repeat: "반복검사",
    suspected: "의심",
    low: "재평가",
  }[level] || "판정";
}

function renderList(target, items, emptyText = "추가 확인사항 없음") {
  target.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : `<li class="muted-list-item">${escapeHtml(emptyText)}</li>`;
}

function medicationCards(medications) {
  if (!medications.length) {
    return `
      <div class="no-medication">
        <strong>현재 단계에서 약제 용량을 제시하지 않습니다.</strong>
        <p>진단검사와 중증도 평가를 먼저 완료하세요.</p>
      </div>`;
  }
  return medications
    .map(
      (medication, index) => `
        <article class="medication-card${medication.blocked ? " is-blocked" : ""}">
          <div class="medication-index">${String(index + 1).padStart(2, "0")}</div>
          <div class="medication-body">
            <div class="medication-title-row">
              <span class="medication-role">${escapeHtml(medication.role)}</span>
              ${medication.blocked ? '<span class="hold-badge">보류</span>' : ""}
            </div>
            <h4>${escapeHtml(medication.name)}</h4>
            <p class="regimen">${escapeHtml(medication.regimen)}</p>
            <p class="medication-note">${escapeHtml(medication.note)}</p>
          </div>
        </article>`,
    )
    .join("");
}

function clinicalFormInput() {
  const data = new FormData(clinicalForm);
  return {
    age: data.get("age"),
    weight: data.get("weight"),
    pregnancy: data.get("pregnancy"),
    domesticExposure: data.has("domesticExposure"),
    overseasExposure: data.has("overseasExposure"),
    temperature: data.get("temperature"),
    fever: data.has("fever"),
    cannotTakeOral: data.get("oralStatus") === "impossible",
    rdt: data.get("rdt"),
    smear: data.get("smear"),
    pcr: data.get("pcr"),
    species: data.get("species"),
    parasitemia: data.get("parasitemia"),
    parasiteDensity: data.get("parasiteDensity"),
    gcs: data.get("gcs"),
    seizureCount: data.get("seizureCount"),
    glucose: data.get("glucose"),
    creatinine: data.get("creatinine"),
    bilirubin: data.get("bilirubin"),
    spo2: data.get("spo2"),
    respiratoryRate: data.get("respiratoryRate"),
    sbp: data.get("sbp"),
    severeSigns: data.getAll("severeSigns"),
    g6pd: data.get("g6pd"),
    prophylaxis: data.get("prophylaxis"),
    activeLiverDisease: data.has("activeLiverDisease"),
    qtcRisk: data.has("qtcRisk"),
  };
}

function renderClinicalResult(result) {
  emptyResult.hidden = true;
  resultContent.hidden = false;
  resultPanel.dataset.level = result.diagnosis.level;

  document.querySelector("#diagnosis-level").textContent = diagnosisLabel(result.diagnosis.level);
  document.querySelector("#diagnosis-title").textContent = result.diagnosis.title;
  document.querySelector("#diagnosis-detail").textContent = result.diagnosis.detail;
  document.querySelector("#disposition-text").textContent = result.disposition;
  document.querySelector("#privacy-text").textContent = result.privacy;

  const severeBlock = document.querySelector("#severe-block");
  severeBlock.hidden = result.severe.length === 0;
  if (result.severe.length) renderList(document.querySelector("#severe-list"), result.severe);

  document.querySelector("#medication-list").innerHTML = medicationCards(result.medications);

  const warningBlock = document.querySelector("#warning-block");
  warningBlock.hidden = result.warnings.length === 0;
  if (result.warnings.length) renderList(document.querySelector("#warning-list"), result.warnings);

  if (window.matchMedia("(max-width: 1050px)").matches) {
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function calculatorFormInput() {
  const data = new FormData(calculatorForm);
  return {
    scenario: data.get("scenario"),
    weight: data.get("weight"),
    age: data.get("age"),
    species: data.get("species"),
    pregnancy: data.get("pregnancy"),
    g6pd: data.get("g6pd"),
    prophylaxis: data.get("prophylaxis"),
    activeLiverDisease: data.has("activeLiverDisease"),
    qtcRisk: data.has("qtcRisk"),
    cannotTakeOral: data.has("cannotTakeOral"),
  };
}

function renderCalculatorResult(result) {
  calculatorOutput.hidden = false;
  calculatorOutput.dataset.level = result.diagnosis.level;
  const status = document.querySelector("#calculator-status");
  status.textContent = result.severe.length ? "중증 경로" : "계산 완료";

  document.querySelector("#calculator-summary").innerHTML = `
    <div><span>권고 경로</span><strong>${escapeHtml(result.disposition)}</strong></div>
    <div><span>추천 약제</span><strong>${result.medications.length}개 후보</strong></div>
    <div><span>중증 기준</span><strong>${result.severe.length ? `${result.severe.length}개 충족` : "해당 없음"}</strong></div>`;
  document.querySelector("#calculator-medication-list").innerHTML = medicationCards(result.medications);
  renderList(
    document.querySelector("#calculator-warning-list"),
    result.warnings,
    "입력 조건에서 추가 보류 사항이 확인되지 않았습니다.",
  );

  calculatorOutput.scrollIntoView({ behavior: "smooth", block: "start" });
}

function activateView(viewName, updateHash = true) {
  const available = ["cdss", "calculator", "reference"];
  const next = available.includes(viewName) ? viewName : "cdss";
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== next;
  });
  document.querySelectorAll("[data-view-target]").forEach((control) => {
    control.classList.toggle("is-active", control.dataset.viewTarget === next);
    if (control.matches("button")) {
      control.setAttribute("aria-current", control.dataset.viewTarget === next ? "page" : "false");
    }
  });
  if (updateHash && window.location.hash !== `#${next}`) {
    window.history.pushState({ view: next }, "", `#${next}`);
  }
  document.querySelector(".workspace-main").scrollIntoView({ block: "start" });
}

function syncCalculatorScenario() {
  const scenario = calculatorForm.elements.scenario.value;
  const species = calculatorForm.elements.species;
  const cannotTakeOral = calculatorForm.elements.cannotTakeOral;
  species.disabled = scenario === "domestic_vivax";
  if (species.disabled) species.value = "vivax";
  cannotTakeOral.disabled = scenario !== "severe";
  if (cannotTakeOral.disabled) cannotTakeOral.checked = false;
}

document.querySelectorAll("[data-view-target]").forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    activateView(control.dataset.viewTarget);
  });
});

window.addEventListener("hashchange", () => activateView(window.location.hash.slice(1), false));
window.addEventListener("popstate", () => activateView(window.location.hash.slice(1), false));

clinicianConfirmed.addEventListener("change", () => {
  assessButton.disabled = !clinicianConfirmed.checked;
});

clinicalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!clinicalForm.reportValidity() || !clinicianConfirmed.checked) return;
  renderClinicalResult(assessMalaria(clinicalFormInput()));
});

clinicalForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    assessButton.disabled = true;
    emptyResult.hidden = false;
    resultContent.hidden = true;
    delete resultPanel.dataset.level;
  }, 0);
});

document.querySelector("#recalculate-button").addEventListener("click", () => {
  clinicalForm.scrollIntoView({ behavior: "smooth", block: "start" });
  clinicalForm.elements.age.focus({ preventScroll: true });
});

calculatorForm.elements.scenario.addEventListener("change", syncCalculatorScenario);
calculatorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!calculatorForm.reportValidity()) return;
  renderCalculatorResult(calculateMedicationPlan(calculatorFormInput()));
});

syncCalculatorScenario();
activateView(window.location.hash.slice(1), false);

window.__malariaAssess = assessMalaria;
window.__calculateMedicationPlan = calculateMedicationPlan;
