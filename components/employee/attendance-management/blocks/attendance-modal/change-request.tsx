import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DailyAttendance, RequestModificationModel } from "@/lib/models/attendance";
import { Calendar, Edit } from "lucide-react";

interface ChangeRequestProps {
    requestModifications: RequestModificationModel[];
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
}

const getRequestStatusBadge = (status: string) => {
    switch (status) {
        case "Approved":
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
            );
        case "Refused":
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Refused</Badge>;
        case "Requested":
            return (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Requested
                </Badge>
            );
        default:
            return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case "clockIn":
            return "Clock In";
        case "clockOut":
            return "Clock Out";
        case "breakOut":
            return "Break Out";
        case "breakIn":
            return "Break In";
        default:
            return type;
    }
};

export const ChangeRequest = ({ requestModifications, day }: ChangeRequestProps) => {
    return (
        <>
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#3f3d56]" />
                <h3
                    className="text-lg font-semibold text-[#3f3d56]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    Change Requests for {day.month} {day.year}
                </h3>
            </div>

            {requestModifications.length > 0 ? (
                <div className="space-y-4">
                    {requestModifications.map(request => (
                        <Card key={request.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {`Request - ${request.requestId ?? ""}`}
                                        </p>
                                    </div>
                                    {getRequestStatusBadge(request.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Timestamp
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.timestamp}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Date
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.date}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Status
                                        </p>
                                        <p
                                            className="text-[#3f3d56] capitalize"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.status}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Old Values
                                        </p>
                                        {request?.oldWorkedHours?.length > 0 ? (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                <div className="space-y-2">
                                                    {request.oldWorkedHours.map((entry, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center"
                                                        >
                                                            <span
                                                                className="text-sm text-[#3f3d56] opacity-70"
                                                                style={{
                                                                    fontFamily:
                                                                        "Montserrat, sans-serif",
                                                                }}
                                                            >
                                                                {getTypeLabel(entry.type)}:
                                                            </span>
                                                            <span
                                                                className="text-sm font-medium text-[#3f3d56]"
                                                                style={{
                                                                    fontFamily:
                                                                        "Montserrat, sans-serif",
                                                                }}
                                                            >
                                                                {entry.hour}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p
                                                className="text-sm text-[#3f3d56] opacity-60 text-center"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                No entries (Absent)
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            New Values
                                        </p>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="space-y-2">
                                                {request?.workedHours?.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center"
                                                    >
                                                        <span
                                                            className="text-sm text-[#3f3d56] opacity-70"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {getTypeLabel(entry.type)}:
                                                        </span>
                                                        <span
                                                            className="text-sm font-medium text-[#3f3d56]"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.hour}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p
                                        className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Comment
                                    </p>
                                    <p
                                        className="text-sm text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {request.comment?.text ?? ""}
                                    </p>
                                </div>
                                {request?.hrComments ? (
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            HR Comment
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request?.hrComments ?? ""}
                                        </p>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <Edit className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] opacity-60"
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                            }}
                        >
                            No change requests for this month
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
};
