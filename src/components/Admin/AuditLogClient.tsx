"use client";

import EmptyState from "@/components/UI/EmptyState";
import Pagination from "@/components/UI/Pagination";
import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import type { AuditLogSearchParamsType } from "@/lib/zodSchema";
import { format } from "date-fns";
import { ScrollTextIcon, SearchIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

type Props = {
  params: AuditLogSearchParamsType;
  total: number;
  totalPages: number;
  actions: string[];
  entries: AuditEntry[];
};

const queryOptions = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

const formatTimestamp = (value: string) =>
  format(new Date(value), "MMM d, yyyy HH:mm:ss");

const AuditLogClient = ({
  params,
  total,
  totalPages,
  actions,
  entries,
}: Props) => {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [action, setAction] = useQueryState(
    "action",
    parseAsString.withDefault("all").withOptions(queryOptions),
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions(queryOptions),
  );

  const [input, setInput] = useState(query ?? "");
  const [prevQuery, setPrevQuery] = useState(query ?? "");
  if ((query ?? "") !== prevQuery) {
    setPrevQuery(query ?? "");
    setInput(query ?? "");
  }

  useEffect(() => {
    if (input === (query ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      void setQuery(input.trim() === "" ? "" : input);
      void setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, query, setQuery, setPage]);

  const activeAction = action ?? params.action;
  const activePage = page ?? params.page;

  const actionItems = useMemo(
    () => [
      { value: "all", label: "All actions" },
      ...actions.map((value) => ({ value, label: value })),
    ],
    [actions],
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter activity</CardTitle>
          <CardDescription>
            {`${total} recorded ${total === 1 ? "event" : "events"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search summary, target, or actor"
                autoComplete="off"
                aria-label="Search audit log"
                className="pl-9"
              />
            </div>
            <Select
              value={activeAction}
              items={actionItems}
              onValueChange={(value) => {
                void setAction(value ?? "all");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by action"
                className="w-full lg:w-64">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((value) => (
                  <SelectItem
                    key={value}
                    value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            {`Page ${activePage} of ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ?
            <EmptyState
              compact={true}
              icon={ScrollTextIcon}
              title="No audit events found"
              description="Administrative actions appear here as soon as they are performed."
            />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      {formatTimestamp(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      {entry.actor ?
                        <Link
                          href={`/admin/users/${entry.actor.id}` as Route}
                          className="hover:text-foreground text-sm font-medium underline-offset-4 hover:underline">
                          {entry.actor.name}
                        </Link>
                      : <span className="text-muted-foreground text-sm">
                          System
                        </span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.action}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <span className="text-foreground/80">
                        {entry.targetType}
                      </span>
                      <br />
                      <span className="break-all">{entry.targetId}</span>
                    </TableCell>
                    <TableCell className="max-w-md text-sm">
                      {entry.summary}
                      {entry.metadata ?
                        <details className="mt-1">
                          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                            Details
                          </summary>
                          <pre className="bg-muted/60 rounded-inset mt-2 max-h-40 overflow-auto p-2 text-xs whitespace-pre-wrap">
                            {entry.metadata}
                          </pre>
                        </details>
                      : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {entry.ipAddress ?? "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
          <Pagination
            page={activePage}
            totalPages={totalPages}
            onPageChange={(next) => void setPage(next)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogClient;
