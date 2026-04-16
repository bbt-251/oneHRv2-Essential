export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const COMPANY_INFO_LOG_MESSAGES = {
    CREATED: (data: { companyName: string; mission?: string; vision?: string }): LogInfo => ({
        title: "Company Information Created",
        description: `Created new company information record for '${data.companyName}'${data.mission ? ` with mission: '${data.mission}'` : ""}${data.vision ? ` and vision: '${data.vision}'` : ""}`,
        module: "Company Information",
    }),

    UPDATED: (data: {
        id: string;
        companyName?: string;
        mission?: string;
        vision?: string;
    }): LogInfo => ({
        title: "Company Information Updated",
        description: `Updated company information for ID: ${data.id}${data.companyName ? `, company name: '${data.companyName}'` : ""}${data.mission ? `, mission: '${data.mission}'` : ""}${data.vision ? `, vision: '${data.vision}'` : ""}`,
        module: "Company Information",
    }),

    BASIC_INFO_UPDATED: (data: {
        id: string;
        companyName?: string;
        postalAddress?: string;
        emailAddress?: string;
        telNo?: string;
    }): LogInfo => ({
        title: "Company Basic Info Updated",
        description: `Updated company basic information for ID: ${data.id}${data.companyName ? `, name: '${data.companyName}'` : ""}${data.postalAddress ? `, address: '${data.postalAddress}'` : ""}${data.emailAddress ? `, email: '${data.emailAddress}'` : ""}${data.telNo ? `, phone: '${data.telNo}'` : ""}`,
        module: "Company Information",
    }),

    MISSION_VISION_UPDATED: (data: { id: string; mission?: string; vision?: string }): LogInfo => ({
        title: "Company Mission & Vision Updated",
        description: `Updated company mission and vision for ID: ${data.id}${data.mission ? `, mission: '${data.mission}'` : ""}${data.vision ? `, vision: '${data.vision}'` : ""}`,
        module: "Company Information",
    }),

    LOGO_UPDATED: (data: { id: string; companyName?: string }): LogInfo => ({
        title: "Company Logo Updated",
        description: `Updated company logo for ${data.companyName || `ID: ${data.id}`}`,
        module: "Company Information",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Company Information Deleted",
        description: `Deleted company information record with ID: ${id}`,
        module: "Company Information",
    }),
};
