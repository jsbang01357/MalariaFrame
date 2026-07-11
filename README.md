# MalariaFrame

MalariaFrame은 1차 의료기관에서 발열 환자의 말라리아 가능성을 놓치지 않고, 검사 후속 조치와 체중 기반 치료 후보를 한 흐름으로 확인하기 위한 **의료진용 오픈소스 임상 의사결정 보조 도구**입니다.

기준 문서는 질병관리청이 2026년 3월 30일 공개한 [말라리아 진료가이드(제3판)](https://www.kdca.go.kr/bbs/kdca/55/306119/download.do)입니다.

- 웹사이트: https://malaria.jisong.dev
- 저장소: https://github.com/jsbang01357/MalariaFrame

> 이 프로젝트는 질병관리청 공식 전산서비스나 허가된 의료기기가 아닙니다. 계산 결과는 처방 자동 확정이 아닌 진료 보조이며, 의료진이 원충종·제형·금기·상호작용과 최신 지침을 최종 확인해야 합니다.

## 현재 구현 범위

- 진료 의사결정, 약물 계산기, 의사용 배포자료를 분리한 의료진용 CDSS 사이드바
- 환자 나이·체중·임신/수유 상태 입력
- 국내 위험지역 및 해외 유행지역 노출 확인
- RDT, 말초혈액도말, PCR 결과에 따른 의심·추정·확인진단 분류
- 초기 음성이나 임상적으로 강하게 의심될 때 6–12시간 후 반복검사 안내
- 중증 말라리아 기준과 즉시 전원·입원 경로
- 국내발생 삼일열의 히드록시클로로퀸·프리마퀸 용량 초안
- 해외유입 말라리아의 피라맥스·말라론·메플로퀸 후보 비교
- 중증 말라리아의 체중별 아르테수네이트 주사 용량
- 독립 약물 계산기에서 계산 직후 하단 처방추천·보류 사유 표시
- 임신, G6PD 결핍/미확인, 활동성 간질환, QT 연장 위험, 예방약 복용력 안전장치
- 입력값 브라우저 내 계산 및 비저장

## 개인정보 보호

이름, 주민등록번호, 등록번호, 연락처는 받지 않습니다. 입력한 임상값은 브라우저의 JavaScript에서만 계산되며 API로 전송하거나 서버·브라우저 저장소에 보관하지 않습니다.

## 로컬 실행

로컬 FastAPI 실행은 Python 3.12 이상, 테스트·Worker 배포는 Node.js 22 이상과 pnpm 10 이상을 권장합니다.

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
.venv/bin/uvicorn api_server:app --host 127.0.0.1 --port 8080
```

브라우저에서 `http://127.0.0.1:8080`에 접속합니다.

## 검증

```bash
node tests/js/run_malaria_engine_test.mjs
python3 -m py_compile api_server.py
curl http://127.0.0.1:8080/api/health
```

## 배포 구조

`scripts/build_static_site.sh`가 공개 파일 5개만 `dist/`에 만들고, `scripts/deploy_gcs.sh`가 `gs://malariaframe-jisong-dev`에 업로드합니다. Cloudflare Worker는 `malaria.jisong.dev`의 HTTPS와 보안 헤더를 담당하며 GCS 정적 파일만 프록시합니다.

```bash
bash scripts/deploy_gcs.sh
pnpm worker:deploy
```

GCS에는 HTML·JavaScript·CSS만 저장되며 환자 입력값은 전송되지 않습니다.

## 구조

```text
frontend/
├── malaria.html          # 의료진 입력·결과 화면
├── malaria-app.js        # 폼 수집과 결과 표시
├── malaria-engine.js     # 결정론적 임상 규칙과 용량 계산
└── malaria-styles.css    # 반응형 UI
tests/js/
└── run_malaria_engine_test.mjs
docs/
└── clinical-rules.md     # 근거, 적용 범위, 검토 필요 항목
api_server.py             # 정적 파일과 health endpoint 제공
```

## 임상 검토가 필요한 항목

- 국내 삼일열 소아 및 41 kg 미만의 실제 국내 유통 제형 처방표
- 100 kg 초과 체중의 제형 반올림과 프리마퀸 1일 상한
- 신·간기능에 따른 약제별 조정 및 전체 상호작용 표
- 해외 국가별 내성 정보와 국내 공급 가능 제형
- 법정감염병 신고 화면 또는 방역통합정보시스템 연계
- 질병관리청/감염내과/약제부의 최종 규칙 검수

자세한 근거와 보수적 처리 원칙은 [임상 규칙 문서](docs/clinical-rules.md)를 참고하세요.

## 라이선스와 출처

소스 코드는 [MIT License](LICENSE)로 배포합니다.

질병관리청 원문은 공공누리의 별도 이용조건을 따릅니다. 이 저장소는 원문 PDF와 촬영 이미지를 재배포하지 않으며, 독립적으로 구현한 계산 규칙에 출처를 표시합니다.
