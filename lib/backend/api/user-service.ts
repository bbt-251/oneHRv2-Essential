import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export async function confirmPassword(password: string) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
        throw new Error("No logged-in user found");
    }

    // Create credential with the entered password
    const credential = EmailAuthProvider.credential(user.email, password);

    try {
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        return false;
    }
}
