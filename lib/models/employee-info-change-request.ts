export interface EmployeeInfoChangeRequestModel {
    id: string;
    timestamp: string;
    employeeId: string;
    uid: string;

    // Employee Information fields
    firstName: string;
    middleName: string;
    surname: string;
    birthDate: string;
    birthPlace: string;
    levelOfEducation: string;
    yearsOfExperience: string;
    maritalStatus: string;
    personalPhone: string;
    personalEmail: string;
    bankAccount: string;
    tinNumber: string;

    // Emergency Contact Information fields
    emergencyContactName: string;
    relationshipToEmployee: string;
    phoneNumber1: string;
    phoneNumber2: string;
    emailAddress1: string;
    emailAddress2: string;
    physicalAddress1: string;
    physicalAddress2: string;

    // Request status
    requestStatus: "pending" | "approved" | "rejected";

    // Optional fields for approval process
    reviewedBy?: string;
    reviewedDate?: string;
    hrComments?: string;
}
