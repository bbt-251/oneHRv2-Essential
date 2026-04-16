import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function GenericView<T extends Record<string, any>>({
    item,
    onClose,
}: {
    item: T;
    onClose: () => void;
}) {
    console.log("item in generic view", item);
    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">Name</Label>
                <div className="mt-1 text-sm">{item.name || "-"}</div>
            </div>

            <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                    <Badge
                        variant={item.active ? "default" : "secondary"}
                        className={
                            item.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {item.active ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </div>

            <div>
                <Label className="text-sm font-medium">Timestamp</Label>
                <div className="mt-1 text-sm">{new Date(item.timestamp).toLocaleString()}</div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white">
                    Close
                </Button>
            </div>
        </div>
    );
}
