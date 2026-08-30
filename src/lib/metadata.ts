import type { Metadata } from "next";

type CreateMetadataOptions = {
  title: string;
  description?: string;
};

export const createMetadata = ({
  title,
  description,
}: CreateMetadataOptions): Metadata => {
  return {
    title,
    ...(description ? { description } : {}),
  };
};
