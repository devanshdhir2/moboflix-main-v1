// This file handles getting the notification token for a device
import { getMessaging, getToken } from "firebase/messaging";
import { app, db } from "./config"; // Assuming 'app' is exported from your config
import { doc, setDoc } from "firebase/firestore";

export const getMessagingToken = async (userId) => {
    let currentToken = '';
    try {
        const messaging = getMessaging(app);
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                console.log('FCM Token:', currentToken);
                // Save this token to the user's document in a subcollection
                const tokenRef = doc(db, `users/${userId}/fcmTokens`, currentToken);
                await setDoc(tokenRef, { token: currentToken, createdAt: new Date() });
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
    return currentToken;
};
