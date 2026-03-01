import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI

class GroqSummarizer:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY not found in environment.")
        
        # Use Gemini 1.5 Flash instead of Groq due to rate limits
        self.llm = ChatGoogleGenerativeAI(
            temperature=0, 
            google_api_key=api_key, 
            model="gemini-2.5-flash"
        )

    async def batch_summarize(self, files: list) -> dict:
        """
        Batches all files into a single Gemini prompt to avoid the 15 RPM free tier limit.
        `files` is a list of tuples: (filename, code_snippet)
        Returns a dict: {filename: "summary"}
        """
        if not os.getenv("GOOGLE_API_KEY") or not files:
            return {}

        # Build a single prompt for all files
        code_blocks = ""
        for (filename, code_snippet) in files:
            # Truncate each to save context window, 500 chars is enough for top-level summary
            code_blocks += f"--- {filename} ---\n{code_snippet[:500]}\n\n"
            
        prompt = (
            "You are an AI architect. I have provided multiple code files below.\n"
            "For EACH file, write exactly ONE concise sentence explaining what it does, why it is used, and for what reason. "
            "Write it for a non-technical audience without technical jargon.\n"
            "Return the output STRICTLY as a JSON dictionary where keys are filenames and values are the ONE sentence summary. "
            "Do NOT include ```json markdown, just return the raw JSON object.\n\n"
            f"Files:\n{code_blocks}"
        )
        
        try:
            response = await self.llm.ainvoke(prompt)
            # Clean formatting if present
            raw_text = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(raw_text)
        except Exception as e:
            print(f"Batch summarization error: {e}")
            fallback = {}
            for filename, _ in files:
                fallback[filename] = "Google API Free Tier Quota Exceeded. Please wait 60 seconds and re-ingest to generate AI narratives."
            return fallback
