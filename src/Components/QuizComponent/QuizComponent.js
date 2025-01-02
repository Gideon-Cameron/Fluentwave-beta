import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WordLearningComponent from './WordLearningComponent';
import SentenceUseComponent from './SentenceUseComponent';
import RegularQuestionComponent from './RegularQuestionComponent';
import MatchingWordsComponent from './MatchingWordsComponent';
import WordIntroductionComponent from './WordIntroductionComponent';

const QuizComponent = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [newLevel, setNewLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [buttonColor, setButtonColor] = useState('bg-gray-300');

  const formattedQuizId = String(quizId);

  // Fetch Quiz Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`https://fluentwave-backend-beta.onrender.com/api/quiz-completion/${formattedQuizId}`);
        if (!response.ok) throw new Error('Failed to fetch quiz data');
        const data = await response.json();

        console.log('Fetched Quiz Data:', data);

        const wordIntroQuestions = data.questions.filter(
          (q) => q.questionType === 'wordIntroduction'
        );
        const wordLearningQuestions = data.questions.filter(
          (q) => q.questionType === 'wordLearning'
        );
        const otherQuestions = data.questions.filter(
          (q) =>
            q.questionType !== 'wordIntroduction' &&
            q.questionType !== 'wordLearning'
        );

        console.log('Word Introduction Questions:', wordIntroQuestions);
        console.log('Word Learning Questions:', wordLearningQuestions);
        console.log('Other Questions (before shuffle):', otherQuestions);

        const shuffledOtherQuestions = otherQuestions.sort(() => Math.random() - 0.5);

        console.log('Shuffled Other Questions:', shuffledOtherQuestions);

        data.questions = [
          ...wordIntroQuestions,
          ...wordLearningQuestions,
          ...shuffledOtherQuestions,
        ];

        console.log('Final Question Order:', data.questions);

        setQuizData(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
        console.error('Error fetching quiz:', error);
      }
    };
    fetchQuiz();
  }, [formattedQuizId]);

  // Handle Correct / Incorrect Answers
  const handleAnswer = (isCorrect) => {
    setIsAnswered(true);
    setButtonColor(isCorrect ? 'bg-green-500' : 'bg-red-500');

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setQuestionsAttempted((prevCount) => prevCount + 1);
  };

  // Continue to Next Question
  const handleContinue = () => {
    setIsAnswered(false);
    setButtonColor('bg-gray-300');

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      handleQuizCompletion();
    }
  };

  // Submit Quiz Completion to Backend
  const handleQuizCompletion = async () => {
    try {
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
      const lessonId = quizData.lessonId?._id || quizData.lessonId;  // Ensure lessonId is properly formatted

      console.log('Submitting Quiz Completion:', { userId, lessonId, score });

      const response = await fetch(`https://fluentwave-backend-beta.onrender.com/api/quiz-completion/${formattedQuizId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          lessonId,
          score,
          totalQuestions: quizData.questions.length,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete quiz');
      const data = await response.json();

      console.log('Quiz Completion Response:', data);

      setXpGained(data.xpGained);
      setNewLevel(data.level);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('Could not complete quiz. Please try again later.');
    }
  };

  if (loading) return <div>Loading quiz...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!quizData) return <div>No quiz data available</div>;

  const currentQuestion = quizData.questions[currentQuestionIndex];

  // Render Appropriate Question Component
  const renderQuestionComponent = () => {
    switch (currentQuestion.questionType) {
      case 'wordIntroduction':
        return (
          <WordIntroductionComponent
            question={currentQuestion}
            onAnswer={() => handleAnswer(true)}  // Always correct for introduction
          />
        );
      case 'wordLearning':
        return <WordLearningComponent question={currentQuestion} onAnswer={handleAnswer} />;
      case 'sentenceUse':
        return <SentenceUseComponent question={currentQuestion} onAnswer={handleAnswer} />;
      case 'multipleChoice':
        return (
          <RegularQuestionComponent
            question={currentQuestion}
            onAnswer={handleAnswer}
            key={currentQuestionIndex}
          />
        );
      case 'matching':
        return <MatchingWordsComponent question={currentQuestion} onAnswer={handleAnswer} />;
      default:
        return <div>Unknown question type</div>;
    }
  };

  const quizCompletionPercentage = Math.round((score / quizData.questions.length) * 100);

  return (
    <div className="p-6 bg-gray-100 min-h-screen md:ml-60 flex flex-col items-center">
      {!quizCompleted ? (
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6">
            {quizData.lessonTitle ? `Quiz: ${quizData.lessonTitle}` : 'Quiz'}
          </h2>
          <p className="text-lg mb-4">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </p>
          {renderQuestionComponent()}
          <div className="flex justify-between mt-8 w-full">
            <button
              onClick={handleContinue}
              disabled={!isAnswered}
              className={`px-6 py-3 rounded-lg text-lg ${buttonColor} ${
                isAnswered ? 'text-white' : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-4xl font-bold text-green-500 mb-4">🎉 Quiz Complete!</h2>
          <p className="text-6xl font-extrabold">{quizCompletionPercentage}%</p>
          <p className="text-lg mt-4">XP Gained: <span className="font-semibold">{xpGained}</span></p>
          <p className="text-lg">Current Level: <span className="font-semibold">{newLevel}</span></p>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;