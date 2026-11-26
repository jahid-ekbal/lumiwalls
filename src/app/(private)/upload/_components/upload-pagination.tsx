import Pagination from "@/components/UI/Pagination";
import type { UploadStatusFilterType } from "@/lib/zodSchema";
import type { Route } from "next";

type UploadPaginationProps = {
  page: number;
  totalPages: number;
  status: UploadStatusFilterType;
};

const buildHref = (page: number, status: UploadStatusFilterType) => {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return (query ? `/upload?${query}` : "/upload") as Route;
};

const UploadPagination = ({
  page,
  totalPages,
  status,
}: UploadPaginationProps) => {
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      buildHref={(next) => buildHref(next, status)}
    />
  );
};

export default UploadPagination;
