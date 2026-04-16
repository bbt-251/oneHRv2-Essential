"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeModel } from "@/lib/models/employee";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { useFirestore } from "@/context/firestore-context";

interface EmployeeMultiSelectDropdownProps {
    selectedEmployeeIDs: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    placeholder: string;
    disabled?: boolean;
}

export function EmployeeMultiSelectDropdown({
    selectedEmployeeIDs,
    onSelectionChange,
    placeholder,
    disabled = false,
}: EmployeeMultiSelectDropdownProps) {
    const { activeEmployees, hrSettings } = useFirestore();
    const [open, setOpen] = useState(false);

    const toggleEmployee = (employeeUID: string) => {
        if (selectedEmployeeIDs.includes(employeeUID)) {
            onSelectionChange(selectedEmployeeIDs.filter(id => id !== employeeUID));
        } else {
            onSelectionChange([...selectedEmployeeIDs, employeeUID]);
        }
    };

    const getEmployeeDisplayName = (employee: EmployeeModel) => {
        return `${employee.firstName} ${employee.surname}`;
    };

    const getEmployeeDetails = (employee: EmployeeModel) => {
        const department = hrSettings.departmentSettings?.find(d => d.id === employee.department);
        const position = hrSettings.positions?.find(p => p.id === employee.employmentPosition);
        const departmentName = department?.name || employee.department || "Unknown Department";
        const positionName = position?.name || employee.employmentPosition || "Unknown Position";
        return `${positionName} - ${departmentName}`;
    };

    const selectedEmployees = activeEmployees.filter(emp => selectedEmployeeIDs.includes(emp.uid));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-10 text-left font-normal disabled:opacity-50"
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedEmployees.length > 0 ? (
                            selectedEmployees.map(employee => (
                                <Badge key={employee.uid} variant="secondary" className="mr-1 mb-1">
                                    {getEmployeeDisplayName(employee)}
                                    <span
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                toggleEmployee(employee.uid);
                                            }
                                        }}
                                        onMouseDown={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleEmployee(employee.uid);
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label="Remove employee"
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </span>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <ScrollArea className="h-[200px] w-full" onWheel={e => e.stopPropagation()}>
                    <div className="p-2">
                        {activeEmployees.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                                No active employees available
                            </div>
                        ) : (
                            activeEmployees.map(employee => (
                                <div
                                    key={employee.uid}
                                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                    onClick={() => toggleEmployee(employee.uid)}
                                >
                                    <Checkbox
                                        checked={selectedEmployeeIDs.includes(employee.uid)}
                                        onCheckedChange={() => toggleEmployee(employee.uid)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {getEmployeeDisplayName(employee)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {getEmployeeDetails(employee)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
