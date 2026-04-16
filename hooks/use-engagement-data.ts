import {
    surveyCollection,
    issueCollection,
    employeeInfoChangeRequestCollection,
} from "@/lib/backend/firebase/collections";

import { SurveyModel } from "@/lib/models/survey";
import { IssueModel } from "@/lib/models/Issue";
import { CollectionConfig, useFirestoreGroup } from "./use-firestore-group";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";

export interface EngagementDataState {
    surveys: SurveyModel[];
    issues: IssueModel[];
    changeRequests: EmployeeInfoChangeRequestModel[];
}

export function useEngagementData() {
    const collections: Record<keyof EngagementDataState, CollectionConfig<any>> = {
        surveys: {
            collectionRef: surveyCollection,
            key: "surveys",
        },
        issues: {
            collectionRef: issueCollection,
            key: "issues",
        },
        changeRequests: {
            collectionRef: employeeInfoChangeRequestCollection,
            key: "changeRequests",
        },
    };

    const groupState = useFirestoreGroup(collections, "engagement-data");

    return {
        surveys: groupState.surveys?.data || [],
        issues: groupState.issues?.data || [],
        changeRequests: groupState.changeRequests?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
