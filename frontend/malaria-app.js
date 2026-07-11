import { assessMalaria } from "./malaria-engine.js";

const form = document.querySelector("#clinical-form");
const assessButton = document.querySelector("#assess-button");
const clinicianConfirmed = document.querySelector("#clinician-confirmed");
const emptyResult = document.querySelector("#empty-result");
const resultContent = document.querySelector("#result-content");
const resultPanel = document.querySelector("#result-panel");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formInput() {
  const data = new FormData(form);
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

function renderList(target, items) {
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderMedications(medications) {
  const container = document.querySelector("#medication-list");
  if (!medications.length) {
    container.innerHTML = `
      <div class="no-medication">
        <strong>현재 단계에서 약제 용량을 제시하지 않습니다.</strong>
        <p>검사와 중증도 평가를 먼저 완료하세요.</p>
      </div>`;
    return;
  }
  container.innerHTML = medications
    .map(
      (medication, index) => `
        <article class="medication-card${medication.blocked ? " is-blocked" : ""}">
          <div class="medication-index">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <span class="medication-role">${escapeHtml(medication.role)}${medication.blocked ? " · 보류" : ""}</span>
            <h4>${escapeHtml(medication.name)}</h4>
            <p class="regimen">${escapeHtml(medication.regimen)}</p>
            <p class="medication-note">${escapeHtml(medication.note)}</p>
          </div>
        </article>`,
    )
    .join("");
}

function renderResult(result) {
  emptyResult.hidden = true;
  resultContent.hidden = false;
  resultPanel.dataset.level = result.diagnosis.level;

  const level = document.querySelector("#diagnosis-level");
  level.textContent = result.diagnosis.level === "confirmed"
    ? "확인진단"
    : result.diagnosis.level === "presumptive"
      ? "추정진단"
      : result.diagnosis.level === "emergency"
        ? "응급"
        : result.diagnosis.level === "repeat"
          ? "반복검사"
          : result.diagnosis.level === "suspected"
            ? "의심"
            : "재평가";
  document.querySelector("#diagnosis-title").textContent = result.diagnosis.title;
  document.querySelector("#diagnosis-detail").textContent = result.diagnosis.detail;
  document.querySelector("#disposition-text").textContent = result.disposition;
  document.querySelector("#privacy-text").textContent = result.privacy;

  const severeBlock = document.querySelector("#severe-block");
  severeBlock.hidden = result.severe.length === 0;
  if (result.severe.length) renderList(document.querySelector("#severe-list"), result.severe);

  renderMedications(result.medications);

  const warningBlock = document.querySelector("#warning-block");
  warningBlock.hidden = result.warnings.length === 0;
  if (result.warnings.length) renderList(document.querySelector("#warning-list"), result.warnings);

  if (window.matchMedia("(max-width: 980px)").matches) {
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

clinicianConfirmed.addEventListener("change", () => {
  assessButton.disabled = !clinicianConfirmed.checked;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity() || !clinicianConfirmed.checked) return;
  renderResult(assessMalaria(formInput()));
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    assessButton.disabled = true;
    emptyResult.hidden = false;
    resultContent.hidden = true;
    delete resultPanel.dataset.level;
  }, 0);
});

document.querySelector("#recalculate-button").addEventListener("click", () => {
  document.querySelector("#clinical-form").scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("[name='age']").focus({ preventScroll: true });
});

window.__malariaAssess = assessMalaria;
