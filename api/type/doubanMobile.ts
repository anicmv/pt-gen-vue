export interface DoubanMobileSearchResult {
  layout: string;
  typeName: string;
  targetId: string;
  targetType: string;
  target: {
    ratingCount?: number;
    ratingMax?: number;
    ratingStarCount?: number;
    ratingValue?: number;
    controversyReason: string;
    title: string;
    abstract: string;
    hasLinewatch: boolean;
    uri: string;
    coverUrl: string;
    year: string;
    cardSubtitle: string;
    id: string;
    nullRatingReason: string;
    isFollow?: boolean;
    isBadgeChart?: boolean;
  };
}

export interface DoubanMobileSearchResponse {
  success: boolean;
  error?: string;
  data?: DoubanMobileSearchResult[];
}
