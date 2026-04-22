import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import ExcelJS from "exceljs";
export { row20, row21, row22, row26, row27_31 } from "./generatePensionSheetFooter";

export interface CumulativeDataModel {
    totalGross: number;
    totalEmployeeP: number;
    totalEmployerP: number;
    totalEmpSumP: number;
}

export interface ContractEndDataModel {
    row: number;
    title?: string;
    cumulative?: number;
    titleTwo?: string;
    employee?: EmployeeModel;
}

export const customCell = ({
    worksheet,
    cell,
    mergeCell,
    value,
    font,
    alignment,
    fill,
    border,
}: {
    worksheet: ExcelJS.Worksheet;
    cell: string;
    mergeCell?: string;
    value?: string | number;
    font?: ExcelJS.Font;
    alignment?: ExcelJS.Alignment;
    fill?: ExcelJS.Fill;
    border?: boolean | object;
}) => {
    if (mergeCell) worksheet.mergeCells(mergeCell);
    const headerCell = worksheet.getCell(cell);
    if (value != undefined) headerCell.value = value;
    if (font) headerCell.font = font;
    if (fill) headerCell.fill = fill;
    headerCell.alignment = alignment ?? {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
    };

    if (border) {
        headerCell.border =
            typeof border == "object"
                ? border
                : {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
    }
};

export const row4 = ({ worksheet }: { worksheet: ExcelJS.Worksheet }) => {
    customCell({
        worksheet,
        cell: "A4",
        mergeCell: "A4:C4",
        value: "1. የድርጅት ስም",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet,
        cell: "D4",
        mergeCell: "D4:G4",
        value: "3. የግብር ከፋይ መለያ ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet,
        cell: "H4",
        mergeCell: "H4:J4",
        value: "4. የግብር ሂሣብ ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet,
        cell: "K4",
        mergeCell: "K4:L4",
        value: "የክፍያ ጊዜ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet,
        cell: "M4",
        value: "Page __ of ____",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });
};

export const row5 = ({
    worksheet,
    basicInfo,
}: {
    worksheet: ExcelJS.Worksheet;
    basicInfo?: CompanyInfoModel;
}) => {
    customCell({
        worksheet: worksheet,
        cell: "A5",
        mergeCell: "A5:C5",
        value: basicInfo?.companyName,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D5",
        mergeCell: "D5:G5",
        value: basicInfo?.tinNumber,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "H5",
        mergeCell: "H5:J5",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "K5",
        value: "ወር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "L5",
        value: "ዓም",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "M5",
        border: true,
    });
};

export const row6 = ({
    worksheet,
    type,
}: {
    worksheet: ExcelJS.Worksheet;
    type: "Pension" | "Tax";
}) => {
    customCell({
        worksheet: worksheet,
        cell: "A6",
        value: "2a. ክልል/ከተማ አስተዳደር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "B6",
        mergeCell: "B6:C6",
        value: "2b. ዞን/ክፍለ ከተማ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D6",
        mergeCell: "D6:H6",
        value: type == "Pension" ? "5. የጡረታ መዋጮ ገቢ ሰብሳቢ መ/ቤት ስም" : "5. የግብር ሰብሣቢ ጽ/ቤት",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "I6",
        mergeCell: "I6:M9",
        value: "የሰነድ ቁጥር (ለቢሮ አገልግሎት ብቻ)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
    });
};

export const row7 = ({ worksheet }: { worksheet: ExcelJS.Worksheet }) => {
    customCell({
        worksheet: worksheet,
        cell: "A7",
        value: "አ.አ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "B7",
        mergeCell: "B7:C7",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D7",
        mergeCell: "D7:H7",
        border: true,
    });
};

export const row8 = ({ worksheet }: { worksheet: ExcelJS.Worksheet }) => {
    customCell({
        worksheet: worksheet,
        cell: "A8",
        value: "2c. ወረዳ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "B8",
        value: "2d. ቀበሌ/ገበሬ ማህበር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "C8",
        value: "2e. የቤት ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D8",
        mergeCell: "D8:E8",
        value: "6. ስልክ ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "F8",
        mergeCell: "F8:H8",
        value: "7. ፋክስ ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });
};

export const row9 = ({
    worksheet,
    basicInfo,
}: {
    worksheet: ExcelJS.Worksheet;
    basicInfo?: CompanyInfoModel;
}) => {
    customCell({
        worksheet: worksheet,
        cell: "A9",
        value: "10",
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "B9",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "C9",
        value: basicInfo?.houseNumber,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D9",
        mergeCell: "D9:E9",
        value: basicInfo?.telNo,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "F9",
        mergeCell: "F9:H9",
        value: basicInfo?.faxNumber,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });
};

export const row11 = ({ worksheet }: { worksheet: ExcelJS.Worksheet }) => {
    customCell({
        worksheet: worksheet,
        cell: "A11",
        value: "ሀ/ተ.ቁ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "B11",
        value: "ለ/የቋሚ ሠረተኛዉ የግብር ከፋይ መለያ ቁጥር",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "C11",
        value: "ሐ/የሠራተኛዉ ሙሉ ስም (ለሰው ስም፣ የአባት ስምና የአያት ስም)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "D11",
        value: "መ/ የተቀጠሩበት ቀን/ወር/ዓም",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "E11",
        value: "ሠ/የወር ደመወዝ /ብር/",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "F11",
        value: "ረ/ የሰራተኞች መዋጮ መጠን /7/",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "G11",
        value: "ሰ/ የአሰሪዉ መዋጮ መጠን /11",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "H11",
        value: "ሸ/በአሰሪዉ የሚገባ  ጥቅል መዋጮ መጠን (ረ+ሰ)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "I11",
        value: "ፊርማ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "J11",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "K11",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "L11",
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: "M11",
        border: true,
    });
};

export const row12 = ({
    worksheet,
    row,
    payrollD,
}: {
    worksheet: ExcelJS.Worksheet;
    row: number;
    payrollD: PayrollData;
}) => {
    customCell({
        worksheet: worksheet,
        cell: `A${row}`,
        value: row - 11,
        // font: { size: 8,bold:true } as ExcelJS.Font,
        // alignment: {horizontal:'center',vertical:'middle'} as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `B${row}`,
        value: payrollD?.employee?.tinNumber ?? "",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `C${row}`,
        value: getFullName(payrollD?.employee ?? ({} as EmployeeModel)),
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `D${row}`,
        value: payrollD?.employee?.contractStartingDate ?? "",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `E${row}`,
        value: payrollD?.totalGrossSalary ?? "",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `F${row}`,
        value: payrollD?.employeePension ?? "",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `G${row}`,
        value: payrollD?.employerPension ?? "",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `H${row}`,
        value: (payrollD?.employeePension ?? 0) + (payrollD?.employerPension ?? 0),
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `I${row}`,
        // value:"ፊርማ",
        // font: { size: 8,bold:true } as ExcelJS.Font,
        // alignment: {horizontal:'center',vertical:'middle',wrapText:true} as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `J${row}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `K${row}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `L${row}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `M${row}`,
        border: true,
    });

    if (row == 12) {
        customCell({
            worksheet: worksheet,
            cell: "J12",
            mergeCell: "J12:M17",
            border: true,
            fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "dbdbdb" },
            },
        });
    }
};

export const row17 = ({
    worksheet,
    initialRow,
    cumulativeData,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
    cumulativeData: CumulativeDataModel;
}) => {
    customCell({
        worksheet: worksheet,
        cell: `E${initialRow + 12}`,
        value: cumulativeData?.totalGross,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `F${initialRow + 12}`,
        value: cumulativeData?.totalEmployeeP,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `G${initialRow + 12}`,
        value: cumulativeData?.totalEmployerP,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `H${initialRow + 12}`,
        value: cumulativeData?.totalEmpSumP,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `I${initialRow + 12}`,
        border: true,
    });
};

export const row18 = ({
    worksheet,
    initialRow,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
}) => {
    customCell({
        worksheet: worksheet,
        cell: `E${initialRow + 13}`,
        value: "(line 20)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `F${initialRow + 13}`,
        value: "(line 30)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `G${initialRow + 13}`,
        value: "(line 40)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `H${initialRow + 13}`,
        value: "(line 50)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `I${initialRow + 13}`,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });
};
