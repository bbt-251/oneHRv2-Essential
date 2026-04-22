import { useState, useMemo, useCallback } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";

export function usePayrollFilters(payslipData: PayrollData[], selectedEmployees: string[]) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [rangeFilters, setRangeFilters] = useState<Record<string, { from: string; to: string }>>(
        {},
    );
    const [dateRangeFilters, setDateRangeFilters] = useState<
        Record<string, { from: string; to: string }>
    >({});

    const applyEmployeeSelection = useCallback(
        (data: PayrollData[]) => {
            if (selectedEmployees.length === 0) return data;
            return data.filter(item => selectedEmployees.includes(item.uid));
        },
        [selectedEmployees],
    );

    const applyAllFilters = useCallback(
        (
            sourceData: PayrollData[],
            textFilters: Record<string, string>,
            numericRangeFilters: Record<string, { from: string; to: string }>,
            dateFilters: Record<string, { from: string; to: string }>,
        ) => {
            let filtered = sourceData;

            Object.entries(textFilters).forEach(([key, filterValue]) => {
                if (filterValue) {
                    filtered = filtered.filter(item => {
                        const itemValue = item[key as keyof PayrollData];
                        return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
                    });
                }
            });

            Object.entries(numericRangeFilters).forEach(([key, range]) => {
                if (range.from || range.to) {
                    filtered = filtered.filter(item => {
                        const itemValue = Number(item[key as keyof PayrollData]);
                        const fromValue = range.from ? Number(range.from) : 0;
                        const toValue = range.to ? Number(range.to) : Number.POSITIVE_INFINITY;
                        return itemValue >= fromValue && itemValue <= toValue;
                    });
                }
            });

            Object.entries(dateFilters).forEach(([key, range]) => {
                if (range.from || range.to) {
                    filtered = filtered.filter(item => {
                        const itemValue = new Date(item[key as keyof PayrollData] as string);
                        const fromDate = range.from ? new Date(range.from) : new Date("1900-01-01");
                        const toDate = range.to ? new Date(range.to) : new Date("2100-12-31");
                        return itemValue >= fromDate && itemValue <= toDate;
                    });
                }
            });

            return filtered;
        },
        [],
    );

    const handleFilterChange = useCallback((columnKey: string, value: string) => {
        setFilters(prev => ({ ...prev, [columnKey]: value }));
    }, []);

    const handleRangeFilterChange = useCallback(
        (columnKey: string, type: "from" | "to", value: string) => {
            setRangeFilters(prev => ({
                ...prev,
                [columnKey]: {
                    ...prev[columnKey],
                    [type]: value,
                },
            }));
        },
        [],
    );

    const handleDateRangeFilterChange = useCallback(
        (columnKey: string, type: "from" | "to", value: string) => {
            setDateRangeFilters(prev => ({
                ...prev,
                [columnKey]: {
                    ...prev[columnKey],
                    [type]: value,
                },
            }));
        },
        [],
    );

    const clearFilters = () => {
        setFilters({});
        setRangeFilters({});
        setDateRangeFilters({});
    };

    const filteredData = useMemo(
        () =>
            applyAllFilters(
                applyEmployeeSelection(payslipData),
                filters,
                rangeFilters,
                dateRangeFilters,
            ),
        [
            applyAllFilters,
            applyEmployeeSelection,
            dateRangeFilters,
            filters,
            payslipData,
            rangeFilters,
        ],
    );

    return {
        filteredData,
        filters,
        rangeFilters,
        dateRangeFilters,
        handleFilterChange,
        handleRangeFilterChange,
        handleDateRangeFilterChange,
        clearFilters,
    };
}
