"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { BrowseWallpaper, UserBoardSummary } from "./browse-types";

type WallpaperInteractionState = {
  favorited: boolean;
  favoriteCount: number;
  downloadCount: number;
  boardIds: string[];
};

type GallerySyncContextValue = {
  boards: UserBoardSummary[];
  addBoard: (board: UserBoardSummary) => void;
  getState: (wallpaper: BrowseWallpaper) => WallpaperInteractionState;
  setFavoriteState: (
    wallpaperId: string,
    favorited: boolean,
    favoriteCount: number,
  ) => void;
  setDownloadCountState: (wallpaperId: string, downloadCount: number) => void;
  toggleBoardMembership: (
    wallpaperId: string,
    boardId: string,
    saved: boolean,
  ) => void;
};

const GallerySyncContext = createContext<GallerySyncContextValue | null>(null);

export function GallerySyncProvider({
  initialWallpapers,
  initialBoards = [],
  children,
}: {
  initialWallpapers: BrowseWallpaper[];
  initialBoards?: UserBoardSummary[];
  children: React.ReactNode;
}) {
  const [boards, setBoards] = useState<UserBoardSummary[]>(initialBoards);
  const [stateMap, setStateMap] = useState<
    Record<string, WallpaperInteractionState>
  >(() => {
    const initial: Record<string, WallpaperInteractionState> = {};
    for (const item of initialWallpapers) {
      initial[item.id] = {
        favorited: item.favoritedByMe,
        favoriteCount: item.favoriteCount,
        downloadCount: item.downloadCount,
        boardIds: item.boardIds ?? [],
      };
    }
    return initial;
  });

  const addBoard = useCallback((board: UserBoardSummary) => {
    setBoards((prev) => {
      if (prev.some((entry) => entry.id === board.id)) {
        return prev;
      }
      return [board, ...prev];
    });
  }, []);

  const getState = useCallback(
    (wallpaper: BrowseWallpaper): WallpaperInteractionState =>
      stateMap[wallpaper.id] ?? {
        favorited: wallpaper.favoritedByMe,
        favoriteCount: wallpaper.favoriteCount,
        downloadCount: wallpaper.downloadCount,
        boardIds: wallpaper.boardIds ?? [],
      },
    [stateMap],
  );

  const setFavoriteState = useCallback(
    (wallpaperId: string, favorited: boolean, favoriteCount: number) => {
      setStateMap((prev) => {
        const current = prev[wallpaperId] ?? {
          favorited: false,
          favoriteCount: 0,
          downloadCount: 0,
          boardIds: [],
        };
        return {
          ...prev,
          [wallpaperId]: {
            ...current,
            favorited,
            favoriteCount,
          },
        };
      });
    },
    [],
  );

  const setDownloadCountState = useCallback(
    (wallpaperId: string, downloadCount: number) => {
      setStateMap((prev) => {
        const current = prev[wallpaperId] ?? {
          favorited: false,
          favoriteCount: 0,
          downloadCount: 0,
          boardIds: [],
        };
        return {
          ...prev,
          [wallpaperId]: {
            ...current,
            downloadCount,
          },
        };
      });
    },
    [],
  );

  const toggleBoardMembership = useCallback(
    (wallpaperId: string, boardId: string, saved: boolean) => {
      setStateMap((prev) => {
        const current = prev[wallpaperId] ?? {
          favorited: false,
          favoriteCount: 0,
          downloadCount: 0,
          boardIds: [],
        };
        const set = new Set(current.boardIds);
        if (saved) {
          set.add(boardId);
        } else {
          set.delete(boardId);
        }
        return {
          ...prev,
          [wallpaperId]: {
            ...current,
            boardIds: [...set],
          },
        };
      });
      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId ?
            {
              ...board,
              itemCount: Math.max(0, board.itemCount + (saved ? 1 : -1)),
            }
          : board,
        ),
      );
    },
    [],
  );

  return (
    <GallerySyncContext.Provider
      value={{
        boards,
        addBoard,
        getState,
        setFavoriteState,
        setDownloadCountState,
        toggleBoardMembership,
      }}>
      {children}
    </GallerySyncContext.Provider>
  );
}

export function useGallerySync() {
  return useContext(GallerySyncContext);
}
