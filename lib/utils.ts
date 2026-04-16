import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { timestampFormat } from "./util/dayjs_format";
import dayjs from "dayjs";
import ApplicantModel, { EducationExperience, ProfessionalExperience } from "./models/applicant";
import { TMCategory } from "./models/hr-settings";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

interface Input {
    data: any[];
    type?: "Latest First" | "Old First";
    format?: string;
    key?: string;
}

export default function sortByDate(value: Input) {
    const data = value.data;
    const type = value.type ?? "Latest First";
    const format = value.format ?? timestampFormat;
    const key = value.key ?? "timestamp";

    /* Sorting the data by date. */
    // Latest first
    if (type === "Latest First") {
        return data.sort((a, b) => {
            let date1: dayjs.Dayjs = dayjs(`${a[key]}`, format);
            let date2: dayjs.Dayjs = dayjs(`${b[key]}`, format);

            return date1.isBefore(date2) ? 1 : -1;
        });
    }

    // Old first
    else {
        return data.sort((a, b) => {
            let date1: dayjs.Dayjs = dayjs(`${a[key]}`, format);
            let date2: dayjs.Dayjs = dayjs(`${b[key]}`, format);

            return date1.isAfter(date2) ? 1 : -1;
        });
    }
}

export function getExperienceDate(exp: ProfessionalExperience): string {
    return `${exp.startDate} - ${exp.currentlyWorking ? "Present" : exp.endDate}`;
}

export function getEducationDate(exp: EducationExperience): string {
    return `${exp.startDate} - ${exp.currentlyStudying ? "Present" : exp.endDate}`;
}

export function getApplicantPhoneNumber(applicant: ApplicantModel): string {
    return `${applicant.phoneCountryCode}${applicant.phoneNumber}`;
}
export function getCategoryDisplayString(
    categoryArray: string[],
    tmCategories: TMCategory[],
): string {
    const parentId = categoryArray?.[0];
    if (!parentId) {
        return "N/A";
    }

    const parentCategory = tmCategories.find(cat => cat.id === parentId);
    if (!parentCategory) {
        return "Unknown Category";
    }

    const subCategoryNames = parentCategory.subcategory?.map(sub => sub.name) || [];

    if (subCategoryNames.length > 0) {
        return `${parentCategory.name} / ${subCategoryNames.join(" / ")}`;
    }

    return parentCategory.name;
}
