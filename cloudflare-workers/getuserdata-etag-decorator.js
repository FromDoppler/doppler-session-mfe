// Worker Name: getuserdata-etag-decorator
// Route: https://app2.fromdoppler.com/WebApp/GetUserData*
addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 }),
    ),
  );
});

async function handleRequest(request) {
  // // BEGIN TEMPORAL CODE
  // const TEST_CACHE_COOKIE_REGEX = /;\s*test_cache=true;/;
  // const testCache = !!TEST_CACHE_COOKIE_REGEX.exec(request.headers.get("Cookie"));
  // if (!testCache) {
  //   return await fetch(request);
  // }
  // // END TEMPORAL CODE

  const origin = readOrigin(request);
  const sessionId = readSessionId(request);

  if (!sessionId) {
    return unauthorizedResponse("No session", origin);
  }

  const timeWindow = getTimeWindow();

  const etag = await generateEtag(sessionId, timeWindow, origin);

  const ifNoneMatch = request.headers.get("If-None-Match");

  if (ifNoneMatch == etag) {
    return notModifiedResponse(etag);
  }

  const originResponse = await fetchOriginResource(request);

  if (originResponse.status != 200) {
    return unauthorizedResponse("Session expired", origin);
  }

  return okResponseWithEtag(originResponse, etag);
}

async function generateEtag(sessionId, timeWindow, origin) {
  // We are using origin here wrong access-control-allow-origin header
  // when the request comes from a different subdomain
  const hash = await sha1(`${sessionId}${timeWindow}${origin}`);
  const etag = `W/"${hash}"`;
  return etag;
}

function getTimeWindow() {
  const cacheTimeWindowSize = 3 * 60 * 1000; // 3 minutes
  const epoch = Date.now();
  const timeWindow = (epoch / cacheTimeWindowSize) >> 0;
  return timeWindow;
}

async function fetchOriginResource(request) {
  const originResponse = await fetch(request);
  return originResponse;
}

function readSessionId(request) {
  // TODO: consider to use cookie parsing
  // see https://developers.cloudflare.com/workers/examples/extract-cookie-value/
  // but it requires a npm package
  const SESSION_COOKIE_REGEX = /(?:;|^)\s*J9A8d2\s*=\s*([^;]+)(?:;|$)/;
  const cookie = request.headers.get("Cookie");
  const sessionId = SESSION_COOKIE_REGEX.exec(cookie)?.[1];
  return sessionId;
}

function readOrigin(request) {
  return request.headers.get("Origin") ?? "";
}

async function sha1(data) {
  const arrayBuffer = await crypto.subtle.digest(
    { name: "SHA-1" },
    new TextEncoder().encode(data),
  );
  const bytes = Array.from(new Uint8Array(arrayBuffer));
  const exa = bytes.map((x) => x.toString(16).padStart(2, "0")).join("");
  return exa;
}

function unauthorizedResponse(reason, origin) {
  // We are using origin here to avoid CORS error when user is not authorized
  return new Response("", {
    status: 401,
    statusText: "Unauthorized",
    headers: {
      "X-Unauthorized-reason": reason,
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": true,
      "access-control-allow-headers": "authorization",
    },
  });
}

function okResponseWithEtag(originResponse, etag) {
  const newResponse = new Response(originResponse.body, originResponse);
  newResponse.headers.set("ETag", etag);
  newResponse.headers.set("Vary", "Origin");
  return newResponse;
}

function notModifiedResponse(etag) {
  return new Response("", {
    status: 304,
    statusText: "Not Modified",
    headers: new Headers({ ETag: etag, Vary: "Origin" }),
  });
}
