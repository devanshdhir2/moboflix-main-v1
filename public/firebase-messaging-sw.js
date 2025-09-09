// This script runs in the background to receive notifications when the app is closed.

// Must use older import syntax for service workers
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKWY1fRc8dQ30Gdr2Dd5W7pwlSKeDtwM4",
  authDomain: "mobofix-app.firebaseapp.com",
  projectId: "mobofix-app",
  storageBucket: "mobofix-app.firebasestorage.app",
  messagingSenderId: "369946427303",
  appId: "1:369946427303:web:5c711390016aeb6a9cc082",
  measurementId: "G-KF2QFT1B8B"
};

// IMPORTANT: You MUST replace the placeholder values above with your actual
// Firebase config values from your .env.local file.
// The service worker cannot access environment variables.

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/android-chrome-192x192.png', // Or your app icon
        sound: '/notification.mp3' // Path to your sound file in the /public folder
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
