"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  GeolocationUnsupportedError,
  getBrowserPosition,
  isGeolocationPermissionDenied,
} from "@/lib/geolocation";
import { matchCity, matchCountry } from "@/lib/location-match";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";

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
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => void handleClick()}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4 mr-2" />
      )}
      {loading ? ui("detectingLocation") : ui("useMyLocation")}
    </Button>
  );
}
