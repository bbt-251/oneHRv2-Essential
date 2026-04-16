import {
    trainingMaterialCollection,
    trainingPathCollection,
    TrainingMaterialCertificationCollection,
    multipleChoiceCollection,
    shortAnswerCollection,
    quizCollection,
    commonAnswerCollection,
} from "@/lib/backend/firebase/collections";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { TrainingPathModel } from "@/lib/models/training-path";
import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import ShortAnswerModel from "@/lib/models/short-answer";
import { QuizModel } from "@/lib/models/quiz.ts";
import { useFirestoreGroup, CollectionConfig } from "./use-firestore-group";
import { CommonAnswerModel } from "@/lib/models/commonAnswer";

export interface TrainingDataState {
    trainingMaterials: TrainingMaterialModel[];
    trainingPaths: TrainingPathModel[];
    trainingCertificates: TrainingCertificationModel[];
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    commonAnswers: CommonAnswerModel[];
    quizzes: QuizModel[];
}

export function useTrainingData() {
    const collections: Record<keyof TrainingDataState, CollectionConfig<any>> = {
        trainingMaterials: {
            collectionRef: trainingMaterialCollection,
            key: "trainingMaterials",
        },
        trainingPaths: {
            collectionRef: trainingPathCollection,
            key: "trainingPaths",
        },
        trainingCertificates: {
            collectionRef: TrainingMaterialCertificationCollection,
            key: "trainingCertificates",
        },
        multipleChoices: {
            collectionRef: multipleChoiceCollection,
            key: "multipleChoices",
        },
        shortAnswers: {
            collectionRef: shortAnswerCollection,
            key: "shortAnswers",
        },
        commonAnswers: {
            collectionRef: commonAnswerCollection,
            key: "commonAnswers",
        },
        quizzes: {
            collectionRef: quizCollection,
            key: "quizzes",
        },
    };

    const groupState = useFirestoreGroup(collections, "training-data");

    return {
        trainingMaterials: groupState.trainingMaterials?.data || [],
        trainingPaths: groupState.trainingPaths?.data || [],
        trainingCertificates: groupState.trainingCertificates?.data || [],
        multipleChoices: groupState.multipleChoices?.data || [],
        shortAnswers: groupState.shortAnswers?.data || [],
        commonAnswers: groupState.commonAnswers?.data || [],

        quizzes: groupState.quizzes?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
