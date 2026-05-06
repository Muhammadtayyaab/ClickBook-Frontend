import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addDomain,
  deleteDomain,
  getDomains,
  verifyDomain,
  type DomainRecord,
} from "@/lib/domains-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
}

const DOMAIN_RE = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export function CustomDomainSection({ projectId }: Props) {
  const [domains, setDomains] = useState<DomainRecord[] | null>(null);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getDomains(projectId);
      setDomains(data);
    } catch (err) {
      setDomains([]);
      toast.error(err instanceof ApiError ? err.message : "Failed to load domains");
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const customDomains = (domains ?? []).filter((d) => d.type === "custom");

  async function handleAdd() {
    const value = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!DOMAIN_RE.test(value)) {
      toast.error("Enter a valid domain like www.mysite.com");
      return;
    }
    setAdding(true);
    try {
      await addDomain(projectId, value);
      toast.success("Domain added — add the DNS record to verify");
      setInput("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add domain");
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(d: DomainRecord) {
    setVerifyingId(d.id);
    try {
      await verifyDomain(d.domain);
      toast.success("Domain verified");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(d: DomainRecord) {
    if (!confirm(`Remove ${d.domain}?`)) return;
    setDeletingId(d.id);
    try {
      await deleteDomain(d.id);
      toast.success("Domain removed");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove domain");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" /> Custom Domain
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your own domain (e.g. <code>www.mysite.com</code>) to this project.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="custom-domain-input">Add a domain</Label>
          <div className="flex gap-2">
            <Input
              id="custom-domain-input"
              placeholder="www.mysite.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={adding}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button onClick={handleAdd} disabled={adding || !input.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Connected domains</h3>
          {domains === null ? (
            <Skeleton className="h-24 w-full" />
          ) : customDomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom domains yet.</p>
          ) : (
            customDomains.map((d) => (
              <DomainRow
                key={d.id}
                domain={d}
                verifying={verifyingId === d.id}
                deleting={deletingId === d.id}
                onVerify={() => handleVerify(d)}
                onDelete={() => handleDelete(d)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DomainRow({
  domain,
  verifying,
  deleting,
  onVerify,
  onDelete,
}: {
  domain: DomainRecord;
  verifying: boolean;
  deleting: boolean;
  onVerify: () => void;
  onDelete: () => void;
}) {
  const verified = domain.is_verified;
  const txtName = `_sitecraft-verification.${domain.domain}`;
  const txtValue = domain.verification_token ?? "";

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{domain.domain}</span>
          <StatusBadge verified={verified} />
        </div>
        <div className="flex items-center gap-2">
          {!verified && (
            <Button size="sm" variant="outline" onClick={onVerify} disabled={verifying}>
              {verifying ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Verify
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {!verified && txtValue && (
        <div className="rounded-md bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Add this DNS record at your domain registrar, then click Verify:
          </p>
          <div className="grid gap-2 sm:grid-cols-[80px_1fr_auto] sm:items-center text-xs font-mono">
            <DnsField label="Type" value="TXT" />
            <DnsField label="Name" value={txtName} copyable />
            <DnsField label="Value" value={txtValue} copyable />
          </div>
        </div>
      )}

      {verified && (
        <p className="text-xs text-muted-foreground">
          SSL: <span className="font-medium">{domain.ssl_status}</span>
        </p>
      )}
    </div>
  );
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        verified
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {verified ? "Verified" : "Pending"}
    </Badge>
  );
}

function DnsField({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }
  return (
    <>
      <span className="text-muted-foreground sm:col-span-1">{label}</span>
      <span className="break-all sm:col-span-1">{value}</span>
      {copyable ? (
        <Button size="sm" variant="ghost" className="h-7 px-2 sm:col-span-1" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
    </>
  );
}
