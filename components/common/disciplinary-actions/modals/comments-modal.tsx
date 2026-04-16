"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: DisciplinaryActionModel | null;
}

export function CommentsModal({ isOpen, onClose, action }: CommentsModalProps) {
    const { employees } = useFirestore();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Waiting HR Approval":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Raised":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "Approved":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "Appealed":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
            case "Appeal Approved":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "Appeal Refused":
                return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getOccurrenceLevelColor = (level: string) => {
        switch (level) {
            case "First Occurrence":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Second Occurrence":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Third Occurrence":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Employee Comments</DialogTitle>
                </DialogHeader>

                {action && (
                    <div className="space-y-6">
                        {/* Action Details */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-foreground">
                                    Action Details
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(action.status)}>
                                        {action.status}
                                    </Badge>
                                    <Badge
                                        className={getOccurrenceLevelColor(action.occurrenceLevel)}
                                    >
                                        {action.occurrenceLevel}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        ID:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {action.actionID}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Employee:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {(() => {
                                            const employee = employees.find(
                                                emp => emp.uid === action.employeeUid,
                                            );
                                            return employee
                                                ? `${employee.firstName} ${employee.surname}`
                                                : "Unknown Employee";
                                        })()}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Violation Type:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {action.violations[0]?.violationType}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Date:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {new Date(action.violationDateAndTime).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Details:
                                </span>
                                <p className="mt-1 text-gray-600 dark:text-muted-foreground">
                                    {action.violations[0]?.details}
                                </p>
                            </div>
                        </div>

                        {/* Employee Comments */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                Employee Comments
                            </h4>
                            {action.employeeComments && action.employeeComments.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {action.employeeComments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm text-gray-900 dark:text-foreground">
                                                    {comment.author}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(comment.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-muted-foreground italic">
                                    No comments from employee yet.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
