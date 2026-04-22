"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import { LateComersModel } from "@/lib/models/late-comers";
import { getLateComersByMonth } from "@/lib/backend/api/attendance/late-comers-service";
import { useData } from "@/context/app-data-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";

interface LateComersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LateComersModal({ isOpen, onClose }: LateComersModalProps) {
    const { employees } = useData();
    const [lateComers, setLateComers] = useState<LateComersModel[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("MMMM"));
    const [loading, setLoading] = useState<boolean>(false);

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const fetchLateComers = useCallback(async () => {
        setLoading(true);
        try {
            const currentYear = dayjs().year();
            const data = await getLateComersByMonth(selectedMonth, currentYear);
            setLateComers(data);
        } catch (error) {
            console.error("Error fetching late comers:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        if (isOpen) {
            void fetchLateComers();
        }
    }, [fetchLateComers, isOpen]);

    const getEmployeeName = (employeeUID: string) => {
        const employee = employees.find(e => e.uid === employeeUID);
        return employee ? getFullName(employee) : "Unknown Employee";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle
                        className="text-xl font-semibold text-[#3f3d56] dark:text-white"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Late Comers Report
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Month Filter */}
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label
                                className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Month:
                            </label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month} value={month}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Employee Name
                                    </TableHead>
                                    <TableHead
                                        className="text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Time
                                    </TableHead>
                                    <TableHead
                                        className="text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Date
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f3d56] mx-auto mb-2"></div>
                                            <p
                                                className="text-[#3f3d56] opacity-70 dark:text-white"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                            >
                                                Loading late comers...
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : lateComers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <p
                                                className="text-[#3f3d56] opacity-70 dark:text-white"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                            >
                                                No late comers found for {selectedMonth}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lateComers.map(lateComer => (
                                        <TableRow key={lateComer.id}>
                                            <TableCell
                                                className="font-medium text-[#3f3d56] dark:text-white"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                            >
                                                {getEmployeeName(lateComer.employeeUID)}
                                            </TableCell>
                                            <TableCell
                                                className="text-[#3f3d56] dark:text-white"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                            >
                                                {dayjs(lateComer.timestamp).format("hh:mm A")}
                                            </TableCell>
                                            <TableCell
                                                className="text-[#3f3d56] dark:text-white"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                            >
                                                {dayjs(lateComer.timestamp).format("MMMM DD, YYYY")}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={onClose}
                            className="bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white px-8"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
