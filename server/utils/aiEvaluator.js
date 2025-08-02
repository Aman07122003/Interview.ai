import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const evaluateAnswerWithAI = async(question, answer) => {
  try {
    const prompt = `
You are an interview evaluator. Rate the following answer to the interview question on a scale of 1 to 5, where 5 is excellent and 1 is poor. Provide a short feedback summary as well.

Question: "${question}"
Answer: "${answer}"

Respond in JSON with the following format:
{
  "score": number (1-10),
  "feedback": string
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        {
          role: "system",
          content: "You are a strict and fair interview evaluator.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content;

    // Parse the returned string as JSON
    const { score, feedback } = JSON.parse(aiMessage);

    return { score, feedback };
  } catch (error) {
    console.error("AI Evaluation Error:", error.message);
    return {
      score: 3,
      feedback: "AI evaluation failed. Default score applied.",
    };
  }
};

// utils/aiEvaluator.js
export const generateFinalReportWithAI = async (questions) => {
    if (!questions || questions.length === 0) {
      throw new Error("No questions provided for report generation.");
    }
  
    // Format the questions, answers, scores, and feedback into a readable structure
    const formattedQA = questions
      .map((q, index) => {
        return `Q${index + 1}: ${q.questionText}\nA${index + 1}: ${q.answerText}\nScore: ${q.score}/5\nFeedback: ${q.aiFeedback}`;
      })
      .join("\n\n");
  
    const prompt = `
  You are an AI interview evaluator. Based on the following Q&A, including scores and feedback, generate a detailed performance summary.
  
  ${formattedQA}
  
  Instructions:
  - Summarize the candidate’s overall performance.
  - Highlight strengths and weaknesses.
  - Provide at least two actionable suggestions for improvement.
  - Keep it professional and concise.
    `;
  
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [
          {
            role: "system",
            content: "You are an experienced HR interview analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });
  
      return response.choices?.[0]?.message?.content?.trim() || "No response generated.";
    } catch (error) {
      console.error("Error generating AI report:", error.message);
      throw new Error("Failed to generate AI report. Please try again.");
    }
  };


