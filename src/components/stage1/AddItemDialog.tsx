import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function AddItemDialog({
  triggerLabel,
  title,
  description,
  withLocality = false,
  onAdd,
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  withLocality?: boolean;
  onAdd: (data: { name: string; locality?: string; notes?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), locality: locality.trim() || undefined, notes: notes.trim() || undefined });
    setName(""); setLocality(""); setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-dashed">
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coastal Redevelopment Belt" />
          </div>
          {withLocality && (
            <div className="grid gap-2">
              <Label htmlFor="loc">Area / Locality</Label>
              <Input id="loc" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. Old Panvel" />
            </div>
          )}
          {withLocality && (
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
