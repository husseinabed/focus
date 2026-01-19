import { createError } from 'h3';

type WorkflowNode = {
  id: string;
  type: string;
  data?: Record<string, any>;
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type RunEventStatus = 'start' | 'success' | 'fail';

export type RunEvent = {
  nodeId: string;
  nodeType: string;
  status: RunEventStatus;
  output?: any;
  error?: string;
  timestamp: string;
};

export type WorkflowExecutionContext = {
  input: Record<string, any>;
  current: Record<string, any>;
  logs: Array<Record<string, any>>;
  sideEffects: Array<Record<string, any>>;
};

export type RunResult = {
  status: 'success' | 'fail';
  output: any;
  context: WorkflowExecutionContext;
  stoppedAtNodeId?: string;
};

type ExecutorOptions = {
  input?: Record<string, any>;
  onEvent?: (event: RunEvent) => void;
  onLog?: (event: any) => void;
  signal?: AbortSignal;
};

type WorkflowDefinition = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

const isDevelopment = () => process.env.NODE_ENV !== 'production';

const logger = (level: string, message: string) => {
  switch (level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'info':
      console.info(message);
      break;
    case 'debug':
      console.debug(message);
      break;
    default:
      console.log(message);
      break;
  }
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        createError({
          statusCode: 499,
          statusMessage: 'Workflow execution aborted.',
        })
      );
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(
        createError({
          statusCode: 499,
          statusMessage: 'Workflow execution aborted.',
        })
      );
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });

const getPathValue = (value: any, path: string) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), value);
};

const substituteContextTokens = (condition: string, context: WorkflowExecutionContext) =>
  condition.replace(/{{\s*context\.([^}]+)\s*}}/g, (_, path) => {
    const value = getPathValue(context, String(path).trim());
    return JSON.stringify(value);
  });

