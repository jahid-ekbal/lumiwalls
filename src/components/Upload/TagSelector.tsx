"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";

const MAX_TAGS = 10;

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type TagSelectorProps = {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectedChange: Dispatch<SetStateAction<string[]>>;
};

const TagSelector = ({
  tags,
  selectedTagIds,
  onSelectedChange,
}: TagSelectorProps) => {
  const [tagSearch, setTagSearch] = useState("");

  const toggleTag = (tagId: string) => {
    onSelectedChange((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= MAX_TAGS) {
        toast.error(`Maximum ${MAX_TAGS} tags allowed`);
        return prev;
      }
      return [...prev, tagId];
    });
  };

  const removeTag = (tagId: string) => {
    onSelectedChange((prev) => prev.filter((id) => id !== tagId));
  };

  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query) ||
        tag.slug.toLowerCase().includes(query),
    );
  }, [tags, tagSearch]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds],
  );

  return (
    <Field>
      <FieldLabel>Tags</FieldLabel>
      <FieldDescription>
        Select from admin-created tags only, max {MAX_TAGS}. Search to filter.
      </FieldDescription>
      {tags.length === 0 ?
        <Alert>
          <AlertTitle>No tags available</AlertTitle>
          <AlertDescription>
            An admin needs to create tags in the Tags page before you can tag
            wallpapers.
          </AlertDescription>
        </Alert>
      : <>
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search tags"
              value={tagSearch}
              onChange={(event) => setTagSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="gap-1 pr-1">
                  {tag.name}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag.name}`}
                    onClick={() => removeTag(tag.id)}
                    className="hover:bg-muted ml-1 rounded-full p-0.5">
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="bg-muted/30 max-h-48 overflow-y-auto rounded-xl border p-2">
            {filteredTags.length === 0 ?
              <p className="text-muted-foreground py-4 text-center text-xs">
                No matching tags
              </p>
            : <div className="grid gap-1">
                {filteredTags.map((tag) => {
                  const checked = selectedTagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <span className="flex-1">{tag.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {tag.slug}
                      </span>
                    </label>
                  );
                })}
              </div>
            }
          </div>
          <p className="text-muted-foreground text-xs">
            {selectedTagIds.length} / {MAX_TAGS} selected
          </p>
        </>
      }
    </Field>
  );
};

export default TagSelector;
