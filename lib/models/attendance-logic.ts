export interface AttendanceLogicModel {
    id: string;
    chosenLogic: 1 | 2 | 3 | 4;
    halfPresentThreshold: number | null;
    presentThreshold: number | null;
}
