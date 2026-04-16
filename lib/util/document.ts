interface Option {
    value: string;
    label: string;
    children?: Option[];
}

export const documentDynamicOptions: Option[] = [
    {
        value: "employee",
        label: "Employee",
        children: [
            {
                value: "{employeeID}",
                label: "Employee ID",
            },
            {
                value: "{firstName}",
                label: "First Name",
            },
            {
                value: "{middleName}",
                label: "Middle Name",
            },
            {
                value: "{surname}",
                label: "Surname",
            },
            {
                value: "{personalPhoneNumber}",
                label: "Personal Phone Number",
            },
            {
                value: "{employmentPosition}",
                label: "Employment Position",
            },
            {
                value: "{contractStartingDate}",
                label: "Contract Starting Date",
            },
            {
                value: "{contractTerminationDate}",
                label: "Contract Termination Date",
            },
            {
                value: "{probationPeriodEndDate}",
                label: "Probation Period End Date",
            },
            {
                value: "{reasonOfLeaving}",
                label: "Reason Of Leaving",
            },
            {
                value: "{section}",
                label: "Section",
            },
            {
                value: "{department}",
                label: "Department",
            },
            {
                value: "{workingLocation}",
                label: "Working Location",
            },
            {
                value: "{salary}",
                label: "Salary",
            },
            {
                value: "{gradeLevel}",
                label: "Grade Level",
            },
            // {
            //   value: "{band}",
            //   label: "Band",
            // },
            {
                value: "{step}",
                label: "Step",
            },
            {
                value: "{hourlyWage}",
                label: "Hourly Wage",
            },
            {
                value: "{shiftType}",
                label: "Shift Type",
            },
            {
                value: "{birthDate}",
                label: "Birth Date",
            },
            {
                value: "{birthPlace}",
                label: "Birth Place",
            },
            {
                value: "{levelOfEducation}",
                label: "Level of Education",
            },
            {
                value: "{yearsOfExperience}",
                label: "Years of Experience",
            },
            {
                value: "{gender}",
                label: "Gender",
            },
            {
                value: "{maritalStatus}",
                label: "Marital Status",
            },
            {
                value: "{personalEmail}",
                label: "Personal Email",
            },
            {
                value: "{bankAccount}",
                label: "Bank Account",
            },
            {
                value: "{providentFundAccount}",
                label: "Provident Fund Account",
            },
            {
                value: "{tinNumber}",
                label: "TIN Number",
            },
            {
                value: "{contractHour}",
                label: "Contract Hour",
            },
            {
                value: "{contractDocument}",
                label: "Contract Document",
            },
            {
                value: "{lastDateOfProbation}",
                label: "Last Date of Probation",
            },
            {
                value: "{eligibleLeaveDays}",
                label: "Eligible Leave Days",
            },
            {
                value: "{companyEmail}",
                label: "Company Email",
            },
            {
                value: "{companyPhoneNumber}",
                label: "Company Phone Number",
            },
            {
                value: "{positionLevel}",
                label: "Position Level",
            },
            {
                value: "{homeLocation}",
                label: "Home Location",
            },
            {
                value: "{reportingLineManagerPosition}",
                label: "Reporting Line Manager Position",
            },
            {
                value: "{reportingLineManager}",
                label: "Reporting Line Manager",
            },
            {
                value: "{unit}",
                label: "Unit",
            },
            {
                value: "{emergencyContactName}",
                label: "Emergency Contact Name",
            },
            {
                value: "{relationshipToEmployee}",
                label: "Relationship to Employee",
            },
            {
                value: "{phoneNumber1}",
                label: "Phone Number 1",
            },
            {
                value: "{phoneNumber2}",
                label: "Phone Number 2",
            },
            {
                value: "{emailAddress1}",
                label: "Email Address 1",
            },
            {
                value: "{emailAddress2}",
                label: "Email Address 2",
            },
            {
                value: "{physicalAddress1}",
                label: "Physical Address 1",
            },
            {
                value: "{physicalAddress2}",
                label: "Physical Address 2",
            },
        ],
    },
    {
        value: "company",
        label: "Company",
        children: [
            {
                value: "{companyName}",
                label: "Company Name",
            },
            {
                value: "{telNo}",
                label: "Tel No",
            },
            {
                value: "{contactPerson}",
                label: "Contact Person",
            },
            {
                value: "{nameManagingDirector}",
                label: "Name Managing Director",
            },
            {
                value: "{legalRepresentative}",
                label: "Legal Representative",
            },
            {
                value: "{totalNumberOfEmployees}",
                label: "Total Number Of Employees",
            },
            {
                value: "{companySize}",
                label: "Company Size",
            },
            {
                value: "{companySector}",
                label: "Company Sector",
            },
        ],
    },
    {
        value: "jobPosting",
        label: "Job Posting",
        children: [
            {
                value: "{jobTitle}",
                label: "Job Title",
            },
            {
                value: "{department}",
                label: "Department",
            },
            {
                value: "{location}",
                label: "Location",
            },
            {
                value: "{employmentType}",
                label: "Employment Type",
            },
            {
                value: "{currency}",
                label: "Currency",
            },
            {
                value: "{minSalary}",
                label: "Min Salary",
            },
            {
                value: "{maxSalary}",
                label: "Max Salary",
            },
            {
                value: "{salaryType}",
                label: "Salary Type",
            },
            {
                value: "{applicationDeadline}",
                label: "Application Deadline",
            },
            {
                value: "{levelOfEducation}",
                label: "Level Of Education",
            },
            {
                value: "{yearsOfExperience}",
                label: "Years Of Experience",
            },
            {
                value: "{workMode}",
                label: "Work Mode",
            },
            {
                value: "{jobLevel}",
                label: "Job Level",
            },
            {
                value: "{contactEmail}",
                label: "Contact Email",
            },
            {
                value: "{contactPhone}",
                label: "Contact Phone",
            },
            {
                value: "{contactName}",
                label: "Contact Name",
            },
            {
                value: "{status}",
                label: "Status",
            },
            {
                value: "{applicants}",
                label: "Applicants",
            },
            {
                value: "{visibility}",
                label: "Visibility",
            },
        ],
    },
    {
        value: "promotion",
        label: "Promotion",
        children: [
            {
                value: "{promotionID}",
                label: "Promotion ID",
            },
            {
                value: "{promotionName}",
                label: "Promotion Name",
            },
            {
                value: "{employeeName}",
                label: "Employee Name",
            },
            {
                value: "{employeeID}",
                label: "Employee ID",
            },
            {
                value: "{currentPosition}",
                label: "Current Position",
            },
            {
                value: "{newPosition}",
                label: "New Position",
            },
            {
                value: "{currentGrade}",
                label: "Current Grade",
            },
            {
                value: "{newGrade}",
                label: "New Grade",
            },
            {
                value: "{currentStep}",
                label: "Current Step",
            },
            {
                value: "{newStep}",
                label: "New Step",
            },
            {
                value: "{currentSalary}",
                label: "Current Salary",
            },
            {
                value: "{newSalary}",
                label: "New Salary",
            },
            {
                value: "{currentEntitlementDays}",
                label: "Current Leave Entitlement Days",
            },
            {
                value: "{newEntitlementDays}",
                label: "New Leave Entitlement Days",
            },
            {
                value: "{period}",
                label: "Promotion Period",
            },
            {
                value: "{evaluationCycle}",
                label: "Evaluation Cycle",
            },
            {
                value: "{promotionReason}",
                label: "Promotion Reason",
            },
            {
                value: "{applicationDate}",
                label: "Application Date",
            },
            {
                value: "{department}",
                label: "Department",
            },
        ],
    },
    {
        value: "exit",
        label: "Exit Management",
        children: [
            {
                value: "{exitID}",
                label: "Exit ID",
            },
            {
                value: "{employeeName}",
                label: "Employee Name",
            },
            {
                value: "{employeeID}",
                label: "Employee ID",
            },
            {
                value: "{exitType}",
                label: "Exit Type",
            },
            {
                value: "{exitReason}",
                label: "Exit Reason",
            },
            {
                value: "{exitReasonDescription}",
                label: "Exit Reason Description",
            },
            {
                value: "{exitLastDate}",
                label: "Exit Last Date",
            },
            {
                value: "{exitEffectiveDate}",
                label: "Exit Effective Date",
            },
            {
                value: "{eligibleToRehire}",
                label: "Eligible to Rehire",
            },
            {
                value: "{remarks}",
                label: "Remarks",
            },
            {
                value: "{department}",
                label: "Department",
            },
            {
                value: "{position}",
                label: "Position",
            },
        ],
    },
    {
        value: "talentAcquisition",
        label: "Talent Acquisition",
        children: [
            // Interview related fields
            {
                value: "interview",
                label: "Interview",
                children: [
                    {
                        value: "{applicantName}",
                        label: "Applicant Name",
                    },
                    {
                        value: "{applicantID}",
                        label: "Applicant ID",
                    },
                    {
                        value: "{jobTitle}",
                        label: "Job Title",
                    },
                    {
                        value: "{interviewDate}",
                        label: "Interview Date",
                    },
                    {
                        value: "{interviewTime}",
                        label: "Interview Time",
                    },
                    {
                        value: "{interviewLocation}",
                        label: "Interview Location",
                    },
                    {
                        value: "{interviewerName}",
                        label: "Interviewer Name",
                    },
                    {
                        value: "{interviewType}",
                        label: "Interview Type",
                    },
                    {
                        value: "{interviewRound}",
                        label: "Interview Round",
                    },
                ],
            },
            // Offer related fields
            {
                value: "offer",
                label: "Job Offer",
                children: [
                    {
                        value: "{applicantName}",
                        label: "Applicant Name",
                    },
                    {
                        value: "{applicantID}",
                        label: "Applicant ID",
                    },
                    {
                        value: "{jobTitle}",
                        label: "Job Title",
                    },
                    {
                        value: "{offeredSalary}",
                        label: "Offered Salary",
                    },
                    {
                        value: "{startDate}",
                        label: "Start Date",
                    },
                    {
                        value: "{benefits}",
                        label: "Benefits",
                    },
                    {
                        value: "{hrContactName}",
                        label: "HR Contact Name",
                    },
                    {
                        value: "{hrContactEmail}",
                        label: "HR Contact Email",
                    },
                    {
                        value: "{offerExpirationDate}",
                        label: "Offer Expiration Date",
                    },
                    {
                        value: "{department}",
                        label: "Department",
                    },
                ],
            },
        ],
    },
];
