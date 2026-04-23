import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OvertimeConfigurationModel } from "@/lib/models/hr-settings";
import { calculateDuration } from "@/lib/util/functions/calculateDuration";
import { DailyAttendance } from "@/lib/models/attendance";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { DollarSign } from "lucide-react";

const getOvertimeStatusBadge = (status: string) => {
    switch (status) {
        case "approved":
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
            );
        case "paid":
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Paid</Badge>;
        case "pending":
            return (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
            );
        default:
            return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
};

interface ClaimedOTProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
    overtimeTypes: OvertimeConfigurationModel[];
    claimedOTs: OvertimeRequestModel[];
}

export const ClaimedOvertime = ({ day, overtimeTypes, claimedOTs }: ClaimedOTProps) => {
    return (
        <>
            <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-[#3f3d56]" />
                <h3
                    className="text-lg font-semibold text-[#3f3d56]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    Overtime Claims for {day.month} {day.year}
                </h3>
            </div>

            {claimedOTs.length > 0 ? (
                <div className="space-y-4">
                    {claimedOTs.map(overtime => (
                        <Card key={overtime.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtime.overtimeId}
                                        </p>
                                    </div>
                                    {getOvertimeStatusBadge(overtime.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Date
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtime.overtimeDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Type
                                        </p>
                                        <p
                                            className="text-[#3f3d56] capitalize"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtimeTypes.find(
                                                ot => ot.id == overtime.overtimeType,
                                            )?.overtimeType ?? ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Start Time
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtime.overtimeStartTime}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime End Time
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtime.overtimeEndTime}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Duration (Hour(s))
                                        </p>
                                        <p
                                            className="text-[#3f3d56] font-semibold"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {calculateDuration(
                                                overtime.overtimeStartTime,
                                                overtime.overtimeEndTime,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] opacity-60"
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                            }}
                        >
                            No overtime claims for this month
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
};
