import { useTheme } from "@/components/theme-provider";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ReactNode } from "react";

interface DeleteConfirmProps {
    onConfirm: () => void | Promise<void>;
    itemName: string;
    title?: string;
    description?: string;
    deleteButtonText?: string;
    trigger?: ReactNode;
    warningText?: string;

    isLoading?: boolean;
}

export default function DeleteConfirm({
    onConfirm,
    itemName,
    title,
    description,
    deleteButtonText = "Delete",
    trigger,
    warningText,
    isLoading = false,
}: DeleteConfirmProps) {
    const { theme } = useTheme();
    const defaultDescription = `Are you sure you want to delete ${itemName}? This action cannot be undone.`;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => e.stopPropagation()}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-black"}`}
                    >
                        {title || `Delete ${itemName}`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || defaultDescription}
                        {warningText && (
                            <span className="mt-2 block text-red-600 font-medium">
                                {warningText}
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className={`${theme === "dark" ? "text-white" : "text-black"}`}
                        disabled={isLoading}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={`${theme === "dark" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : deleteButtonText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
