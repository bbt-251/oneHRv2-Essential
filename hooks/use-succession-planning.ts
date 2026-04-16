import { successionPlanningCollection } from "@/lib/backend/firebase/collections";
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { CollectionConfig, FirestoreGroupState, useFirestoreGroup } from "./use-firestore-group";

export interface SuccessionPlanningState {
    successionPlans: SuccessionPlanningModel[];
    loading: boolean;
    error: string | null;
}

export function useSuccessionPlanning(): SuccessionPlanningState {
    const collections: Record<string, CollectionConfig<SuccessionPlanningModel>> = {
        successionPlans: {
            collectionRef: successionPlanningCollection,
            key: "successionPlans",
        },
    };

    const groupState = useFirestoreGroup<SuccessionPlanningModel>(
        collections,
        "succession-planning",
    );

    const state: FirestoreGroupState<SuccessionPlanningModel> = groupState.successionPlans || {
        data: [],
        loading: false,
        error: null,
    };

    return {
        successionPlans: state.data,
        loading: state.loading,
        error: state.error,
    };
}
