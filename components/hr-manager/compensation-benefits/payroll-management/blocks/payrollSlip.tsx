/* eslint-disable jsx-a11y/alt-text */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PayrollData } from "../page";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";

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
    ],
});

// Create styles
const styles = StyleSheet.create({
    page: {
        fontSize: "12px",
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontFamily: "Montserrat",
        paddingBottom: 140,
    },
    pageContainer: {
        paddingHorizontal: 32,
        paddingVertical: 24,
    },
    text: {
        fontWeight: 350,
        marginVertical: 0,
        lineHeight: 1.4,
    },
    header: {
        marginVertical: 0,
        fontWeight: 600,
        lineHeight: 1.4,
    },
    pageTitle: {
        fontSize: "18px",
        fontWeight: 600,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "25px",
    },
    borderBottom: {
        borderBottom: "1px solid grey",
        marginBottom: "40px",
    },
    rowText: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    personalInfo: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        marginBottom: "22px",
        paddingLeft: 0,
    },
    infoLabel: {
        width: "46%",
    },
    infoValue: {
        width: "54%",
        textAlign: "right",
    },
    parentContainer: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    payrollContainer: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "stretch",
        marginBottom: "8px",
    },
    sectionHeaderContainer: {
        // border: "1px solid brown",
        width: "100%",
    },
    payrollInfoContainer: {
        width: "100%",
    },
    payrollInfo: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid grey",
        paddingTop: 6,
        paddingBottom: 6,
    },
    payrollInfoDouble: {
        width: "40%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signature: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    container: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingLeft: 0,
    },
    separator: {
        marginTop: "12px",
        marginBottom: "12px",
    },
    subjectContainer: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 0,
        marginBottom: 6,
    },
    subjectBorder: {
        width: "55%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderBottom: "1px solid grey",
        marginTop: 8,
    },
    subjectText: {
        fontWeight: 650,
        fontSize: "16px",
        marginVertical: 0,
        lineHeight: 1.3,
    },
});

