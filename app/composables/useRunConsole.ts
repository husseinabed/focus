export interface RunEvent {
  id: string;
  type: 'node';
  nodeId: string;
  nodeType: string;
  status: 'start' | 'success' | 'fail';
  input?: any;
  output?: any;
  error?: any;
  ts: string;
}

export const useRunConsole = () => {
  const events = useState<RunEvent[]>('run-console-events', () => []);
  const status = useState<'idle' | 'running' | 'success' | 'fail'>('run-console-status', () => 'idle');
  const isOpen = useState<boolean>('run-console-open', () => false);

  const clear = () => {
    events.value = [];
    status.value = 'idle';
  };

  const push = (event: RunEvent) => {
    events.value.push(event);
  };

  const list = () => events.value;

  const setStatus = (newStatus: 'idle' | 'running' | 'success' | 'fail') => {
    status.value = newStatus;
  };

  const toggle = (open?: boolean) => {
    if (typeof open === 'boolean') {
      isOpen.value = open;
    } else {
      isOpen.value = !isOpen.value;
    }
  };

  return {
    events,
    status,
    isOpen,
    clear,
    push,
    list,
    setStatus,
    toggle,
  };
};
