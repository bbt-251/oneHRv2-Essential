import { Label } from "@/components/ui/label";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { Paperclip } from "lucide-react";

interface AttachmentsProps {
    selectedRequest: TrainingMaterialRequestModel;
}

export default function Attachments({ selectedRequest }: AttachmentsProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Attachments</h3>
            {selectedRequest.attachments && selectedRequest.attachments.length > 0 ? (
                <ul className="space-y-3">
                    {selectedRequest.attachments.map((attachment, index) => (
                        <li
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-md"
                        >
                            <div className="flex items-center gap-3">
                                <Paperclip className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {attachment.attachmentTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {attachment.attachmentFormat}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={attachment.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                            >
                                View
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No attachments for this request.</p>
            )}
        </div>
    );
}
