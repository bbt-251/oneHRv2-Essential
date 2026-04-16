import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import { customCell } from "./generatePensionComponents";
import ExcelJS from "exceljs";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

export interface CumulativeDataModel {
    totalGross: number;
    totalIncomeTax: number;
    totalOtherTaxableAllowances: number;
    totalNetPay: number;
}

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
        value: "ረ/ጠቅላላ የትራንስፖርት አበል (ብር)",
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
        value: "ሰ/የስራ ግብር የሚከፈልበት የትራንስፖርት አበል (ብር)",
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
        value: "ሸ/የትርፍ ሰዓት ክፍያ (ብር)",
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
        value: "ቀ/ ሌሎች ጥቅማ ጥቅሞች (ብር)",
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
        value: "በ/ ጠቅላላ ግብር የሚከፈልበት ገቢ ብር",
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
        cell: "K11",
        value: "ተ/ የስራ ግብር /ብር/",
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
        cell: "L11",
        value: "ቸ/ የወጪ መጋራት ክፍያ /ብር/",
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
        cell: "M11",
        value: "ነ/ የተጣራ ተከፋይ /ብር/",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
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
        value: payrollD?.employee?.tinNumber,
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
        value: payrollD?.employee?.contractStartingDate,
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
        value: payrollD?.totalGrossSalary,
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
        value: payrollD?.transportAllowance,
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
        value: payrollD?.taxableTransportAllowance,
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
        value: payrollD?.totalOvertimeAmount,
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
        value: payrollD?.otherAllowances,
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
        cell: `J${row}`,
        value: payrollD?.taxableOtherAllowances,
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
        cell: `K${row}`,
        value: payrollD?.incomeTax,
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
        cell: `L${row}`,
        value: payrollD?.costSharing,
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
        cell: `M${row}`,
        value: payrollD?.netPay,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
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
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `G${initialRow + 12}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `H${initialRow + 12}`,

        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `I${initialRow + 12}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `J${initialRow + 12}`,
        value: cumulativeData?.totalOtherTaxableAllowances,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `K${initialRow + 12}`,
        value: cumulativeData?.totalIncomeTax,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `L${initialRow + 12}`,
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `M${initialRow + 12}`,
        value: cumulativeData?.totalNetPay,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
        } as ExcelJS.Alignment,
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

    customCell({
        worksheet: worksheet,
        cell: `J${initialRow + 13}`,
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
        cell: `K${initialRow + 13}`,
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
        cell: `L${initialRow + 13}`,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });

    customCell({
        worksheet: worksheet,
        cell: `M${initialRow + 13}`,
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "dbdbdb" },
        },
        border: true,
    });
};
