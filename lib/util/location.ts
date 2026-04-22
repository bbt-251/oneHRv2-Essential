import { booleanPointInPolygon, point, polygon, distance } from "@turf/turf";

export function isLocationInPolygons(
    polygons: [number, number][][],
    location: [number, number],
): boolean {
    const pt = point(location);

    for (const poly of polygons) {
        const turfPoly = polygon([poly]);
        if (booleanPointInPolygon(pt, turfPoly)) {
            return true;
        }
    }

    return false;
}

export function isLocationAroundPoints(
    points: [number, number][],
    location: [number, number],
    radius: number,
): boolean {
    for (const p of points) {
        const from = point(p);
        const to = point(location);
        const dis = distance(from, to);
        if (dis <= radius) {
            return true;
        }
    }

    return false;
}

export async function getCurrentLocation(): Promise<[number, number] | false> {
    return new Promise(resolve => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            resolve(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                const { longitude, latitude } = position.coords;
                resolve([longitude, latitude]);
            },
            error => {
                console.log("Error", error);
                resolve(false);
                return;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds
                maximumAge: 0,
            },
        );
    });
}
