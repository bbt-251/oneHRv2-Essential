import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AmountModalProps {
    isAmountModalOpen: boolean;
    setIsAmountModalOpen: (open: boolean) => void;
    selectedMonthlyAmounts: { [month: string]: number };
}

export function AmountModal({
    isAmountModalOpen,
    setIsAmountModalOpen,
    selectedMonthlyAmounts,
}: AmountModalProps) {
    return (
        <Dialog open={isAmountModalOpen} onOpenChange={setIsAmountModalOpen}>
            <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
                <DialogHeader>
                    <DialogTitle>Amount Per Month</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow style={{ backgroundColor: "#3f3d56ff" }}>
                                <TableHead className="text-white text-center w-1/12">
                                    January
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    February
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    March
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    April
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">May</TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    June
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    July
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    August
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    September
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    October
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    November
                                </TableHead>
                                <TableHead className="text-white text-center w-1/12">
                                    December
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.January || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.February || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.March || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.April || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.May || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.June || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.July || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.August || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.September || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.October || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.November || 0}
                                </TableCell>
                                <TableCell className="font-medium text-center">
                                    {selectedMonthlyAmounts.December || 0}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
