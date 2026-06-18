import { Resend } from "resend";
import { NotifyPayload } from "../types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "SheetWatch <noreply@sheetwatch.app>";

export async function sendEmail(to: string, payload: NotifyPayload): Promise<void> {
  await resend.emails.send({
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
