export type BrowseCategoryOption = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type BrowseTagOption = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type BrowseTagRef = {
  id: string;
  name: string;
  slug: string;
};

export type UserBoardSummary = {
  id: string;
  title: string;
  slug: string;
  isPublicToMembers: boolean;
  itemCount: number;
};

export type BrowseWallpaper = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumb400Url: string | null;
  thumb800Url: string | null;
  thumb1920Url: string | null;
  originalUrl: string | null;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  fileSize: number | null;
  aspectRatio: string | null;
  dominantColors: string[];
  featured: boolean;
  editorsPick: boolean;
  downloadCount: number;
  viewCount: number;
  favoriteCount: number;
  favoritedByMe: boolean;
  boardIds?: string[];
  createdAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  uploader: {
    name: string;
    handle: string | null;
    image: string | null;
  };
  tags: {
    tag: BrowseTagRef;
  }[];
};
