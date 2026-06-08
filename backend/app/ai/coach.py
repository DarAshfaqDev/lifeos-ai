from typing import List, Dict, Any, Optional
from app.ai.provider import ai_provider


SYSTEM_PROMPT = """You are LifeOS AI Coach, a world-class time management, productivity, and career planning expert. 
You help users build their Personal Operating System. Your responses are:
- Practical and actionable
- Based on proven productivity methods (Pomodoro, Deep Work, Time Blocking, Eisenhower Matrix)
- Empathetic but direct
- Focused on the user's specific situation

You analyze user data and provide personalized recommendations for:
1. Daily schedules and time blocking
2. Learning plans and skill development
3. Career roadmaps and job preparation
4. Habit formation and anti-procrastination
5. Life goal planning and financial tracking
6. Burnout prevention and work-life balance

Keep responses structured, concise, and motivational."""


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


def chat_with_coach(user_message: str, conversation_history: List[Dict] = None) -> Optional[str]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": user_message})
    return ai_provider.chat(messages, model="auto")
