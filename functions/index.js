const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function that triggers when a ticket document is updated.
 * It checks if a technician has been newly assigned and, if so,
 * sends a push notification to that technician.
 */
exports.sendNewJobNotification = functions.firestore
  .document("tickets/{ticketId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const ticketId = context.params.ticketId;

    // Check if a technician was just assigned to a pending ticket
    if (
      newData.technicianId &&
      newData.status === "Pending" &&
      oldData.technicianId !== newData.technicianId
    ) {
      const technicianId = newData.technicianId;
      console.log(
        `Technician ${technicianId} was newly assigned to ticket ${ticketId}. Sending notification.`
      );

      // Get the technician's unique notification tokens from the subcollection
      const tokensSnapshot = await admin
        .firestore()
        .collection(`users/${technicianId}/fcmTokens`)
        .get();

      if (tokensSnapshot.empty) {
        console.log("No notification tokens found for this technician.");
        return null;
      }

      // Extract the token strings from the documents
      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      // Construct the notification message payload
      const payload = {
        notification: {
          title: "New Job Assigned!",
          body: `You have a new job: ${
            newData.deviceInfo
          } - ${newData.issueDescription.substring(0, 50)}...`,
          sound: "default", // Plays the default notification sound on the device
          // To use a custom sound, you would add its path here and in the service worker
        },
        data: {
            // You can send extra data here, like the URL to open
            click_action: `/dashboard/technician/job/${ticketId}`
        }
      };

      // Send the notification to all of the technician's registered devices
      try {
        const response = await admin.messaging().sendToDevice(tokens, payload);
        console.log("Successfully sent message:", response);

        // Optional: Clean up tokens that are no longer valid
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error(
              "Failure sending notification to",
              tokens[index],
              error
            );
            // If a token is no longer registered, delete it from the database
            if (
              error.code === "messaging/registration-token-not-registered"
            ) {
              tokensSnapshot.docs[index].ref.delete();
            }
          }
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
    return null;
  });

