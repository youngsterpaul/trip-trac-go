import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  initialLimit?: number;
  loadMoreLimit?: number;
  threshold?: number;
}

export function useInfiniteScroll<T>(
  fetchFunction: (offset: number, limit: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions = {}
) {
  const {
    initialLimit = 10,
    loadMoreLimit = 20,
    threshold = 0.8
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Initial fetch
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFunction(0, initialLimit);
      setItems(data);
      setOffset(initialLimit);
      setHasMore(data.length === initialLimit);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, initialLimit]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    try {
      const data = await fetchFunction(offset, loadMoreLimit);
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
        setHasMore(data.length === loadMoreLimit);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFunction, offset, loadMoreLimit, hasMore]);

  // Intersection observer callback
  const lastItemRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        loadMore();
      }
    }, {
      threshold,
      rootMargin: '100px'
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, loadMore, threshold]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    lastItemRef,
    fetchInitial,
    setItems
  };
}
