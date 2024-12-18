import { createClient } from "redis";
const client = createClient();

async function processSubmission(submission: string) {
  const { problemId, code, language, userId } = JSON.parse(submission);

  console.log(
    `Processing submission for problemId ${problemId} for user with userId ${userId}`
  );
  console.log(`Code: ${code}`);
  console.log(`Language: ${language}`);
  // Here you would add your actual processing logic

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Finished processing submission for problemId ${problemId}.`);

  // For pub-sub:

  if (problemId === 1) {
    client.publish(
      "problem_done_1",
      JSON.stringify({ problemId, status: "TLE" })
    );
  } else {
    client.publish(
      "problem_done_2",
      JSON.stringify({ problemId, status: "Success" })
    );
  }
}

async function startWorker() {
  try {
    await client.connect();
    console.log("Worker connected to Redis.");

    // Main loop
    while (true) {
      try {
        const submission = await client.brPop("submisions", 0);
        // @ts-ignore
        await processSubmission(submission.element);
      } catch (error) {
        console.error("Error processing submission:", error);
        // Implement your error handling logic here. For example, you might want to push
        // the submission back onto the queue or log the error to a file.
      }
    }
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}

startWorker();
