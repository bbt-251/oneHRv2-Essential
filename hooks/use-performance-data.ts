import {
    performanceEvaluationCollection,
    objectiveCollection,
    competenceValueCollection,
    competenceAssessmentCollection,
    weightDefinitionCollection,
    evaluationMetricsCollection,
} from "@/lib/backend/firebase/collections";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { CompetenceValueModel, CompetenceAssessmentModel } from "@/lib/models/competenceAssessment";
import { ObjectiveWeightModel } from "@/lib/models/objective-weight";
import { EvaluationMetricModel } from "@/lib/models/evaluation-metric";
import { useFirestoreGroup, CollectionConfig } from "./use-firestore-group";

export interface PerformanceDataState {
    performanceEvaluations: PerformanceEvaluationModel[];
    objectives: ObjectiveModel[];
    competenceValues: CompetenceValueModel[];
    competenceAssessments: CompetenceAssessmentModel[];
    objectiveWeights: ObjectiveWeightModel[];
    evaluationMetrics: EvaluationMetricModel[];
}

export function usePerformanceData() {
    const collections: Record<keyof PerformanceDataState, CollectionConfig<any>> = {
        performanceEvaluations: {
            collectionRef: performanceEvaluationCollection,
            key: "performanceEvaluations",
        },
        objectives: {
            collectionRef: objectiveCollection,
            key: "objectives",
        },
        competenceValues: {
            collectionRef: competenceValueCollection,
            key: "competenceValues",
        },
        competenceAssessments: {
            collectionRef: competenceAssessmentCollection,
            key: "competenceAssessments",
        },
        objectiveWeights: {
            collectionRef: weightDefinitionCollection,
            key: "objectiveWeights",
        },
        evaluationMetrics: {
            collectionRef: evaluationMetricsCollection,
            key: "evaluationMetrics",
        },
    };

    const groupState = useFirestoreGroup(collections, "performance-data");

    return {
        performanceEvaluations: groupState.performanceEvaluations?.data || [],
        objectives: groupState.objectives?.data || [],
        competenceValues: groupState.competenceValues?.data || [],
        competenceAssessments: groupState.competenceAssessments?.data || [],
        objectiveWeights: groupState.objectiveWeights?.data || [],
        evaluationMetrics: groupState.evaluationMetrics?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
