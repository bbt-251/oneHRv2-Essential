import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
    ContractEndDataModel,
    customCell,
    row11,
    row12,
    row17,
    row18,
    row20,
    row21,
    row22,
    row26,
    row27_31,
    row4,
    row5,
    row6,
    row7,
    row8,
    row9,
} from "./generatePensionComponents";
import dayjs from "dayjs";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import { CompanyInfoModel } from "@/lib/models/companyInfo";

export async function generatePension(payrollData: PayrollData[], basicInfo?: CompanyInfoModel) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Form");

    /////////////////////////////////////
    // Header                          //
    /////////////////////////////////////

    worksheet.getRow(1).height = 50;
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 24;
    worksheet.getColumn(3).width = 17;
    worksheet.getColumn(4).width = 13;
    worksheet.getColumn("F").width = 13;
    worksheet.getColumn("G").width = 15;
    worksheet.getColumn("H").width = 17;
    worksheet.getColumn("I").width = 12;
    worksheet.getColumn("J").width = 12;
    worksheet.getColumn("K").width = 13;
    worksheet.getColumn("L").width = 12;
    worksheet.getColumn("M").width = 14;

    // Load the image (Assuming it’s in base64 or binary format)
    const res1 = await fetch("/images/aa-city-administration.png");
    const arrayBuffer1 = await res1.arrayBuffer();
    const buffer1 = Buffer.from(arrayBuffer1);

    const imageId1 = workbook.addImage({
        buffer: buffer1,
        extension: "png",
    });

    const res2 = await fetch("/images/mayor.png");
    const arrayBuffer2 = await res2.arrayBuffer();
    const buffer2 = Buffer.from(arrayBuffer2);

    const imageId2 = workbook.addImage({
        buffer: buffer2,
        extension: "png",
    });

    // Insert Image at A1
    worksheet.addImage(imageId1, {
        tl: { col: 0, row: 0 },
        ext: { width: 50, height: 85 },
    });

    worksheet.addImage(imageId2, {
        tl: { col: 12, row: 0 },
        ext: { width: 100, height: 85 },
    });

    // Add header text
    customCell({
        worksheet: worksheet,
        cell: "B2",
        mergeCell: "B1:F2",
        value: "የአዲስ አበባ ከተማ አስተዳደር  ገቢዎች ቢሮ\nአዲስ አበባ ቁጥር 1 መካከለኛ ግብር ከፋዮች ቅ/ጽ/ቤት",
        fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "000000" },
        },
        font: {
            bold: true,
            color: { argb: "FFFFFF" },
            size: 8,
        } as ExcelJS.Font,
    });

    customCell({
        worksheet: worksheet,
        cell: "G1",
        mergeCell: "G1:L2",
        value: "የግል ድርጅት የጡረታ መዋጮ ማሳወቂያ ቅፅ (በግል ድርጅቶች ሠራተኞች ጡረታ አዋጅ ቁጥር 715/2003)",
        font: { size: 12 } as ExcelJS.Font,
    });

    // Add borders to all cells
    // worksheet.eachRow({ includeEmpty: true }, (row) => {
    //   row.eachCell((cell) => {
    //     cell.border = {
    //       top: { style: "thin" },
    //       left: { style: "thin" },
    //       bottom: { style: "thin" },
    //       right: { style: "thin" },
    //     };
    //   });
    // });

    /////////////////////////////////////
    // Part 1                          //
    /////////////////////////////////////

    worksheet.getRow(3).height = 11;
    worksheet.getRow(4).height = 11;
    worksheet.getRow(5).height = 11;
    worksheet.getRow(6).height = 56;
    worksheet.getRow(8).height = 11;
    worksheet.getRow(9).height = 11;
    worksheet.getRow(10).height = 11;
    worksheet.getRow(11).height = 35;

    // Row 3
    customCell({
        worksheet,
        cell: "A3",
        mergeCell: "A3:M3",
        value: "ክፍል -1 የግብር ከፋይ ዝርዝር መረጃ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { indent: 10, vertical: "middle" } as ExcelJS.Alignment,
        border: true,
    });

    row4({ worksheet });
    row5({ worksheet, basicInfo });
    row6({ worksheet, type: "Pension" });
    row7({ worksheet });
    row8({ worksheet });
    row9({ worksheet, basicInfo });

    /////////////////////////////////////
    // Part 2                          //
    /////////////////////////////////////

    // Row 10
    customCell({
        worksheet,
        cell: "A10",
        mergeCell: "A10:M10",
        value: "ክፍል -2   ማስታወቂያ ዝርዝር መረጃ",
        font: { size: 8, bold: true } as ExcelJS.Font,
        alignment: { indent: 10, vertical: "middle" } as ExcelJS.Alignment,
        border: true,
    });

    row11({ worksheet });

    payrollData.map((payrollD, index) => {
        row12({ worksheet, row: 12 + index, payrollD });
    });

    const cumulativeData = {
        totalGross: payrollData?.reduce((acc, pd) => acc + (pd?.totalGrossSalary ?? 0), 0),
        totalEmployeeP: payrollData?.reduce((acc, pd) => acc + (pd?.employeePension ?? 0), 0),
        totalEmployerP: payrollData?.reduce((acc, pd) => acc + (pd?.employerPension ?? 0), 0),
        totalEmpSumP: payrollData?.reduce(
            (acc, pd) => acc + (pd?.employerPension ?? 0) + (pd?.employeePension ?? 0),
            0,
        ),
    };

    row17({ worksheet, initialRow: payrollData.length, cumulativeData });
    row18({ worksheet, initialRow: payrollData.length });

    /////////////////////////////////////
    // Part 3 & 4                      //
    /////////////////////////////////////

    row20({ worksheet, initialRow: payrollData.length });
    row21({ worksheet, initialRow: payrollData.length });

    const filteredPayrollData = payrollData?.filter(pd => {
        const month = dayjs(pd.employee?.contractTerminationDate ?? "", "MMMM DD, YYYY").month();
        const year = dayjs(pd.employee?.contractTerminationDate ?? "", "MMMM DD, YYYY").year();
        const now = dayjs();
        return now.year() == year && now.month() == month;
    });

    const contractEnd: ContractEndDataModel[] = [
        {
            row: 1,
            employee: filteredPayrollData?.at(0)?.employee,
            title: "የወሩ ጠቅላላ የሰራተኞች ደመወዝ  (ከላይ ካለዉ ከሰንጠረዥ (ሠ)",
            cumulative: cumulativeData.totalGross,
            titleTwo: "የደረሰኝ ቁጥር",
        },
        {
            row: 2,
            employee: filteredPayrollData?.at(1)?.employee,
            title: "የወሩ ጠቅላላ የሰራተኞች መዋጮ መጠን   (ከላይ ካለዉ ከሰንጠረዥ (ረ)",
            cumulative: cumulativeData.totalEmployeeP,
            titleTwo: "የገንዘብ  ልክ",
        },
        {
            row: 3,
            employee: filteredPayrollData?.at(2)?.employee,
            title: "የወሩ ጠቅላላ የአሰሪዉ መዋጮ መጠን   (ከላይ ካለዉ ከሰንጠረዥ (ሰ)",
            cumulative: cumulativeData.totalEmployerP,
            titleTwo: "ቼክ ቁጥር",
        },
        {
            row: 4,
            employee: filteredPayrollData?.at(3)?.employee,
            title: "የወሩ ጠቅላላ መዋጮ መጠን   (ከላይ ካለዉ ከሰንጠረዥ (ሸ)",
            cumulative: cumulativeData.totalEmpSumP,
            titleTwo: "የገንዘብ ተቀባይ ስምና ፊርማ",
        },
        ...filteredPayrollData
            .slice(4)
            .map((pd, index) => ({ row: index + 5, employee: pd.employee })),
    ];

    contractEnd.map(contractEndData => {
        row22({ worksheet, initialRow: payrollData.length, contractEndData });
    });

    row26({
        worksheet,
        initialRow: payrollData.length + contractEnd.length - 4,
    });
    row27_31({
        worksheet,
        initialRow: payrollData.length + contractEnd.length - 4,
    });

    // Export the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "pension.xlsx");
}
