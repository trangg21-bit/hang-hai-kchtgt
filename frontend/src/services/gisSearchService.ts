import api from './api';
import type {
  GisSearchRequest,
  GisSearchResponse,
  SearchHistoryItem,
} from '../types/gisSearch';

export const gisSearchService = {
  /**
   * Execute GIS search with various query types (TEXT, LOCATION, RADIUS, POLYGON, COORDINATE).
   * Max 100 results, 10s timeout.
   */
  async search(request: GisSearchRequest): Promise<GisSearchResponse> {
    const res = await api.post('/search', request);
    return res.data.data;
  },

  /**
   * Get search history (max 20 entries).
   */
  async getHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    const res = await api.get('/search/history', { params: { limit } });
    return res.data.data || [];
  },

  /**
   * Clear all search history.
   */
  async clearHistory(): Promise<void> {
    await api.delete('/search/history');
  },
};
