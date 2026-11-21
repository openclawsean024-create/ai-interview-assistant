// app/lib/llm/errors.ts
// provider 與 router 共用的錯誤型別。訊息一律使用固定代碼，不含 API key 或上游原始訊息。

export type LlmErrorKind = 'http' | 'timeout' | 'network' | 'invalid_response';

export class LlmHttpError extends Error {
  readonly kind: LlmErrorKind;
  readonly status?: number;

  constructor(kind: LlmErrorKind, status?: number) {
    super(kind === 'http' ? `openai_${status ?? 'unknown'}` : `openai_${kind}`);
    this.name = 'LlmHttpError';
    this.kind = kind;
    this.status = status;
  }
}

export const AUTH_FAILED_CODE = 'OPENAI_AUTH_FAILED';

/** 401／403：不降級，必須讓使用者知道 key 失效。 */
export class LlmAuthError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(AUTH_FAILED_CODE);
    this.name = 'LlmAuthError';
    this.status = status;
  }
}

export function isAuthError(err: unknown): err is LlmAuthError {
  return err instanceof LlmAuthError || (err as { message?: unknown })?.message === AUTH_FAILED_CODE;
}
