import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function NameSheet({
  open,
  onOpenChange,
  title,
  placeholder,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  children?: ReactNode;
}) {
  const [name, setName] = useState("");
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setName("");
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setName("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input
              id="sheet-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {children}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="bg-critical text-critical-foreground hover:bg-critical/90">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
