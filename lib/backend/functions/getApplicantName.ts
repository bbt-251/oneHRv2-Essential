import ApplicantModel from "@/lib/models/applicant";

export function getApplicantName(applicant: ApplicantModel): string {
    return `${applicant.firstName} ${applicant.surname}`;
}
