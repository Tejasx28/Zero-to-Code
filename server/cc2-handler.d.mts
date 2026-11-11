export function handleCC2Request(request: Request, env?: Record<string,string|undefined>, upstreamFetch?: typeof fetch): Promise<Response>;
export function validateTutorRequest(payload: unknown): {message:string;context:unknown;history:{role:'user'|'assistant';content:string}[]} | null;
