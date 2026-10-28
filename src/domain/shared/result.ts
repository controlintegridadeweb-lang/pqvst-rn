export interface DomainError {
  code: string;
  message: string;
}

export type DomainResult<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export function ok<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}

export function fail<T>(code: string, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}
