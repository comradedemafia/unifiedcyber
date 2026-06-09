import { Helmet } from "react-helmet-async";

const SITE = "https://unified-cyber-guard.lovable.app";

interface PageHeadProps {
  title: string;
  description: string;
  path: string;
}

/**
 * Per-route SEO head: unique title, description, canonical, and og:* tags.
 * Keep `path` as a leading-slash route (e.g. "/login", "/").
 */
export const PageHead = ({ title, description, path }: PageHeadProps) => {
  const url = `${SITE}${path === "/" ? "/" : path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default PageHead;
