import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  initial: string;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void> | void;
}

export function RenameDialog({ open, initial, onClose, onConfirm }: Props) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    setSaving(true);
    try {
      await onConfirm(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rename">New name</Label>
            <Input id="rename" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={saving || value.trim().length < 2}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}