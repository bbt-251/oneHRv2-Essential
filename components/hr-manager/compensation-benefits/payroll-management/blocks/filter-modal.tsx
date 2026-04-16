import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { FilterField } from "./filter-field";

interface FilterModalProps {
    isFilterModalOpen: boolean;
    setIsFilterModalOpen: (open: boolean) => void;
    getCurrentColumns: () => { key: string; label: string }[];
    filters: Record<string, string>;
    rangeFilters: Record<string, { from: string; to: string }>;
    dateRangeFilters: Record<string, { from: string; to: string }>;
    handleFilterChange: (columnKey: string, value: string) => void;
    handleRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
    handleDateRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
    clearFilters: () => void;
}

export function FilterModal({
    isFilterModalOpen,
    setIsFilterModalOpen,
    getCurrentColumns,
    filters,
    rangeFilters,
    dateRangeFilters,
    handleFilterChange,
    handleRangeFilterChange,
    handleDateRangeFilterChange,
    clearFilters,
}: FilterModalProps) {
    return (
        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent"
                >
                    <Filter className="h-4 w-4" />
                    Filter
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Filter Employee Data</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {getCurrentColumns().map(col => (
                        <div key={col.key}>
                            <FilterField
                                col={col}
                                filters={filters}
                                rangeFilters={rangeFilters}
                                dateRangeFilters={dateRangeFilters}
                                handleFilterChange={handleFilterChange}
                                handleRangeFilterChange={handleRangeFilterChange}
                                handleDateRangeFilterChange={handleDateRangeFilterChange}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 p-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFilters();
                        }}
                    >
                        Clear All
                    </Button>
                    <Button onClick={() => setIsFilterModalOpen(false)}>Apply Filters</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
