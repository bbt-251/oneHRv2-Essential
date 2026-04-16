import React, { Fragment } from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { HrSettingsByType } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { CompetenceAssessmentModel, CompetenceValueModel } from "@/lib/models/competenceAssessment";
import generateID from "@/lib/util/generateID";

// Register Montserrat font
Font.register({
    family: "Montserrat",
    fonts: [
        {
            src: "/fonts/Montserrat-ExtraLight.ttf",
            fontWeight: 200,
        },
        {
            src: "/fonts/Montserrat-Regular.ttf",
            fontWeight: 400,
        },
        {
            src: "/fonts/Montserrat-SemiBold.ttf",
            fontWeight: 600,
        },
        {
            src: "/fonts/Montserrat-Medium.ttf",
            fontWeight: 500,
        },
        {
            src: "/fonts/Montserrat-VariableFont_wght.ttf",
        },
    ],
});

interface EmployeePerformanceReportProps {
    employeeUid: string;
    employees: EmployeeModel[];
    performanceEvaluations: PerformanceEvaluationModel[];
    objectives: ObjectiveModel[];
    competenceValues: CompetenceValueModel[];
    competenceAssessments: CompetenceAssessmentModel[];
    hrSettings: HrSettingsByType;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Montserrat",
        fontSize: 12,
        position: "relative",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    icon: {
        width: 50,
        height: 45,
    },
    title: {
        fontWeight: 900,
        fontSize: 18,
        marginLeft: 10,
        textTransform: "uppercase",
        color: "#000000",
    },
    pinkTitle: {
        fontSize: 18,
        marginLeft: 10,
        textTransform: "uppercase",
        color: "#FF4081",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 900,
        marginBottom: 10,
        color: "#000000",
    },
    pinkSectionTitle: {
        fontSize: 12,
        fontWeight: 900,
        marginBottom: 10,
        color: "#FF4081",
    },
    pinkSub: {
        fontSize: 14,
        marginBottom: 10,
        color: "#FF4081",
    },
    section: {
        backgroundColor: "#FFF6DF",
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        // borderColor: '#FFE082',
    },
    evaluationSection: {
        backgroundColor: "#EFEFEF",
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
    },
    objSection: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        border: "2px",
        borderColor: "#FFF0CA",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    column: {
        // width: '48%',
        alignItems: "center",
    },
    label: {
        fontSize: 8,
        fontWeight: 600,
        color: "#000000",
        marginBottom: 5,
    },
    pinkLabel: {
        fontSize: 10,
        color: "#FF4081",
        marginBottom: 5,
    },
    value: {
        fontSize: 8,
        color: "#000000",
        marginBottom: 15,
    },
    smartObj: {
        fontSize: 8,
        color: "#000000",
        marginBottom: 15,
        whiteSpace: "normal",
        wordWrap: "break-word",
        maxWidth: "190px",
    },
    pinkValue: {
        fontSize: 12,
        color: "#FF4081",
        marginBottom: 15,
    },
    footerRow: {
        position: "absolute",
        left: 10,
        bottom: 10,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingRight: "25px",
        paddingLeft: "10px",
        marginTop: 20,
    },
    footerRowContainers: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    footerLabel: {
        fontSize: 8,
        fontWeight: 600,
        color: "#000000",
    },
    footerValue: {
        fontSize: 8,
        color: "#000000",
    },
    signature: {
        // fontFamily: 'Signature',
        fontSize: 16,
        color: "#000000",
    },
    actionText: {
        fontSize: 10,
        color: "#000000",
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 10,
        color: "#FF4081",
        marginBottom: 5,
    },
});

