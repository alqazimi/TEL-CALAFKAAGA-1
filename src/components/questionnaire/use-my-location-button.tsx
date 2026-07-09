"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  GeolocationUnsupportedError,
  getBrowserPosition,
  isGeolocationPermissionDenied,
} from "@/lib/geolocation";
import { matchCity, matchCountry } from "@/lib/location-match";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";
import { cn } from "@/lib/utils";

interface UseMyLocationButtonProps {
  onDetected: (country: string, city: string) => void;
  disabled?: boolean;
  className?: string;
}

export function UseMyLocationButton({
  onDetected,
  disabled,
  className,
}: UseMyLocationButtonProps) {
  const reverseGeocode = useAction(api.geolocation.reverseGeocode);
  const { ui } = useQuestionnaireI18n();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const position = await getBrowserPosition();
      const result = await reverseGeocode({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const country = matchCountry(result.country);
      if (!country) {
        toast.error(ui("locationCountryUnsupported"));
        return;
      }

      const city = matchCity(country, result.city);
      if (!city) {
        toast.error(ui("locationFailed"));
        return;
      }

      onDetected(country, city);
      toast.success(ui("locationDetected"));
    } catch (error) {
      if (error instanceof GeolocationUnsupportedError) {
        toast.error(ui("locationUnsupported"));
        return;
      }
      if (isGeolocationPermissionDenied(error)) {
        toast.error(ui("locationPermissionDenied"));
        return;
      }
      toast.error(ui("locationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-center gap-2.5 rounded-full bg-primary/10 px-5 py-3.5 text-base font-semibold text-primary transition-colors",
        "hover:bg-primary/15 active:bg-primary/20 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={() => void handleClick()}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <MapPin className="h-5 w-5 shrink-0" />
      )}
      <span>{loading ? ui("detectingLocation") : ui("useMyLocation")}</span>
    </button>
  );
}
