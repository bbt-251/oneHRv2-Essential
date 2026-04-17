import { uploadUsingGateway } from "@/lib/backend/gateways/factory";

export const uploadLeaveAttachmentViaGateway = async (
    file: File,
    leaveId: string,
): Promise<string> => {
    const documentId = Date.now().toString();
    const fileName = `${documentId}-${file.name}`;
    const filePath = `leaves/${leaveId}/${fileName}`;

    return uploadUsingGateway(filePath, file);
};
