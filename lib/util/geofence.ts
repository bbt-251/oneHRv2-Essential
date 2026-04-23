import { getCurrentLocation, isLocationInPolygons } from "@/lib/util/location";

export type GeoCoordinate = [number, number];
export type WorkingAreaPolygon = GeoCoordinate[];
export type WorkingAreaPolygons = WorkingAreaPolygon[];

export type GeofenceValidationReason =
    | "allowed"
    | "no_geofence"
    | "location_unavailable"
    | "outside_geofence"
    | "invalid_working_area";

export interface GeofenceValidationResult {
    ok: boolean;
    reason: GeofenceValidationReason;
    location: GeoCoordinate | null;
    polygons: WorkingAreaPolygons;
}

function isCoordinate(value: unknown): value is GeoCoordinate {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        Number.isFinite(value[0]) &&
        typeof value[1] === "number" &&
        Number.isFinite(value[1])
    );
}

function isWorkingAreaPolygons(value: unknown): value is WorkingAreaPolygons {
    return (
        Array.isArray(value) &&
        value.every(
            polygon => Array.isArray(polygon) && polygon.length > 0 && polygon.every(isCoordinate),
        )
    );
}

export function parseWorkingArea(workingArea?: string | null): {
    polygons: WorkingAreaPolygons;
    isValid: boolean;
} {
    if (!workingArea?.trim()) {
        return { polygons: [], isValid: true };
    }

    try {
        const parsed: unknown = JSON.parse(workingArea);
        if (!isWorkingAreaPolygons(parsed)) {
            return { polygons: [], isValid: false };
        }

        return { polygons: parsed, isValid: true };
    } catch {
        return { polygons: [], isValid: false };
    }
}

export function validateWorkingAreaGeofence(
    workingArea: string | null | undefined,
    location?: GeoCoordinate | false | null,
): GeofenceValidationResult {
    const { polygons, isValid } = parseWorkingArea(workingArea);

    if (!isValid) {
        return {
            ok: false,
            reason: "invalid_working_area",
            location: null,
            polygons: [],
        };
    }

    if (!polygons.length) {
        return {
            ok: true,
            reason: "no_geofence",
            location: null,
            polygons,
        };
    }

    if (!location) {
        return {
            ok: false,
            reason: "location_unavailable",
            location: null,
            polygons,
        };
    }

    const isAllowed = isLocationInPolygons(polygons, location);
    return {
        ok: isAllowed,
        reason: isAllowed ? "allowed" : "outside_geofence",
        location,
        polygons,
    };
}

export async function validateWorkingAreaGeofenceForCurrentLocation(
    workingArea?: string | null,
): Promise<GeofenceValidationResult> {
    const parsed = parseWorkingArea(workingArea);

    if (!parsed.isValid) {
        return {
            ok: false,
            reason: "invalid_working_area",
            location: null,
            polygons: [],
        };
    }

    if (!parsed.polygons.length) {
        return {
            ok: true,
            reason: "no_geofence",
            location: null,
            polygons: [],
        };
    }

    const currentLocation = await getCurrentLocation();
    return validateWorkingAreaGeofence(workingArea, currentLocation);
}
