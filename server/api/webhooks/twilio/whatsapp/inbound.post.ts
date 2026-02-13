import twilio from "twilio";
import {
  defineEventHandler,
  getHeader,
  setHeader,
  createError,
  getRequestURL,
} from "h3";

function getRawBody(event: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    event.node.req.on("data", (chunk: Buffer) => (data += chunk.toString("utf8")));
    event.node.req.on("end", () => resolve(data));
    event.node.req.on("error", reject);
  });
}

function getExternalUrl(event: any) {
  // Base URL as Nitro sees it (path + query)
  const reqUrl = getRequestURL(event);

  // Prefer forwarded proto/host, then host
  const proto =
    (getHeader(event, "x-forwarded-proto") as string) ||
    (getHeader(event, "cf-visitor") ? "https" : "") ||
    reqUrl.protocol.replace(":", "") ||
    "https";

  const host =
    (getHeader(event, "x-forwarded-host") as string) ||
    (getHeader(event, "host") as string) ||
    reqUrl.host;

  // IMPORTANT: Twilio signature validation depends on exact URL (no default ports unless present)
  return `${proto}://${host}${reqUrl.pathname}${reqUrl.search}`;
}

export default defineEventHandler(async (event) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN || useRuntimeConfig().twilioAuthToken;
  if (!authToken) {
    throw createError({ statusCode: 500, statusMessage: "Missing TWILIO_AUTH_TOKEN" });
  }

  const signature = (getHeader(event, "x-twilio-signature") as string) || "";

  // Twilio sends x-www-form-urlencoded by default
  const raw = await getRawBody(event);
  const params = new URLSearchParams(raw);
  const body = Object.fromEntries(params.entries()) as Record<string, string>;

  const url = getExternalUrl(event);

  const isValid = twilio.validateRequest(authToken, signature, url, body);

  if (!isValid) {
    // Return fast; log for debugging
    console.warn("[twilio] invalid signature", { url, hasSig: !!signature });
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 401;
    return "Invalid signature";
  }

  // Normalize
  const payload = {
    provider: "twilio",
    channel: "whatsapp",
    from: body.From || "", // whatsapp:+972...
    to: body.To || "",
    text: body.Body || "",
    messageSid: body.MessageSid || "",
    waId: body.WaId || "",
    profileName: body.ProfileName || "",
    receivedAt: new Date().toISOString(),
  };

  // TODO: save to Supabase + enqueue workflow/job
  console.log("[twilio] inbound", payload);

  setHeader(event, "content-type", "text/plain");
  return "ok";
});
