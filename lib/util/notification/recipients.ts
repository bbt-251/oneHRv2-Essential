import { EmployeeModel } from "@/lib/models/employee";

export interface NotificationRecipient {
    uid: string;
    email: string;
    telegramChatID: string;
}

/**
 * Get notification recipients based on employee hierarchy
 * @param employees - All employees in the system
 * @param targetEmployeeUids - UIDs of employees who are the target of the notification
 * @param notificationType - Type of notification (for HR vs Manager logic)
 * @returns Array of notification recipients with recipient type information
 */
export function getNotificationRecipients(
    activeEmployees: EmployeeModel[],
    targetEmployeeUids: string[],
    notificationType: "manager" | "hr" | "both" = "manager",
): (NotificationRecipient & { recipientType: "hr" | "employee" | "manager" })[] {
    const recipients: (NotificationRecipient & { recipientType: "hr" | "employee" | "manager" })[] =
        [];

    if (notificationType === "hr" || notificationType === "both") {
        // For HR notifications, send to all HR Managers
        const hrManagers = activeEmployees.filter(
            emp => emp.role && emp.role.includes("HR Manager"),
        );

        hrManagers.forEach(hr => {
            if (hr.uid && (hr.personalEmail || hr.companyEmail || hr.telegramChatID)) {
                recipients.push({
                    uid: hr.uid,
                    email: hr.personalEmail || hr.companyEmail || "",
                    telegramChatID: hr.telegramChatID || "",
                    recipientType: "hr" as const,
                });
            }
        });
    }

    if (notificationType === "manager" || notificationType === "both") {
        if (notificationType === "manager") {
            // For manager notifications, send to reporting line managers of target employees
            const reportingManagers = new Set<string>();

            targetEmployeeUids.forEach(empUid => {
                const employee = activeEmployees.find(emp => emp.uid === empUid);
                if (employee && employee.reportingLineManager) {
                    reportingManagers.add(employee.reportingLineManager);
                }
            });

            // Get manager details
            reportingManagers.forEach(managerUid => {
                const manager = activeEmployees.find(emp => emp.uid === managerUid);
                if (
                    manager &&
                    (manager.personalEmail || manager.companyEmail || manager.telegramChatID)
                ) {
                    recipients.push({
                        uid: manager.uid,
                        email: manager.personalEmail || manager.companyEmail || "",
                        telegramChatID: manager.telegramChatID || "",
                        recipientType: "manager" as const,
                    });
                }
            });
        }

        // For 'manager' type, also send to target employees
        // For 'both' type, this is handled separately below
        if (notificationType === "manager") {
            targetEmployeeUids.forEach(empUid => {
                const employee = activeEmployees.find(emp => emp.uid === empUid);
                if (
                    employee &&
                    (employee.personalEmail || employee.companyEmail || employee.telegramChatID)
                ) {
                    recipients.push({
                        uid: employee.uid,
                        email: employee.personalEmail || employee.companyEmail || "",
                        telegramChatID: employee.telegramChatID || "",
                        recipientType: "employee" as const,
                    });
                }
            });
        }
    }

    if (notificationType === "both") {
        // For 'both' type: send to HR Managers + reporting line managers of target employees
        const reportingManagers = new Set<string>();

        targetEmployeeUids.forEach(empUid => {
            const employee = activeEmployees.find(emp => emp.uid === empUid);
            if (employee && employee.reportingLineManager) {
                reportingManagers.add(employee.reportingLineManager);
            }
        });

        // Get manager details
        reportingManagers.forEach(managerUid => {
            const manager = activeEmployees.find(emp => emp.uid === managerUid);
            if (
                manager &&
                (manager.personalEmail || manager.companyEmail || manager.telegramChatID)
            ) {
                recipients.push({
                    uid: manager.uid,
                    email: manager.personalEmail || manager.companyEmail || "",
                    telegramChatID: manager.telegramChatID || "",
                    recipientType: "manager" as const,
                });
            }
        });
    }

    // Filter out recipients without any contact information
    let validRecipients = recipients.filter(
        recipient => recipient.email || recipient.telegramChatID,
    );

    // Deduplicate recipients by UID to prevent double notifications
    const uniqueRecipients = new Map<string, (typeof validRecipients)[0]>();
    validRecipients.forEach(recipient => {
        if (!uniqueRecipients.has(recipient.uid)) {
            uniqueRecipients.set(recipient.uid, recipient);
        }
    });
    validRecipients = Array.from(uniqueRecipients.values());

    return validRecipients;
}

/**
 * Get employee names from UIDs for logging purposes
 */
export function getEmployeeNames(activeEmployees: EmployeeModel[], employeeUids: string[]): string {
    return employeeUids
        .map(uid => {
            const emp = activeEmployees.find(e => e.uid === uid);
            return emp ? `${emp.firstName} ${emp.surname}` : uid;
        })
        .join(", ");
}
