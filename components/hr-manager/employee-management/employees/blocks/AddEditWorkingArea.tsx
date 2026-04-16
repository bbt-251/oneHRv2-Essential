import { EmployeeModel } from "@/lib/models/employee";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import WorkingLocationMap from "./working-area";
import { useTheme } from "@/components/theme-provider";

export default function AddEditWorkingArea({
    open,
    setOpen,
    edit,
    data,
    employee,
    setCoordinates,
}: {
    open: boolean;
    setOpen: (val: boolean) => void;
    edit: boolean;
    data: [number, number][];
    employee: EmployeeModel;
    setCoordinates: (coordinate: [number, number][]) => void;
}) {
    const { theme } = useTheme();
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl">
                <AlertDialogHeader>
                    <DialogTitle
                        className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                    >
                        Working Area
                    </DialogTitle>
                </AlertDialogHeader>
                {/* The map component should be inside the DialogContent */}
                <WorkingLocationMap
                    edit={edit}
                    data={data}
                    employee={employee}
                    setCoordinates={setCoordinates}
                />
            </DialogContent>
        </Dialog>
    );
}
