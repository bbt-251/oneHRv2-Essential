import {
    hiringNeedCollection,
    matchingProfileCollection,
    customCriteriaCollection,
    screeningQuestionCollection,
    jobPostCollection,
    jobApplicationCollection,
    applicantCollection,
    talentPoolCollection,
    subPoolCollection,
} from "@/lib/backend/firebase/collections";
import { HiringNeedModel } from "@/lib/models/hiring-need";
import MatchingProfileModel from "@/lib/models/matching-profile";
import CustomCriteriaModel from "@/lib/models/custom-criteria";
import ScreeningQuestionModel from "@/lib/models/screening-questions";
import { JobPostModel } from "@/lib/models/job-post";
import { JobApplicationModel } from "@/lib/models/job-application";
import ApplicantModel from "@/lib/models/applicant";
import { useFirestoreGroup, CollectionConfig } from "./use-firestore-group";
import { TalentPoolModel } from "@/lib/models/talentPool";
import { SubPoolModel } from "@/lib/models/subPool";

export interface TalentAcquisitionState {
    hiringNeeds: HiringNeedModel[];
    matchingProfiles: MatchingProfileModel[];
    customCriteria: CustomCriteriaModel[];
    screeningQuestions: ScreeningQuestionModel[];
    jobPosts: JobPostModel[];
    jobApplications: JobApplicationModel[];
    applicants: ApplicantModel[];
    talentPools: TalentPoolModel[];
    subPools: SubPoolModel[];
}

export function useTalentAcquisition() {
    const collections: Record<keyof TalentAcquisitionState, CollectionConfig<any>> = {
        hiringNeeds: {
            collectionRef: hiringNeedCollection,
            key: "hiringNeeds",
        },
        matchingProfiles: {
            collectionRef: matchingProfileCollection,
            key: "matchingProfiles",
        },
        customCriteria: {
            collectionRef: customCriteriaCollection,
            key: "customCriteria",
        },
        screeningQuestions: {
            collectionRef: screeningQuestionCollection,
            key: "screeningQuestions",
        },
        jobPosts: {
            collectionRef: jobPostCollection,
            key: "jobPosts",
        },
        jobApplications: {
            collectionRef: jobApplicationCollection,
            key: "jobApplications",
        },
        applicants: {
            collectionRef: applicantCollection,
            key: "applicants",
        },
        talentPools: {
            collectionRef: talentPoolCollection,
            key: "talentPools",
        },
        subPools: {
            collectionRef: subPoolCollection,
            key: "subPools",
        },
    };

    const groupState = useFirestoreGroup(collections, "talent-acquisition");

    return {
        hiringNeeds: groupState.hiringNeeds?.data || [],
        matchingProfiles: groupState.matchingProfiles?.data || [],
        customCriteria: groupState.customCriteria?.data || [],
        screeningQuestions: groupState.screeningQuestions?.data || [],
        jobPosts: groupState.jobPosts?.data || [],
        jobApplications: groupState.jobApplications?.data || [],
        applicants: groupState.applicants?.data || [],
        talentPools: groupState.talentPools?.data || [],
        subPools: groupState.subPools?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
