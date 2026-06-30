import { Resend } from "resend";
import { NotifyPayload } from "../types";

const FROM = process.env.EMAIL_FROM ?? "SheetWatch <noreply@sheetwatch.app>";

let resend: Resend | null = null;
let warnedNoKey = false;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warnedNoKey) {
      console.warn("RESEND_API_KEY not set — email notifications disabled (push-only).");
      warnedNoKey = true;
    }
    return null;
  }
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendEmail(to: string, payload: NotifyPayload): Promise<void> {
  const client = getResend();
  if (!client) return;

  await client.emails.send({
    from: FROM,
    to,
    subject: payload.title,
    html: `
      <h2>${payload.title}</h2>
      <p>${payload.body}</p>
      <p><a href="${payload.url}">Open sheet →</a></p>
    `,
  });
}
