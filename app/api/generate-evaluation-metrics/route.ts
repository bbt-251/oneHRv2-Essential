import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { evaluationName, numberOfMetrics, complexityLevel } = await request.json();

        const numMetrics = numberOfMetrics || 4;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Generate evaluation metrics for "${evaluationName}" with complexity level ${complexityLevel} (on a 1-5 scale). Create exactly ${numMetrics} metrics. Each metric should have a relevant name for evaluating ${evaluationName}, a threshold between 1-5, and weights that sum exactly to 100%. Also suggest an appropriate passing score (70-90 range).

Return ONLY a JSON object with this structure:
{
  "passingScore": 75,
  "metrics": [
    {
      "name": "Metric Name",
      "threshold": 3,
      "weight": 25
    }
  ]
}

Ensure:
- Thresholds are integers 1-5
- Weights are integers that sum to exactly 100%
- Metric names are relevant to evaluating ${evaluationName}
- No other text or formatting outside the JSON.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const result = response.choices[0].message.content;

        // Try to parse as JSON
        let evaluationData;
        try {
            evaluationData = result ? JSON.parse(result) : null;
            // Ensure we have the correct structure
            if (
                !evaluationData ||
                typeof evaluationData.passingScore !== "number" ||
                !Array.isArray(evaluationData.metrics)
            ) {
                throw new Error("Invalid structure");
            }

            // Validate metrics structure
            evaluationData.metrics = evaluationData.metrics.filter(
                (metric: any) =>
                    metric &&
                    typeof metric.name === "string" &&
                    typeof metric.threshold === "number" &&
                    typeof metric.weight === "number" &&
                    metric.threshold >= 1 &&
                    metric.threshold <= 5 &&
                    metric.weight >= 0 &&
                    metric.weight <= 100,
            );

            // Ensure we have the right number of metrics
            evaluationData.metrics = evaluationData.metrics.slice(0, numMetrics);

            // Ensure weights sum to 100%
            const totalWeight = evaluationData.metrics.reduce(
                (sum: number, m: any) => sum + (m.weight || 0),
                0,
            );
            if (totalWeight !== 100) {
                // Auto-adjust weights to sum to 100%
                const adjustmentFactor = 100 / totalWeight;
                evaluationData.metrics = evaluationData.metrics.map((metric: any) => ({
                    ...metric,
                    weight: Math.round(metric.weight * adjustmentFactor),
                }));
                // Fix any rounding issues
                const newTotal = evaluationData.metrics.reduce(
                    (sum: number, m: any) => sum + m.weight,
                    0,
                );
                if (newTotal !== 100) {
                    evaluationData.metrics[0].weight += 100 - newTotal;
                }
            }
        } catch {
            return NextResponse.json(
                { error: "Failed to generate valid evaluation metrics" },
                { status: 500 },
            );
        }

        return NextResponse.json(evaluationData);
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
