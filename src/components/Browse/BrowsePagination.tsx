"use client";

import Pagination from "@/components/UI/Pagination";
import { useQueryState } from "nuqs";
import { browseParsers } from "./browse-search-params";

type BrowsePaginationProps = {
  page: number;
  totalPages: number;
};

const BrowsePagination = ({ page, totalPages }: BrowsePaginationProps) => {
  const [, setPage] = useQueryState("page", browseParsers.page);

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={(next) => void setPage(next)}
    />
  );
};

export default BrowsePagination;
