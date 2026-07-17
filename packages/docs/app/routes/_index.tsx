import { redirect } from "react-router";

// The legacy docs landing page is retired. The real landing page is the
// marketing site, which owns "/" on www.jami.studio. This route only exists
// so direct hits on the docs deployment (or client-side navigations to "/")
// land on the real homepage instead of a dead route.
export function loader() {
  return redirect("https://www.jami.studio/");
}

export default function Home() {
  return null;
}
