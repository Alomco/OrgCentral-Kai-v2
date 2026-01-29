type GlobalListener = (event: Event) => void;

interface GlobalListenerEntry {
    target: EventTarget;
    type: string;
    options?: AddEventListenerOptions | boolean;
    handlers: Set<GlobalListener>;
    dispatcher: GlobalListener;
}

const globalListeners = new Map<string, GlobalListenerEntry>();

export interface GlobalListenerOptions {
    key: string;
    target: EventTarget;
    type: string;
    handler: GlobalListener;
    options?: AddEventListenerOptions | boolean;
}

export function subscribeGlobalEventListener({
    key,
    target,
    type,
    handler,
    options,
}: GlobalListenerOptions): () => void {
    const existing = globalListeners.get(key);
    if (existing) {
        existing.handlers.add(handler);
        return () => unsubscribeGlobalEventListener(key, handler);
    }

    const handlers = new Set<GlobalListener>([handler]);
    const dispatcher: GlobalListener = (event) => {
        for (const entry of handlers) {
            entry(event);
        }
    };

    globalListeners.set(key, { target, type, options, handlers, dispatcher });
    target.addEventListener(type, dispatcher, options);

    return () => unsubscribeGlobalEventListener(key, handler);
}

function unsubscribeGlobalEventListener(key: string, handler: GlobalListener): void {
    const entry = globalListeners.get(key);
    if (!entry) {
        return;
    }

    entry.handlers.delete(handler);
    if (entry.handlers.size === 0) {
        entry.target.removeEventListener(entry.type, entry.dispatcher, entry.options);
        globalListeners.delete(key);
    }
}