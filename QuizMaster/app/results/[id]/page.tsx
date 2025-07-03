"use client"

import { useState, useEffect } from "react"
import { aiService } from '@/lib/services/aiService'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Clock, CheckCircle, XCircle, ArrowLeft, MessageCircle, Send } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface Quiz {
  id: string
  title: string
  description: string
  tags: string[]
  questions: Question[]
}

interface UserAttempt {
  id: string
  quizId: string
  score: number
  totalQuestions: number
  completedAt: string
  timeElapsed: number
  answers: { [key: string]: number }
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function ResultsPage() {
  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<UserAttempt | null>(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  useEffect(() => {
    const userData = localStorage.getItem("currentUser")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    loadQuizAndAttempt(parsedUser.id)
  }, [router, quizId])

  const loadQuizAndAttempt = (userId: string) => {
    // Load quiz
    const savedQuizzes = localStorage.getItem("quizzes")
    if (savedQuizzes) {
      const quizzes = JSON.parse(savedQuizzes)
      const foundQuiz = quizzes.find((q: Quiz) => q.id === quizId)
      if (foundQuiz) {
        setQuiz(foundQuiz)
      }
    }

    // Load user attempt
    const attempts = localStorage.getItem(`attempts_${userId}`)
    if (attempts) {
      const userAttempts = JSON.parse(attempts)
      const foundAttempt = userAttempts.find((a: UserAttempt) => a.quizId === quizId)
      if (foundAttempt) {
        // Ensure the attempt has a proper ID
        if (!foundAttempt.id) {
          foundAttempt.id = `${quizId}_${Date.now()}`
        }
        setAttempt(foundAttempt)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !quiz || !attempt || isStreaming) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsStreaming(true)

    try {
      // First try to use the backend AI service
      let response
      try {
        // Prepare a rich context for the AI
        const contextPrompt = `User Score: ${attempt.score}/${attempt.totalQuestions}\n` +
                             `Quiz Title: ${quiz.title}\n` +
                             `Time Taken: ${formatTime(attempt.timeElapsed)}\n\n` +
                             `User Question: ${userMessage}`
        
        // Call the backend AI service
        response = await aiService.chatbotAsk({
          prompt: contextPrompt,
          attemptId: attempt.id
        })
      } catch (aiError) {
        console.error("Backend AI service error:", aiError)
        // Fall back to local response if backend fails
        response = await generateLocalAIResponse(userMessage, quiz, attempt)
      }
      
      setChatMessages((prev) => [...prev, { role: "assistant", content: response }])

    } catch (error) {
      console.error("Error sending chat message:", error)
      setChatMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting to the AI service right now. However, I can see from your quiz results that you scored " + 
                Math.round((attempt.score / attempt.totalQuestions) * 100) + "%. Feel free to review the question explanations above!" 
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  // Local AI response generator as fallback
  const generateLocalAIResponse = async (userMessage: string, quiz: Quiz, attempt: UserAttempt): Promise<string> => {
    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
    const incorrectQuestions = quiz.questions.filter(q => attempt.answers[q.id] !== q.correctAnswer)
    
    const message = userMessage.toLowerCase()
    
    // Simple keyword-based responses
    if (message.includes('score') || message.includes('result')) {
      return `You scored ${attempt.score} out of ${attempt.totalQuestions} questions correctly (${percentage}%). ${
        percentage >= 80 ? 'Excellent work!' : 
        percentage >= 60 ? 'Good job! With a bit more practice, you can improve further.' : 
        'Keep practicing! Focus on the areas where you had difficulty.'
      }`
    }
    
    if (message.includes('wrong') || message.includes('incorrect') || message.includes('missed')) {
      if (incorrectQuestions.length === 0) {
        return "Great job! You answered all questions correctly!"
      }
      return `You missed ${incorrectQuestions.length} question${incorrectQuestions.length > 1 ? 's' : ''}. The incorrect questions were about: ${
        incorrectQuestions.map((q, i) => `Question ${quiz.questions.indexOf(q) + 1}: "${q.question}"`).join(', ')
      }`
    }
    
    if (message.includes('time')) {
      return `You completed the quiz in ${formatTime(attempt.timeElapsed)}. ${
        attempt.timeElapsed < 60 ? 'That was quite fast!' : 
        attempt.timeElapsed < 300 ? 'Good pacing!' : 
        'Take your time to read questions carefully.'
      }`
    }
    
    if (message.includes('improve') || message.includes('better')) {
      const tips = [
        "Review the questions you got wrong and understand why the correct answer is right.",
        "Take your time reading each question carefully.",
        "If you're unsure, eliminate obviously wrong answers first.",
        "Practice similar quizzes to reinforce your knowledge."
      ]
      return `Here are some tips to improve: ${tips.join(' ')}`
    }
    
    // Check if asking about a specific question number
    const questionMatch = message.match(/question (\d+)/i)
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1]) - 1
      if (questionNum >= 0 && questionNum < quiz.questions.length) {
        const question = quiz.questions[questionNum]
        const userAnswer = attempt.answers[question.id]
        const isCorrect = userAnswer === question.correctAnswer
        
        return `Question ${questionNum + 1}: "${question.question}"\n\n` +
               `The correct answer is: ${question.options[question.correctAnswer]}\n` +
               `Your answer was: ${userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}\n` +
               `Result: ${isCorrect ? 'Correct! ✓' : 'Incorrect ✗'}\n\n` +
               `${isCorrect ? 'Well done!' : 'The correct answer is important because it directly addresses what the question is asking.'}`
      }
    }
    
    // Default response
    return `I can help you understand your quiz results! You scored ${percentage}% on "${quiz.title}". Ask me about specific questions, your overall performance, or how to improve. For example, try asking "Why did I get question 2 wrong?" or "How can I improve my score?"`
  }

  if (!user || !quiz || !attempt) return null

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
                <p className="text-gray-600">{quiz.title}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowChatbot(!showChatbot)}
              variant={showChatbot ? "default" : "outline"}
              className={showChatbot ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {showChatbot ? "Hide" : "Show"} AI Tutor
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-8 ${showChatbot ? "lg:grid-cols-2" : "max-w-4xl mx-auto"}`}>
          {/* Results Section */}
          <div className="space-y-6">
            {/* Score Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Your Score</CardTitle>
                    <CardDescription>Completed on {new Date(attempt.completedAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <Trophy className="h-12 w-12 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                    <div className="text-xl text-gray-600 mt-2">
                      {attempt.score} out of {attempt.totalQuestions} correct
                    </div>
                  </div>

                  <Progress value={percentage} className="h-4" />

                  <div className="flex justify-center">
                    <Badge className={getScoreBadgeColor(percentage)}>
                      {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Time: {formatTime(attempt.timeElapsed)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Review */}
            <Card>
              <CardHeader>
                <CardTitle>Question Review</CardTitle>
                <CardDescription>Review your answers and see the correct solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {quiz.questions.map((question, index) => {
                    const userAnswer = attempt.answers[question.id]
                    const isCorrect = userAnswer === question.correctAnswer

                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">Question {index + 1}</h4>
                            <p className="text-gray-700 mb-3">{question.question}</p>
                          </div>
                        </div>

                        <div className="ml-8 space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-2 rounded border ${
                                optIndex === question.correctAnswer
                                  ? "bg-green-50 border-green-200 text-green-800"
                                  : optIndex === userAnswer && !isCorrect
                                    ? "bg-red-50 border-red-200 text-red-800"
                                    : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{option}</span>
                                {optIndex === question.correctAnswer && (
                                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                                    Correct
                                  </Badge>
                                )}
                                {optIndex === userAnswer && optIndex !== question.correctAnswer && (
                                  <Badge variant="secondary" className="ml-auto bg-red-100 text-red-800">
                                    Your Answer
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chatbot Section */}
          {showChatbot && (
            <div className="space-y-6">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI Tutor</span>
                  </CardTitle>
                  <CardDescription>Ask questions about your quiz performance or get explanations</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">Ask me anything about your quiz results!</p>
                          <p className="text-xs mt-2 text-gray-400">
                            Try: "Why was question 3 wrong?" or "How can I improve my score?"
                          </p>
                        </div>
                      )}

                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}

                      {isStreaming && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-pulse">Thinking...</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your quiz results..."
                      onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                      disabled={isStreaming}
                    />
                    <Button onClick={sendChatMessage} disabled={!chatInput.trim() || isStreaming} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}