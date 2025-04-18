import os
import json
import openai


class ReportGenerator:
    """Generates bug reports by invoking an LLM."""

    def __init__(self, model='gpt-3.5-turbo'):
        if 'OPENAI_API_KEY' not in os.environ:
            raise EnvironmentError("OPENAI_API_KEY environment variable is not set")
        self.model = model

    def generate_report(self, feedback, snippets):
        # Prepare code context
        snippet_texts = []
        for s in snippets:
            snippet_texts.append(
                f"File: {s.file}\nLines {s.start_line}-{s.end_line}:\n{s.snippet}"
            )
        context = "\n\n".join(snippet_texts)
        system_prompt = (
            "You are a bug report assistant. "
            "Given user feedback and relevant code snippets, "
            "produce a JSON report following the given schema, "
            "then render a Markdown report."
        )
        user_prompt = (
            f"User feedback:\n{feedback}\n\n"
            f"Relevant code snippets:\n{context}\n\n"
            "Please output the JSON object first, then the Markdown."
        )
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        json_str = content[start:end]
        report_json = json.loads(json_str)
        # Markdown is remaining
        report_md = content[end:].strip()
        return report_json, report_md