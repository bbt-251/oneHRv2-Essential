import React, { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { EmployeeModel } from "@/lib/models/employee";

const WorkingLocationMap = ({
    edit,
    data,
    employee,
    setCoordinates,
}: {
    edit: boolean;
    data: [number, number][];
    employee: EmployeeModel;
    setCoordinates: (coordinate: [number, number]) => void;
}) => {
    const mapContainerRef: any = useRef(null);
    const mapRef: any = useRef<mapboxgl.Map | null>(null);
    const drawRef: any = useRef<MapboxDraw | null>(null);

    const getCenter = useCallback((): [number, number] => {
        return [38.669, 9.06];
    }, []);

    useEffect(() => {
        if (mapRef.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current ?? "",
            style: "mapbox://styles/mapbox/streets-v11",
            center: getCenter(),
            zoom: data.length > 1 ? 5 : 11,
        });

        drawRef.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true,
            },
            defaultMode: "draw_polygon",
        });

        mapRef.current.addControl(drawRef.current);

        mapRef.current.on("draw.create", (e: any) => {
            const allFeatures = drawRef.current?.getAll();

            setCoordinates(
                allFeatures?.features?.map((feature: any) =>
                    feature?.geometry?.coordinates?.at(0),
                ) || [],
            );
        });

        mapRef.current.on("draw.delete", (e: any) => {
            const allFeatures = drawRef.current?.getAll();
            setCoordinates(allFeatures?.features?.at(0)?.geometry?.coordinates || []);
        });

        mapRef.current.on("draw.update", (e: any) => {
            const allFeatures = drawRef.current?.getAll();
            setCoordinates(allFeatures?.features?.at(0)?.geometry?.coordinates || []);
        });

        mapRef.current.on("contextmenu", (e: any) => {
            const features = mapRef.current?.queryRenderedFeatures(e.point, {
                layers: drawRef.current?.getMode() === "draw_polygon" ? [] : undefined,
            });

            if (features && features.length) {
                const featureId = features[0].properties?.id;
                if (featureId) {
                    drawRef.current?.delete(featureId);
                }
            }
        });
    }, [data, edit, getCenter, setCoordinates]);

    useEffect(() => {
        if (!edit) return;
        const coordinates = employee.workingArea ? JSON.parse(employee.workingArea) : [];
        const map = mapRef.current;
        const draw = drawRef.current;

        if (!map || !draw) return;
        if (!coordinates || coordinates.length === 0) return;

        // First clear previous drawings
        draw.deleteAll();

        coordinates.map((coordinate: [number, number][], index: number) => {
            // Create a GeoJSON polygon feature
            const polygon = {
                id: index,
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [[...coordinate, coordinate[0]]], // close the polygon by repeating the first coordinate
                },
            };

            draw.add(polygon);
        }, []);
    }, [edit, employee.workingArea]);

    useEffect(() => {
        mapRef.current.on("load", () => {
            mapRef.current?.resize();
        });
    }, []);

    return (
        <>
            <div
                ref={mapContainerRef}
                id="map"
                style={{
                    height: "60vh",
                    width: "100%",
                }}
            />
        </>
    );
};

export default WorkingLocationMap;