export default function PayrollSlip({
    data,
    header,
    footer,
    signature,
    stamp,
    attendanceLogic,
}: {
    data: PayrollData;
    header: string;
    footer: string;
    signature: string;
    stamp: string;
    attendanceLogic: 1 | 2 | 3 | 4;
}) {
    function Header() {
        if (header !== "") {
            return (
                <View fixed>
                    <Image
                        src={header}
                        style={{
                            width: "100%",
                            height: 110,
                            marginBottom: 16,
                        }}
                    />
                </View>
            );
        } else {
            return <View></View>;
        }
    }

    function Subject({ text }: { text: string }) {
        return (
            <View style={styles.subjectContainer}>
                <Text style={styles.subjectText}>{text}</Text>

                <View style={styles.subjectBorder}></View>
            </View>
        );
    }

    function PersonalInfo() {
        return (
            <View style={styles.personalInfo}>
                <View style={styles.rowText}>
                    <Text style={[styles.header, styles.infoLabel]}>Date:</Text>
                    <Text style={[styles.text, styles.infoValue]}>
                        {data.month} {data.year}
                    </Text>
                </View>

                <View style={styles.rowText}>
                    <Text style={[styles.header, styles.infoLabel]}>Name:</Text>
                    <Text style={[styles.text, styles.infoValue]}>{data?.employeeName ?? ""}</Text>
                </View>

                {/* <View style={styles.rowText}>
                    <Text style={styles.header}>First Name:</Text>
                    <Text style={styles.text}>{data.firstName}</Text>
                </View>

                <View style={styles.rowText}>
                    <Text style={styles.header}>Middle Name:</Text>
                    <Text style={styles.text}>{data?.middleName ?? '-'}</Text>
                </View>

                <View style={styles.rowText}>
                    <Text style={styles.header}>Surname:</Text>
                    <Text style={styles.text}>{data.surname}</Text>
                </View> */}

                <View style={styles.rowText}>
                    <Text style={[styles.header, styles.infoLabel]}>Employment Position:</Text>
                    <Text style={[styles.text, styles.infoValue]}>
                        {data.employmentPosition || "-"}
                    </Text>
                </View>

                <View style={styles.rowText}>
                    <Text style={[styles.header, styles.infoLabel]}>Department:</Text>
                    <Text style={[styles.text, styles.infoValue]}>{data.department}</Text>
                </View>

                <View style={styles.rowText}>
                    <Text style={[styles.header, styles.infoLabel]}>Location:</Text>
                    <Text style={[styles.text, styles.infoValue]}>{data.workingLocation}</Text>
                </View>
            </View>
        );
    }

    function Payslip() {
        return (
            <View>
                {/* First Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Base Salary:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.baseSalary)}
                                </Text>
                            </View>
                        </View>

                        {attendanceLogic === 4 && (
                            <View style={styles.payrollInfoContainer}>
                                <View style={styles.payrollInfo}>
                                    <Text style={styles.text}>Number of Worked Hours:</Text>

                                    <View style={styles.payrollInfoDouble}>
                                        <Text style={styles.text}>
                                            {numberCommaSeparator(data.monthlyWorkedHours)}
                                        </Text>
                                        <Text style={styles.text}>
                                            {numberCommaSeparator(
                                                Number(data.monthlyWorkedHours) *
                                                    Number(data.hourlyWage),
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {attendanceLogic !== 1 && (
                            <View style={styles.payrollInfoContainer}>
                                {data.overtimes.map((val, index) => {
                                    return (
                                        <View style={styles.payrollInfo} key={index}>
                                            <Text style={styles.text}>{val.name}</Text>

                                            <View style={styles.payrollInfoDouble}>
                                                <Text style={styles.text}>{val.amount}</Text>
                                                <Text style={styles.text}>
                                                    {numberCommaSeparator(
                                                        val.amount *
                                                            data.hourlyWage *
                                                            (val.rate / 100),
                                                    )}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>

                {/* Second Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Total Payment:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.totalPayment)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.payrollInfoContainer}>
                            {data.payments.map((value, index) => {
                                return (
                                    <View style={styles.payrollInfo} key={index}>
                                        <Text style={styles.text}>{value.name}</Text>
                                        <Text style={styles.text}>
                                            {numberCommaSeparator(value.amount)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Third Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Total Gross Pay:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.totalGrossPay)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Fourth Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Total Taxable Gross Pay:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.taxableGrossSalary)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Fifth Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Total Deduction:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.totalDeduction)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.payrollInfoContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.text}>Income Tax:</Text>
                                <Text style={styles.text}>
                                    {numberCommaSeparator(data.incomeTax)}
                                </Text>
                            </View>

                            {data.deductions.map((value, index) => {
                                return (
                                    <View style={styles.payrollInfo} key={index}>
                                        <Text style={styles.text}>{value.name}</Text>
                                        <Text style={styles.text}>
                                            {numberCommaSeparator(value.amount)}
                                        </Text>
                                    </View>
                                );
                            })}

                            {data.loans.map((value, index) => {
                                return (
                                    <View style={styles.payrollInfo} key={index}>
                                        <Text style={styles.text}>{value.name}</Text>
                                        <Text style={styles.text}>
                                            {numberCommaSeparator(value.amount)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Sixth Section */}
                <View style={styles.parentContainer}>
                    <View style={styles.payrollContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <View style={styles.payrollInfo}>
                                <Text style={styles.header}>Net Pay:</Text>
                                <Text style={styles.header}>
                                    {numberCommaSeparator(data.netPay)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    function Signature() {
        return (
            <View style={styles.container}>
                {signature !== "" && (
                    <View style={styles.signature} fixed>
                        <Image
                            src={signature}
                            style={{
                                width: 144,
                                height: 77,
                            }}
                        />
                    </View>
                )}
            </View>
        );
    }

    function Stamp() {
        return (
            <View style={styles.container}>
                {stamp !== "" && (
                    <View style={styles.signature} fixed>
                        <Image
                            src={stamp}
                            style={{
                                width: 80,
                                height: 80,
                            }}
                        />
                    </View>
                )}
            </View>
        );
    }

    function Footer() {
        if (footer !== "") {
            return (
                <View
                    fixed
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    <Image
                        src={footer}
                        style={{
                            width: "100%",
                            // height: "100%",
                            height: 170,
                        }}
                    />
                </View>
            );
        } else {
            return <View></View>;
        }
    }

    if (data) {
        return (
            <>
                <Document title={`${data.employeeName} ${data.month} ${data.year} Payroll Slip`}>
                    <Page size="A4" style={styles.page}>
                        <Header />

                        <View style={styles.pageContainer}>
                            <Subject text="Payslip" />

                            <View style={styles.separator}></View>

                            <PersonalInfo />

                            <Payslip />

                            <View style={styles.separator}></View>

                            <Signature />

                            <View style={styles.separator}></View>

                            <Stamp />
                        </View>

                        <Footer />
                    </Page>
                </Document>
            </>
        );
    } else {
        return <></>;
    }
}