const EmployeePerformanceReport = ({
    employeeUid,
    employees,
    performanceEvaluations,
    objectives,
    competenceValues,
    competenceAssessments = [],
    hrSettings,
}: EmployeePerformanceReportProps) => {
    // Find employee data
    const employee = employees.find(emp => emp.uid === employeeUid);

    // Find evaluation campaigns associated with this employee
    const employeeCampaigns = hrSettings.evaluationCampaigns.filter(campaign =>
        campaign.associatedEmployees.includes(employeeUid),
    );

    // Group data by campaign (period + round combination)
    const campaignData = employeeCampaigns.map(campaign => {
        const campaignEvaluations = performanceEvaluations.filter(
            pe =>
                pe.employeeUid === employeeUid &&
                pe.periodID === campaign.periodID &&
                pe.roundID === campaign.roundID,
        );

        const campaignObjectives = objectives.filter(
            obj =>
                obj.employee === employeeUid &&
                obj.period === campaign.periodID &&
                obj.round === campaign.roundID,
        );

        const campaignCompetenceValues = competenceValues.filter(
            cv => cv.employeeUid === employeeUid && cv.campaignId === campaign.id,
        );

        // Find period details
        const period = hrSettings.periodicOptions.find(p => p.id === campaign.periodID);
        const round = period?.evaluations?.find(ev => ev.id == campaign.roundID);

        return {
            campaign,
            evaluations: campaignEvaluations,
            objectives: campaignObjectives,
            competenceValues: campaignCompetenceValues,
            period,
            round,
        };
    });

    // Calculate overall scores from employee's past performance records
    const calculateOverallScores = () => {
        if (!employee?.performance || employee.performance.length === 0) {
            return {
                objectiveScore: 0,
                competencyScore: 0,
                overallScore: 0,
            };
        }

        // Calculate average objective score from past performance records
        const totalObjectiveScore = employee.performance.reduce(
            (sum, perf) => sum + (perf.objectiveScore || 0),
            0,
        );
        const objectiveScore = totalObjectiveScore / employee.performance.length;

        // Calculate average competency score from past performance records
        const totalCompetencyScore = employee.performance.reduce(
            (sum, perf) => sum + (perf.competencyScore || 0),
            0,
        );
        const competencyScore = totalCompetencyScore / employee.performance.length;

        // Calculate average overall performance score from past performance records
        const totalOverallScore = employee.performance.reduce(
            (sum, perf) => sum + (perf.performanceScore || 0),
            0,
        );
        const overallScore = totalOverallScore / employee.performance.length;

        return {
            objectiveScore: Math.round(objectiveScore * 100) / 100,
            competencyScore: Math.round(competencyScore * 100) / 100,
            overallScore: Math.round(overallScore * 100) / 100,
        };
    };

    const overallScores = calculateOverallScores();

    // Get employee full name
    const getEmployeeFullName = (emp: EmployeeModel) => {
        return `${emp.firstName} ${emp.middleName ? emp.middleName + " " : ""}${emp.surname}`;
    };

    // Get manager name
    const getManagerName = (managerUid: string) => {
        const manager = employees.find(emp => emp.uid === managerUid);
        return manager ? getEmployeeFullName(manager) : "N/A";
    };

    return (
        <Document>
            {/* Page 1 */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image style={styles.icon} src="/images/page-1.png" />
                    <Text style={styles.title}>Employee Performance Evaluation Report</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>EMPLOYEE INFORMATION</Text>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>First Name</Text>
                            <Text style={styles.value}>{employee?.firstName || "N/A"}</Text>
                            <Text style={styles.label}>Middle Name</Text>
                            <Text style={styles.value}>{employee?.middleName || "N/A"}</Text>
                            <Text style={styles.label}>Employment Position</Text>
                            <Text style={styles.value}>
                                {hrSettings?.positions?.find(
                                    p => p.id == employee?.employmentPosition,
                                )?.name || "N/A"}
                            </Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.label}>Last Name</Text>
                            <Text style={styles.value}>{employee?.surname || "N/A"}</Text>
                            <Text style={styles.label}>Department</Text>
                            <Text style={styles.value}>
                                {hrSettings?.departmentSettings?.find(
                                    d => d.id == employee?.department,
                                )?.name || "N/A"}
                            </Text>
                            <Text style={styles.label}>Manager</Text>
                            <Text style={styles.value}>
                                {employee?.reportingLineManager
                                    ? getManagerName(employee.reportingLineManager)
                                    : "N/A"}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>EMPLOYEE PERFORMANCE</Text>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>Campaigns</Text>
                            <Text style={styles.value}>
                                {campaignData.length} Active Campaign(s)
                            </Text>
                            <Text style={styles.label}>Total Objectives</Text>
                            <Text style={styles.value}>
                                {campaignData.reduce((sum, cd) => sum + cd.objectives.length, 0)}
                            </Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.label}>Overall Competency Assessment Score</Text>
                            <Text style={styles.value}>{overallScores.competencyScore}</Text>
                            <Text style={styles.label}>Overall Objective Performance Score</Text>
                            <Text style={styles.value}>{overallScores.objectiveScore}</Text>
                            <Text style={styles.label}>Overall Employee Performance Score</Text>
                            <Text style={styles.value}>{overallScores.overallScore}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.footerRow}>
                    <View style={styles.footerRowContainers}>
                        <Text style={styles.footerLabel}>ACCEPTANCE TIMESTAMP</Text>
                        <Text style={styles.footerValue}>{new Date().toLocaleString()}</Text>
                    </View>
                    <View style={styles.footerRowContainers}>
                        <Text style={styles.footerLabel}>EMPLOYEE SIGNATURE</Text>
                        {employee?.signature ? (
                            <Image style={{ width: 100, height: 40 }} src={employee.signature} />
                        ) : (
                            <Text style={styles.footerValue}>N/A</Text>
                        )}
                    </View>
                </View>
            </Page>

            {/* Dynamic Campaign Sections */}
            {campaignData.map((campaignInfo, campaignIndex) => {
                const {
                    campaign,
                    evaluations,
                    objectives: campaignObjectives,
                    competenceValues: campaignCompetenceValues,
                    period,
                    round,
                } = campaignInfo;
                const performance = employee?.performance?.find(p => p.campaignId == campaign.id);
                return (
                    <Fragment key={`campaign-group-${campaign.id}`}>
                        {/* Campaign Summary Page */}
                        <Page size="A4" style={styles.page}>
                            <View style={styles.header}>
                                <Image style={styles.icon} src="/images/page-2.png" />
                                <Text
                                    style={styles.pinkTitle}
                                >{`${round?.round ?? ""} (${period?.periodName ?? ""})`}</Text>
                            </View>
                            <View style={styles.evaluationSection}>
                                <View style={styles.row}>
                                    <View style={styles.column}>
                                        <Text style={styles.pinkLabel}>Campaign Start Date</Text>
                                        <Text style={styles.value}>
                                            {new Date(campaign.startDate).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.pinkLabel}>Campaign End Date</Text>
                                        <Text style={styles.value}>
                                            {new Date(campaign.endDate).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.pinkLabel}>Period</Text>
                                        <Text style={styles.value}>
                                            {period?.periodName || "N/A"}
                                        </Text>
                                    </View>
                                    <View style={styles.column}>
                                        <Text style={styles.pinkLabel}>
                                            Objective Performance Score
                                        </Text>
                                        <Text style={styles.value}>
                                            {performance?.objectiveScore
                                                ? performance?.objectiveScore.toFixed(2)
                                                : "0.00"}
                                        </Text>
                                        <Text style={styles.pinkLabel}>
                                            Competency Assessment Score
                                        </Text>
                                        <Text style={styles.value}>
                                            {performance?.competencyScore
                                                ? performance?.competencyScore.toFixed(2)
                                                : "0.00"}
                                        </Text>
                                        <Text style={styles.pinkLabel}>
                                            Employee Performance Score
                                        </Text>
                                        <Text style={styles.value}>
                                            {performance?.performanceScore
                                                ? performance?.performanceScore.toFixed(2)
                                                : "0.00"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Page>

                        {/* Objectives for this Campaign */}
                        {campaignObjectives.map((objective, objIndex) => (
                            <Fragment key={`objective-group-${campaign.id}-${objective.id}`}>
                                {/* Objective Definition Page */}
                                <Page size="A4" style={styles.page}>
                                    <View style={styles.header}>
                                        <Image style={styles.icon} src="/images/page-3.png" />
                                        <Text style={styles.pinkTitle}>Employee Objectives </Text>
                                    </View>
                                    <Text style={styles.pinkSub}>Definition</Text>
                                    <View style={styles.objSection}>
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>Timestamp</Text>
                                                <Text style={styles.value}>
                                                    {new Date(
                                                        objective.timestamp,
                                                    ).toLocaleDateString()}
                                                </Text>
                                                <Text style={styles.pinkLabel}>Title</Text>
                                                <Text style={styles.value}>{objective.title}</Text>
                                                <Text style={styles.pinkLabel}>Status</Text>
                                                <Text style={styles.value}>{objective.status}</Text>
                                                <Text style={styles.pinkLabel}>Dpt KPI</Text>
                                                <Text style={styles.value}>
                                                    {objective.deptKPI || "N/A"}
                                                </Text>
                                            </View>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>
                                                    SMART Objective
                                                </Text>
                                                <Text style={styles.smartObj}>
                                                    {objective.SMARTObjective}
                                                </Text>
                                                <Text style={styles.pinkLabel}>Target Date</Text>
                                                <Text style={styles.value}>
                                                    {new Date(
                                                        objective.targetDate,
                                                    ).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Page>

                                {/* Action Plans Page */}
                                <Page size="A4" style={styles.page}>
                                    <View style={styles.header}>
                                        <Image style={styles.icon} src="/images/page-4.png" />
                                        <Text style={styles.pinkTitle}>Employee Objectives</Text>
                                    </View>
                                    <Text style={styles.pinkSectionTitle}>ACTION PLANS</Text>
                                    {objective.actionItems && objective.actionItems.length > 0 ? (
                                        objective.actionItems.map(
                                            (actionItem: any, actionIndex: number) => (
                                                <View key={actionIndex} style={styles.objSection}>
                                                    <Text style={styles.actionLabel}>
                                                        Action Item {actionIndex + 1}
                                                    </Text>
                                                    <Text style={styles.actionText}>
                                                        {actionItem.actionItem}
                                                    </Text>
                                                    {actionItem.description && (
                                                        <Text style={styles.actionText}>
                                                            {actionItem.description}
                                                        </Text>
                                                    )}
                                                    <View style={styles.row}>
                                                        <View style={styles.column}>
                                                            <Text style={styles.actionLabel}>
                                                                EMPLOYEE
                                                            </Text>
                                                            <Text style={styles.value}>
                                                                {actionItem.employee
                                                                    ? "Completed"
                                                                    : "Pending"}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.column}>
                                                            <Text style={styles.actionLabel}>
                                                                MANAGER
                                                            </Text>
                                                            <Text style={styles.value}>
                                                                {actionItem.manager
                                                                    ? "Completed"
                                                                    : "Pending"}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            ),
                                        )
                                    ) : (
                                        <View style={styles.objSection}>
                                            <Text style={styles.actionText}>
                                                No action items defined for this objective.
                                            </Text>
                                        </View>
                                    )}
                                </Page>

                                {/* Self-Assessment and Review Page */}
                                <Page size="A4" style={styles.page}>
                                    <View style={styles.header}>
                                        <Image style={styles.icon} src="/images/page-5.png" />
                                        <Text style={styles.pinkTitle}>Employee Objectives</Text>
                                    </View>
                                    <Text style={styles.pinkSub}>SELF-ASSESSMENT</Text>
                                    <View style={styles.objSection}>
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>
                                                    Completion Status
                                                </Text>
                                                <Text style={styles.value}>
                                                    {objective.selfEvaluation?.value
                                                        ? `${objective.selfEvaluation.value}/5`
                                                        : "N/A"}
                                                </Text>
                                                <Text style={styles.pinkLabel}>Actual Result</Text>
                                                <Text style={styles.value}>
                                                    {objective.selfEvaluation?.actualResult ||
                                                        "N/A"}
                                                </Text>
                                            </View>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>Justification</Text>
                                                <Text style={styles.value}>
                                                    {objective.selfEvaluation?.justification ||
                                                        "N/A"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.pinkSub}>REVIEW</Text>
                                    <View style={styles.objSection}>
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>
                                                    Completion Status
                                                </Text>
                                                <Text style={styles.value}>
                                                    {objective.managerEvaluation?.value
                                                        ? `${objective.managerEvaluation.value}/5`
                                                        : "N/A"}
                                                </Text>
                                                <Text style={styles.pinkLabel}>Actual Result</Text>
                                                <Text style={styles.value}>
                                                    {objective.managerEvaluation?.justification ||
                                                        "N/A"}
                                                </Text>
                                            </View>
                                            <View style={styles.column}>
                                                <Text style={styles.pinkLabel}>Justification</Text>
                                                <Text style={styles.value}>
                                                    {objective.managerEvaluation?.managerMessage ||
                                                        "N/A"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Page>
                            </Fragment>
                        ))}

                        {/* Competencies for this Campaign */}
                        {(() => {
                            // Find competence assessments for this employee and campaign
                            const employeeAssessment = competenceAssessments.find(
                                ca => ca.for === employeeUid,
                            );
                            if (!employeeAssessment) return null;

                            const campaignAssessments = employeeAssessment.assessment.filter(
                                assessment => assessment.campaignId === campaign.id,
                            );

                            if (campaignAssessments.length === 0) return null;

                            // Group competence values by competenceId to separate employee and manager assessments
                            const groupedCompetencies: {
                                [key: string]: { competence: any; self?: any; manager?: any };
                            } = {};

                            campaignAssessments.forEach(assessment => {
                                const isSelfAssessment = assessment.evaluatedBy === employeeUid;

                                assessment.competenceValues.forEach(competencyValue => {
                                    if (!groupedCompetencies[competencyValue.competenceId]) {
                                        const competence = hrSettings.competencies?.find(
                                            c => c.id === competencyValue.competenceId,
                                        );
                                        groupedCompetencies[competencyValue.competenceId] = {
                                            competence,
                                            self: undefined,
                                            manager: undefined,
                                        };
                                    }

                                    if (isSelfAssessment) {
                                        groupedCompetencies[competencyValue.competenceId].self =
                                            competencyValue;
                                    } else {
                                        groupedCompetencies[competencyValue.competenceId].manager =
                                            competencyValue;
                                    }
                                });
                            });

                            return (
                                <Page size="A4" style={styles.page}>
                                    <View style={styles.header}>
                                        <Image style={styles.icon} src="/images/page-6.png" />
                                        <Text style={styles.title}>Employee Competencies</Text>
                                    </View>
                                    {Object.entries(groupedCompetencies).map(
                                        ([competenceId, data], index: number) => (
                                            <View key={`${campaign.id}-${competenceId}`}>
                                                <Text style={styles.sectionTitle}>
                                                    {data.competence?.competenceName ||
                                                        `Competence ${index + 1}`}
                                                </Text>
                                                <View style={styles.section}>
                                                    <View style={styles.row}>
                                                        <View style={styles.column}>
                                                            <Text style={styles.label}>
                                                                Threshold
                                                            </Text>
                                                            <Text style={styles.value}>
                                                                {data.self?.threshold ||
                                                                    data.manager?.threshold ||
                                                                    "N/A"}
                                                            </Text>
                                                            <Text style={styles.label}>
                                                                Employee Score
                                                            </Text>
                                                            <Text style={styles.value}>
                                                                {data.self?.value !== null &&
                                                                data.self?.value !== undefined
                                                                    ? `${data.self.value}/5`
                                                                    : "Not rated"}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.column}>
                                                            <Text style={styles.label}>Weight</Text>
                                                            <Text style={styles.value}>
                                                                {data.self?.weight ||
                                                                    data.manager?.weight ||
                                                                    "N/A"}
                                                            </Text>
                                                            <Text style={styles.label}>
                                                                Manager Score
                                                            </Text>
                                                            <Text style={styles.value}>
                                                                {data.manager?.value !== null &&
                                                                data.manager?.value !== undefined
                                                                    ? `${data.manager.value}/5`
                                                                    : "Not rated"}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        ),
                                    )}
                                </Page>
                            );
                        })()}
                    </Fragment>
                );
            })}
        </Document>
    );
};

export default EmployeePerformanceReport;
