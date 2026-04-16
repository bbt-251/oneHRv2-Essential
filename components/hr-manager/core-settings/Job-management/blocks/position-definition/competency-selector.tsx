import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { HrSettingsByType } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { Check, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AvailableCompetency } from "./position-definition";

export function CompetencySelector({
    selectedCompetencies,
    availableCompetencies,
    onCompetenciesChange,
    positionName,
    hrSettings,
}: {
    selectedCompetencies: string[];
    availableCompetencies: AvailableCompetency[];
    onCompetenciesChange: (competencies: string[]) => void;
    positionName: string;
    hrSettings: HrSettingsByType;
}) {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [discoveredSearchTerm, setDiscoveredSearchTerm] = useState<string>("");
    const [discoveredCompetencies, setDiscoveredCompetencies] = useState<
        { preferredLabel: string; description: string }[]
    >([]);
    const [loadingDiscovered, setLoadingDiscovered] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedComp, setSelectedComp] = useState<{
        preferredLabel: string;
        description: string;
    } | null>(null);
    const [competenceName, setCompetenceName] = useState("");
    const [competenceType, setCompetenceType] = useState("");
    const [creating, setCreating] = useState(false);

    const filteredCompetencies = availableCompetencies.filter(comp => {
        const matchesSearch =
            comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || comp.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const competencyTypes = Array.from(new Set(availableCompetencies.map(c => c.type)));

    const filteredDiscoveredCompetencies = discoveredCompetencies.filter(comp => {
        const matchesSearch =
            comp.preferredLabel.toLowerCase().includes(discoveredSearchTerm.toLowerCase()) ||
            comp.description.toLowerCase().includes(discoveredSearchTerm.toLowerCase());
        return matchesSearch;
    });

    const competenceTypes = Array.from(new Set(hrSettings.competencies.map(c => c.competenceType)));

    useEffect(() => {
        const fetchDiscovered = async () => {
            if (!positionName.trim()) return;
            setLoadingDiscovered(true);
            try {
                const response = await fetch(
                    `https://bbt-tech-skill-search.hf.space/skills_search_engine?position=${encodeURIComponent(positionName)}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    },
                );
                const data = await response.json();
                setDiscoveredCompetencies(data.result || []);
            } catch (error) {
                console.error("Error fetching discovered competencies:", error);
                setDiscoveredCompetencies([]);
            } finally {
                setLoadingDiscovered(false);
            }
        };
        fetchDiscovered();
    }, [positionName]);

    function toggleCompetency(competencyId: string) {
        if (selectedCompetencies.includes(competencyId)) {
            onCompetenciesChange(selectedCompetencies.filter(id => id !== competencyId));
        } else {
            onCompetenciesChange([...selectedCompetencies, competencyId]);
        }
    }

    function getCompetencyName(id: string) {
        return availableCompetencies.find(c => c.id === id)?.name || id;
    }

    const openAddModal = (comp: { preferredLabel: string; description: string }) => {
        setSelectedComp(comp);
        setCompetenceName(comp.preferredLabel);
        setCompetenceType("");
        setAddModalOpen(true);
    };

    const handleCreateCompetence = async () => {
        if (!competenceName.trim() || !competenceType.trim()) return;
        setCreating(true);
        try {
            await hrSettingsService.create("competencies", {
                competenceName: competenceName.trim(),
                competenceType: competenceType.trim(),
                active: "Yes",
            });
            showToast("Competence created successfully!", "Success", "success");
            setAddModalOpen(false);
            setSelectedComp(null);
            setCompetenceName("");
            setCompetenceType("");
        } catch (error) {
            console.error("Error creating competence:", error);
            showToast("Failed to create competence.", "Error", "error");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search competencies..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {competencyTypes.map(type => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Selected Competencies */}
            {selectedCompetencies.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        Selected Competencies ({selectedCompetencies.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {selectedCompetencies.map(id => (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-sm"
                            >
                                {getCompetencyName(id)}
                                <button
                                    type="button"
                                    className="ml-1 rounded-full hover:bg-amber-100 p-0.5"
                                    onClick={() => toggleCompetency(id)}
                                    aria-label={`Remove ${getCompetencyName(id)}`}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Competencies */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Available Competencies</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredCompetencies.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No competencies found matching your criteria
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredCompetencies
                                .sort((a, b) =>
                                    dayjs(b.timestamp, timestampFormat).diff(dayjs(a.timestamp)),
                                )
                                .map(competency => {
                                    const isSelected = selectedCompetencies.includes(competency.id);
                                    return (
                                        <div
                                            key={competency.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                                isSelected
                                                    ? "bg-amber-50 border border-amber-200"
                                                    : "hover:border-gray-300 transition-colors border border-transparent",
                                            )}
                                            onClick={() => toggleCompetency(competency.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                                                        isSelected
                                                            ? "bg-amber-600 border-amber-600"
                                                            : "border-gray-300",
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {competency.name}
                                                </div>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    "text-xs",
                                                    competency.type === "Technical" &&
                                                        "bg-blue-100 text-blue-800 border-blue-200",
                                                    competency.type === "Behavioral" &&
                                                        "bg-green-100 text-green-800 border-green-200",
                                                    competency.type === "Leadership" &&
                                                        "bg-purple-100 text-purple-800 border-purple-200",
                                                )}
                                            >
                                                {competency.type}
                                            </Badge>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Discover Competencies */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Discover Competencies</Label>
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search discovered competencies..."
                            value={discoveredSearchTerm}
                            onChange={e => setDiscoveredSearchTerm(e.target.value)}
                            className="pl-10 h-8"
                        />
                    </div>
                </div>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {loadingDiscovered ? (
                        <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                            Discovering competencies...
                        </div>
                    ) : filteredDiscoveredCompetencies.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            {discoveredSearchTerm
                                ? "No competencies match your search"
                                : positionName
                                    ? "No competencies found for this position"
                                    : "Enter a position name to discover competencies"}
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filteredDiscoveredCompetencies.map((comp, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-sm my-1">
                                            {comp.preferredLabel}
                                        </div>
                                        <div className="text-xs text-gray-400 line-clamp-2">
                                            {comp.description}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => openAddModal(comp)}
                                        className="hover:cursor-pointer hover:border-gray-300 transition-colors"
                                    >
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Competence Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Competence</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="competenceName">Competence Name</Label>
                            <Input
                                id="competenceName"
                                value={competenceName}
                                onChange={e => setCompetenceName(e.target.value)}
                                placeholder="Enter competence name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="competenceType">Competence Type</Label>
                            <Select value={competenceType} onValueChange={setCompetenceType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select competence type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {competenceTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateCompetence}
                                disabled={creating || !competenceName.trim() || !competenceType}
                            >
                                {creating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
