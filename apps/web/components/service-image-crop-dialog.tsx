"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Slider } from "#/components/ui/slider";
import { SERVICE_BOOKING_IMAGE_ASPECT, getCroppedImageDataUrl } from "#/utils/service-image-crop";

export function ServiceImageCropDialog(p: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onApply: (dataUrl: string) => void | Promise<void>;
}) {
  const t = useTranslations("services.imageCrop");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (p.open && p.imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [p.open, p.imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!p.imageSrc || !croppedAreaPixels) {
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(p.imageSrc, croppedAreaPixels);
      await Promise.resolve(p.onApply(dataUrl));
      p.onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const cropperRegion = p.imageSrc ? (
    <div className="relative h-[min(55vh,380px)] w-full overflow-hidden rounded-lg bg-slate-950">
      <Cropper
        image={p.imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={SERVICE_BOOKING_IMAGE_ASPECT}
        objectFit="cover"
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
        showGrid={false}
      />
    </div>
  ) : null;

  const zoomBlock = (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-slate-500">{t("zoomLabel")}</p>
      <Slider min={1} max={3} step={0.02} value={[zoom]} onValueChange={(v) => setZoom(v[0] ?? 1)} />
    </div>
  );

  const actionsFooter = (
    <DialogFooter className="gap-2 sm:gap-0">
      <Button type="button" variant="outline" onClick={() => p.onOpenChange(false)} disabled={busy}>
        {t("cancel")}
      </Button>
      <Button type="button" onClick={() => void handleApply()} disabled={busy || !croppedAreaPixels}>
        {t("apply")}
      </Button>
    </DialogFooter>
  );

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {cropperRegion}
        {zoomBlock}
        {actionsFooter}
      </DialogContent>
    </Dialog>
  );
}
