export interface DoubanInfo {
  id: number;
  title: string;
  type: "Movie" | "TVSeries";
  originalTitle: string;
  translatedName: string;
  year: number;
  countries: string;
  officialWebsite: string;
  mainPic: string;
  genres: string;
  languages: string;
  publishDate: string;
  imdbRating: number;
  imdbRatingCount: number;
  imdbId: string;
  douBanRating: number;
  douBanRatingCount: number;
  episodesCount: number;
  sessionCount: number;
  durations: string;
  directors: string;
  actors: string;
  dramatist: string;
  intro: string;
  awards: string;
  tags: string;
}
