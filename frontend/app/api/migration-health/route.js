// A real Next.js route verifies that the migration runtime is active.
// No filesystem paths, credentials or account data are returned.
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ runtime: 'nextjs', backend: 'local-laravel', snapshot: 'prepared-not-production-verified' },
    { headers: { 'Cache-Control': 'no-store' } });
}
