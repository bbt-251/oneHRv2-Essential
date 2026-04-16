import { Button } from "@/components/ui/button";

interface TabButtonsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function TabButtons({ activeTab, setActiveTab }: TabButtonsProps) {
    return (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <Button
                variant={activeTab === "payments" ? "default" : "ghost"}
                onClick={() => setActiveTab("payments")}
                className={`px-6 py-2 rounded-md transition-all ${
                    activeTab === "payments"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
                Payments
            </Button>
            <Button
                variant={activeTab === "deductions" ? "default" : "ghost"}
                onClick={() => setActiveTab("deductions")}
                className={`px-6 py-2 rounded-md transition-all ${
                    activeTab === "deductions"
                        ? "bg-white dark:bg-gray-700 shadow-sm"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
                Deductions
            </Button>
        </div>
    );
}
