import JSZip from "jszip";
import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import PayrollSlip from "@/components/hr-manager/compensation-benefits/payroll-management/blocks/payrollSlip";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";

export const generatePayrollSlip = async (
    selections: string[],
    dataSource: PayrollData[],
    pdfSettings: PayrollPDFSettingsModel,
    attendanceLogic: 1 | 2 | 3 | 4,
    showToast: any,
) => {
    if (selections.length === 0) {
        showToast("No selections made.", "Warning", "warning");
        return;
    }

    const zip = new JSZip();
    const pdfBlobs: { blob: Blob; fileName: string }[] = [];

    try {
        await Promise.all(
            selections.map(async id => {
                const slipData = dataSource.find(doc => doc.uid === id);
                if (slipData) {
                    const pdfBlob = await pdf(
                        <PayrollSlip
                            data={slipData}
                            header={pdfSettings.header ?? ""}
                            footer={pdfSettings.footer ?? ""}
                            signature={pdfSettings.signature ?? ""}
                            stamp={pdfSettings.stamp ?? ""}
                            attendanceLogic={attendanceLogic}
                        />,
                    ).toBlob();

                    pdfBlobs.push({
                        blob: pdfBlob,
                        fileName: `${slipData.employeeName} ${slipData.month} ${slipData.year} Payroll Slip.pdf`,
                    });

                    const folder = zip.folder(slipData.employeeName);
                    if (folder) {
                        folder.file(pdfBlobs[pdfBlobs.length - 1].fileName, pdfBlob);
                    }
                }
            }),
        );

        const fileCount = pdfBlobs.length;
        if (fileCount === 1) {
            const singleFile = pdfBlobs[0];
            saveAs(singleFile.blob, singleFile.fileName);
        } else if (fileCount > 1) {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "Payroll Slip Batch Download.zip");
        } else {
            showToast(
                "An error occurred generating slip data. Please try again.",
                "Error",
                "error",
            );
        }
    } catch (error) {
        console.log(error);
        showToast("An error occurred. Please try again.", "Error", "error");
    }
};
