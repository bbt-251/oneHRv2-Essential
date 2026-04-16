import { Button } from "@/components/ui/button";

interface PdfViewerProps {
    url: string;
    isDownloadable: boolean;
}

export default function PdfViewer({ url, isDownloadable }: PdfViewerProps) {
    let link = url;
    let downloadLink = url;
    if (url && url.includes("https://drive.google.com")) {
        let id = "";

        // Case 1: URL has /d/<ID>/
        const match = url.match(/\/d\/([^/]+)/);
        if (match) {
            id = match[1];
        }

        // Case 2: URL has ?id=<ID>
        const queryMatch = url.match(/[?&]id=([^&]+)/);
        if (queryMatch) {
            id = queryMatch[1];
        }

        if (id) {
            link = `https://drive.google.com/file/d/${id}/preview`;
            downloadLink = `https://drive.google.com/uc?export=download&id=${id}`;
        }
    }

    const handleDownload = () => {
        window.open(downloadLink, "_blank");
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
                {isDownloadable ? (
                    <Button
                        className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                        onClick={handleDownload}
                    >
                        Download
                    </Button>
                ) : (
                    <></>
                )}
            </div>
            <div>
                <p style={{ color: "GrayText" }}>
                    ( Incase there is an error on this page, like nothing is being displayed, the
                    training material is linked to an incompatible link. Please inform your HR Team)
                </p>
                <iframe
                    id="pdfViewer"
                    src={link}
                    width="100%"
                    height="500px"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}
