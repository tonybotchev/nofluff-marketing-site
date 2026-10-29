function payperbookedDestination(host, pathname) {
  const name = String(host || '').split(':')[0].toLowerCase();
  if (name !== 'payperbooked.com' && name !== 'www.payperbooked.com') return '';
  if (pathname === '/' || pathname === '/index.html') return '/pay-per-booking';
  if (pathname === '/pricing' || pathname === '/pricing.html') return '/payperbooked/pricing';
  if (pathname === '/booking' || pathname === '/booking.html') return '/payperbooked/booking';
  if (pathname === '/llms.txt') return '/payperbooked/llms.txt';
  if (pathname === '/robots.txt') return '/payperbooked/robots.txt';
  if (pathname === '/sitemap.xml') return '/payperbooked/sitemap.xml';
  return '';
}

export const config = {
  matcher: ['/', '/index.html', '/pricing', '/pricing.html', '/booking', '/booking.html', '/llms.txt', '/robots.txt', '/sitemap.xml']
};

export default function middleware(request) {
  const url = new URL(request.url);
  const destination = payperbookedDestination(request.headers.get('host'), url.pathname);
  if (!destination) return;
  url.pathname = destination;
  // Same rewrite header as @vercel/functions, without pulling cache, database, and OIDC into this edge bundle.
  return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
}
