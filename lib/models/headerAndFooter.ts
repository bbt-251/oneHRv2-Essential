export interface HeaderAndFooterModel {
    id: string;
    timestamp: string;
    image: string;
    headerAndFooterType: "Header" | "Footer";
    startDate: string;
    endDate: string;
    active: "Yes" | "No";
}
