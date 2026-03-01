import os
import asyncio
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# High-velocity LPU inference constraint
groq_llm = ChatGroq(
    temperature=0, 
    model_name="llama3-8b-8192", 
    api_key=os.getenv("GROQ_API_KEY")
)

summary_prompt = PromptTemplate.from_template(
    "You are a principal engineer. In exactly 1 sentence, summarize the absolute purpose of this file based on its AST headers and imports. Skip filler words.\n\n{file_content}\n\nSummary:"
)

chain = summary_prompt | groq_llm | StrOutputParser()

async def summarize_file_async(file_path: str, file_content: str):
    """ Isolated Map routine: extremely low-latency non-blocking call """
    summary = await chain.ainvoke({"file_content": file_content})
    return {"file_id": file_path, "summary": summary}

async def generate_summaries_map_reduce(file_data: list[dict]):
    """ 
    Parallel map-reduce over the raw file buffers
    file_data structure: [{'path': 'src/auth.py', 'content': 'AST string...'}]
    """
    tasks = [summarize_file_async(f['path'], f['content']) for f in file_data]
    results = await asyncio.gather(*tasks)
    return results
