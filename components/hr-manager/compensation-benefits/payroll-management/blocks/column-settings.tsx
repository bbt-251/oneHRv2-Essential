import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings } from "lucide-react";

interface ColumnSettingsProps {
    getCurrentColumns: () => { key: string; label: string }[];
    visibleColumns: Record<string, boolean>;
    toggleColumnVisibility: (columnKey: string) => void;
}

export function ColumnSettings({
    getCurrentColumns,
    visibleColumns,
    toggleColumnVisibility,
}: ColumnSettingsProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent"
                >
                    <Settings className="h-4 w-4" />
                    Columns
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getCurrentColumns().map(col => (
                            <div key={col.key} className="flex items-center space-x-2">
                                <Checkbox
                                    id={col.key}
                                    checked={visibleColumns[col.key] || false}
                                    onCheckedChange={() => toggleColumnVisibility(col.key)}
                                />
                                <label htmlFor={col.key} className="text-sm font-normal">
                                    {col.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
