import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

const employmentTypes = ["Full-time", "Part-time", "Contract", "Intern"];
const positions = [
    "Senior Developer",
    "Marketing Manager",
    "Sales Representative",
    "HR Specialist",
    "Finance Analyst",
];
const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];
const sections = ["Backend", "Frontend", "Digital Marketing", "Enterprise Sales", "Recruitment"];
const locations = ["New York", "Los Angeles", "Chicago", "Boston", "San Francisco"];

interface FilterFieldProps {
    col: { key: string; label: string };
    filters: Record<string, string>;
    rangeFilters: Record<string, { from: string; to: string }>;
    dateRangeFilters: Record<string, { from: string; to: string }>;
    handleFilterChange: (columnKey: string, value: string) => void;
    handleRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
    handleDateRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
}

export function FilterField({
    col,
    filters,
    rangeFilters,
    dateRangeFilters,
    handleFilterChange,
    handleRangeFilterChange,
    handleDateRangeFilterChange,
}: FilterFieldProps) {
    const getFieldType = (columnKey: string) => {
        if (columnKey === "contractStartingDate" || columnKey === "contractTerminationDate") {
            return "dateRange";
        }
        if (
            ["employmentPosition", "department", "section", "workingLocation"].includes(columnKey)
        ) {
            return "dropdown";
        }
        if (
            columnKey.includes("Salary") ||
            columnKey.includes("Payment") ||
            columnKey.includes("Cost") ||
            columnKey.includes("Tax") ||
            columnKey.includes("Deduction") ||
            columnKey.includes("Gross")
        ) {
            return "range";
        }
        return "text";
    };

    const getDropdownOptions = (columnKey: string) => {
        switch (columnKey) {
            case "employmentPosition":
                return positions;
            case "department":
                return departments;
            case "section":
                return sections;
            case "workingLocation":
                return locations;
            default:
                return [];
        }
    };

    const fieldType = getFieldType(col.key);

    switch (fieldType) {
        case "dateRange":
            return (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        {col.label}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <Input
                                type="date"
                                placeholder="From"
                                value={dateRangeFilters[col.key]?.from || ""}
                                onChange={e =>
                                    handleDateRangeFilterChange(col.key, "from", e.target.value)
                                }
                                className="h-9 pl-3 pr-10"
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <div className="relative">
                            <Input
                                type="date"
                                placeholder="To"
                                value={dateRangeFilters[col.key]?.to || ""}
                                onChange={e =>
                                    handleDateRangeFilterChange(col.key, "to", e.target.value)
                                }
                                className="h-9 pl-3 pr-10"
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            );

        case "dropdown":
            return (
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        {col.label}
                    </label>
                    <Select
                        value={filters[col.key] || "All"}
                        onValueChange={value => handleFilterChange(col.key, value)}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder={`Select ${col.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All {col.label}</SelectItem>
                            {getDropdownOptions(col.key).map(option => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );

        case "range":
            return (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        {col.label}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            placeholder="From"
                            value={rangeFilters[col.key]?.from || ""}
                            onChange={e => handleRangeFilterChange(col.key, "from", e.target.value)}
                            className="h-9"
                        />
                        <Input
                            type="number"
                            placeholder="To"
                            value={rangeFilters[col.key]?.to || ""}
                            onChange={e => handleRangeFilterChange(col.key, "to", e.target.value)}
                            className="h-9"
                        />
                    </div>
                </div>
            );

        default:
            return (
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        {col.label}
                    </label>
                    <Input
                        placeholder={`Filter by ${col.label.toLowerCase()}...`}
                        value={filters[col.key] || ""}
                        onChange={e => handleFilterChange(col.key, e.target.value)}
                        className="h-9"
                    />
                </div>
            );
    }
}
