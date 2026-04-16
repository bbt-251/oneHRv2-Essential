/* eslint-disable jsx-a11y/alt-text */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import draftToHtml from "draftjs-to-html";
import React from "react";
import { EmployeeModel } from "@/lib/models/employee";
import generateID from "@/lib/util/generateID";
import { convertHtml2PDFtags } from "@/lib/backend/functions/convertHtml2PDFtags";
import parsePdfString from "./parsePdfString";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { getEmployeeInitials } from "@/lib/util/getEmployeeFullName";
import { CompanyInfoModel } from "@/lib/models/companyInfo";

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
            src: "/fonts/Montserrat-Italic.ttf",
            fontWeight: 600,
            fontStyle: "italic",
        },
    ],
});

// Create styles
const styles = StyleSheet.create({
    page: {
        fontSize: "13px",
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontFamily: "Montserrat",
    },
    pageContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    text: {
        fontWeight: 350,
        // marginVertical: 2,
        lineHeight: 1.5,
    },
    subjectText: {
        fontWeight: 650,
        fontSize: "17px",
        // marginVertical: 1,
        lineHeight: 1.5,
        textAlign: "center",
        textDecoration: "underline",
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
        marginBottom: "30px",
    },
    separator: {
        marginTop: "10px",
        marginBottom: "10px",
    },
    dateText: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    signature: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    signatureContainer: {
        width: "90%",
        display: "flex",
        flexDirection: "row",
        // justifyContent:'space-between',
        gap: "1rem",
        position: "absolute",
        bottom: "-90px",
        // left:'30px'
    },
    container: {
        width: "100%",
        display: "flex",
        paddingLeft: 15,
        paddingRight: 15,
    },
    subjectContainer: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 40,
    },
    subjectBorder: {
        width: "50%%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderBottom: "1px solid grey",
    },
    initialsContainer: {
        width: "90%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        position: "absolute",
        left: "30px",
    },
});

function isJSONParsable(str: any) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

function replaceEmployeeData(
    str: string,
    employeeData: EmployeeModel,
    basicInfo: CompanyInfoModel,
    jobPosting?: any,
) {
    return str.replace(/\{([^}]+)\}/g, function (match, data) {
        return (
            (employeeData as any)[data] ||
            (basicInfo as any)[data] ||
            (jobPosting as any)?.[data] ||
            match
        );
    });
}

export default function DocumentComponent({
    employeeData,
    basicInfo,
    data,
    header,
    signatureCompany,
    signatureEmployee,
    footer,
    jobPosting,
}: {
    employeeData: EmployeeModel;
    basicInfo: CompanyInfoModel;
    data: DocumentDefinitionModel;
    header: string;
    signatureCompany: string;
    signatureEmployee: string;
    footer: string;
    jobPosting?: any;
}) {
    if (data) {
        const htmlElements = data.content.map((d: string) =>
            isJSONParsable(d) ? draftToHtml(JSON.parse(d)) : [],
        );

        let pdfElement = "";

        htmlElements.map((htmlElement: string | never[]) => {
            if (typeof htmlElement === "string") {
                pdfElement +=
                    convertHtml2PDFtags(htmlElement) + `<Text style={{"height":"10px"}}></Text>`;
            }
        });

        const parsedHtml = parsePdfString(
            replaceEmployeeData(pdfElement, employeeData ?? {}, basicInfo ?? {}, jobPosting),
        );

        return (
            <>
                <Document key={generateID()} title={`${data.name}`}>
                    <Page
                        size="A4"
                        style={{ ...styles.page, paddingBottom: footer == "" ? 80 : 280 }}
                    >
                        {/* Header Img */}
                        {header !== "" ? (
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
                        ) : (
                            <View fixed style={{ marginBottom: "20px" }}></View>
                        )}

                        {/* content */}
                        {
                            <View style={{ paddingHorizontal: "30px" }}>
                                {/* Date Container */}
                                <View style={styles.container}>
                                    <View style={styles.dateText}>
                                        <Text style={styles.text}>
                                            {dayjs().format("MMMM DD, YYYY")}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.separator}></View>

                                {/* Subject Container */}
                                <Text style={styles.subjectText}>{data.subject}</Text>

                                <View style={styles.separator}></View>

                                {/* Content Container */}
                                <View style={{ ...styles.container, fontSize: "11px" }}>
                                    {...parsedHtml}
                                    {/* Signature Container */}
                                    <View style={styles.signatureContainer}>
                                        {signatureEmployee !== "" &&
                                        employeeData?.signedDocuments?.includes(data.id) ? (
                                                <View
                                                    style={{
                                                        display: "flex",
                                                        width: 144,
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <View style={styles.signature} fixed>
                                                        <Image
                                                            src={signatureEmployee}
                                                            style={{
                                                                width: 112,
                                                                height: 47,
                                                            }}
                                                        />
                                                    </View>
                                                    <Text style={{ fontSize: "8px" }}>
                                                    Employee Signature
                                                    </Text>
                                                </View>
                                            ) : (
                                                <></>
                                            )}
                                        {/* {
                                        (data as any)?.workflowSignatures?.map((w:WorkflowSignatureModel,index:number)=>{
                                            return (
                                                <View key={index} style={{display:'flex',width: 122,flexDirection:'column',alignItems:'center'}}>
                                                    <View style={styles.signature} fixed>
                                                        <Image
                                                            src={w.employeeSignature}
                                                            style={{
                                                                width: 112,
                                                                height: 47,
                                                            }}
                                                        />
                                                    </View>
                                                    
                                                    <Text style={{fontSize:'8px'}}>
                                                        {w.position.split('-')[2]}
                                                    </Text>
                                                </View>
                                            )
                                        })
                                    } */}
                                    </View>
                                </View>

                                <View style={styles.separator}></View>
                            </View>
                        }

                        {/* Initials Container */}
                        {data.initialNeeded == "Yes" ? (
                            <View
                                fixed
                                style={{
                                    ...styles.initialsContainer,
                                    bottom: footer == "" ? 25 : 170,
                                }}
                            >
                                <View
                                    style={{
                                        display: "flex",
                                        width: 144,
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: "15px", fontWeight: "bold" }}>
                                        {getEmployeeInitials(employeeData ?? ({} as EmployeeModel))}
                                    </Text>
                                </View>

                                {data?.initial !== "" && (
                                    <View
                                        style={{
                                            display: "flex",
                                            width: 144,
                                            flexDirection: "column",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: "15px", fontWeight: "bold" }}>
                                            {data.initial}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <></>
                        )}

                        {/* Footer Container */}
                        {footer !== "" && (
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
                                        height: 170,
                                    }}
                                />
                            </View>
                        )}
                    </Page>
                </Document>
            </>
        );
    } else {
        return <></>;
    }
}
