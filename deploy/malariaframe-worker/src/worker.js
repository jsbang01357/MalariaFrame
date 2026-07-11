const ALLOWED_PATHS = new Set([
  "/index.html",
  "/404.html",
  "/malaria-app.js",
  "/malaria-engine.js",
  "/malaria-styles.css",
]);

const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; base-uri 'none'; connect-src 'none'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
  "permissions-policy": "camera=(), geolocation=(), microphone=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, HEAD" },
      });
    }

    const incoming = new URL(request.url);
    const requestedPath = incoming.pathname === "/" ? "/index.html" : incoming.pathname;
    if (!ALLOWED_PATHS.has(requestedPath)) {
      return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
    }

    const origin = new URL(env.ORIGIN);
    const bucketPath = origin.pathname.replace(/\/$/, "");
    origin.pathname = `${bucketPath}${requestedPath}`;
    const upstream = await fetch(origin.toString(), {
      method: request.method,
      cf: { cacheEverything: true, cacheTtl: requestedPath.endsWith(".html") ? 0 : 300 },
    });

    const headers = new Headers(upstream.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value);
    }
    headers.set(
      "cache-control",
      requestedPath.endsWith(".html")
        ? "no-cache, max-age=0"
        : "public, max-age=300, must-revalidate",
    );

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};
