import assert from "node:assert/strict";

import {
  assessMalaria,
  artesunateDose,
  hydroxychloroquineDose,
  malaroneDose,
  primaquineDose,
  pyramaxDose,
} from "../../frontend/malaria-engine.js";

const base = {
  age: 45,
  weight: 70,
  pregnancy: "none",
  g6pd: "normal",
  rdt: "positive",
  smear: "positive",
  pcr: "not_done",
  species: "vivax",
  prophylaxis: "none",
  severeSigns: [],
};

assert.deepEqual(hydroxychloroquineDose(70), {
  d0Mg: 950,
  d1Mg: 950,
  d2Mg: 450,
  totalMg: 2350,
  tableWeight: 70,
  source: "kdca-adult-table",
});
assert.equal(primaquineDose(70).totalTablets, 17);
assert.equal(primaquineDose(70).schedule, "첫 3일 2정, 나머지 11일 1정");
assert.equal(hydroxychloroquineDose(41).d0Mg, 600);
assert.equal(hydroxychloroquineDose(100).d0Mg, 1300);
assert.equal(hydroxychloroquineDose(40).source, "formula-needs-review");
assert.equal(hydroxychloroquineDose(101).source, "formula-needs-review");
assert.equal(primaquineDose(60).totalTablets, 14);
assert.equal(primaquineDose(61).totalTablets, 15);
assert.equal(pyramaxDose(23.9), 1);
assert.equal(pyramaxDose(24), 2);
assert.equal(pyramaxDose(45), 3);
assert.equal(pyramaxDose(65), 4);
assert.equal(pyramaxDose(50), 3);
assert.equal(malaroneDose(8), 0.5);
assert.equal(malaroneDose(9), 0.75);
assert.equal(malaroneDose(10), 0.75);
assert.equal(malaroneDose(11), 1);
assert.equal(malaroneDose(20), 1);
assert.equal(malaroneDose(21), 2);
assert.equal(malaroneDose(30), 2);
assert.equal(malaroneDose(31), 3);
assert.equal(malaroneDose(40), 3);
assert.equal(malaroneDose(40.1), 4);
assert.deepEqual(artesunateDose(18), { mgPerKg: 3, perDoseMg: 54, vialCount: 1 });

const domestic = assessMalaria({ ...base, domesticExposure: true, overseasExposure: false });
assert.equal(domestic.diagnosis.level, "confirmed");
assert.match(domestic.disposition, /국내발생 삼일열/);
assert.equal(domestic.medications[0].id, "hydroxychloroquine");
assert.equal(domestic.medications[1].id, "primaquine");

const imported = assessMalaria({
  ...base,
  weight: 50,
  species: "falciparum",
  domesticExposure: false,
  overseasExposure: true,
});
assert.equal(imported.medications[0].id, "pyramax");
assert.match(imported.medications[0].regimen, /1일 3정/);
assert.ok(imported.warnings.some((warning) => warning.includes("입원치료")));

const severe = assessMalaria({
  ...base,
  weight: 18,
  species: "falciparum",
  overseasExposure: true,
  severeSigns: ["의식소실·혼수"],
});
assert.equal(severe.medications[0].id, "iv-artesunate");
assert.match(severe.medications[0].regimen, /54 mg\/dose/);
assert.match(severe.disposition, /응급상태/);

const repeat = assessMalaria({
  ...base,
  rdt: "negative",
  smear: "not_done",
  pcr: "not_done",
  domesticExposure: true,
  overseasExposure: false,
  fever: true,
});
assert.equal(repeat.diagnosis.level, "repeat");
assert.match(repeat.disposition, /6–12시간/);

const pregnancy = assessMalaria({
  ...base,
  pregnancy: "trimester23",
  domesticExposure: true,
  overseasExposure: false,
});
assert.equal(pregnancy.medications.length, 1);
assert.ok(pregnancy.warnings.some((warning) => warning.includes("프리마퀸")));

const deficient = assessMalaria({
  ...base,
  g6pd: "deficient",
  domesticExposure: true,
  overseasExposure: false,
});
assert.equal(deficient.medications[1].id, "primaquine-weekly");
assert.match(deficient.medications[1].regimen, /주 1회, 총 8주/);

const g6pdUnknown = assessMalaria({
  ...base,
  g6pd: "unknown",
  domesticExposure: true,
  overseasExposure: false,
});
assert.equal(g6pdUnknown.medications[1].blocked, true);
assert.ok(g6pdUnknown.warnings.some((warning) => warning.includes("G6PD 결과 미확인")));

const liverDisease = assessMalaria({
  ...base,
  species: "unknown",
  domesticExposure: false,
  overseasExposure: true,
  activeLiverDisease: true,
});
assert.equal(liverDisease.medications[0].blocked, true);
assert.equal(liverDisease.medications[1].id, "malarone");
assert.ok(liverDisease.warnings.some((warning) => warning.includes("열대열말라리아")));

const autoSevere = assessMalaria({
  ...base,
  domesticExposure: false,
  overseasExposure: true,
  species: "falciparum",
  parasitemia: 10.1,
});
assert.equal(autoSevere.medications[0].id, "iv-artesunate");
assert.ok(autoSevere.severe.some((reason) => reason.includes("10% 초과")));

console.log("MalariaFrame clinical decision engine: all scenarios passed");
