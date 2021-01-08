export function isHttpJsonResponse(res: Response) {
  const contentType =
    res?.headers?.get('content-type') ?? res?.headers?.get('Content-Type');

  if (contentType && contentType.includes('application/json')) {
    return true;
  }

  return false;
}
