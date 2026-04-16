import MultipleChoiceModel from "@/lib/models/multiple-choice";
import { QuizModel } from "@/lib/models/quiz.ts";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
    ],
});
Font.register({
    family: "MonteCarlo",
    fonts: [
        {
            src: "/fonts/MonteCarlo-Regular.ttf",
            fontWeight: 400,
        },
    ],
});

// Create styles
const styles = StyleSheet.create({
    page: {
        fontSize: "13px",
        paddingVertical: 0,
        fontFamily: "Montserrat",
        paddingLeft: 0,
        paddingRight: 0,
        margin: 0,
        position: "relative",
    },
    pageContainer: {
        paddingHorizontal: 30,
        paddingVertical: 30,
    },
    logo: {
        display: "flex",
        margin: 0,
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    text: {
        fontWeight: 500,
        marginVertical: 2,
        lineHeight: 1.5,
    },
    subjectText: {
        fontWeight: 600,
        fontSize: "25px",
        marginVertical: 2,
        lineHeight: 1.5,
    },
    nameText: {
        fontWeight: 600,
        fontSize: "30px",
        marginVertical: 2,
        lineHeight: 1.5,
        fontFamily: "MonteCarlo",
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
    container: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingLeft: 40,
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
    twoColumnContainer: {
        width: "90%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: "10px",
        paddingHorizontal: "120px",
    },
    column: {
        flex: 1,
    },
    detailText: {
        fontSize: "10px",
        fontWeight: 400,
        marginVertical: 2,
        lineHeight: 1.5,
    },
});

function getRankAndScore(
    materialId: string,
    trainingMaterials: TrainingMaterialModel[],
    quizzes: QuizModel[],
    uid: string,
) {
    const selectedTrainingMaterial = trainingMaterials?.find(
        material => material.id === materialId,
    );
    const associatedQuizzes = selectedTrainingMaterial?.associatedQuiz ?? [];
    const filteredQuizzes = quizzes.filter(quiz => associatedQuizzes.includes(quiz.id));

    let totalRank = 0;
    let totalScore = 0;
    filteredQuizzes.map(quiz => {
        const sortedResult =
            quiz?.quizTakenTimestamp?.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0)) ?? [];
        const rank = sortedResult.findIndex(r => r.employeeUid == uid) + 1;
        const result = sortedResult.find(r => r.employeeUid == uid);
        totalScore += result?.score ?? 0;
        totalRank += rank;
    });

    const rank = filteredQuizzes.length > 0 ? Math.round(totalRank / filteredQuizzes.length) : 0;
    const averageScore =
        filteredQuizzes.length > 0
            ? Math.round((totalScore * 100) / filteredQuizzes.length) / 100
            : 0;

    return { rank, averageScore };
}

export default function CertificationComponent({
    data,
    logo,
    stamp,
    trainingMaterials,
    quizzes,
}: {
    data: any;
    logo: string;
    stamp: string;
    trainingMaterials: TrainingMaterialModel[];
    quizzes: QuizModel[];
}) {
    if (data) {
        const { rank, averageScore } = getRankAndScore(
            data?.trainingMaterialID,
            trainingMaterials,
            quizzes,
            data?.employeeID,
        );
        return (
            <>
                <Document title={`${data.name}`}>
                    <Page size="A4" orientation="landscape" style={styles.page}>
                        <View style={styles.logo}>
                            <Image
                                src={"images/certification-decor.png"}
                                style={{
                                    transform: "rotate(-45deg)",
                                    width: "300px",
                                    display: "flex",
                                    position: "absolute",
                                    top: 35,
                                    left: -50,
                                }}
                            />
                            <Image
                                src={logo}
                                style={{
                                    width: "100px",
                                    marginTop: "50px",
                                    marginBottom: "20px",
                                    display: "flex",
                                }}
                            />
                            <Image
                                src={"images/certification-decor.png"}
                                style={{
                                    transform: "rotate(45deg)",
                                    width: "300px",
                                    display: "flex",
                                    position: "absolute",
                                    top: 40,
                                    right: -50,
                                }}
                            />
                        </View>

                        <View style={styles.pageContainer}>
                            {/* Subject Container */}
                            <View style={styles.subjectContainer}>
                                <Text style={styles.subjectText}>
                                    CERTIFICATION OF TRAINING COMPLETION
                                </Text>
                            </View>

                            <View style={styles.separator}></View>

                            <View style={styles.subjectContainer}>
                                <Text style={styles.text}>This is to certify that</Text>
                            </View>

                            <View style={styles.subjectContainer}>
                                <Text style={styles.nameText}>{data.fullName}</Text>
                                <View style={styles.subjectBorder}></View>
                            </View>

                            <View style={styles.separator}></View>

                            <View style={styles.subjectContainer}>
                                <Text style={styles.text}>
                                    has completed the {data.title} on {data.completionDate}
                                </Text>
                            </View>

                            <View style={styles.separator}></View>

                            <View style={styles.container}>
                                <Text
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                        paddingLeft: "120px",
                                    }}
                                >
                                    Training details
                                </Text>
                            </View>

                            <View style={styles.twoColumnContainer}>
                                <View style={styles.column}>
                                    <Text style={styles.detailText}>
                                        Training duration: {data.trainingLength}
                                    </Text>
                                    <Text style={styles.detailText}>
                                        Training complexity: {data.trainingComplexity}
                                    </Text>
                                    <Text style={styles.detailText}>
                                        Training Format: {data.trainingFormat}
                                    </Text>
                                </View>
                                {data.associatedQuiz ? (
                                    <View>
                                        <Text style={styles.detailText}>
                                            Average Exam result: {averageScore}
                                        </Text>
                                        <Text style={styles.detailText}>Rank: {rank}</Text>
                                    </View>
                                ) : (
                                    <></>
                                )}
                            </View>

                            <View style={styles.separator}></View>

                            {/* Stamp Container */}
                            <View style={styles.subjectContainer}>
                                {stamp !== "" ? (
                                    <View fixed>
                                        <Image
                                            src={stamp}
                                            style={{
                                                width: 100,
                                                height: 100,
                                                position: "absolute",
                                                bottom: -70,
                                                left: -70,
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <></>
                                )}
                            </View>
                        </View>
                        <Image
                            src={"images/certification-decor.png"}
                            style={{
                                transform: "rotate(-135deg)",
                                width: "300px",
                                display: "flex",
                                position: "absolute",
                                bottom: 35,
                                left: -60,
                            }}
                        />
                        <Image
                            src={"images/certification-decor.png"}
                            style={{
                                transform: "rotate(135deg)",
                                width: "300px",
                                display: "flex",
                                position: "absolute",
                                bottom: 35,
                                right: -55,
                            }}
                        />
                    </Page>
                </Document>
            </>
        );
    } else {
        return <></>;
    }
}
