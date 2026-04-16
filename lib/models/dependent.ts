export enum DependentRelationship {
    SPOUSE = "Spouse",
    CHILD = "Child",
    PARENT = "Parent",
    SIBLING = "Sibling",
    OTHER = "Other",
}

export interface DependentModel {
    id: string | null; // Unique identifier for the dependent
    timestamp: string; // Date and time when the dependent record was created
    dependentID: string; // Unique ID for the dependent (auto-generated)
    firstName: string; // First name of the dependent (required)
    middleName: string | null; // Middle name of the dependent (optional)
    lastName: string; // Last name of the dependent (required)
    gender: "Male" | "Female"; // Gender of the dependent (required)
    dateOfBirth: string; // Date of birth in "MMMM DD, YYYY" format (required)
    phoneNumber: string; // Contact phone number (required)
    relationship: DependentRelationship; // Relationship to employee (required)
    relatedTo: string; // Employee UID this dependent is related to (required)
}
