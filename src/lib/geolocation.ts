export class GeolocationUnsupportedError extends Error {
  constructor() {
    super("GEOLOCATION_UNSUPPORTED");
    this.name = "GeolocationUnsupportedError";
  }
}

export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeolocationUnsupportedError());
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

export function isGeolocationPermissionDenied(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as GeolocationPositionError).code) === 1
  );
}
