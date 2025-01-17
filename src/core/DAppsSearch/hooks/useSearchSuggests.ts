import { useAppsListStore, useConnectedAppsList } from '$store';
import { isValidUrl } from '$utils';
import uniqBy from 'lodash/uniqBy';
import { useCallback, useMemo, useRef } from 'react';
import { ISearchSuggest, SearchSuggestSource } from '../types';

export const useSearchSuggests = (query: string) => {
  const appsList = useAppsListStore((s) => s.appsList);

  const connectedApps = useConnectedAppsList();

  const allApps = useMemo(
    () => uniqBy([...connectedApps, ...appsList], 'url'),
    [appsList, connectedApps],
  );

  const searchSuggestsRef = useRef<ISearchSuggest[]>([]);

  const searchSuggests = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery.length === 0) {
      return [];
    }

    const result: ISearchSuggest[] = [];

    const isUrl = isValidUrl(trimmedQuery);

    if (isUrl) {
      result.push({ url: trimmedQuery, source: SearchSuggestSource.DIRECT_LINK });
    }

    // TODO: redo as SearchIndexer
    const appsSuggests = allApps
      .filter(
        (app) =>
          app.name.toLowerCase().includes(trimmedQuery) ||
          app.url.toLowerCase().includes(trimmedQuery),
      )
      .sort((a, b) => {
        if (
          a.name.toLowerCase().startsWith(trimmedQuery) &&
          !b.name.toLowerCase().startsWith(trimmedQuery)
        ) {
          return -1;
        }
        if (
          b.name.toLowerCase().startsWith(trimmedQuery) &&
          !a.name.toLowerCase().startsWith(trimmedQuery)
        ) {
          return 1;
        }
        return 0;
      })
      .map((app) => ({ ...app, source: SearchSuggestSource.APP }));

    result.push(...appsSuggests.slice(0, 3));

    return result;
  }, [allApps, query]);

  searchSuggestsRef.current = searchSuggests;

  const getFirstSuggest = useCallback((): ISearchSuggest | null => {
    const firstSuggest = searchSuggestsRef.current[0];

    return firstSuggest ?? null;
  }, []);

  return { searchSuggests, getFirstSuggest };
};
