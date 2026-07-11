export const GUIDELINE = Object.freeze({
  title: "말라리아 진료가이드(제3판)",
  publisher: "질병관리청",
  publishedAt: "2026-03-30",
  url: "https://www.kdca.go.kr/bbs/kdca/55/306119/download.do",
});

const POSITIVE = "positive";

const HYDROXYCHLOROQUINE_TABLE = [
  [41, 46, 600, 600, 300],
  [47, 49, 650, 650, 300],
  [50, 52, 700, 700, 300],
  [53, 54, 700, 700, 350],
  [55, 57, 750, 750, 350],
  [58, 60, 800, 800, 350],
  [61, 62, 800, 800, 400],
  [63, 65, 850, 850, 400],
  [66, 69, 900, 900, 450],
  [70, 72, 950, 950, 450],
  [73, 75, 1000, 1000, 450],
  [76, 77, 1000, 1000, 500],
  [78, 82, 1050, 1050, 500],
  [83, 85, 1100, 1100, 550],
  [86, 93, 1200, 1200, 600],
  [94, 100, 1300, 1300, 650],
];

const PRIMAQUINE_TABLETS = [
  [41, 60, 14],
  [61, 64, 15],
  [65, 68, 16],
  [69, 72, 17],
  [73, 77, 18],
  [78, 81, 19],
  [82, 85, 20],
  [86, 90, 21],
  [91, 94, 22],
  [95, 98, 23],
  [99, 100, 24],
];

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundTo(value, unit) {
  return Math.round(value / unit) * unit;
}

function rangeValue(table, weight, valueIndex) {
  const row = table.find(([min, max]) => weight >= min && weight <= max);
  return row ? row[valueIndex] : null;
}

