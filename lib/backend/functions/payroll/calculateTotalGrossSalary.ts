import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";

export default function calcTotalGrossSalary(
    baseSalary: number,
    empComps: EmployeeCompensationModel[],
    month: number,
) {
    if (Number.isNaN(Number(baseSalary))) {
        return 0;
    }
    if (empComps?.length == 0) {
        return baseSalary ?? 0;
    }

    let totalPaymentAmount = 0;
    empComps.map((val: EmployeeCompensationModel) => {
        if (
            val?.type === "Payment" &&
            val?.paymentAmount &&
            !Number.isNaN(val?.paymentAmount?.at(month))
        ) {
            totalPaymentAmount += val?.paymentAmount.at(month) ?? 0;
        }
    });
    return totalPaymentAmount + baseSalary;
}
