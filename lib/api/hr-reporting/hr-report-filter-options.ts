"use client";

import { getDocs } from "firebase/firestore";
import {
    employeeCollection,
    objectiveCollection,
    leaveManagementCollection,
    overtimeRequestCollection,
} from "@/lib/backend/firebase/collections";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { periodicOptionService } from "@/lib/backend/api/performance-management/periodic-option-service";
import type { EmployeeModel } from "@/lib/models/employee";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { LeaveModel } from "@/lib/models/leave";
import type { OvertimeRequestModel } from "@/lib/models/overtime-request";

export type FilterValueOption = { value: string; label: string };

/**
 * Returns a list of options for the Value dropdown when the given report filter field
 * has enumerable values (e.g. Level of Education, Department, Employee Name).
 * Returns null when the field should use a free-text input.
 */
export async function getFilterValueOptions(field: string): Promise<FilterValueOption[] | null> {
    switch (field) {
        case "employeeName": {
            const snap = await getDocs(employeeCollection);
            const names = new Set<string>();
            snap.forEach(d => {
                const e = d.data() as EmployeeModel;
                const name = `${e.firstName} ${e.middleName ?? ""} ${e.surname}`.trim();
                if (name) names.add(name);
            });
            return Array.from(names)
                .sort((a, b) => a.localeCompare(b))
                .map(name => ({ value: name, label: name }));
        }
        case "employeeId": {
            const snap = await getDocs(employeeCollection);
            const ids = new Set<string>();
            snap.forEach(d => {
                const e = d.data() as EmployeeModel;
                if (e.employeeID) ids.add(e.employeeID);
            });
            return Array.from(ids)
                .sort((a, b) => a.localeCompare(b))
                .map(id => ({ value: id, label: id }));
        }
        case "levelOfEducation": {
            const list = (await hrSettingsService.getAll("levelOfEducations")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "department": {
            const list = (await hrSettingsService.getAll("departmentSettings")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "section": {
            const list = (await hrSettingsService.getAll("sectionSettings")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "workingLocation": {
            const list = (await hrSettingsService.getAll("locations")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "employmentPosition": {
            const list = (await hrSettingsService.getAll("positions")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "shiftType": {
            const list = (await hrSettingsService.getAll("shiftTypes")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "yearsOfExperience": {
            const list = (await hrSettingsService.getAll("yearsOfExperiences")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "contractType": {
            const list = (await hrSettingsService.getAll("contractTypes")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "contractHour": {
            const list = (await hrSettingsService.getAll("contractHours")) as {
                id: string;
                hourPerWeek?: number;
            }[];
            return (list ?? []).map(item => {
                const label = item.hourPerWeek != null ? `${item.hourPerWeek} hrs/week` : item.id;
                return { value: label, label };
            });
        }
        case "gradeLevel": {
            const list = (await hrSettingsService.getAll("grades")) as {
                id: string;
                grade: string;
            }[];
            return (list ?? []).map(item => ({ value: item.grade, label: item.grade }));
        }
        case "gender": {
            const snap = await getDocs(employeeCollection);
            const byKey = new Map<string, string>();
            snap.forEach(d => {
                const e = d.data() as EmployeeModel;
                const g = e.gender?.trim();
                if (!g) return;
                const key = g.toLowerCase();
                const label = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
                if (!byKey.has(key)) byKey.set(key, label);
            });
            return Array.from(byKey.values())
                .sort((a, b) => a.localeCompare(b))
                .map(label => ({ value: label, label }));
        }
        case "contractStatus": {
            return [
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
            ];
        }
        case "managerPosition": {
            return [
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
            ];
        }
        case "status":
        case "objectiveStatus": {
            return [
                { value: "Created", label: "Created" },
                { value: "Approved", label: "Approved" },
                { value: "Refused", label: "Refused" },
                { value: "Acknowledged", label: "Acknowledged" },
            ];
        }
        case "overtimeStatus": {
            return [
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
            ];
        }
        case "departmentKpi": {
            const list = (await hrSettingsService.getAll("departmentKPIs")) as {
                id: string;
                title: string;
            }[];
            return (list ?? []).map(item => ({ value: item.title, label: item.title }));
        }
        case "strategicObjective": {
            const snap = await getDocs(objectiveCollection);
            const set = new Set<string>();
            snap.forEach(d => {
                const obj = d.data() as ObjectiveModel;
                const v = obj.SMARTObjective?.trim();
                if (v) set.add(v);
            });
            return Array.from(set)
                .sort((a, b) => a.localeCompare(b))
                .map(text => ({ value: text, label: text }));
        }
        case "evaluationsReference": {
            const options = await periodicOptionService.getAll();
            const refs = new Set<string>();
            options.forEach(
                (opt: {
                    id: string | null;
                    periodName: string;
                    year: number;
                    evaluations: { id: string | null; round: string }[];
                }) => {
                    if (opt.id == null) return;
                    const periodLabel = `${opt.periodName} (${opt.year})`;
                    opt.evaluations?.forEach(ev => {
                        const label = ev.round ? `${periodLabel} - ${ev.round}` : periodLabel;
                        refs.add(label);
                    });
                },
            );
            return Array.from(refs)
                .sort((a, b) => a.localeCompare(b))
                .map(label => ({ value: label, label }));
        }
        case "period": {
            const options = await periodicOptionService.getAll();
            const periods = new Set<string>();
            options.forEach((opt: { id: string | null; periodName: string; year: number }) => {
                if (opt.id == null) return;
                periods.add(`${opt.periodName} (${opt.year})`);
            });
            return Array.from(periods)
                .sort((a, b) => a.localeCompare(b))
                .map(label => ({ value: label, label }));
        }
        case "monthDate": {
            const months = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];
            return months.map(m => ({ value: m, label: m }));
        }
        case "yearDate": {
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i));
            return years.map(y => ({ value: y, label: y }));
        }
        case "leaveState": {
            return [
                { value: "Requested", label: "Requested" },
                { value: "Closed", label: "Closed" },
            ];
        }
        case "leaveStage": {
            return [
                { value: "Open", label: "Open" },
                { value: "Approved", label: "Approved" },
                { value: "Refused", label: "Refused" },
                { value: "Cancelled", label: "Cancelled" },
            ];
        }
        case "leaveType": {
            const list = (await hrSettingsService.getAll("leaveTypes")) as {
                id: string;
                name: string;
            }[];
            const opts = (list ?? []).map(item => ({ value: item.name, label: item.name }));
            const seen = new Set(opts.map(o => o.value));
            const snap = await getDocs(leaveManagementCollection);
            snap.forEach(d => {
                const leave = d.data() as LeaveModel;
                const raw = leave.leaveType?.trim();
                if (!raw) return;
                const fromSettings = list.find(t => t.id === raw || t.name === raw);
                const label = fromSettings?.name ?? raw;
                if (!seen.has(label)) {
                    seen.add(label);
                    opts.push({ value: label, label });
                }
            });
            return opts.sort((a, b) => a.label.localeCompare(b.label));
        }
        case "overtimeType": {
            const list = (await hrSettingsService.getAll("overtimeTypes")) as {
                id: string;
                overtimeType: string;
            }[];
            const opts = (list ?? []).map(item => ({
                value: item.overtimeType,
                label: item.overtimeType,
            }));
            const seen = new Set(opts.map(o => o.value));
            const snap = await getDocs(overtimeRequestCollection);
            snap.forEach(d => {
                const ot = d.data() as OvertimeRequestModel;
                const raw = ot.overtimeType?.trim();
                if (!raw) return;
                const fromSettings = list.find(t => t.id === raw || t.overtimeType === raw);
                const label = fromSettings?.overtimeType ?? raw;
                if (!seen.has(label)) {
                    seen.add(label);
                    opts.push({ value: label, label });
                }
            });
            return opts.sort((a, b) => a.label.localeCompare(b.label));
        }
        case "maritalStatus": {
            const list = (await hrSettingsService.getAll("maritalStatuses")) as {
                id: string;
                name: string;
            }[];
            return (list ?? []).map(item => ({ value: item.name, label: item.name }));
        }
        case "eligibleLeaveDays": {
            const snap = await getDocs(employeeCollection);
            const values = new Set<string>();
            snap.forEach(d => {
                const e = d.data() as EmployeeModel;
                if (e.eligibleLeaveDays != null && !Number.isNaN(e.eligibleLeaveDays)) {
                    values.add(String(e.eligibleLeaveDays));
                }
            });
            return Array.from(values)
                .sort((a, b) => Number(a) - Number(b))
                .map(v => ({ value: v, label: v }));
        }
        case "roles": {
            const snap = await getDocs(employeeCollection);
            const roleSet = new Set<string>();
            snap.forEach(d => {
                const e = d.data() as EmployeeModel;
                e.role?.forEach(r => {
                    if (r?.trim()) roleSet.add(r.trim());
                });
            });
            return Array.from(roleSet)
                .sort((a, b) => a.localeCompare(b))
                .map(r => ({ value: r, label: r }));
        }
        default:
            return null;
    }
}
