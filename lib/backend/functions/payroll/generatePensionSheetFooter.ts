import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import ExcelJS from "exceljs";

function customCell({
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
}) {
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
}

interface ContractEndRowData {
    row: number;
    title?: string;
    cumulative?: number;
    titleTwo?: string;
    employee?: EmployeeModel;
}

export const row20 = ({
    worksheet,
    initialRow,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
}) => {
    customCell({
        worksheet,
        cell: `A${15 + initialRow}`,
        mergeCell: `A${15 + initialRow}:C${15 + initialRow}`,
        value: "ክፍል -3   የወሩ የተጠቃለለ  ሂሳብ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { vertical: "middle" } as ExcelJS.Alignment,
        border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `D${15 + initialRow}`,
        border: { top: { style: "thin" }, bottom: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `E${15 + initialRow}`,
        mergeCell: `E${15 + initialRow}:H${15 + initialRow}`,
        value: "ክፍል -4 በዚህ ወር  የሥራ ዉላቸዉ የተቋረጠ ሠራተኞች ዝርዝር መረጃ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { vertical: "middle" } as ExcelJS.Alignment,
        border: { top: { style: "thin" }, bottom: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `I${15 + initialRow}`,
        border: { top: { style: "thin" }, bottom: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `J${15 + initialRow}`,
        mergeCell: `J${15 + initialRow}:M${15 + initialRow}`,
        value: "ክፍል -5 ለቢሮ አገልግሎት ብቻ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { indent: 10, vertical: "middle" } as ExcelJS.Alignment,
        border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        },
    });
};

export const row21 = ({
    worksheet,
    initialRow,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
}) => {
    customCell({
        worksheet,
        cell: `A${16 + initialRow}`,
        value: 10,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center", vertical: "middle" } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `B${16 + initialRow}`,
        value: "በዚህ ወር ውስጥ ደመወዝ የሚከፈላቸዉ የሠራተኞች  ብዛት",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({ worksheet, cell: `C${16 + initialRow}`, border: true });
    customCell({ worksheet, cell: `D${16 + initialRow}`, border: true });
    customCell({
        worksheet,
        cell: `E${16 + initialRow}`,
        value: "ተ.ቁ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `F${16 + initialRow}`,
        value: "የቋሚ ሠረተኛዉ የግብር ከፋይ መለያ ቁጥር /TIN/",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `G${16 + initialRow}`,
        mergeCell: `G${16 + initialRow}:H${16 + initialRow}`,
        value: "የሠራተኛዉ ሙሉ ስም (ለሰው ስም፣ የአባት ስምና የአያት ስም)",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({ worksheet, cell: `I${16 + initialRow}`, border: true });
    customCell({
        worksheet,
        cell: `J${16 + initialRow}`,
        mergeCell: `J${16 + initialRow}:K${16 + initialRow}`,
        value: "የተከፈለበት ቀን",
        font: { size: 8 } as ExcelJS.Font,
        alignment: { vertical: "middle" } as ExcelJS.Alignment,
        border: true,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "dbdbdb" } },
    });
    customCell({
        worksheet,
        cell: `L${16 + initialRow}`,
        mergeCell: `L${16 + initialRow}:M${16 + initialRow}`,
        border: true,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "dbdbdb" } },
    });
};

export const row22 = ({
    worksheet,
    initialRow,
    contractEndData,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
    contractEndData: ContractEndRowData;
}) => {
    const row = 16 + contractEndData.row + initialRow;
    customCell({
        worksheet,
        cell: `A${row}`,
        value: contractEndData.row < 5 ? `${contractEndData.row + 1}0` : undefined,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center", vertical: "middle" } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `B${row}`,
        value: contractEndData.title,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `C${row}`,
        value: contractEndData.cumulative,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({ worksheet, cell: `D${row}`, border: true });
    customCell({
        worksheet,
        cell: `E${row}`,
        value: contractEndData.row,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `F${row}`,
        value: contractEndData.employee?.tinNumber,
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `G${row}`,
        mergeCell: `G${row}:H${row}`,
        value: getFullName(contractEndData.employee ?? ({} as EmployeeModel)),
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({ worksheet, cell: `I${row}`, border: true });
    customCell({
        worksheet,
        cell: `J${row}`,
        mergeCell: `J${row}:K${row}`,
        value: contractEndData.titleTwo,
        font: { size: 8 } as ExcelJS.Font,
        alignment: { vertical: "middle" } as ExcelJS.Alignment,
        border: true,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "dbdbdb" } },
    });
    customCell({
        worksheet,
        cell: `L${row}`,
        mergeCell: `L${row}:M${row}`,
        border: true,
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "dbdbdb" } },
    });
};

export const row26 = ({
    worksheet,
    initialRow,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
}) => {
    customCell({
        worksheet,
        cell: `A${21 + initialRow}`,
        mergeCell: `A${21 + initialRow}:M${21 + initialRow}`,
        value: "ክፍል- 6 የትክክለኛነት ማረጋገጫ",
        font: { size: 12, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center", vertical: "middle" } as ExcelJS.Alignment,
        border: true,
    });
};

export const row27_31 = ({
    worksheet,
    initialRow,
}: {
    worksheet: ExcelJS.Worksheet;
    initialRow: number;
}) => {
    customCell({
        worksheet,
        cell: `A${22 + initialRow}`,
        mergeCell: `A${22 + initialRow}:B${26 + initialRow}`,
        value: "ከላይ የተገለፀው ማስታወቂያና የተሰጠው መረጃ በሙሉ የተሟላና ትክክለኛ መሆኑን አረጋግጣለሁ፡፡ ትክክለኛ ያልሆነ መረጃ ማቅረብ በግብር ሕጐችም ሆነ በወንጀለኛ መቅጫ ሕግ የሚያስቀጣ መሆኑን እገነዘባለሁ፡፡",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `C${22 + initialRow}`,
        mergeCell: `C${22 + initialRow}:D${22 + initialRow}`,
        value: "የግብር ከፋዩ/ሕጋዊ ወኪሊ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center" } as ExcelJS.Alignment,
        border: { top: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `C${23 + initialRow}`,
        mergeCell: `C${23 + initialRow}:D${23 + initialRow}`,
        border: { left: { style: "thin" }, right: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `C${24 + initialRow}`,
        mergeCell: `C${24 + initialRow}:D${24 + initialRow}`,
        value: "ስም ______________________________",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "left", vertical: "bottom" } as ExcelJS.Alignment,
        border: { left: { style: "thin" }, right: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `C${25 + initialRow}`,
        mergeCell: `C${25 + initialRow}:D${25 + initialRow}`,
        value: "ፊርማ _____________________________",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "left", vertical: "bottom" } as ExcelJS.Alignment,
        border: { left: { style: "thin" }, right: { style: "thin" } },
    });
    customCell({
        worksheet,
        cell: `C${26 + initialRow}`,
        mergeCell: `C${26 + initialRow}:D${26 + initialRow}`,
        value: "ቀን ______________________________",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "left", vertical: "bottom" } as ExcelJS.Alignment,
        border: {
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "thin" },
        },
    });
    customCell({
        worksheet,
        cell: `E${22 + initialRow}`,
        mergeCell: `E${22 + initialRow}:G${26 + initialRow}`,
        value: "የድርጅቱ ማህተም",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center", vertical: "top" } as ExcelJS.Alignment,
        border: true,
    });
    customCell({
        worksheet,
        cell: `H${25 + initialRow}`,
        mergeCell: `H${25 + initialRow}:M${25 + initialRow}`,
        value: "የግብር ባለሥልጣን ስም   -------------------------------  ፊርማ ------------------------  ቀን   ---------------------",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { horizontal: "center", vertical: "middle" } as ExcelJS.Alignment,
        border: { right: { style: "thin" } },
    });
    customCell({ worksheet, cell: `M${22 + initialRow}`, border: { right: { style: "thin" } } });
    customCell({ worksheet, cell: `M${23 + initialRow}`, border: { right: { style: "thin" } } });
    customCell({ worksheet, cell: `M${24 + initialRow}`, border: { right: { style: "thin" } } });
    customCell({ worksheet, cell: `M${25 + initialRow}`, border: { right: { style: "thin" } } });
    customCell({
        worksheet,
        cell: `H${26 + initialRow}`,
        mergeCell: `H${26 + initialRow}:M${26 + initialRow}`,
        border: { bottom: { style: "thin" }, right: { style: "thin" } },
    });
};
