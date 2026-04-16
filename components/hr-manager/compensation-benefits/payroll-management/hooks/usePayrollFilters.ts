import { useState, useEffect, useRef, useCallback } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";

export function usePayrollFilters(
    payslipData: PayrollData[],
    selectedEmployees: string[],
    setFilteredData: (data: PayrollData[]) => void,
) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [rangeFilters, setRangeFilters] = useState<Record<string, { from: string; to: string }>>(
        {},
    );
    const [dateRangeFilters, setDateRangeFilters] = useState<
        Record<string, { from: string; to: string }>
    >({});

    // Use ref to track previous filtered data to prevent unnecessary updates
    const prevFilteredDataRef = useRef<PayrollData[] | null>(null);

    // Track if this is the initial render
    const isInitialRef = useRef(true);

    const hasActiveFilters =
        Object.values(filters).some(v => v) ||
        Object.values(rangeFilters).some(r => r.from || r.to) ||
        Object.values(dateRangeFilters).some(r => r.from || r.to);

    const applyEmployeeSelection = useCallback(
        (data: PayrollData[]) => {
            if (selectedEmployees.length === 0) return data;
            return data.filter(item => selectedEmployees.includes(item.uid));
        },
        [selectedEmployees],
    );

    // Apply filters when payslipData changes (e.g., when month changes)
    useEffect(() => {
        // Skip the initial render - let the main useEffect in usePayrollData handle initial state
        if (isInitialRef.current) {
            isInitialRef.current = false;
            return;
        }

        if (hasActiveFilters) {
            applyAllFilters(filters, rangeFilters, dateRangeFilters);
        } else {
            // No filters active, just set the payslipData as filtered data
            const baseData = applyEmployeeSelection(payslipData);
            if (prevFilteredDataRef.current !== baseData) {
                prevFilteredDataRef.current = baseData;
                setFilteredData(baseData);
            }
        }
    }, [payslipData, hasActiveFilters, applyEmployeeSelection]);

    const handleFilterChange = useCallback(
        (columnKey: string, value: string) => {
            const newFilters = { ...filters, [columnKey]: value };
            setFilters(newFilters);
            applyAllFilters(newFilters, rangeFilters, dateRangeFilters);
        },
        [filters, rangeFilters, dateRangeFilters],
    );

    const handleRangeFilterChange = useCallback(
        (columnKey: string, type: "from" | "to", value: string) => {
            const newRangeFilters = {
                ...rangeFilters,
                [columnKey]: {
                    ...rangeFilters[columnKey],
                    [type]: value,
                },
            };
            setRangeFilters(newRangeFilters);
            applyAllFilters(filters, newRangeFilters, dateRangeFilters);
        },
        [filters, rangeFilters, dateRangeFilters],
    );

    const handleDateRangeFilterChange = useCallback(
        (columnKey: string, type: "from" | "to", value: string) => {
            const newDateRangeFilters = {
                ...dateRangeFilters,
                [columnKey]: {
                    ...dateRangeFilters[columnKey],
                    [type]: value,
                },
            };
            setDateRangeFilters(newDateRangeFilters);
            applyAllFilters(filters, rangeFilters, newDateRangeFilters);
        },
        [filters, rangeFilters, dateRangeFilters],
    );

    const applyAllFilters = (
        textFilters: Record<string, string>,
        rangeFilters: Record<string, { from: string; to: string }>,
        dateFilters: Record<string, { from: string; to: string }>,
    ) => {
        let filtered = payslipData;

        // Apply text filters
        Object.entries(textFilters).forEach(([key, filterValue]) => {
            if (filterValue) {
                filtered = filtered.filter(item => {
                    const itemValue = item[key as keyof typeof item];
                    return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
                });
            }
        });

        // Apply range filters
        Object.entries(rangeFilters).forEach(([key, range]) => {
            if (range.from || range.to) {
                filtered = filtered.filter(item => {
                    const itemValue = Number(item[key as keyof typeof item]);
                    const fromValue = range.from ? Number(range.from) : 0;
                    const toValue = range.to ? Number(range.to) : Number.POSITIVE_INFINITY;
                    return itemValue >= fromValue && itemValue <= toValue;
                });
            }
        });

        // Apply date range filters
        Object.entries(dateFilters).forEach(([key, range]) => {
            if (range.from || range.to) {
                filtered = filtered.filter(item => {
                    const itemValue = new Date(item[key as keyof typeof item] as string);
                    const fromDate = range.from ? new Date(range.from) : new Date("1900-01-01");
                    const toDate = range.to ? new Date(range.to) : new Date("2100-12-31");
                    return itemValue >= fromDate && itemValue <= toDate;
                });
            }
        });

        // Only update if the filtered data is actually different
        const currentFiltered = prevFilteredDataRef.current;
        if (currentFiltered === filtered) {
            return; // Skip update if data hasn't changed
        }

        // Check if arrays have same content
        const hasChanged =
            !currentFiltered ||
            currentFiltered.length !== filtered.length ||
            currentFiltered.some((item, index) => item.uid !== filtered[index]?.uid);

        if (hasChanged) {
            prevFilteredDataRef.current = filtered;
            setFilteredData(filtered);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setRangeFilters({});
        setDateRangeFilters({});
        setFilteredData(applyEmployeeSelection(payslipData));
    };

    return {
        filters,
        rangeFilters,
        dateRangeFilters,
        handleFilterChange,
        handleRangeFilterChange,
        handleDateRangeFilterChange,
        clearFilters,
    };
}
