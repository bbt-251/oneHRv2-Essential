export interface LogModel {
    id: string;
    timestamp: string;
    module: string;
    title: string;
    description: string;
    status: "Success" | "Failure";
    actionBy: string;
}
