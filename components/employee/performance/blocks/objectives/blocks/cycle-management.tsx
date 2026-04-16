"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
    CalendarIcon,
    Plus,
    Edit,
    Users,
    Settings,
    Play,
    Clock,
    CheckCircle,
    AlertTriangle,
    BarChart3,
} from "lucide-react";
import { format } from "date-fns";

interface CycleManagementProps {
    onCycleCreate?: (cycle: Partial<EvaluationCycle>) => void;
    onCycleUpdate?: (cycleId: string, updates: Partial<EvaluationCycle>) => void;
    onCycleStatusChange?: (cycleId: string, status: string) => void;
}

export function CycleManagement({
    onCycleCreate,
    onCycleUpdate,
    onCycleStatusChange,
}: CycleManagementProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);

    // Mock data for existing cycles
    const [cycles, setCycles] = useState<EvaluationCycle[]>([
        {
            id: "2024-q4",
            name: "2024 Q4 Performance Review",
            description: "Fourth quarter performance evaluation cycle",
            startDate: new Date("2024-10-01"),
            endDate: new Date("2024-12-31"),
            status: "active",
            phases: [
                {
                    id: "phase-1",
                    name: "Objective Setting",
                    description: "Set objectives for the quarter",
                    startDate: new Date("2024-10-01"),
                    endDate: new Date("2024-10-15"),
                    type: "objective-setting",
                    status: "completed",
                    requirements: ["Manager approval required"],
                },
                {
                    id: "phase-2",
                    name: "Self Assessment",
                    description: "Employee self-evaluation period",
                    startDate: new Date("2024-11-01"),
                    endDate: new Date("2024-11-30"),
                    type: "self-assessment",
                    status: "active",
                    requirements: ["Complete all objectives", "Submit competency assessment"],
                },
            ],
            participants: ["emp-1", "emp-2", "mgr-1"],
            settings: {
                allowSelfAssessment: true,
                requireManagerReview: true,
                enablePeerFeedback: false,
                autoProgressPhases: true,
                reminderSettings: {
                    enabled: true,
                    daysBeforeDeadline: [7, 3, 1],
                    emailNotifications: true,
                    inAppNotifications: true,
                },
            },
            createdAt: new Date("2024-09-15"),
            updatedAt: new Date("2024-11-01"),
        },
    ]);

    const [newCycle, setNewCycle] = useState<Partial<EvaluationCycle>>({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        status: "draft",
        phases: [],
        participants: [],
        settings: {
            allowSelfAssessment: true,
            requireManagerReview: true,
            enablePeerFeedback: false,
            autoProgressPhases: false,
            reminderSettings: {
                enabled: true,
                daysBeforeDeadline: [7, 3, 1],
                emailNotifications: true,
                inAppNotifications: true,
            },
        },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "draft":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
            case "review":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
            case "completed":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
            case "archived":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
    };

    const getPhaseStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "active":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "overdue":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const handleCreateCycle = () => {
        const cycle = {
            ...newCycle,
            id: `cycle-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as EvaluationCycle;

        setCycles([...cycles, cycle]);
        onCycleCreate?.(cycle);
        setIsCreateModalOpen(false);
        setNewCycle({
            name: "",
            description: "",
            startDate: new Date(),
            endDate: new Date(),
            status: "draft",
            phases: [],
            participants: [],
            settings: {
                allowSelfAssessment: true,
                requireManagerReview: true,
                enablePeerFeedback: false,
                autoProgressPhases: false,
                reminderSettings: {
                    enabled: true,
                    daysBeforeDeadline: [7, 3, 1],
                    emailNotifications: true,
                    inAppNotifications: true,
                },
            },
        });
    };

    const renderCycleOverview = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                    Evaluation Cycles
                </h2>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create New Cycle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Evaluation Cycle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cycle-name">Cycle Name</Label>
                                    <Input
                                        id="cycle-name"
                                        value={newCycle.name}
                                        onChange={e =>
                                            setNewCycle({ ...newCycle, name: e.target.value })
                                        }
                                        placeholder="e.g., 2025 Q1 Performance Review"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cycle-status">Initial Status</Label>
                                    <Select
                                        value={newCycle.status}
                                        onValueChange={value =>
                                            setNewCycle({ ...newCycle, status: value as any })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="cycle-description">Description</Label>
                                <Textarea
                                    id="cycle-description"
                                    value={newCycle.description}
                                    onChange={e =>
                                        setNewCycle({ ...newCycle, description: e.target.value })
                                    }
                                    placeholder="Describe the purpose and scope of this evaluation cycle"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-transparent"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newCycle.startDate
                                                    ? format(newCycle.startDate, "PPP")
                                                    : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newCycle.startDate}
                                                onSelect={date =>
                                                    setNewCycle({
                                                        ...newCycle,
                                                        startDate: date || new Date(),
                                                    })
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-transparent"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newCycle.endDate
                                                    ? format(newCycle.endDate, "PPP")
                                                    : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newCycle.endDate}
                                                onSelect={date =>
                                                    setNewCycle({
                                                        ...newCycle,
                                                        endDate: date || new Date(),
                                                    })
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateCycle}>Create Cycle</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {cycles.map(cycle => (
                    <Card key={cycle.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {cycle.name}
                                        <Badge className={getStatusColor(cycle.status)}>
                                            {cycle.status}
                                        </Badge>
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                        {cycle.description}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedCycle(cycle)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-foreground">
                                        Duration
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-muted-foreground">
                                        {format(cycle.startDate, "MMM dd")} -{" "}
                                        {format(cycle.endDate, "MMM dd, yyyy")}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-foreground">
                                        Participants
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-muted-foreground flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {cycle.participants.length} participants
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-foreground">
                                        Progress
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress value={65} className="flex-1" />
                                        <span className="text-sm text-gray-600 dark:text-muted-foreground">
                                            65%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {cycle.phases.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                                        Current Phases
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {cycle.phases.slice(0, 3).map(phase => (
                                            <Badge
                                                key={phase.id}
                                                variant="outline"
                                                className="flex items-center gap-1"
                                            >
                                                {getPhaseStatusIcon(phase.status)}
                                                {phase.name}
                                            </Badge>
                                        ))}
                                        {cycle.phases.length > 3 && (
                                            <Badge variant="outline">
                                                +{cycle.phases.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                Cycle Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Active Cycles
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    3
                                </p>
                            </div>
                            <Play className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Total Participants
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    247
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Completion Rate
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    78%
                                </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Avg. Rating
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    4.2
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">{renderCycleOverview()}</TabsContent>

                <TabsContent value="analytics">{renderAnalytics()}</TabsContent>

                <TabsContent value="settings">
                    <div className="text-center py-12">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                            Global Settings
                        </h3>
                        <p className="text-gray-600 dark:text-muted-foreground">
                            Configure system-wide evaluation settings
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
