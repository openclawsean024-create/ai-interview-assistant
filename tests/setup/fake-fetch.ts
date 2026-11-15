// tests/setup/fake-fetch.ts
// 假 fetch：只在記憶體內回應，永不碰網路。用來模擬 AI 供應商的 HTTP 行為。

export interface FakeCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export type FakeResponder = (call: FakeCall, signal?: AbortSignal | null) => Response | Promise<Response>;

export interface FakeFetch {
  fetch: typeof fetch;
  calls: FakeCall[];
}

function headersToObject(h: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  new Headers(h).forEach((v, k) => {
    out[k.toLowerCase()] = v;
  });
  return out;
}

export function createFakeFetch(responder: FakeResponder): FakeFetch {
  const calls: FakeCall[] = [];
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    let body: unknown = undefined;
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const call: FakeCall = {
      url,
      method: (init?.method ?? 'GET').toUpperCase(),
      headers: headersToObject(init?.headers),
      body,
    };
    calls.push(call);
    return responder(call, init?.signal);
  }) as typeof fetch;
  return { fetch: fakeFetch, calls };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 模擬 OpenAI Chat Completions 成功回應，content 為 JSON 字串。 */
export function chatCompletion(content: unknown): Response {
  return jsonResponse(200, {
    id: 'chatcmpl-fake-0000',
    choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(content) } }],
  });
}

/** 模擬永遠不回應、只會在 abort 時以 AbortError 結束的連線（用來測 timeout）。 */
export function hangUntilAborted(signal?: AbortSignal | null): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const abort = () => {
      const err = new Error('The operation was aborted.');
      err.name = 'AbortError';
      reject(err);
    };
    if (!signal) return; // 沒有 signal 就永遠懸掛（測試會因此逾時而失敗）
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
  });
}
