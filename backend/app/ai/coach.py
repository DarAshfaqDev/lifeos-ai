from typing import List, Dict, Any, Optional
from app.ai.provider import ai_provider


SYSTEM_PROMPT = """You are LifeOS AI Coach, a practical personal execution coach.

Your job is NOT to entertain or produce essays. Your job is to help the user do meaningful work.

Rules:
- Be concise. Under ~200 words unless the user asks for detail.
- Always end with ONE clear next action the user can do right now.
- When asked "what should I do today", return a short prioritized list (max 3 items) with time estimates, then ONE "start here" recommendation.
- If a plan sounds too ambitious (many tasks, huge hours, many habits at once), say so plainly and suggest a smaller realistic plan.
- Never use shame or guilt. If the user missed a day, help them recover: smaller task, realistic reschedule, or remove it.
- Convert vague goals into concrete micro-actions. "Study Python" → "Open your notes and complete one exercise."
- Use the user's real data when given. If you don't have enough data, say so instead of guessing."""



def generate_roadmap(user_data: Dict[str, Any]) -> Optional[str]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"""Create a personalized roadmap for this user:
- Age: {user_data.get('age', 'N/A')}
- Education: {user_data.get('education', 'N/A')}
- Occupation: {user_data.get('occupation', 'N/A')}
- Career Goal: {user_data.get('career_goal', 'N/A')}
- Skills Learning: {', '.join(user_data.get('skills_learning', []))}
- Daily Study Hours: {user_data.get('daily_study_hours', 'N/A')}
- Sleep Schedule: {user_data.get('sleep_schedule', 'N/A')}
- Biggest Distractions: {', '.join(user_data.get('biggest_distractions', []))}
- Life Goals: {', '.join(user_data.get('life_goals', []))}

Provide:
1. A 3-month roadmap with weekly milestones
2. Daily schedule optimized for their energy and commitments
3. Learning plan prioritized by career goal
4. Anti-procrastination strategy for their specific distractions
5. Top 3 priorities they should focus on right now"""}
    ]
    return ai_provider.chat(messages, model="auto")


def analyze_productivity(tasks_data: List[Dict], habits_data: List[Dict]) -> Optional[str]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"""Analyze this user's productivity data and provide recommendations:

Tasks: {tasks_data}
Habits: {habits_data}

Provide:
1. Productivity score and trend analysis
2. Top 3 time leaks identified
3. Specific recommendations to improve
4. Warning signs of burnout (if any)"""}
    ]
    return ai_provider.chat(messages, model="auto")


def generate_interview_questions(role: str, skills: List[str], question_type: str = "technical") -> Optional[str]:
    messages = [
        {"role": "system", "content": "You are an expert interview coach. Generate realistic interview questions with model answers."},
        {"role": "user", "content": f"""Generate {question_type} interview questions for a {role} position.
Required skills: {', '.join(skills)}

For each question provide:
1. The question
2. What the interviewer is looking for
3. A model answer (2-3 sentences)
4. Common mistakes to avoid

Generate 5 questions."""},
    ]
    return ai_provider.chat(messages, model="auto")


def chat_with_coach(user_message: str, conversation_history: List[Dict] = None, user_context: Dict[str, Any] = None) -> Optional[str]:
    system = SYSTEM_PROMPT
    if user_context:
        context_lines = ["Here is the user's current context:"]
        if user_context.get("name"):
            context_lines.append(f"- Name: {user_context['name']}")
        if user_context.get("career_goal"):
            context_lines.append(f"- Career goal: {user_context['career_goal']}")
        if user_context.get("today_tasks"):
            context_lines.append(f"- Today's tasks: {', '.join(user_context['today_tasks'])}")
        if user_context.get("top_goal"):
            context_lines.append(f"- Top goal: {user_context['top_goal']}")
        if user_context.get("focus_score") is not None:
            context_lines.append(f"- Today's focus score: {user_context['focus_score']}/100")
        if user_context.get("postponed_count") is not None and user_context["postponed_count"] > 0:
            context_lines.append(f"- Unfinished tasks from previous days: {user_context['postponed_count']}")
        if user_context.get("recent_completed"):
            context_lines.append(f"- Recently completed: {', '.join(user_context['recent_completed'][-5:])}")
        system = SYSTEM_PROMPT + "\n\n" + "\n".join(context_lines)

    messages = [{"role": "system", "content": system}]
    if conversation_history:
        messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": user_message})
    return ai_provider.chat(messages, model="auto")


def breakdown_task(task_title: str, description: str = "") -> Optional[str]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"""Break this task into small, independently actionable steps.

Task: {task_title}
{('Details: ' + description) if description else ''}

Return a numbered list of 3-8 concrete micro-actions. Each step must be something the user can do in one sitting without help. Keep each step to under 12 words. No extra commentary, no preamble."""},
    ]
    return ai_provider.chat(messages, model="auto")


def im_stuck(task_title: str, blocker: str = "") -> Optional[str]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"""The user is stuck on this task: "{task_title}".
{('They say: ' + blocker) if blocker else ''}

Decide what they need: an explanation, a smaller step, an example, a resource, a schedule adjustment, or motivation.
Then give them exactly ONE practical next step they can take in the next 5 minutes. Keep it under 120 words."""},
    ]
    return ai_provider.chat(messages, model="auto")
