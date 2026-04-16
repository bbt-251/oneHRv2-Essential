import { promotionInstanceCollection } from "@/lib/backend/firebase/collections";

import { PromotionInstanceModel } from "@/lib/models/promotion-instance";
import { CollectionConfig, useFirestoreGroup } from "./use-firestore-group";

export interface PromotionDataState {
    promotionInstances: PromotionInstanceModel[];
}

export function usePromotionData() {
    const collections: Record<keyof PromotionDataState, CollectionConfig<any>> = {
        promotionInstances: {
            collectionRef: promotionInstanceCollection,
            key: "promotionInstances",
        },
    };

    const groupState = useFirestoreGroup(collections, "promotion-data");

    return {
        promotionInstances: groupState.promotionInstances?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
