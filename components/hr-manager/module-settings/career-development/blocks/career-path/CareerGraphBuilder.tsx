"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    RotateCcw,
    Filter,
    X,
    Network,
    ArrowRight,
    Users,
    BookOpen,
} from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { RoleModel, TrackModel, CareerLevel, CAREER_LEVELS } from "@/lib/models/career-path";

// Level colors as per spec
const LEVEL_COLORS: Record<string, string> = {
    Entry: "#22c55e", // Green
    Junior: "#3b82f6", // Blue
    Mid: "#a855f7", // Purple
    Senior: "#f97316", // Orange
    Lead: "#ef4444", // Red
    Manager: "#6b7280", // Gray
    Director: "#1f2937", // Dark gray
};

// Node positions for vertical layout
interface NodePosition {
    x: number;
    y: number;
}

interface GraphNode {
    id: string;
    role: RoleModel;
    position: NodePosition;
    track: TrackModel | null;
}

interface GraphEdge {
    from: string;
    to: string;
    type: "prerequisite" | "successor";
}

export default function CareerGraphBuilder() {
    const { roles, tracks, hrSettings } = useFirestore();

    const positions = hrSettings.positions || [];
    const competencies = hrSettings.competencies || [];

    // Filter state
    const [filterTrack, setFilterTrack] = useState<string>("");
    const [filterLevel, setFilterLevel] = useState<string>("");

    // Zoom and pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Container ref
    const containerRef = useRef<HTMLDivElement>(null);

    // Get level index for vertical positioning
    const getLevelIndex = (level: string | null): number => {
        if (!level) return CAREER_LEVELS.indexOf("Mid");
        const idx = CAREER_LEVELS.indexOf(level as CareerLevel);
        return idx >= 0 ? idx : CAREER_LEVELS.indexOf("Mid");
    };

    // Process roles into graph nodes and edges
    const { nodes, edges } = useMemo(() => {
        const filteredRoles = roles.filter(role => {
            const matchesTrack = !filterTrack || role.track === filterTrack;
            const matchesLevel = !filterLevel || role.level === filterLevel;
            return matchesTrack && matchesLevel;
        });

        // Group roles by level for vertical layout
        const levelGroups: Record<number, RoleModel[]> = {};
        CAREER_LEVELS.forEach((_, idx) => {
            levelGroups[idx] = [];
        });

        filteredRoles.forEach(role => {
            const levelIdx = getLevelIndex(role.level);
            levelGroups[levelIdx].push(role);
        });

        // Calculate node positions
        const nodeList: GraphNode[] = [];
        const nodeWidth = 220;
        const nodeHeight = 120;
        const horizontalGap = 40;
        const verticalGap = 80;

        // Position nodes in vertical layout (levels top to bottom)
        Object.entries(levelGroups).forEach(([levelIdx, levelRoles]) => {
            const y = parseInt(levelIdx) * (nodeHeight + verticalGap) + 50;
            const totalWidth =
                levelRoles.length * nodeWidth + (levelRoles.length - 1) * horizontalGap;
            const startX = -totalWidth / 2; // Center horizontally

            levelRoles.forEach((role, idx) => {
                const x = startX + idx * (nodeWidth + horizontalGap) + nodeWidth / 2;
                const track = role.track ? tracks.find(t => t.id === role.track) || null : null;

                nodeList.push({
                    id: role.id,
                    role,
                    position: { x, y },
                    track,
                });
            });
        });

        // Calculate edges from prerequisite/successor relationships
        const edgeList: GraphEdge[] = [];
        filteredRoles.forEach(role => {
            // Prerequisites
            (role.prerequisiteRoles || []).forEach(prereqId => {
                if (filteredRoles.some(r => r.id === prereqId)) {
                    edgeList.push({
                        from: prereqId,
                        to: role.id,
                        type: "prerequisite",
                    });
                }
            });
            // Successors
            (role.potentialSuccessorRoles || []).forEach(succId => {
                if (filteredRoles.some(r => r.id === succId)) {
                    edgeList.push({
                        from: role.id,
                        to: succId,
                        type: "successor",
                    });
                }
            });
        });

        return { nodes: nodeList, edges: edgeList };
    }, [roles, tracks, filterTrack, filterLevel]);

    // Calculate SVG viewBox based on nodes
    const viewBox = useMemo(() => {
        if (nodes.length === 0) return { minX: -400, minY: -200, width: 800, height: 400 };

        const padding = 100;
        const minX = Math.min(...nodes.map(n => n.position.x)) - 110 - padding;
        const maxX = Math.max(...nodes.map(n => n.position.x)) + 110 + padding;
        const minY = Math.min(...nodes.map(n => n.position.y)) - 60 - padding;
        const maxY = Math.max(...nodes.map(n => n.position.y)) + 60 + padding;

        return {
            minX,
            minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }, [nodes]);

    // Handlers
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.3));
    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Get role display name
    const getRoleName = (role: RoleModel): string => {
        if (role.roleTitle) {
            const position = positions.find(p => p.id === role.roleTitle);
            return position?.name || role.roleTitle;
        }
        return "Untitled Role";
    };

    // Get track name
    const getTrackName = (trackId: string | null): string => {
        if (!trackId) return "No Track";
        const track = tracks.find(t => t.id === trackId);
        return track?.name || "Unknown Track";
    };

    // Get skill count
    const getSkillCount = (role: RoleModel): number => {
        return (role.requiredSkills?.length || 0) + (role.requiredCourses?.length || 0);
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilterTrack("");
        setFilterLevel("");
    };

    // Render connection arrows
    const renderEdges = () => {
        return edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            const fromX = fromNode.position.x;
            const fromY = fromNode.position.y;
            const toX = toNode.position.x;
            const toY = toNode.position.y;

            const nodeWidth = 100; // Half of width (200/2)
            const nodeHeight = 50; // Half of height (100/2)

            // Calculate connection points on node edges
            // For vertical connections (same column): connect from bottom to top
            // For horizontal connections (different columns): connect from side to side
            const isHorizontalConnection = Math.abs(toX - fromX) > nodeWidth;
            const isSameColumn = Math.abs(toY - fromY) > 0 && Math.abs(toX - fromX) <= nodeWidth;

            let startX: number, startY: number, endX: number, endY: number;

            if (isSameColumn || Math.abs(toY - fromY) > Math.abs(toX - fromX)) {
                // Vertical connection - from bottom of fromNode to top of toNode
                startX = fromX;
                startY = fromY + nodeHeight;
                endX = toX;
                endY = toY - nodeHeight;
            } else {
                // Horizontal/Diagonal connection - connect from right edge to left edge (or vice versa)
                if (toX > fromX) {
                    // Connection goes right to left
                    startX = fromX + nodeWidth;
                    startY = fromY;
                    endX = toX - nodeWidth;
                    endY = toY;
                } else {
                    // Connection goes left to right
                    startX = fromX - nodeWidth;
                    startY = fromY;
                    endX = toX + nodeWidth;
                    endY = toY;
                }
            }

            // Create curved path with better control points for horizontal connections
            let pathD: string;

            if (isSameColumn || Math.abs(toY - fromY) > Math.abs(toX - fromX)) {
                // Vertical curve
                const midY = (startY + endY) / 2;
                pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
            } else {
                // Horizontal/diagonal curve - use better control point placement
                const dx = Math.abs(endX - startX);
                const midX = (startX + endX) / 2;
                const controlOffset = Math.min(dx * 0.5, 80);

                if (toX > fromX) {
                    // Curve from right to left
                    pathD = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
                } else {
                    // Curve from left to right
                    pathD = `M ${startX} ${startY} C ${startX - controlOffset} ${startY}, ${endX + controlOffset} ${endY}, ${endX} ${endY}`;
                }
            }

            // Calculate arrow rotation based on connection direction
            const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;

            return (
                <g key={`edge-${idx}`}>
                    <path
                        d={pathD}
                        fill="none"
                        stroke={edge.type === "prerequisite" ? "#94a3b8" : "#64748b"}
                        strokeWidth="2"
                        strokeDasharray={edge.type === "prerequisite" ? "5,5" : "none"}
                        markerEnd="url(#arrowhead)"
                    />
                </g>
            );
        });
    };

    // Render nodes
    const renderNodes = () => {
        return nodes.map(node => {
            const level = node.role.level || "Mid";
            const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS["Mid"];
            const skillCount = getSkillCount(node.role);

            return (
                <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                    {/* Node card */}
                    <rect
                        x="-100"
                        y="-50"
                        width="200"
                        height="100"
                        rx="8"
                        fill="white"
                        stroke={levelColor}
                        strokeWidth="3"
                        filter="url(#shadow)"
                    />

                    {/* Track color indicator */}
                    {node.track?.color && (
                        <rect
                            x="-100"
                            y="-50"
                            width="8"
                            height="100"
                            rx="4"
                            fill={node.track.color}
                        />
                    )}

                    {/* Role name */}
                    <text
                        x="0"
                        y="-20"
                        textAnchor="middle"
                        className="text-sm font-semibold fill-gray-900"
                        style={{ fontSize: "14px" }}
                    >
                        {getRoleName(node.role).length > 20
                            ? getRoleName(node.role).substring(0, 20) + "..."
                            : getRoleName(node.role)}
                    </text>

                    {/* Track and Level */}
                    <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        className="text-xs fill-gray-500"
                        style={{ fontSize: "11px" }}
                    >
                        {getTrackName(node.role.track)} • {level}
                    </text>

                    {/* Skill count badge */}
                    <g transform="translate(-30, 25)">
                        <rect x="0" y="0" width="28" height="18" rx="9" fill="#f3f4f6" />
                        <text
                            x="14"
                            y="13"
                            textAnchor="middle"
                            className="text-xs fill-gray-600"
                            style={{ fontSize: "10px" }}
                        >
                            {skillCount}
                        </text>
                    </g>

                    {/* Course count badge */}
                    <g transform="translate(10, 25)">
                        <rect x="0" y="0" width="28" height="18" rx="9" fill="#ecfdf5" />
                        <text
                            x="14"
                            y="13"
                            textAnchor="middle"
                            className="text-xs fill-green-600"
                            style={{ fontSize: "10px" }}
                        >
                            {(node.role.requiredCourses || []).length}
                        </text>
                    </g>

                    {/* Level badge */}
                    <rect x="60" y="-45" width="35" height="18" rx="4" fill={levelColor} />
                    <text
                        x="77.5"
                        y="-32"
                        textAnchor="middle"
                        className="text-xs font-medium fill-white"
                        style={{ fontSize: "9px" }}
                    >
                        {level.substring(0, 4)}
                    </text>
                </g>
            );
        });
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-amber-600" />
                        Career Progression Graph
                    </CardTitle>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 border rounded-md p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleZoomOut}
                                title="Zoom Out"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs w-12 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleZoomIn}
                                title="Zoom In"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleResetZoom}
                                title="Reset View"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Fullscreen */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleFullscreen}
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>

                    <select
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={filterTrack}
                        onChange={e => setFilterTrack(e.target.value)}
                    >
                        <option value="">All Tracks</option>
                        {tracks.map(track => (
                            <option key={track.id} value={track.id}>
                                {track.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={filterLevel}
                        onChange={e => setFilterLevel(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        {CAREER_LEVELS.map(level => (
                            <option key={level} value={level}>
                                {level}
                            </option>
                        ))}
                    </select>

                    {(filterTrack || filterLevel) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-gray-500"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                        </Button>
                    )}

                    <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
                        <span>{nodes.length} roles</span>
                        <span>{edges.length} connections</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-gray-500">Level Colors:</span>
                    {CAREER_LEVELS.slice(0, 6).map(level => (
                        <div key={level} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: LEVEL_COLORS[level] }}
                            />
                            <span>{level}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent>
                {/* Graph Container */}
                <div
                    ref={containerRef}
                    className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden"
                    style={{
                        height: isFullscreen ? "calc(100vh - 100px)" : "500px",
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {nodes.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Career Roles Found
                                </h3>
                                <p className="text-gray-500 max-w-md">
                                    Create career tracks and roles to visualize career progression
                                    paths.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <svg
                            className="w-full h-full"
                            viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
                            style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                transformOrigin: "center center",
                            }}
                        >
                            <defs>
                                {/* Arrow marker */}
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="9"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                </marker>

                                {/* Shadow filter */}
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow
                                        dx="0"
                                        dy="2"
                                        stdDeviation="3"
                                        floodOpacity="0.1"
                                    />
                                </filter>
                            </defs>

                            {/* Render edges first (behind nodes) */}
                            {renderEdges()}

                            {/* Render nodes */}
                            {renderNodes()}
                        </svg>
                    )}
                </div>

                {/* Info Panel */}
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-200" />
                            <span>Prerequisite (dashed)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-400" />
                            <span>Successor (solid)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        <span>Career progression flows downward</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
