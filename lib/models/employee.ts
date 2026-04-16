// Custom Field Types
export type CustomFieldSection = "employee" | "contract" | "position" | "emergency";
export type CustomFieldType = "text" | "number" | "date";

// Custom Field Interface (v2)
export interface CustomField {
    id: string;
    section: CustomFieldSection;
    label: string; // e.g., "Secondary Bank Account"
    value: string; // e.g., "9834723894289347u"
    type: CustomFieldType; // field type (text, number, date)
}

export interface EmployeeModel {
    id: string;
    timestamp: string;
    uid: string;

    /// employee information
    firstName: string;
    middleName: string | null;
    surname: string;
    birthDate: string;
    birthPlace: string;
    gender: string;
    maritalStatus: string;
    personalPhoneNumber: string;
    personalEmail: string;
    telegramChatID: string | null;

    // Current geolocation (Telegram live/static location)
    currentLocation: EmployeeCurrentLocation | null;

    bankAccount: string;
    providentFundAccount: string;
    hourlyWage: number;
    tinNumber: string;
    passportNumber: string;
    nationalIDNumber: string;
    employeeID: string;
    password: string;
    lastChanged: string;
    passwordRecovery: PasswordRecovery;
    signature: string;
    signedDocuments: string[];
    profilePicture: string;

    /// contract information
    company: string;
    contractType: string;
    contractHour: number | "Custom";
    hoursPerWeek: number;
    contractStatus: "active" | "inactive";
    contractStartingDate: string;
    contractTerminationDate: string;
    contractDuration: number[];
    hireDate: string;
    contractDocument: string;
    probationPeriodEndDate: string; //use this
    lastDateOfProbation: string;
    reasonOfLeaving: string;
    salary: number;
    currency: string;
    eligibleLeaveDays: number;
    companyEmail: string;
    companyPhoneNumber: string;
    associatedTax: string;
    pensionApplication: boolean;

    /// position information
    employmentPosition: string;
    positionLevel: string;
    section: string;
    department: string;
    workingLocation: string;
    workingArea: string; // JSON stringified [ [[lng, lat],[lng,lat],...] ,... ]
    homeLocation: string;
    managerPosition: boolean;
    reportees: string[];
    reportingLineManagerPosition: string;
    reportingLineManager: string;
    gradeLevel: string;
    step: number;
    shiftType: string;
    role: string[];
    unit: string;

    // emergency information
    emergencyContactName: string;
    relationshipToEmployee: string;
    phoneNumber1: string;
    phoneNumber2: string;
    emailAddress1: string;
    emailAddress2: string;
    physicalAddress1: string;
    physicalAddress2: string;

    notifications: notificationModel[];
    claimedOvertimes: string[];

    // timezone for attendance display
    timezone: string | null;

    // custom fields - single array with section-based filtering
    customFields: CustomField[];

    // balance leave days
    balanceLeaveDays: number;
    accrualLeaveDays: number;
    lastELDUpdate: string;

    // document
    documentRequests: { [documentID: string]: boolean };
    associatedRestrictedDocuments: string[];
}

export interface EducationDetailModel {
    id: string;
    startDate: string;
    endDate: string;
    title: string;
    educationalLevel: string;
    school: string;
    schoolNotListed?: boolean;
    fieldOfStudy?: string;
    grade?: string;
    status?: "completed" | "in-progress" | "incomplete";
}

export interface EmployeeCurrentLocation {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    source: "telegram" | "telegram_live";
    isLive: boolean;
    updatedAt: string;
    liveMessageId: string | null;
    liveChatId: string | null;
    liveUntil: string | null;
    endedAt: string | null;
}

export interface ExperienceDetailModel {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    mainActivities: string;
    reference: string;
    employmentType?: string;
    isCurrent?: boolean;
    location?: string;
    reasonForLeaving?: string;
    referenceName?: string;
    referenceContact?: string;
}

export interface notificationModel {
    id: string;
    isPinned: boolean;
    isRead: boolean;
}

export interface PasswordRecovery {
    timestamp: string;
    token: string;
}