const parseLiteral = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const evaluateCondition = (condition: string, context: WorkflowExecutionContext) => {
  if (!condition || typeof condition !== 'string') return false;
  const substituted = substituteContextTokens(condition, context);
  const match = substituted.match(/^\s*(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*$/);
  if (!match) return false;

  const left = parseLiteral(match[1]);
  const operator = match[2];
  const right = parseLiteral(match[3]);

  switch (operator) {
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return (left as any) > (right as any);
    case '>=':
      return (left as any) >= (right as any);
    case '<':
      return (left as any) < (right as any);
    case '<=':
      return (left as any) <= (right as any);
    default:
      return false;
  }
};

const resolveNextEdge = (
  node: WorkflowNode,
  output: any,
  outgoingEdgesBySource: Map<string, WorkflowEdge[]>
) => {
  const outgoing = outgoingEdgesBySource.get(node.id) || [];
  if (outgoing.length === 0) return null;

  if (node.type === 'decision') {
    const outcome = output === true;
    const handle = outcome ? 'true' : 'false';
    return outgoing.find((edge) => edge.sourceHandle === handle) || null;
  }

  return outgoing.find((edge) => edge.sourceHandle === 'out') || outgoing[0];
};

const getContextSnapshotForLog = (context: WorkflowExecutionContext) => ({
  input: context.input,
  current: context.current,
  sideEffects: context.sideEffects,
});

const executeNode = async (
  node: WorkflowNode,
  input: any,
  context: WorkflowExecutionContext,
  signal?: AbortSignal,
  onLog?: (event: any) => void
) => {
  const data = {
    ...(node.data?.schema?.defaultData ?? {}),
    ...(node.data || {}),
  };

  if (node.type.startsWith('trigger-')) {
    return input;
  }

  switch (node.type) {
    case 'log': {
      const message = data.message;
      const level = data.level ?? 'info';
      const includeContext = data.includeContext ?? true;
    
      logger(level, message)
      onLog?.({level, message})

      context.logs.push({
        type: 'log',
        message,
        level,
        includeContext,
        context: includeContext ? getContextSnapshotForLog(context) : undefined,
        timestamp: new Date().toISOString(),
      });
      return input;
    }
    case 'delay': {
      const duration = Number(data.duration ?? 0);
      const unit = data.unit ?? 'seconds';
      const ms =
        unit === 'hours'
          ? duration * 60 * 60 * 1000
          : unit === 'minutes'
          ? duration * 60 * 1000
          : duration * 1000;
      context.logs.push({
        type: 'delay',
        duration,
        unit,
        skipped: isDevelopment(),
        timestamp: new Date().toISOString(),
      });
 
      if (!isDevelopment() && ms > 0) {
        await sleep(ms, signal);
      }
      return input;
    }
    case 'send-email': {
      const to = data.to;
      const subject = data.subject;
      const body = data.body;
      context.sideEffects.push({
        type: 'send-email',
        to,
        subject,
        body,
        timestamp: new Date().toISOString(),
      });
      return input;
    }
    case 'decision': {
      const condition = data?.condition ?? data?.config?.condition ?? '';
      if (!condition) return false;
      return evaluateCondition(condition, context);
    }
    case 'done': {
      return input;
    }
    default: {
      return input;
    }
  }
};

export const executeWorkflow = async (
  definition: WorkflowDefinition,
  options: ExecutorOptions = {}
): Promise<RunResult> => {
  const nodes = definition.nodes || [];
  const edges = definition.edges || [];

  if (nodes.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workflow definition has no nodes.',
    });
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingEdgesBySource = new Map<string, WorkflowEdge[]>();

  edges.forEach((edge) => {
    const list = outgoingEdgesBySource.get(edge.source) || [];
    list.push(edge);
    outgoingEdgesBySource.set(edge.source, list);
  });

  const startNode =
    nodes.find((node) => node.type?.startsWith('trigger-')) || nodes[0];

  if (!startNode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workflow definition has no start node.',
    });
  }

  const context: WorkflowExecutionContext = {
    input: options.input ?? {},
    current: options.input ?? {},
    logs: [],
    sideEffects: [],
  };

  let currentNode: WorkflowNode | undefined = startNode;
  let currentInput: any = options.input ?? {};
  const maxSteps = Math.max(nodes.length * 5, 20);

  for (let step = 0; currentNode && step < maxSteps; step += 1) {
    if (options.signal?.aborted) {
      return {
        status: 'fail',
        output: currentInput,
        context,
        stoppedAtNodeId: currentNode.id,
      };
    }
    options.onEvent?.({
      nodeId: currentNode.id,
      nodeType: currentNode.type,
      status: 'start',
      timestamp: new Date().toISOString(),
    });

    try {
      context.current = (currentInput ?? {}) as Record<string, any>;
      const output = await executeNode(
        currentNode,
        currentInput,
        context,
        options.signal,
        options?.onLog
      );
      if (options.signal?.aborted) {
        return {
          status: 'fail',
          output: currentInput,
          context,
          stoppedAtNodeId: currentNode.id,
        };
      }
      options.onEvent?.({
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        status: 'success',
        output,
        timestamp: new Date().toISOString(),
      });

      if (currentNode.type === 'done') {
        return {
          status: 'success',
          output,
          context,
          stoppedAtNodeId: currentNode.id,
        };
      }

      const nextEdge = resolveNextEdge(
        currentNode,
        output,
        outgoingEdgesBySource
      );
      if (!nextEdge) {
        return {
          status: 'success',
          output,
          context,
          stoppedAtNodeId: currentNode.id,
        };
      }

      const nextNode = nodesById.get(nextEdge.target);
      if (!nextNode) {
        return {
          status: 'success',
          output,
          context,
          stoppedAtNodeId: currentNode.id,
        };
      }

      currentNode = nextNode;
      currentInput = output;
    } catch (error: any) {
      if (options.signal?.aborted || error?.statusCode === 499) {
        return {
          status: 'fail',
          output: currentInput,
          context,
          stoppedAtNodeId: currentNode.id,
        };
      }
      const message = error?.message || 'Workflow node failed.';
      options.onEvent?.({
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        status: 'fail',
        error: message,
        timestamp: new Date().toISOString(),
      });

      return {
        status: 'fail',
        output: currentInput,
        context,
        stoppedAtNodeId: currentNode.id,
      };
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Workflow execution exceeded safe step limit.',
  });
};
