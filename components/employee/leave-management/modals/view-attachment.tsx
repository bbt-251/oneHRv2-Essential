"use client";

import { useEffect, useState } from "react";
import {
    X,
    Download,
    Printer,
    Minus,
    Plus,
    FileText,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { getBackendStorageDownloadUrl } from "@/lib/backend/client/storage-client";

interface ViewAttachmentProps {
    attachments: string[];
    setIsAttachmentModalOpen: (open: boolean) => void;
}

const FIREBASE_STORAGE_URL_PREFIX = "https://firebasestorage.googleapis.com/";
const GOOGLE_STORAGE_URL_PREFIX = "https://storage.googleapis.com";

export default function ViewAttachment({
    attachments,
    setIsAttachmentModalOpen,
}: ViewAttachmentProps) {
    const { theme } = useTheme();
    const [zoom, setZoom] = useState<number>(74);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [resolvedAttachmentUrl, setResolvedAttachmentUrl] = useState<string | null>(null);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);

    const firstAttachment = attachments?.[0];
    const isDirectUrl =
        typeof firstAttachment === "string" &&
        (firstAttachment.startsWith(FIREBASE_STORAGE_URL_PREFIX) ||
            firstAttachment.startsWith(GOOGLE_STORAGE_URL_PREFIX) ||
            firstAttachment.startsWith("http://") ||
            firstAttachment.startsWith("https://"));
    const hasAttachment = typeof firstAttachment === "string" && firstAttachment.length > 0;

    useEffect(() => {
        let active = true;

        if (!hasAttachment || isDirectUrl) {
            return;
        }

        getBackendStorageDownloadUrl(firstAttachment)
            .then(downloadUrl => {
                if (!active) {
                    return;
                }

                setResolvedAttachmentUrl(downloadUrl);
                setAttachmentError(null);
            })
            .catch(error => {
                if (!active) {
                    return;
                }

                console.error("Failed to resolve attachment download URL:", error);
                setResolvedAttachmentUrl(null);
                setAttachmentError("Failed to resolve attachment.");
            });

        return () => {
            active = false;
        };
    }, [firstAttachment, hasAttachment, isDirectUrl]);

    const pdfUrl = isDirectUrl ? firstAttachment : resolvedAttachmentUrl;
    const isValidAttachment = Boolean(pdfUrl);

    const handleClose = () => {
        setIsAttachmentModalOpen(false);
    };

    const getFileNameFromUrl = (url: string): string => {
        try {
            const path = url.split("?")[0];
            const segments = path.split("%2F");
            const fileName = segments.pop();

            if (fileName) {
                return decodeURIComponent(fileName);
            }
            return "attachment.pdf"; // Fallback
        } catch (e) {
            console.error("Failed to parse file name:", e);
            return "attachment.pdf"; // Fallback on error
        }
    };

    const fileName = pdfUrl ? getFileNameFromUrl(pdfUrl) : "Attachment";

    const handlePrint = () => {
        const iframe = document.getElementById("pdf-iframe") as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 sm:p-6 md:p-8"
            onClick={handleClose}
        >
            <div
                className={`rounded-lg shadow-2xl w-full h-full flex flex-col overflow-hidden ${theme === "dark" ? "dark:bg-black" : ""}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    className={`flex justify-between items-center py-3 px-6 border-b ${theme === "dark" ? "dark:border-gray-700" : "border-gray-200"}`}
                >
                    <h2
                        className={`text-lg font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                    >
                        Attachments
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Conditionally render the viewer or a message */}
                {!isValidAttachment ? (
                    <div
                        className={`flex-grow flex flex-col items-center justify-center p-8 text-center ${theme === "dark" ? "dark:bg-gray-800" : "bg-gray-50"}`}
                    >
                        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                        <h3
                            className={`text-xl font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                        >
                            No Attachment Available
                        </h3>
                        <p
                            className={`text-gray-500 mt-2 ${theme === "dark" ? "text-gray-200" : "text-gray-500"}`}
                        >
                            {attachmentError ||
                                "There is no valid attachment to display for this request."}
                        </p>
                    </div>
                ) : (
                    <div
                        className={`flex-grow flex flex-col ${theme === "dark" ? "dark:bg-gray-800" : "bg-gray-200"}`}
                    >
                        {/* Viewer Controls Header */}
                        <div
                            className={`flex items-center justify-between bg-gray-800  px-4 py-1.5 shadow-md z-10 ${theme === "dark" ? "dark:bg-gray-800" : "text-white"}`}
                        >
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                                    title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                                >
                                    {sidebarOpen ? (
                                        <ChevronsLeft className="w-5 h-5" />
                                    ) : (
                                        <ChevronsRight className="w-5 h-5" />
                                    )}
                                </button>
                                <div
                                    className={`w-px bg-gray-600 h-6 mx-1 ${theme === "dark" ? "dark:bg-gray-600" : ""}`}
                                ></div>
                                <span
                                    className={`text-sm font-medium truncate max-w-xs md:max-w-md ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                    title={fileName}
                                >
                                    {fileName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                                    onClick={() => setZoom(z => Math.max(25, z - 10))}
                                >
                                    <Minus
                                        className={`w-5 h-5 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                    />
                                </button>
                                <span
                                    className={`text-sm font-bold w-12 text-center select-none ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                >
                                    {zoom}%
                                </span>
                                <button
                                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                                    onClick={() => setZoom(z => Math.min(200, z + 10))}
                                >
                                    <Plus
                                        className={`w-5 h-5 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={pdfUrl || ""}
                                    download={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                                    title="Download"
                                >
                                    <Download
                                        className={`w-5 h-5 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                    />
                                </a>
                                <button
                                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                                    onClick={handlePrint}
                                    title="Print"
                                >
                                    <Printer
                                        className={`w-5 h-5 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div
                            className={`flex-grow flex overflow-hidden ${theme === "dark" ? "dark:bg-gray-800" : ""}`}
                        >
                            {/* Thumbnail Sidebar */}
                            {sidebarOpen && (
                                <div
                                    className={`w-64  p-4 overflow-y-auto transition-all duration-300 ${theme === "dark" ? "dark:bg-gray-800" : ""}`}
                                >
                                    <div
                                        className={`p-2 border-2 border-blue-400 rounded-md bg-gray-800 cursor-pointer ${theme === "dark" ? "dark:bg-gray-800" : ""}`}
                                    >
                                        <div className="bg-white h-40 flex items-center justify-center rounded-sm">
                                            <div className="text-center">
                                                <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {fileName}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-white text-center mt-2 text-sm font-medium">
                                            1
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PDF Content */}
                            <div
                                className={`flex-grow overflow-auto flex justify-center p-4 ${theme === "dark" ? "dark:bg-gray-800" : "bg-gray-400"}`}
                            >
                                <iframe
                                    id="pdf-iframe"
                                    src={`${pdfUrl}#toolbar=0`}
                                    title={fileName}
                                    frameBorder="0"
                                    className="shadow-lg"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: "top center",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
