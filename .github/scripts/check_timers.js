const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error("Missing Firebase configuration (VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID).");
  process.exit(1);
}

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fetchActiveTimers() {
  const query = {
    structuredQuery: {
      from: [{ collectionId: "active_timers" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "running" }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: "endTime" },
                op: "LESS_THAN_OR_EQUAL",
                value: { integerValue: Date.now().toString() }
              }
            }
          ]
        }
      }
    }
  };

  const response = await fetch(`${FIRESTORE_BASE_URL}:runQuery?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch timers: ${await response.text()}`);
  }

  const results = await response.json();
  return results.filter(r => r.document).map(r => r.document);
}

async function updateTimerStatus(docName, status) {
  const url = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=status&key=${API_KEY}`;
  
  const payload = {
    fields: {
      status: { stringValue: status }
    }
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to update timer ${docName}: ${await response.text()}`);
  }
}

async function sendNtfyNotification() {
  const response = await fetch("https://ntfy.sh/gurpreet-vault-timer-2024", {
    method: "POST",
    headers: {
      "Title": "⏰ Time's Up!"
    },
    body: "Your focus session is complete"
  });

  if (!response.ok) {
    throw new Error(`Failed to send ntfy notification: ${await response.text()}`);
  }
}

async function main() {
  try {
    const timers = await fetchActiveTimers();
    if (timers.length === 0) {
      console.log("No active timers ready to trigger.");
      return;
    }

    console.log(`Found ${timers.length} timer(s) to trigger.`);

    for (const timer of timers) {
      await sendNtfyNotification();
      await updateTimerStatus(timer.name, "done");
      console.log(`Triggered and updated timer: ${timer.name}`);
    }
  } catch (error) {
    console.error("Error checking timers:", error);
    process.exit(1);
  }
}

main();
