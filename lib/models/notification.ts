/* eslint-disable semi */
export default interface InAppNotificationModel {
    id: string | null;
    timestamp: string;
    uid: string;
    title: string;
    message: string;
    action: string | null; // redirection route when a notification is clicked
    isRead: boolean;
}
