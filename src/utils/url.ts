import axios, { CancelTokenSource } from 'axios';
import domainFromPartialUrl from 'domain-from-partial-url';

export const isValidUrl = (value: string) =>
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi.test(
    value,
  ) || /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/.test(value);

export const getDomainFromURL = (url: string): string => domainFromPartialUrl(url);

export const getCorrectUrl = (url: string, https?: boolean) => {
  const protocol = https ? 'https' : 'http';

  return url.startsWith(protocol) ? url : `${protocol}://${url}`;
};

export const getUrlTitle = async (url: string, cancelTokenSource: CancelTokenSource) => {
  const response = await axios.get<string>(getCorrectUrl(url, true), {
    cancelToken: cancelTokenSource.token,
  });

  const { parse } = await import('node-html-parser');

  const root = parse(response.data, {
    blockTextElements: {
      script: false,
      noscript: false,
      style: false,
      pre: false,
    },
  });

  const metaTitleNode = root.querySelector(
    'meta[property="og:title"], meta[property="twitter:title"], meta[property="og:site_name"]',
  );

  if (metaTitleNode) {
    return metaTitleNode.attributes.content;
  }

  const titleNode = root.querySelector('title');

  if (titleNode) {
    return titleNode.text;
  }

  throw new Error('title not found');
};
