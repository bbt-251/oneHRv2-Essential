export interface CompanyInfoModel {
    id: string;
    // From CompanyData
    mission: string;
    vision: string;
    values: {
        qualityExcellence: string;
        sustainability: string;
    };

    // From BasicInfo
    companyName: string;
    postalAddress: string;
    companyUrl: string;
    telNo: string;
    contactPerson: string;
    emailAddress: string;
    managingDirector: string;
    legalRepresentative: string;
    yearsInBusiness: string;
    companySize: string;
    companySector: string;
    tinNumber: string;
    faxNumber: string;
    houseNumber: string;
    capital: string;
    totalAnnualRevenue: string;
    companyProfile: string;
    companyLogoURL: string;
}
