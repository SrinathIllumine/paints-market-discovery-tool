import { useState } from "react";
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
import { MapPin } from "lucide-react";

type Mode = "form" | "pin";

export function AddProspectSheet({
  open,
  onOpenChange,
  onStartPinPick,
  onSubmit,
  pendingLatLng,
  onClearPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartPinPick: () => void;
  onSubmit: (data: { name: string; locality?: string; lat: number; lng: number }) => void;
  /** If set, user already dropped a pin and is naming it. */
  pendingLatLng?: { lat: number; lng: number } | null;
  onClearPending: () => void;
}) {
  const [mode, setMode] = useState<Mode>("form");
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");

  const hasPendingPin = !!pendingLatLng;
  const center = { lat: 18.9894, lng: 73.1175 };

  const submit = () => {
    if (!name.trim()) return;
    const coords = pendingLatLng ?? center;
    onSubmit({ name: name.trim(), locality: locality.trim() || undefined, ...coords });
    setName("");
    setLocality("");
    setMode("form");
    onClearPending();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setName("");
          setLocality("");
          setMode("form");
          onClearPending();
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a prospect</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {!hasPendingPin && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                onStartPinPick();
                onOpenChange(false);
              }}
            >
              <MapPin className="h-4 w-4 text-critical" /> Drop a pin on the map
            </Button>
          )}
          {hasPendingPin && (
            <div className="rounded-lg border border-critical/40 bg-critical/5 px-3 py-2 text-xs text-foreground">
              Pin placed at {pendingLatLng!.lat.toFixed(4)}, {pendingLatLng!.lng.toFixed(4)}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pname">Prospect name</Label>
            <Input
              id="pname"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adhiraj Capital City"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ploc">Locality (optional)</Label>
            <Input
              id="ploc"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Kharghar"
            />
          </div>
          {!hasPendingPin && (
            <p className="text-xs text-muted-foreground">
              No pin? We'll place it at the map center.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            className="bg-critical text-critical-foreground hover:bg-critical/90"
          >
            Add prospect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// silence unused warning
void Mode;
