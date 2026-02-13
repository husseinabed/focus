import twilio from "twilio";
import {
  defineEventHandler,
  getHeader,
  setHeader,
  getRequestURL,
  createError,
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
  const reqUrl = getRequestURL(event);

  const proto =
    (getHeader(event, "x-forwarded-proto") as string) ||
    (getHeader(event, "cf-visitor") ? "https" : "") ||
    reqUrl.protocol.replace(":", "") ||
    "https";

  const host =
    (getHeader(event, "x-forwarded-host") as string) ||
    (getHeader(event, "host") as string) ||
    reqUrl.host;

  // חשוב: URL חייב להתאים *בדיוק* ל־Webhook שהוגדר ב־Twilio
  return `${proto}://${host}${reqUrl.pathname}${reqUrl.search}`;
}

export default defineEventHandler(async (event) => {
  const authToken =
    process.env.TWILIO_AUTH_TOKEN || useRuntimeConfig().twilioAuthToken;

  if (!authToken) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing TWILIO_AUTH_TOKEN",
    });
  }

  const signature = (getHeader(event, "x-twilio-signature") as string) || "";

  // Twilio שולח x-www-form-urlencoded
  const raw = await getRawBody(event);
  const params = new URLSearchParams(raw);
  const body = Object.fromEntries(params.entries()) as Record<string, string>;

  const url = getExternalUrl(event);

  const isValid = twilio.validateRequest(authToken, signature, url, body);
  if (!isValid) {
    console.warn("[twilio][status] invalid signature", { url });
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 401;
    return "Invalid signature";
  }

  // --- נרמול שדות סטטוס ---
  const payload = {
    provider: "twilio",
    channel: "whatsapp",
    messageSid: body.MessageSid || "",
    messageStatus: body.MessageStatus || "", // queued | sent | delivered | read | failed | undelivered
    errorCode: body.ErrorCode || null,
    errorMessage: body.ErrorMessage || null,
    from: body.From || "",
    to: body.To || "",
    timestamp: new Date().toISOString(),
  };

  // TODO: עדכון DB (messages.status) לפי messageSid
  // await updateMessageStatus(payload)

  console.log("[twilio][status]", payload);

  setHeader(event, "content-type", "text/plain");
  return "ok";
});
