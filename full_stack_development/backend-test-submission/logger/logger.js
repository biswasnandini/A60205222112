
const AUTH_URL = "http://20.244.56.144/evaluation-service/auth";
const LOG_URL = "http://20.244.56.144/evaluation-service/logs";
const REGISTRATION_DETAILS = {
  email: "nandini.biswas210@gmail.com",    
  name: "Nandini Biswas",                
  clientId: "031dd7ec-e7ef-4db2-8401-abf8444580b3",             
  clientSecret: "KAwQgrrjfFuEvTPS"      
};

let _accessToken = null;
let _tokenExpiresAt = null;

// Helper: universal fetch (browser/Node)
async function myFetch(url, options) {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return await window.fetch(url, options);
  } else {
    const nodeFetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    return await nodeFetch(url, options);
  }
}

// Helper: get and cache token
async function getAccessToken() {
  const now = Date.now();
  if (_accessToken && _tokenExpiresAt && now < _tokenExpiresAt - 10000) { // renew 10s before expiry
    return _accessToken;
  }
  const res = await myFetch(AUTH_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(REGISTRATION_DETAILS)
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  _accessToken = data.access_token || data.accessToken || data.token;
  // Guess expiry if provided. If not, default to 9 min.
  _tokenExpiresAt = now + ((data.expires_in ? data.expires_in * 1000 : 540000));
  return _accessToken;
}

// The main log function (exported)
// stack: "backend" | "frontend"
// level: "debug" | "info" | "warn" | "error" | "fatal" (all lowercase)
// pkg: see allowed list
// message: string
async function Log(stack, level, pkg, message) {
  // All args must be lowercased except message
  stack = stack && stack.toString().toLowerCase();
  level = level && level.toString().toLowerCase();
  pkg = pkg && pkg.toString().toLowerCase();

  // Field validation (optional, basic only)
  const stackAllowed = ["backend", "frontend"];
  const levelAllowed = ["debug", "info", "warn", "error", "fatal"];
  if (!stackAllowed.includes(stack)) throw new Error("Invalid stack");
  if (!levelAllowed.includes(level)) throw new Error("Invalid level");
  if (typeof pkg !== "string" || pkg.length === 0) throw new Error("Invalid package");

  const token = await getAccessToken();
  const res = await myFetch(LOG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      stack,
      level,
      package: pkg,
      message
    })
  });
  if (!res.ok) throw new Error("Failed to send log");
  const data = await res.json();
  return data; // { logId, message }
}

if (typeof module !== "undefined") module.exports = { Log }; // Node
export { Log }; // Browser/ESM

