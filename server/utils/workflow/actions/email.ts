// ✅ Production-ready sendEmailNodeSchema (matches your NEW schema typing)
// - Uses config as ObjectSchema (type/object/properties/required)
// - Uses string labels only (LocaleLabel = string)
// - Adds outputs schema (receipt + out passthrough)
// - Adds safe execute() with validation + provider hook (dry-run if none)
// - sideEffect: true

import { NodeContext, WorkflowNodeSchema } from "~/types/workflow_executer"

type EmailSendProvider = {
  send: (args: {
    to: string
    subject: string
    body: string
    ctx: NodeContext
  }) => Promise<{ messageId?: string }>
}

function isEmailLike(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function clamp(s: string, max = 10_000) {
  return s.length <= max ? s : s.slice(0, max) + "…"
}

export const sendEmailNodeSchema: WorkflowNodeSchema = {
  type: "send-email",
  category: "actions",
  title: "workflow.nodes.actions.send_email.title",
  icon: "i-lucide-mail",
  hint: "workflow.nodes.actions.send_email.hint",
  component: "ActionSendEmail",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  // ✅ Inspector schema (ObjectSchema)
  config: {
    type: "object",
    required: ["to", "subject", "body"],
    properties: {
      to: {
        type: "string",
        label: "workflow.nodes.actions.send_email.to",
        placeholder: "Recipient email",
        format: "email",
        required: true,
      },
      subject: {
        type: "string",
        label: "workflow.nodes.actions.send_email.subject",
        placeholder: "Email subject",
        required: true,
      },
      body: {
        type: "string",
        
        format: "textarea",
        label: "workflow.nodes.actions.send_email.body",
        placeholder: "Email body",
        required: true,
      },
    },
  },

  // ✅ Outputs schema
  outputs: {
    type: "object",
    properties: {
      out: { type: "json", format: "json", label: "workflow.nodes.actions.send_email.outputs.out" },
      receipt: {
        type: "object",
        required: ["to", "subject", "timestamp", "status"],
        properties: {
          to: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.to", required: true },
          subject: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.subject", required: true },
          timestamp: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.timestamp", required: true },
          status: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.status", required: true },
          provider: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.provider" },
          messageId: { type: "string", label: "workflow.nodes.actions.send_email.outputs.receipt.messageId" },
        },
      },
    },
  },

  ui: {
    renderer: "actions",
    tone: "primary",
    width: 320,
  },

  execution: {
    blocking: false,
    sideEffect: true,
  },

  async execute({ config, inputs, ctx }) {
    const to = String((config as any)?.to ?? "").trim()
    const subject = clamp(String((config as any)?.subject ?? "").trim(), 500)
    const body = clamp(String((config as any)?.body ?? ""), 20_000)

    if (!to || !isEmailLike(to)) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_TO", message: "Invalid recipient email." } }
    }
    if (!subject) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_SUBJECT", message: "Email subject is required." } }
    }
    if (!body) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_BODY", message: "Email body is required." } }
    }

    const provider = (ctx.data as any)?.emailProvider as EmailSendProvider | undefined
    const timestamp = new Date().toISOString()
    let messageId: string | undefined

    try {
      if (provider?.send) {
        const r = await provider.send({ to, subject, body, ctx })
        messageId = r?.messageId
      } else {
        // ✅ safe dry-run if provider not injected
        console.log({
          ts: timestamp,
          scope: "workflow",
          nodeType: "send-email",
          mode: "dry-run",
          to,
          subject,
          bodyPreview: body.slice(0, 200),
        })
      }
    } catch (e: any) {
      return {
        status: "failed",
        outputs: {},
        error: { code: "SEND_FAILED", message: e?.message || "Failed to send email.", details: { to } },
      }
    }

    const payload = (inputs as any)?.in ?? inputs ?? {}

    return {
      status: "success",
      outputs: {
        out: payload,
        receipt: {
          to,
          subject,
          timestamp,
          status: "sent",
          provider: provider?.send ? "custom" : "dry-run",
          ...(messageId ? { messageId } : {}),
        },
      },
    }
  },
} as const
