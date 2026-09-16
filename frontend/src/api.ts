import { GAS_URL } from './config';

export type ApiResponse<T = Record<string, unknown>> = {
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
  memberId?: string;
  results?: T[];
  duplicate?: boolean;
  duplicateCandidate?: {
    name?: string;
    phone?: string;
    place?: string;
  };
  [key: string]: unknown;
};

export async function postJson<T>(payload: Record<string, unknown>): Promise<ApiResponse<T>> {
  if (!GAS_URL) {
    throw new Error('Google Apps Script URL is not configured. Set VITE_GAS_URL in the frontend environment.');
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script returned HTTP ${response.status}. Verify that VITE_GAS_URL points to an active /exec web app deployment.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : JSON.parse(await response.text());

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response received from the server.');
  }

  return data as ApiResponse<T>;
}
