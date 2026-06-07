import { next, rewrite } from "@vercel/functions";

const SKATTEREVISION_HOST = "skatterevision.twistedstacks.com";

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.hostname === SKATTEREVISION_HOST && shouldServeSkatterevisionPage(url.pathname)) {
    return rewrite(new URL("/skatterevision.html", request.url));
  }

  return next();
}

function shouldServeSkatterevisionPage(pathname: string) {
  if (pathname === "/skatterevision.html") {
    return false;
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/assets/")) {
    return false;
  }

  return true;
}
