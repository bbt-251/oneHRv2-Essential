import { Button } from "@/components/ui/button";

interface TabButtonsProps {
    activeTab: string;
    handleTabChange: (tab: string) => void;
}

export function TabButtons({ activeTab, handleTabChange }: TabButtonsProps) {
    return (
        <div className="flex gap-2 pt-2 border-t">
            <Button
                size="sm"
                onClick={() => handleTabChange("profile")}
                className={activeTab === "profile" ? "bg-[#3f3d56ff] text-white" : ""}
            >
                Profile
            </Button>
            <Button
                variant={activeTab === "worktime" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("worktime")}
                className={activeTab === "worktime" ? "bg-[#3f3d56ff] text-white" : ""}
            >
                Work Time
            </Button>
            <Button
                variant={activeTab === "payments" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("payments")}
                className={activeTab === "payments" ? "bg-[#3f3d56ff] text-white" : ""}
            >
                Payments
            </Button>
            <Button
                variant={activeTab === "deductions" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("deductions")}
                className={activeTab === "deductions" ? "bg-[#3f3d56ff] text-white" : ""}
            >
                Deductions
            </Button>
        </div>
    );
}
