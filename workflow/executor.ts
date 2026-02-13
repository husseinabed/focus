// ✅ FIX: routing must NOT depend on outputs having "out".
// ✅ FIX: buildNodeInputs must NOT treat sourceHandle ("out") as an output key for flow edges.
// ✅ ADD: port-aware routing using handles (out/success/failed) + done-node stop.

import { v4 as uuidv4 } from "uuid";
import { list as nodeSchemas } from "~~/shared/workflowNodeSchemas";

// -----------------------------
// Graph types
// -----------------------------
export type WorkflowNode = {
  id: string;
  type: string;
  data?: Record<string, any>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null; // routing handle (flow port id): out/success/failed
  targetHandle?: string | null; // input handle id: in, etc.
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

// -----------------------------
// Runtime types
// -----------------------------
export type NodeContext = {
  runId: string;
  workflowId: string;
  nodeId: string;
  now: string;
  locale?: string;
  data?: Record<string, unknown>;
};

export type ExecuteResult<TOutputs extends Record<string, unknown> = Record<string, unknown>> = {
  status: "success" | "failed";
  outputs: TOutputs;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
};

export type RunEventStatus = "start" | "success" | "fail";

export type RunEvent = {
  id: string;
  type: "run-start" | "run-success" | "run-fail" | "node-start" | "node-success" | "node-fail" | "log";
  nodeId?: string;
  nodeType?: string;
  status?: RunEventStatus;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  ts: string;
};

export type WorkflowExecutionContext = {
  input: Record<string, any>;
  output: Record<string, any>;
  sideEffects: Array<Record<string, any>>;
};

// -----------------------------
// Errors
// -----------------------------
export class WorkflowExecutionError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, opts?: { statusCode?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "WorkflowExecutionError";
    this.statusCode = opts?.statusCode ?? 400;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

// -----------------------------
// Options
// -----------------------------
type ExecutorOptions = {
  workflowId?: string;
  locale?: string;
  ctxData?: Record<string, unknown>;
  signal?: AbortSignal;
  onEvent?: (event: RunEvent) => void;
  debug?: boolean;
  maxSteps?: number;
  maxQueue?: number;

  doneNodeTypes?: string[]; // default: ['done', 'utility-done']
};

export class WorkflowExecutor {
  readonly runId: string = uuidv4();
  readonly workflowId: string;

  private readonly options: Required<Pick<ExecutorOptions, "debug" | "maxSteps" | "maxQueue">> &
    Omit<ExecutorOptions, "debug" | "maxSteps" | "maxQueue">;

  private readonly nodes: WorkflowNode[];
  private readonly edges: WorkflowEdge[];

  private readonly nodesMap: Map<string, WorkflowNode>;
  private readonly incomingEdgesMap: Map<string, WorkflowEdge[]>;
  private readonly outgoingEdgesMap: Map<string, WorkflowEdge[]>;

  private readonly logs: Array<Record<string, any>> = [];

  readonly context: WorkflowExecutionContext = {
    input: {},
    output: {},
    sideEffects: [],
  };

  constructor(graph: WorkflowGraph, options: ExecutorOptions = {}) {
    this.options = {
      debug: options.debug ?? false,
      maxSteps: options.maxSteps ?? 10_000,
      maxQueue: options.maxQueue ?? 10_000,
      ...options,
    };

    this.workflowId = options.workflowId ?? "workflow";
    this.nodes = graph.nodes ?? [];
    this.edges = graph.edges ?? [];

    this.nodesMap = new Map(this.nodes.map((n) => [n.id, n]));
    this.incomingEdgesMap = new Map();
    this.outgoingEdgesMap = new Map();

    for (const e of this.edges) {
      const outArr = this.outgoingEdgesMap.get(e.source) ?? [];
      outArr.push(e);
      this.outgoingEdgesMap.set(e.source, outArr);

      const inArr = this.incomingEdgesMap.get(e.target) ?? [];
      inArr.push(e);
      this.incomingEdgesMap.set(e.target, inArr);
    }
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  getLogs() {
    return [...this.logs];
  }
  resetLogs() {
    this.logs.length = 0;
  }

  private isDoneNode(node: WorkflowNode) {
    const doneTypes = this.options.doneNodeTypes ?? ["done", "utility-done"];
    return doneTypes.includes(node.type);
  }

  private getDoneNodes() {
    return this.nodes.filter((n) => this.isDoneNode(n));
  }

  private getSingleTriggerNode(): WorkflowNode {
    const trigger = this.nodes.find((n) => n.type?.startsWith("trigger-"));
    if (!trigger) {
      throw new WorkflowExecutionError("Trigger node not found (unexpected).", { statusCode: 500, code: "TRIGGER_MISSING" });
    }
    return trigger;
  }

  // -----------------------------
  // Validation
  // -----------------------------
  private validateConnectedAndLeadsToDone() {
    const trigger = this.getSingleTriggerNode();
    const doneNodes = this.getDoneNodes();

    if (doneNodes.length === 0) {
      throw new WorkflowExecutionError("Workflow graph has no done node.", { statusCode: 400, code: "NO_DONE" });
    }

    // Reachable from trigger
    const reachable = new Set<string>([trigger.id]);
    const q1: string[] = [trigger.id];

    while (q1.length) {
      const id = q1.shift()!;
      for (const e of this.outgoingEdgesMap.get(id) ?? []) {
        if (!reachable.has(e.target)) {
          reachable.add(e.target);
          q1.push(e.target);
        }
      }
    }

    const disconnected = this.nodes.map((n) => n.id).filter((id) => !reachable.has(id));
    if (disconnected.length) {
      throw new WorkflowExecutionError("Workflow graph has disconnected nodes (not reachable from trigger).", {
        statusCode: 400,
        code: "DISCONNECTED_NODES",
        details: { nodeIds: disconnected },
      });
    }

    // Can reach a done (reverse BFS from all done nodes)
    const canReachDone = new Set<string>();
    const q2: string[] = [];

    for (const dn of doneNodes) {
      canReachDone.add(dn.id);
      q2.push(dn.id);
    }

    while (q2.length) {
      const id = q2.shift()!;
      for (const e of this.incomingEdgesMap.get(id) ?? []) {
        if (!canReachDone.has(e.source)) {
          canReachDone.add(e.source);
          q2.push(e.source);
        }
      }
    }

    const deadEnds = this.nodes.filter((n) => !canReachDone.has(n.id)).map((n) => n.id);
    if (deadEnds.length) {
      throw new WorkflowExecutionError("Some nodes do not lead to a done node.", {
        statusCode: 400,
        code: "NO_PATH_TO_DONE",
        details: { nodeIds: deadEnds },
      });
    }

    const doneReachable = doneNodes.some((n) => reachable.has(n.id));
    if (!doneReachable) {
      throw new WorkflowExecutionError("Done node exists but is not reachable from trigger.", {
        statusCode: 400,
        code: "DONE_NOT_REACHABLE",
        details: { doneNodeIds: doneNodes.map((n) => n.id) },
      });
    }
  }

  private validateGraph() {
    if (!Array.isArray(this.nodes) || this.nodes.length === 0) {
      throw new WorkflowExecutionError("Workflow graph has no nodes.", { statusCode: 400, code: "NO_NODES" });
    }

    const triggers = this.nodes.filter((n) => n.type?.startsWith("trigger-"));
    if (triggers.length === 0) {
      throw new WorkflowExecutionError("Workflow graph has no trigger node.", { statusCode: 400, code: "NO_TRIGGER" });
    }
    if (triggers.length > 1) {
      throw new WorkflowExecutionError("Workflow graph has more than one trigger node.", {
        statusCode: 400,
        code: "MULTIPLE_TRIGGERS",
        details: { triggerIds: triggers.map((t) => t.id) },
      });
    }

    for (const e of this.edges) {
      if (!this.nodesMap.has(e.source)) {
        throw new WorkflowExecutionError(`Edge source node not found: ${e.source}`, { statusCode: 400, code: "EDGE_INVALID", details: e });
      }
      if (!this.nodesMap.has(e.target)) {
        throw new WorkflowExecutionError(`Edge target node not found: ${e.target}`, { statusCode: 400, code: "EDGE_INVALID", details: e });
      }
    }

    this.validateConnectedAndLeadsToDone();
  }

  // -----------------------------
  // Inputs wiring (FIXED)
  // -----------------------------
  private buildNodeInputs(node: WorkflowNode): Record<string, any> {
    if (node.type?.startsWith("trigger-")) {
      return { ...this.context.input, in: this.context.input };
    }

    const incoming = this.incomingEdgesMap.get(node.id) ?? [];
    const inputs: Record<string, any> = {};

    for (const edge of incoming) {
      const upstreamOut = this.context.output[edge.source];
      if (upstreamOut == null) continue;

      const targetKey = (edge.targetHandle || "in").trim() || "in";
      const sourceKey = (edge.sourceHandle || "").trim();

      // ✅ If sourceHandle matches an emitted output key, pass that payload
      if (
        sourceKey &&
        upstreamOut &&
        typeof upstreamOut === "object" &&
        Object.prototype.hasOwnProperty.call(upstreamOut, sourceKey)
      ) {
        inputs[targetKey] = (upstreamOut as any)[sourceKey];
      } else {
        // fallback: pass whole outputs object
        inputs[targetKey] = upstreamOut;
      }
    }

    inputs.$input = this.context.input;
    return inputs;
  }

  // -----------------------------
  // Schema lookup
  // -----------------------------
  private getSchema(nodeType: string): any {
    const schema = nodeSchemas.find((s: any) => s.type === nodeType);
    if (!schema) {
      throw new WorkflowExecutionError(`Workflow node schema not found for type: ${nodeType}`, {
        statusCode: 400,
        code: "SCHEMA_NOT_FOUND",
        details: { nodeType },
      });
    }
    return schema;
  }

  // -----------------------------
  // Routing (FIXED)
  // -----------------------------
  private enqueueNext(queue: string[], node: WorkflowNode, result: ExecuteResult<Record<string, unknown>>) {
    const outEdges = this.outgoingEdgesMap.get(node.id) ?? [];
    const outputs = (result.outputs && typeof result.outputs === "object") ? result.outputs : {};

    for (const edge of outEdges) {
      const h = (edge.sourceHandle || "out").trim() || "out";

      // ✅ Standard routing handles
      if (h === "out") {
        // "out" always continues (even if outputs.out missing)
        queue.push(edge.target);
        continue;
      }

      if (h === "success") {
        if (result.status === "success") queue.push(edge.target);
        continue;
      }

      if (h === "fail" || h === "failed") {
        if (result.status === "failed") queue.push(edge.target);
        continue;
      }

      // ✅ Conditional/branch handles (decision: true/false, etc.)
      // Only route if the node actually emitted that handle in outputs
      if (Object.prototype.hasOwnProperty.call(outputs, h)) {
        queue.push(edge.target);
        continue;
      }

      // Otherwise skip (prevents accidentally taking both decision branches)
    }
  }

  // -----------------------------
  // Run
  // -----------------------------
  async execute(input: Record<string, any>) {
    this.throwIfAborted();
    this.validateGraph();

    this.context.input = input ?? {};
    this.context.output = {};
    this.context.sideEffects = [];

    this.emit({ type: "run-start", status: "start", input: this.context.input });

    const trigger = this.getSingleTriggerNode();
    const queue: string[] = [trigger.id];

    let steps = 0;

    while (queue.length > 0) {
      this.throwIfAborted();

      if (steps++ > this.options.maxSteps) {
        const err = new WorkflowExecutionError("Workflow exceeded maxSteps safety limit.", {
          statusCode: 400,
          code: "MAX_STEPS",
          details: { maxSteps: this.options.maxSteps },
        });
        this.emit({ type: "run-fail", status: "fail", error: serializeError(err) });
        throw err;
      }

      if (queue.length > this.options.maxQueue) {
        const err = new WorkflowExecutionError("Workflow exceeded maxQueue safety limit.", {
          statusCode: 400,
          code: "MAX_QUEUE",
          details: { maxQueue: this.options.maxQueue, queueLength: queue.length },
        });
        this.emit({ type: "run-fail", status: "fail", error: serializeError(err) });
        throw err;
      }

      const nodeId = queue.shift()!;
      const node = this.nodesMap.get(nodeId);



      if (!node) continue;

      // ✅ Stop expanding after Done node (still records its outputs)
      const isDone = this.isDoneNode(node);

      const nodeInputs = this.buildNodeInputs(node);
      const schema = this.getSchema(node.type);

      this.emit({ type: "node-start", nodeId: node.id, nodeType: node.type, status: "start", input: nodeInputs });

      const nodeCtx: NodeContext = {
        runId: this.runId,
        workflowId: this.workflowId,
        nodeId: node.id,
        now: new Date().toISOString(),
        locale: this.options.locale,
        data: this.options.ctxData,
      };

      let result: ExecuteResult<Record<string, unknown>>;
      try {

        if (typeof schema.execute !== "function") {
          result = { status: "success", outputs: { ...nodeInputs } };
        } else {


          const config = ({
            ...(node.data?.schema?.defaultData ?? {}),
            ...(node.data || {}),
          }) as any;

          const r = await schema.execute({ config, inputs: nodeInputs, ctx: nodeCtx });

          result = normalizeExecuteResult(r);
        }
      } catch (e: any) {
        const errObj = serializeError(e);
        this.emit({ type: "node-fail", nodeId: node.id, nodeType: node.type, status: "fail", input: nodeInputs, error: errObj });
        this.emit({ type: "run-fail", status: "fail", error: errObj });
        throw toWorkflowError(e);
      }

      this.context.output[node.id] = result.outputs;

      if (result.status === "failed") {
        this.emit({
          type: "node-fail",
          nodeId: node.id,
          nodeType: node.type,
          status: "fail",
          input: nodeInputs,
          output: result.outputs,
          error: result.error ?? { message: "Node returned failed status." },
        });

        this.emit({ type: "run-fail", status: "fail", error: result.error ?? { message: "Node returned failed status." }, output: this.context.output });

        throw new WorkflowExecutionError(result.error?.message ?? "Node failed.", {
          statusCode: 400,
          code: result.error?.code ?? "NODE_FAILED",
          details: result.error?.details,
        });
      }

      this.emit({ type: "node-success", nodeId: node.id, nodeType: node.type, status: "success", input: nodeInputs, output: result.outputs });

      if (schema.execution?.sideEffect) {
        this.context.sideEffects.push({
          nodeId: node.id,
          nodeType: node.type,
          at: new Date().toISOString(),
          outputs: result.outputs,
        });
      }

      // ✅ Only enqueue next nodes if not done
      if (!isDone) {
        this.enqueueNext(queue, node, result);
      }
    }

    this.emit({ type: "run-success", status: "success", output: this.context.output });
    return this.context.output;
  }

  // -----------------------------
  // Events & logging
  // -----------------------------
  private emit(partial: Omit<RunEvent, "id" | "ts">) {
    const event: RunEvent = { id: uuidv4(), ts: new Date().toISOString(), ...partial };
    this.options.onEvent?.(event);

    if (this.options.debug && event.type === "log") {
      // eslint-disable-next-line no-console
      console.log("[Workflow]", event);
    }
  }

  log(message: string, data?: Record<string, any>) {
    const entry = { message, ...(data ?? {}), ts: new Date().toISOString() };
    this.logs.push(entry);
    this.emit({ type: "log", input: entry });
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.log("[Workflow Log]", entry);
    }
  }

  private throwIfAborted() {
    if (this.options.signal?.aborted) {
      throw new WorkflowExecutionError("Workflow execution aborted.", { statusCode: 499, code: "ABORTED" });
    }
  }
}

// -----------------------------
// Utils
// -----------------------------
function normalizeExecuteResult(r: any): ExecuteResult<Record<string, unknown>> {
  if (!r || typeof r !== "object") return { status: "success", outputs: {} };

  const status = r.status === "failed" ? "failed" : "success";
  const outputs = r.outputs && typeof r.outputs === "object" ? r.outputs : {};
  const error =
    r.error && typeof r.error === "object"
      ? r.error
      : r.error
        ? { message: String(r.error) }
        : undefined;

  return { status, outputs, error };
}

function serializeError(e: any) {
  if (!e) return { message: "Unknown error" };
  if (e instanceof WorkflowExecutionError) {
    return { name: e.name, message: e.message, statusCode: e.statusCode, code: e.code, details: e.details, stack: e.stack };
  }
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { message: typeof e === "string" ? e : "Unknown error", raw: e };
}

function toWorkflowError(e: any) {
  if (e instanceof WorkflowExecutionError) return e;
  if (e instanceof Error) return new WorkflowExecutionError(e.message, { statusCode: 500, code: "UNHANDLED", details: { name: e.name } });
  return new WorkflowExecutionError("Unhandled error.", { statusCode: 500, code: "UNHANDLED", details: e });
}
