export interface MatchingProfileCriteria {
    type:
        | "gender"
        | "age"
        | "score"
        | "matching_rate"
        | "department"
        | "education"
        | "experience"
        | "category"
        | "industry"
        | "cv_rating"
        | "internal"
        | "external";
    value: string;
    min: number;
    max: number;
    condition: string;

    // Additional metadata for custom criteria
    customCriteriaId?: string; // ID of the custom criteria set
    customCriteriaName?: string; // Name of the custom criteria set
    criteriaId?: string; // ID of the specific criteria within the set
    criteriaName?: string; // Name of the specific criteria
    criteriaType?: "select" | "number"; // Type of the custom criteria
    criteriaOptions?: string[]; // Available options for select type criteria
}

export default interface MatchingProfileModel {
    id: string;
    timestamp: string;
    name: string;
    criteria: MatchingProfileCriteria[];
    internal: boolean;
    external: boolean;
};;;;;;;;;;
