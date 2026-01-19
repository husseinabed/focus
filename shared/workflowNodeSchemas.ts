

// Triggers
export const manualTriggerSchema = {
  type: 'trigger-manual',
  category: 'trigger',
  title: 'workflow.nodes.trigger.manual.title',
  component: 'Manual',
  icon: 'i-lucide-mouse-pointer-click',
  hint: 'workflow.nodes.trigger.manual.hint',
  ports: {
    inputs: [],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Start' } }
    ]
  },
  config: {}, // Explicitly define an empty config
  ui: {
    renderer: 'trigger',
    tone: 'primary',
    width: 280
  },
  execution: {
    blocking: false
  }
}
export const leadAddedTriggerSchema = {
  type: 'trigger-lead_added',
  category: 'trigger',
  title: 'workflow.nodes.trigger.lead_added.title',
  icon: 'i-lucide-user-plus',
  hint: 'workflow.nodes.trigger.lead_added.hint',
  component: 'LeadAdded',
  ports: {
    inputs: [],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Start' } }
    ]
  },
  config: {
    source: {
      type: 'enum',
      label: 'workflow.nodes.trigger.lead_added.source',
      options: ['all', 'manual', 'scrape', 'import'],
      default: 'all',
    },
    min_priority: {
      type: 'number',
      label: 'workflow.nodes.trigger.lead_added.min_priority',
      default: 1,
      min: 1,
      max: 5,
    }
  },
  ui: {
    renderer: 'trigger',
    tone: 'primary',
    width: 280
  },
  execution: {
    blocking: false
  }
}

export const inboundReplyTriggerSchema = {
  type: 'trigger-inbound_reply',
  category: 'trigger',
  title: 'workflow.nodes.trigger.inbound_reply.title',
  icon: 'i-lucide-message-square-reply',
  hint: 'workflow.nodes.trigger.inbound_reply.hint',
  component: "InboundReply",
  ports: {
    inputs: [],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Start' } }
    ]
  },
  config: {
    inbox_id: {
      type: 'string',
      label: 'workflow.nodes.trigger.inbound_reply.inbox_id',
      placeholder: 'Enter inbox ID',
      required: true,
    },
    keywords: {
      type: 'string',
      label: 'workflow.nodes.trigger.inbound_reply.keywords',
      placeholder: 'Comma-separated keywords (optional)',
      optional: true,
    }
  },
  ui: {
    renderer: 'trigger',
    tone: 'primary',
    width: 280
  },
  execution: {
    blocking: false
  }
}

export const scheduledTriggerSchema = {
  type: 'trigger-scheduled',
  category: 'trigger',
  title: 'workflow.nodes.trigger.scheduled.title',
  icon: 'i-lucide-clipboard-clock',
  hint: 'workflow.nodes.trigger.scheduled.hint',
  component: "Scheduled",
  ports: {
    inputs: [],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Start' } }
    ]
  },
  config: {
    cron_expression: {
      type: 'string',
      label: 'workflow.nodes.trigger.scheduled.cron_expression',
      placeholder: 'e.g., 0 0 * * * (daily at midnight)',
      required: true,
    }
  },
  ui: {
    renderer: 'trigger',
    tone: 'primary',
    width: 280
  },
  execution: {
    blocking: false
  }
}

// Actions
export const loggingNodeSchema = {
  type: 'log',
  category: 'actions',
  title: 'workflow.nodes.actions.log.title',
  component: 'ActionLog',
  icon: 'i-lucide-file-text',
  hint: 'workflow.nodes.utility.logging.hint',
  ports: {
    inputs: [
      { id: 'in', dataType: 'flow', label: { en: 'In' } }
    ],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Out' } }
    ]
  },

  config: {
    level: {
      type: 'string',
      label: 'workflow.nodes.actions.log.level.label',
      description: 'workflow.nodes.actions.log.level.description',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },

    message: {
      type: 'string',
      format: "textarea",
      label: 'workflow.nodes.actions.log.message.label',
      description: 'workflow.nodes.actions.log.message.description',
      placeholder: 'workflow.nodes.actions.log.message.placeholder',
      required: true
    },

    includeContext: {
      type: 'boolean',
      label: 'workflow.nodes.actions.log.includeContext.label',
      description: 'workflow.nodes.actions.log.includeContext.description',
      default: true
    }
  },
  ui: {
    renderer: 'actions',
    tone: 'neutral',
    width: 320
  },

  execution: {
    blocking: false,
    sideEffect: true
  }
}


