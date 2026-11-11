import { handleCC2Request } from '../../server/cc2-handler.mjs';

/** Available on Netlify at POST /api/cc2 when CC2_ENABLED and OPENAI_API_KEY are configured. */
export default async function handler(request) {
  return handleCC2Request(request, process.env);
}
export const config = {path:'/api/cc2',method:'POST'};
