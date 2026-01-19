export type RunEvent = {
  nodeId: string;
  nodeType: string;
  status: 'start' | 'success' | 'fail';
  output?: any;
  error?: string;
  timestamp: string;
};

export type RunResult = {
  status: 'success' | 'fail';
  output: any;
  context: Record<string, any>;
  stoppedAtNodeId?: string;
};

type WorkflowRunnerOptions = {
  getNodes: () => any[];
  setNodes: (nodes: any[]) => void;
  input?: Record<string, any>;
  onEvent?: (event: MessageEvent, type: string) => void;
};

const mapStatusToRuntime = (status: RunEvent['status']) => {
  switch (status) {
    case 'start':
      return 'running';
    case 'success':
    case 'fail':
      return status;
    default:
      return 'idle';
  }
};

const updateNodeRuntime = (node: any, event: RunEvent) => {
  const error =
    typeof event.error === 'string' ? event.error : (event.error as any)?.message;

  return {
    ...node,
    data: {
      ...(node.data ?? {}),
      runtime: {
        ...node.data?.runtime,
        status: mapStatusToRuntime(event.status),
        lastEvent: event,
        error: event.status === 'fail' ? error : undefined,
      },
    },
  };
};

const resetNodeRuntime = (node: any) => ({
  ...node,
  data: {
    ...(node.data ?? {}),
    runtime: {
      ...node.data?.runtime,
      status: 'idle',
    },
  },
});

export const useWorkflowRunner = () => {
  const runWorkflow = (
    workflowId: string,
    { getNodes, setNodes, input, onEvent }: WorkflowRunnerOptions
  ) => {


    return new Promise<RunResult>((resolve, reject) => {
      if (typeof EventSource === 'undefined') {
        reject(new Error('EventSource is not available in this environment.'));
        return;
      }

      const params = new URLSearchParams();
      if (input) {
        params.set('input', JSON.stringify(input));
      }

      const query = params.toString();
      // Note: query string input can exceed URL limits; consider a POST+runId flow later.
      const url = query ? `/api/workflows/${workflowId}/run?${query}` : `/api/workflows/${workflowId}/run`;
      setNodes(getNodes().map(resetNodeRuntime))

      const source = new EventSource(url);
      let settled = false;

      const closeSource = () => {
        source.close();
      };

      const finalize = (action: () => void) => {
        if (settled) return;
        settled = true;
        closeSource();
        action();
      };

      source.addEventListener('node', (event) => {


        onEvent?.(event as MessageEvent, 'node');
        const runEvent = JSON.parse((event as MessageEvent).data) as RunEvent;

        const nodes = getNodes();
        const updated = nodes.map((node) =>
          node.id === runEvent.nodeId ? updateNodeRuntime(node, runEvent) : node
        );

        setNodes(updated);
      });

      source.addEventListener('started', (event) => {
        onEvent?.(event as MessageEvent, 'started');
        // no-op; keep for future telemetry hooks
      });

      source.addEventListener('ping', (event) => {
        onEvent?.(event as MessageEvent, 'ping');
        // keep alive
      });

      source.addEventListener('finished', (event) => {
        onEvent?.(event as MessageEvent, 'finished');
        const result = JSON.parse((event as MessageEvent).data) as RunResult;
        finalize(() => resolve(result));
      });

      source.addEventListener('error', (event) => {
        onEvent?.(event as MessageEvent, 'error');
        if ('data' in event && (event as MessageEvent).data) {
          const raw = (event as MessageEvent).data
          try {
            const payload = raw ? JSON.parse(raw) : null
            finalize(() => reject(new Error(payload?.message || 'Workflow run failed.')))
          } catch {
            finalize(() => reject(new Error(raw || 'Workflow run failed.')))
          }
        }
      });


      // log node listenr
      source.addEventListener('log', (event) => {

        if ('data' in event && event.data) {
          const raw = event.data
          const { level, message } = raw ? JSON.parse(raw) : null

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

        }

      })

      source.onerror = (event) => {
        onEvent?.(event as MessageEvent, 'error');
        if (settled) return;
        finalize(() => reject(new Error('Workflow run failed.')));
      };
    });
  };

  return {
    runWorkflow,
  };
};
