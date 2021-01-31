/**
 * @ignore
 */
export function isHttpJsonResponse(res: Response) {
  const contentType =
    res?.headers?.get('content-type') ?? res?.headers?.get('Content-Type');

  if (contentType && contentType.includes('application/json')) {
    return true;
  }

  return false;
}

/**
 * @ignore
 */
export function isHttpResponse(res: Response) {
  return res instanceof Response;
}

/**
 * @ignore
 */
export function parseError(error: { message: string; status: number }) {
  return {
    message: error.message,
    status: error.status,
  };
}

/**
 * @ignore
 */
export class HttpStatusCodes {
  static OK = 200;
}
