import { Delegation } from "./blocks/delegation";

export default function DelegationManagementManager() {
    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen dark:bg-background">
            <div className="mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                        Delegation Management
                    </h1>
                    <p className="text-brand-600 mt-2 dark:text-muted-foreground">
                        Manage and assign delegations for your team members
                    </p>
                </div>

                <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                    <Delegation isHRManager={false} />
                </div>
            </div>
        </div>
    );
}
