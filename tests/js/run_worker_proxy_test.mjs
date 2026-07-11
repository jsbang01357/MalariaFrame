import assert from "node:assert/strict";

import worker from "../../deploy/malariaframe-worker/src/worker.js";

let requestedOrigin = "";
globalThis.fetch = async (url) => {
  requestedOrigin = url;
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

const response = await worker.fetch(
  new Request("https://malaria.jisong.dev/"),
  { ORIGIN: "https://storage.googleapis.com/malariaframe-jisong-dev" },
);

assert.equal(
  requestedOrigin,
  "https://storage.googleapis.com/malariaframe-jisong-dev/index.html",
);
assert.equal(response.status, 200);
assert.equal(response.headers.get("x-content-type-options"), "nosniff");

const missing = await worker.fetch(
  new Request("https://malaria.jisong.dev/private.json"),
  { ORIGIN: "https://storage.googleapis.com/malariaframe-jisong-dev" },
);
assert.equal(missing.status, 404);

console.log("MalariaFrame Worker proxy: all scenarios passed");