function formatDose(value) {
  if (!Number.isFinite(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function tabletSchedule(totalTablets, days) {
  const base = Math.floor(totalTablets / days);
  const extra = totalTablets % days;
  if (extra === 0) return `${base}정씩 ${days}일`;
  if (base === 0) return `첫 ${extra}일 1정, 나머지 ${days - extra}일은 복용 없음`;
  return `첫 ${extra}일 ${base + 1}정, 나머지 ${days - extra}일 ${base}정`;
}

export function hydroxychloroquineDose(weightInput) {
  const weight = numberOrNull(weightInput);
  if (!weight || weight <= 0) return null;

  const tableWeight = Math.round(weight);
  const tableRow = HYDROXYCHLOROQUINE_TABLE.find(
    ([min, max]) => tableWeight >= min && tableWeight <= max,
  );
  if (tableRow) {
    return {
      d0Mg: tableRow[2],
      d1Mg: tableRow[3],
      d2Mg: tableRow[4],
      totalMg: tableRow[2] + tableRow[3] + tableRow[4],
      tableWeight,
      source: "kdca-adult-table",
    };
  }

  const conversion = 200 / 155;
  const d0Mg = roundTo(weight * 10 * conversion, 50);
  const d1Mg = roundTo(weight * 10 * conversion, 50);
  const d2Mg = roundTo(weight * 5 * conversion, 50);
  return {
    d0Mg,
    d1Mg,
    d2Mg,
    totalMg: d0Mg + d1Mg + d2Mg,
    tableWeight: null,
    source: "formula-needs-review",
  };
}

export function primaquineDose(weightInput, imported = false) {
  const weight = numberOrNull(weightInput);
  if (!weight || weight <= 0) return null;
  const totalBaseMg = weight * (imported ? 7 : 3.5);
  const tableWeight = Math.round(weight);
  const tableTablets = imported
    ? null
    : rangeValue(PRIMAQUINE_TABLETS, tableWeight, 2);
  const totalTablets = tableTablets ?? Math.ceil(totalBaseMg / 15);
  const days = 14;
  return {
    totalBaseMg: Math.round(totalBaseMg * 10) / 10,
    dailyBaseMg: Math.round((totalBaseMg / days) * 10) / 10,
    totalTablets,
    schedule: tabletSchedule(totalTablets, days),
    imported,
    source: tableTablets ? "kdca-adult-table" : "formula-needs-review",
  };
}

export function pyramaxDose(weightInput) {
  const weight = numberOrNull(weightInput);
  if (!weight || weight < 20) return null;
  if (weight < 24) return 1;
  if (weight < 45) return 2;
  if (weight < 65) return 3;
  return 4;
}

export function malaroneDose(weightInput) {
  const weight = numberOrNull(weightInput);
  if (!weight || weight < 5) return null;
  if (weight <= 8) return 0.5;
  if (weight <= 10) return 0.75;
  if (weight <= 20) return 1;
  if (weight <= 30) return 2;
  if (weight <= 40) return 3;
  return 4;
}

export function artesunateDose(weightInput) {
  const weight = numberOrNull(weightInput);
  if (!weight || weight <= 0) return null;
  const mgPerKg = weight < 20 ? 3 : 2.4;
  const perDoseMg = Math.round(weight * mgPerKg * 10) / 10;
  return {
    mgPerKg,
    perDoseMg,
    vialCount: Math.ceil(perDoseMg / 60),
  };
}

function positiveTest(input) {
  return [input.rdt, input.smear, input.pcr].some((value) => value === POSITIVE);
}

function confirmedTest(input) {
  return input.smear === POSITIVE || input.pcr === POSITIVE;
}

function hasNegativeTest(input) {
  return [input.rdt, input.smear, input.pcr].some((value) => value === "negative");
}

function severeReasons(input) {
  const reasons = [...(input.severeSigns || [])];
  const gcs = numberOrNull(input.gcs);
  const seizures = numberOrNull(input.seizureCount);
  const glucose = numberOrNull(input.glucose);
  const creatinine = numberOrNull(input.creatinine);
  const bilirubin = numberOrNull(input.bilirubin);
  const spo2 = numberOrNull(input.spo2);
  const respiratoryRate = numberOrNull(input.respiratoryRate);
  const sbp = numberOrNull(input.sbp);
  const parasitemia = numberOrNull(input.parasitemia);
  const parasiteDensity = numberOrNull(input.parasiteDensity);

  if (gcs !== null && gcs < 11) reasons.push("GCS 11 미만");
  if (seizures !== null && seizures >= 2) reasons.push("24시간 내 경련 2회 이상");
  if (glucose !== null && glucose < 40) reasons.push("혈당 40 mg/dL 미만");
  if (creatinine !== null && creatinine > 3) reasons.push("Cr 3 mg/dL 초과");
  if (spo2 !== null && respiratoryRate !== null && spo2 < 92 && respiratoryRate > 30) {
    reasons.push("SpO₂ 92% 미만 및 호흡수 30회/분 초과");
  }
  if (sbp !== null && sbp < 80) reasons.push("수축기혈압 80 mmHg 미만");
  if (input.species === "falciparum" && parasitemia !== null && parasitemia > 10) {
    reasons.push("열대열 기생충혈증 10% 초과");
  }
  if (input.species === "knowlesi" && parasiteDensity !== null) {
    if (parasiteDensity > 100000 || (bilirubin !== null && bilirubin > 3 && parasiteDensity > 20000)) {
      reasons.push("원숭이열 중증 기생충밀도 기준 충족");
    }
  }
  if (
    bilirubin !== null && bilirubin > 3 && parasiteDensity !== null && parasiteDensity > 100000
  ) {
    reasons.push("황달 및 기생충밀도 중증 기준 충족");
  }
  return [...new Set(reasons)];
}

function diagnosisAssessment(input, severe) {
  const temperature = numberOrNull(input.temperature);
  const fever = Boolean(input.fever) || (temperature !== null && temperature >= 37.5);
  const exposure = Boolean(input.domesticExposure || input.overseasExposure);
  const positive = positiveTest(input);
  const confirmed = confirmedTest(input);

  if (confirmed) {
    return {
      level: "confirmed",
      title: "말라리아 확인진단",
      detail: "말초혈액도말 또는 PCR 양성입니다. 원충종과 무성 기생충혈증을 확인합니다.",
      treatmentEligible: true,
    };
  }
  if (input.rdt === POSITIVE) {
    return {
      level: "presumptive",
      title: "말라리아 추정진단",
      detail: "RDT 양성입니다. 즉시 치료를 검토하고 혈액도말 또는 PCR 확진 검사를 뒤따르게 합니다.",
      treatmentEligible: true,
    };
  }
  if (severe && input.overseasExposure && fever) {
    return {
      level: "emergency",
      title: "중증 해외유입 말라리아 강력 의심",
      detail: "확진을 기다리며 치료를 지연하지 말고 즉시 상급병원·감염내과와 협의합니다.",
      treatmentEligible: true,
    };
  }
  if (fever && exposure && hasNegativeTest(input)) {
    return {
      level: "repeat",
      title: "음성이어도 말라리아 배제 불가",
      detail: "초기 검사 6–12시간 뒤 RDT/혈액도말을 반복하거나 PCR을 시행합니다.",
      treatmentEligible: false,
    };
  }
  if (fever && exposure) {
    return {
      level: "suspected",
      title: "말라리아 의심",
      detail: "RDT를 신속히 시행하고, 혈액도말과 PCR을 준비합니다.",
      treatmentEligible: false,
    };
  }
  if (positive) {
    return {
      level: "presumptive",
      title: "말라리아 검사 양성",
      detail: "임상·역학 정보를 재확인하고 원충종 확인 및 치료를 진행합니다.",
      treatmentEligible: true,
    };
  }
  return {
    level: "low",
    title: "현재 정보만으로 의심 근거 부족",
    detail: "노출력과 발열 경과를 다시 확인하고 다른 발열 질환을 함께 감별합니다.",
    treatmentEligible: false,
  };
}

function domesticTreatment(input, warnings) {
  const weight = numberOrNull(input.weight);
  const hydroxy = hydroxychloroquineDose(weight);
  const primaquine = primaquineDose(weight, false);
  const medications = [];

  if (input.species === "unknown") {
    warnings.push("국내 노출만 확인된 경우에도 혈액도말 또는 PCR로 원충종을 확정합니다.");
  }

  if (hydroxy) {
    medications.push({
      id: "hydroxychloroquine",
      name: "히드록시클로로퀸 황산염",
      role: "혈액원충 제거",
      regimen: `D0 ${hydroxy.d0Mg} mg → D1 ${hydroxy.d1Mg} mg → D2 ${hydroxy.d2Mg} mg (총 ${hydroxy.totalMg} mg)`,
      note:
        hydroxy.source === "kdca-adult-table"
          ? `제3판 성인 체중표의 ${hydroxy.tableWeight} kg 예시 적용`
          : "25 mg base/kg(10-10-5) 환산값입니다. 소아·표 범위 밖 체중은 감염내과/약사 검토가 필요합니다.",
    });
  }

  const pregnant = input.pregnancy !== "none";
  if (pregnant) {
    warnings.push("임신·수유 중 프리마퀸/타페노퀸은 투약하지 않고 분만과 수유 종료 후로 미룹니다.");
  } else if (input.g6pd === "deficient") {
    const weeklyMg = Math.round(weight * 0.75 * 10) / 10;
    medications.push({
      id: "primaquine-weekly",
      name: "프리마퀸 저용량 간헐요법",
      role: "G6PD 결핍 시 재발 방지 대안",
      regimen: `${formatDose(weeklyMg)} mg base를 주 1회, 총 8주`,
      note: "용혈 징후를 면밀히 관찰하며 감염내과 전문 진료 하에 적용합니다.",
    });
    warnings.push("G6PD 결핍에서는 표준 프리마퀸 요법을 사용하지 않습니다.");
  } else if (primaquine) {
    medications.push({
      id: "primaquine",
      name: "프리마퀸",
      role: "간원충 제거·재발 방지",
      regimen: `총 ${primaquine.totalBaseMg} mg base / 14일 · 비바퀸 15 mg base 기준 총 ${primaquine.totalTablets}정 (${primaquine.schedule})`,
      note: "G6PD 검사를 가급적 투약 전에 시행합니다. 1일 30 mg 이상은 G6PD 정상 확인 후에만 권고됩니다.",
      blocked: input.g6pd === "unknown",
    });
    if (input.g6pd === "unknown") {
      warnings.push("G6PD 결과 미확인: 프리마퀸은 검사 우선이며, 불가피한 선투약은 용혈 모니터링 계획이 필요합니다.");
    }
  }

  return medications;
}

function importedTreatment(input, warnings) {
  const weight = numberOrNull(input.weight);
  const pregnancy = input.pregnancy || "none";
  const sameProphylaxis = input.prophylaxis || "none";
  const medications = [];

  if (pregnancy === "breastfeeding") {
    warnings.push("수유부의 해외유입 경구치료는 영아 상태와 약제별 수유 안전성을 감염내과·약제부와 확인합니다.");
  }

  if (pregnancy === "trimester1") {
    medications.push({
      id: "mefloquine",
      name: "메플로퀸",
      role: "임신 1삼분기 합병증 없는 해외유입 1차 후보",
      regimen: "총 25 mg base/kg을 2–3회로 나누어 6–12시간 간격 투여",
      note: weight >= 60 ? "60 kg 이상 예시: 총 6정(3+2+1정)" : "체중별 제형 조정은 약사/감염내과 확인이 필요합니다.",
      blocked: sameProphylaxis === "mefloquine",
    });
    warnings.push("메플로퀸 투약이 어렵고 잠재적 이득이 위험보다 큰 경우에만 피라맥스를 주의하여 고려합니다.");
  } else {
    const tablets = pyramaxDose(weight);
    if (tablets) {
      medications.push({
        id: "pyramax",
        name: "아르테수네이트-피로나리딘(피라맥스)",
        role: pregnancy === "trimester23" ? "임신 2–3삼분기 1차 후보" : "합병증 없는 해외유입 1차 후보",
        regimen: `1일 ${tablets}정, 1일 1회, 3일간`,
        note: "활동성 간질환에서는 주의가 필요합니다.",
        blocked: Boolean(input.activeLiverDisease),
      });
    } else {
      warnings.push("피라맥스 성인 정제표는 20 kg 미만에 적용할 수 없습니다. 소아 제형과 전문 용량 검토가 필요합니다.");
    }
  }

  const malaroneTablets = malaroneDose(weight);
  if (malaroneTablets) {
    medications.push({
      id: "malarone",
      name: "아토바쿠온-프로구아닐(말라론)",
      role: "피라맥스 투약이 어려울 때 대안",
      regimen: `1일 ${malaroneTablets}정, 1일 1회, 3일간`,
      note: "예방화학요법으로 같은 약을 복용했다면 치료제로 배제합니다.",
      blocked: sameProphylaxis === "atovaquone-proguanil" || pregnancy !== "none",
    });
  }

  if (sameProphylaxis !== "mefloquine" && pregnancy !== "trimester1") {
    medications.push({
      id: "mefloquine-backup",
      name: "메플로퀸",
      role: "다른 약제를 투여할 수 없을 때 제한적 대안",
      regimen: "총 25 mg base/kg을 2–3회로 나누어 6–12시간 간격 투여",
      note: "부작용과 일부 동남아 내성 때문에 후순위입니다. 총 1,500 mg(6정) 초과 경험이 부족합니다.",
    });
  }

  if (["vivax", "ovale"].includes(input.species)) {
    const primaquine = primaquineDose(weight, true);
    if (pregnancy !== "none") {
      warnings.push("해외유입 삼일열/난형열이라도 임신·수유 중 근치요법은 분만과 수유 종료 후로 미룹니다.");
    } else if (input.g6pd === "normal" && primaquine) {
      medications.push({
        id: "primaquine-imported",
        name: "고용량 프리마퀸",
        role: "해외유입 삼일열·난형열 재발 방지",
        regimen: `총 ${primaquine.totalBaseMg} mg base / 14일(0.5 mg/kg/일) 또는 7일(1 mg/kg/일)`,
        note: "G6PD 정상 확인 후 사용하며, 정확한 정제 분배는 약사 검토가 필요합니다.",
      });
    } else if (input.g6pd === "deficient") {
      warnings.push("G6PD 결핍 환자의 해외유입 근치요법은 감염내과 전문 진료가 필요합니다.");
    } else {
      warnings.push("해외유입 삼일열/난형열 근치요법 전 G6PD 결과를 확인합니다.");
    }
  }

  if (input.species === "unknown" || input.species === "mixed") {
    warnings.push("원충종이 불확실하면 열대열말라리아로 간주하고 PCR로 혼합감염·원충종을 확인합니다.");
  }
  if (input.species === "falciparum") {
    warnings.push("열대열말라리아는 입원치료가 원칙입니다.");
  }
  return medications;
}

export function assessMalaria(rawInput = {}) {
  const input = {
    ...rawInput,
    weight: numberOrNull(rawInput.weight),
    age: numberOrNull(rawInput.age),
  };
  const severe = severeReasons(input);
  const diagnosis = diagnosisAssessment(input, severe.length > 0 || Boolean(input.cannotTakeOral));
  const warnings = [];
  let medications = [];
  let disposition = "외래에서 검사 결과와 임상 경과를 재평가합니다.";

  if (!input.weight || input.weight <= 0) warnings.push("체중을 입력해야 용량을 계산할 수 있습니다.");
  if (input.age !== null && input.age < 0.25) warnings.push("생후 3개월 미만은 투약 경험이 부족하여 소아감염 전문 진료가 필요합니다.");
  if (input.weight !== null && input.weight < 5) warnings.push("체중 5 kg 미만은 투약 경험이 부족하여 소아감염 전문 진료가 필요합니다.");

  if (severe.length > 0 || input.cannotTakeOral) {
    const ivDose = artesunateDose(input.weight);
    disposition = "의학적 응급상태: 즉시 상급병원 전원·입원, 감염내과 협진 및 아르테수네이트 주사제 확보";
    if (ivDose) {
      medications = [{
        id: "iv-artesunate",
        name: "아르테수네이트 주사제",
        role: "중증 말라리아 1차 치료",
        regimen: `${ivDose.perDoseMg} mg/dose (${ivDose.mgPerKg} mg/kg), 0·12·24시간 정맥투여 후 최소 24시간 치료`,
        note: `60 mg/vial 기준 dose당 ${ivDose.vialCount} vial 준비(잔량 처리·실제 조제는 기관 지침 적용). 경구 가능 시 3일 경구요법으로 완료합니다.`,
      }];
    }
    warnings.unshift("아르테수네이트 확보 전에도 경구 가능하면 권고 경구약으로 임시 치료를 시작하고, 주사제 준비 즉시 변경합니다.");
  } else if (diagnosis.treatmentEligible && input.weight) {
    const domesticVivax = input.domesticExposure && !input.overseasExposure && input.species !== "falciparum" && input.species !== "mixed";
    medications = domesticVivax
      ? domesticTreatment(input, warnings)
      : importedTreatment(input, warnings);
    disposition = domesticVivax
      ? "국내발생 삼일열 경로: 치료 시작, 확진·원충종 확인 및 신고 절차 진행"
      : "해외유입 경로: 원충종이 불확실하면 열대열로 간주하고 입원·전문 진료 우선";
  } else if (diagnosis.level === "repeat") {
    disposition = "초기 검사 후 6–12시간 뒤 반복 검사 또는 PCR. 악화 시 즉시 전원합니다.";
  }

  if (input.qtcRisk) warnings.push("QT 연장 약물 병용 여부와 기저 심전도를 확인합니다.");
  if (input.activeLiverDisease) warnings.push("활동성 간질환: 피라맥스 사용 주의 및 간기능 모니터링이 필요합니다.");
  if (input.prophylaxis && input.prophylaxis !== "none") warnings.push("예방화학요법으로 복용한 동일 약물은 치료제에서 배제합니다.");
  if (input.rdt === POSITIVE) warnings.push("RDT 양성은 추정진단입니다. 혈액도말 또는 PCR 확진 검사를 반드시 시행합니다.");

  return {
    guideline: GUIDELINE,
    diagnosis,
    disposition,
    severe,
    medications,
    warnings: [...new Set(warnings)],
    privacy: "입력값은 브라우저에서만 계산되며 서버로 전송하거나 저장하지 않습니다.",
  };
}
