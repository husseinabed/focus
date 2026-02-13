import type { WorkflowNodeSchema } from "~/types/workflow_executer";


import { manualTriggerSchema } from '~~/server/utils/workflow/triggers/manual'
import { leadAddedTriggerSchema } from '~~/server/utils/workflow/triggers/leadAdded'  
import { inboundReplyTriggerSchema } from '~~/server/utils/workflow/triggers/inboundReply'
import { scheduledTriggerSchema } from '~~/server/utils/workflow/triggers/scheduled'

import { loggingNodeSchema } from '~~/server/utils/workflow/actions/logging'
import { doneNodeSchema } from '~~/server/utils/workflow/actions/done'
import { sendEmailNodeSchema } from '~~/server/utils/workflow/actions/email'
import { templateNodeSchema } from '~~/server/utils/workflow/actions/template'
import { bookMeetingNodeSchema } from '~~/server/utils/workflow/actions/book' 

import { decisionNodeSchema } from '~~/server/utils/workflow/utility/decision'
import { routerNodeSchema } from '~~/server/utils/workflow/utility/router'
import { delayNodeSchema } from '~~/server/utils/workflow/utility/delay'


export const list: WorkflowNodeSchema[] = [
  manualTriggerSchema,
  leadAddedTriggerSchema,
  inboundReplyTriggerSchema,
  scheduledTriggerSchema,
  decisionNodeSchema,

  routerNodeSchema,
  loggingNodeSchema,

  doneNodeSchema,


  delayNodeSchema,
  sendEmailNodeSchema,
  templateNodeSchema,
  bookMeetingNodeSchema
]