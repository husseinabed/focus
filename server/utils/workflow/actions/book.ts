// ✅ Production-ready Book Meeting node (NEW schema typing)
// - Uses string labels only
// - Uses ObjectSchema config (type/object/properties/required)
// - Adds outputs schema + execute()
// - Branch routing via outputs.success / outputs.failed (works with your updated executor)
// - Safe validation + provider hook (dry-run if none)
// - sideEffect: true, blocking: true

import { NodeContext, WorkflowNodeSchema } from "~/types/workflow_executer";

type MeetingProvider = "calendly" | "google" | "internal";
type MeetingType = "video" | "phone" | "in_person";
type DurationMinutes = "15" | "30" | "45" | "60";

type BookMeetingProvider = {
  book: (args: {
    provider: MeetingProvider;
    calendarId?: string;
    meetingType: MeetingType;
    durationMinutes: number;
    timezone: string;
    attendeeName: string;
    attendeeEmail: string;
    notes?: string;
    ctx: NodeContext;
    input: unknown;
  }) => Promise<{ bookingId?: string; joinUrl?: string; startAt?: string; endAt?: string }>;
};

function isEmailLike(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function clamp(s: string, max = 10_000) {
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function toIntDuration(v: unknown, fallback = 30) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n === 15 || n === 30 || n === 45 || n === 60) return n;
  return fallback;
}

export const bookMeetingNodeSchema: WorkflowNodeSchema = {
  type: "book-meeting",
  category: "actions",
  title: "workflow.nodes.actions.bookMeeting.title",
  component: "ActionBookMeeting",
  icon: "i-lucide-calendar-check",
  hint: "workflow.nodes.actions.bookMeeting.hint",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "In" }],
    outputs: [
      { id: "success", dataType: "flow", label: "Booked" },
      { id: "failed", dataType: "flow", label: "Failed" },
    ],
  },

  // ✅ Inspector config (ObjectSchema)
  config: {
    type: "object",
    required: ["attendeeName", "attendeeEmail"],
    properties: {
      provider: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.provider.label",
        description: "workflow.nodes.actions.bookMeeting.provider.description",
        enum: ["calendly", "google", "internal"],
        default: "internal",
      },
      calendarId: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.calendarId.label",
        description: "workflow.nodes.actions.bookMeeting.calendarId.description",
        placeholder: "primary",
      },
      meetingType: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.meetingType.label",
        enum: ["video", "phone", "in_person"],
        default: "video",
      },
      durationMinutes: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.duration.label",
        enum: ["15", "30", "45", "60"],
        default: "30",
      },
      timezone: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.timezone.label",
        placeholder: "Asia/Jerusalem",
        default: "Asia/Jerusalem",
      },
      attendeeName: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.attendeeName.label",
        required: true,
      },
      attendeeEmail: {
        type: "string",
        label: "workflow.nodes.actions.bookMeeting.attendeeEmail.label",
        required: true,
        format: "email",
      },
      notes: {
        type: "string",
        format: "textarea",
        label: "workflow.nodes.actions.bookMeeting.notes.label",
        placeholder: "workflow.nodes.actions.bookMeeting.notes.placeholder",
      },
      sendConfirmation: {
        type: "boolean",
        label: "workflow.nodes.actions.bookMeeting.sendConfirmation.label",
        default: true,
      },
    },
  },

  // ✅ Outputs schema
  outputs: {
    type: "object",
    properties: {
      success: { type: "json", format: "json", label: "workflow.nodes.actions.bookMeeting.outputs.success" },
      failed: { type: "json", format: "json", label: "workflow.nodes.actions.bookMeeting.outputs.failed" },
      receipt: {
        type: "object",
        required: ["timestamp", "status"],
        properties: {
          timestamp: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.timestamp", required: true },
          status: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.status", required: true },
          provider: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.provider" },
          bookingId: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.bookingId" },
          joinUrl: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.joinUrl" },
          startAt: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.startAt" },
          endAt: { type: "string", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.endAt" },
          error: { type: "json", format: "json", label: "workflow.nodes.actions.bookMeeting.outputs.receipt.error" },
        },
      },
    },
  },

  ui: {
    renderer: "actions",
    tone: "primary",
    width: 360,
  },

  execution: {
    blocking: true,
    sideEffect: true,
  },

  async execute({ config, inputs, ctx }) {
    const payload = (inputs as any)?.in ?? inputs ?? {};

    const provider = String((config as any)?.provider ?? "internal") as MeetingProvider;
    const calendarId = String((config as any)?.calendarId ?? "").trim() || undefined;
    const meetingType = String((config as any)?.meetingType ?? "video") as MeetingType;
    const durationMinutes = toIntDuration((config as any)?.durationMinutes ?? "30", 30);
    const timezone = String((config as any)?.timezone ?? "Asia/Jerusalem").trim() || "Asia/Jerusalem";

    const attendeeName = clamp(String((config as any)?.attendeeName ?? "").trim(), 200);
    const attendeeEmail = String((config as any)?.attendeeEmail ?? "").trim();
    const notes = clamp(String((config as any)?.notes ?? ""), 5000);
    const sendConfirmation = (config as any)?.sendConfirmation !== false;

    if (!attendeeName) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_NAME", message: "attendeeName is required." } };
    }
    if (!attendeeEmail || !isEmailLike(attendeeEmail)) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_EMAIL", message: "attendeeEmail is invalid." } };
    }
    if (!["calendly", "google", "internal"].includes(provider)) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_PROVIDER", message: "Unsupported provider." } };
    }
    if (!["video", "phone", "in_person"].includes(meetingType)) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_MEETING_TYPE", message: "Invalid meetingType." } };
    }

    const timestamp = new Date().toISOString();

    // ✅ Provider injection point (server layer)
    // Pass via ctxData: { meetingProvider: { book(...) { ... } } }
    const meetingProvider = (ctx.data as any)?.meetingProvider as BookMeetingProvider | undefined;

    try {
      if (meetingProvider?.book) {
        const r = await meetingProvider.book({
          provider,
          calendarId,
          meetingType,
          durationMinutes,
          timezone,
          attendeeName,
          attendeeEmail,
          notes: notes || undefined,
          ctx,
          input: payload,
        });

        const receipt = {
          timestamp,
          status: "booked",
          provider,
          bookingId: r?.bookingId,
          joinUrl: r?.joinUrl,
          startAt: r?.startAt,
          endAt: r?.endAt,
          sendConfirmation,
        };

        return {
          status: "success",
          outputs: {
            success: payload, // ✅ branch handle used by executor routing
            receipt,
          },
        };
      }

      // ✅ Dry-run if no provider configured (still success)
      console.log({
        ts: timestamp,
        scope: "workflow",
        nodeType: "book-meeting",
        mode: "dry-run",
        provider,
        calendarId,
        meetingType,
        durationMinutes,
        timezone,
        attendeeName,
        attendeeEmail,
        notesPreview: notes.slice(0, 200),
        sendConfirmation,
      });

      return {
        status: "success",
        outputs: {
          success: payload,
          receipt: {
            timestamp,
            status: "dry-run",
            provider,
            sendConfirmation,
          },
        },
      };
    } catch (e: any) {
      const err = { code: "BOOK_FAILED", message: e?.message || "Failed to book meeting.", details: e };

      return {
        status: "success", // ✅ keep run alive, branch to "failed"
        outputs: {
          failed: payload,
          receipt: {
            timestamp,
            status: "failed",
            provider,
            error: err,
          },
        },
      };
    }
  },
} as const;
