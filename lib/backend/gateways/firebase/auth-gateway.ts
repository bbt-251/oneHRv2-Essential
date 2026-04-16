import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/backend/firebase/init";
import { AuthGateway } from "@/lib/backend/gateways/types";

export const createFirebaseAuthGateway = (): AuthGateway => ({
    onAuthStateChanged: callback =>
        onAuthStateChanged(auth, user => {
            callback(
                user
                    ? {
                        uid: user.uid,
                        email: user.email,
                    }
                    : null,
            );
        }),
    signOut: () => signOut(auth),
});