export const doneNodeSchema = {
  type: 'done',
  category: 'actions',
  title: 'workflow.nodes.actions.done.title',

  icon: 'i-lucide-check-circle',
  hint: 'workflow.nodes.actions.done.hint',
  component: "ActionDone",


  ports: {
    inputs: [
      { id: 'in', dataType: 'flow', label: { en: 'In' } }
    ],
    outputs: []
  },

  ui: {
    renderer: 'actions',
    tone: 'success',
    width: 240
  },

  execution: {
    blocking: true,
    terminal: true
  }
}

export const decisionNodeSchema = {
  type: 'decision',
  category: 'actions',
  title: 'workflow.nodes.actions.decision.title',

  icon: 'i-lucide-git-commit',
  hint: 'workflow.nodes.actions.decision.hint',
  component: "ActionDecision",


  ports: {
    inputs: [
      { id: 'in', dataType: 'flow', label: { en: 'In' } }
    ],
    outputs: [
      { id: 'true', dataType: 'flow', label: { en: 'True' } },
      { id: 'false', dataType: 'flow', label: { en: 'False' } }
    ]
  },

  config: {
    condition: {
      type: 'string',
      label: 'workflow.nodes.actions.decision.condition',
      placeholder: 'e.g., {{lead.priority}} > 3',
      required: true
    }
  },

  ui: {
    renderer: 'actions',
    tone: 'orange',
    width: 280
  },

  execution: {
    blocking: false
  }
}

export const delayNodeSchema = {
  type: 'delay',
  category: 'actions',
  title: 'workflow.nodes.actions.delay.title',

  icon: 'i-lucide-timer',
  hint: 'workflow.nodes.actions.delay.hint',
  component: "ActionDelay",



  ports: {
    inputs: [
      { id: 'in', dataType: 'flow', label: { en: 'In' } }
    ],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Out' } }
    ]
  },

  config: {
    duration: {
      type: 'number',
      label: 'workflow.nodes.actions.delay.duration',
      placeholder: 'e.g., 60 (seconds)',
      required: true,
      min: 1
    },
    unit: {
      type: 'string',
      label: 'workflow.nodes.actions.delay.unit',
      enum: ['seconds', 'minutes', 'hours'],
      default: 'seconds'
    }
  },

  ui: {
    renderer: 'actions',
    tone: 'yellow',
    width: 280
  },

  execution: {
    blocking: true
  }
}

export const sendEmailNodeSchema = {
  type: 'send-email',
  category: 'actions',
  title: 'workflow.nodes.actions.send_email.title',

  icon: 'i-lucide-mail',
  hint: 'workflow.nodes.actions.send_email.hint',
  component: "ActionSendEmail",



  ports: {
    inputs: [
      { id: 'in', dataType: 'flow', label: { en: 'In' } }
    ],
    outputs: [
      { id: 'out', dataType: 'flow', label: { en: 'Out' } }
    ]
  },

  config: {
    to: {
      type: 'string',
      label: 'workflow.nodes.actions.send_email.to',
      placeholder: 'Recipient email',
      required: true
    },
    subject: {
      type: 'string',
      label: 'workflow.nodes.actions.send_email.subject',
      placeholder: 'Email subject',
      required: true
    },
    body: {
      type: 'string',
      format: 'textarea',
      label: 'workflow.nodes.actions.send_email.body',
      placeholder: 'Email body',
      required: true
    }
  },

  ui: {
    renderer: 'actions',
    tone: 'blue',
    width: 320
  },

  execution: {
    blocking: false,
    sideEffect: true
  }
}


export const list = [
  manualTriggerSchema,
  loggingNodeSchema,
  doneNodeSchema,
  leadAddedTriggerSchema,
  inboundReplyTriggerSchema,
  scheduledTriggerSchema,
  decisionNodeSchema,
  delayNodeSchema,
  sendEmailNodeSchema
]