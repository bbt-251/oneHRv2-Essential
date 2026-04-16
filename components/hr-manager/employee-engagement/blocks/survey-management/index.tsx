import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { QuestionsModel } from "./surveyReport";

type GetResponsePercentage = (choiceID: string) => number;

const PollResultPieChart = ({
    question,
    questionType,
    getResponsePercentage,
}: {
    question: QuestionsModel;
    questionType: "Multiple Choice" | "Common Answer";
    getResponsePercentage: GetResponsePercentage;
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [options, setOptions] = useState<any>({});
    const [ky, setKy] = useState<number>(0);

    useEffect(() => {
        const data: Array<{ name: string; value: number }> = [];
        const choices = question.choices;
        choices.forEach((choice, index) => {
            data.push({
                name: choice,
                value: getResponsePercentage(choices[index]),
            });
        });

        const newOptions = {
            tooltip: {
                trigger: "item",
            },
            legend: {
                orient: "vertical",
                left: "left",
            },
            series: [
                {
                    name: "Response",
                    type: "pie",
                    radius: "50%",
                    data: data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: "rgba(0, 0, 0, 0.5)",
                        },
                    },
                },
            ],
        };

        setOptions(newOptions);
        setKy(ky + 1);
        setLoading(false);
    }, [question, questionType, getResponsePercentage]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ width: "100%", height: "400px" }}>
            <ReactECharts style={{ width: "100%", height: "100%" }} key={ky} option={options} />
        </div>
    );
};

export default PollResultPieChart;
