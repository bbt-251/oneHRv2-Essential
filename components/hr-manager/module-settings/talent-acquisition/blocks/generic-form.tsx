import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { useState } from "react";

export default function GenericForm<
    T extends { id?: string; name: string; active: boolean; timestamp?: string },
>({
    item,
    onSave,
    onCancel,
    title,
}: {
    item?: T;
    onSave: (data: Omit<T, "id">) => void;
    onCancel: () => void;
    title: string;
}) {
    const { theme } = useTheme();
    const [formData, setFormData] = useState<Partial<T>>(
        item || ({ name: "", active: true } as Partial<T>),
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            timestamp: dayjs().format(timestampFormat),
        } as Omit<T, "id">;
        onSave(dataToSave);
    };

    const updateField = (key: keyof T, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                        Name
                        <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={(formData.name as string) || ""}
                        onChange={e => updateField("name" as keyof T, e.target.value)}
                        required
                        className="mt-1"
                        placeholder={`Enter ${title.toLowerCase()} name`}
                    />
                </div>

                <div>
                    <Label htmlFor="active" className="text-sm font-medium">
                        Status
                    </Label>
                    <div className="flex items-center space-x-2 mt-1">
                        <Switch
                            className={"" + (theme === "dark" ? "bg-brand-200" : "bg-accent-800")}
                            id="active"
                            checked={(formData.active as boolean) || false}
                            onCheckedChange={checked => updateField("active" as keyof T, checked)}
                        />
                        <Label htmlFor="active" className="text-sm">
                            {(formData.active as boolean) ? "Active" : "Inactive"}
                        </Label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="bg-transparent"
                >
                    Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                    {item ? "Update" : "Create"} {title}
                </Button>
            </div>
        </form>
    );
}
