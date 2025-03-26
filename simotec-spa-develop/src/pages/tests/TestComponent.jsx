import React, { useState, useEffect } from "react";
import { Container, Row, Col, ProgressBar } from "react-bootstrap";
import QuestionComponent from "./QuestionComponent";
import { sendRequest } from "../../utils/axios";

const TestComponent = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 600 seconds = 10 minutes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch questions from the API
    const fetchQuestions = async () => {
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/questions`,
        "GET"
      );

      if (response.status === 200) {
        setQuestions(response.data.questions);
        setLoading(false);
      } else {
        console.error("Error fetching questions:", response.data);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    // Start the timer when the component is mounted
    if (!loading && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId); // Clear the interval on component unmount
    }
  }, [loading, timeLeft]);

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const payload = {
      participant_id: 1, // Debes obtener el ID del participante de alguna manera
      test_id: 1, // Suponiendo que el test ID es 1
      answers: Object.keys(answers).map((questionId) => ({
        question_id: parseInt(questionId),
        selected_option_id: answers[questionId],
      })),
    };

    const response = await sendRequest(
      `${import.meta.env.VITE_API_URL}/questions`,
      "POST",
      payload
    );

    if (response.status === 200) {
      console.log("Test submitted successfully");
      alert("Test submitted successfully!");
    } else {
      console.error("Error submitting test:", response.data);
      alert("There was an error submitting your test.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const timeInRed = timeLeft <= 60;

  return (
    <Container
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Row className="mb-4">
        <Col>
          <h2>
            Tiempo Restante:{" "}
            <span style={{ color: timeInRed ? "red" : "black" }}>
              {Math.floor(timeLeft / 60)}:{("0" + (timeLeft % 60)).slice(-2)}
            </span>
          </h2>
          <ProgressBar now={(600 - timeLeft) / 6} />
        </Col>
      </Row>
      <Row className="flex-grow-1">
        <Col>
          <QuestionComponent
            question={currentQuestion}
            onOptionSelect={handleOptionSelect}
            onNext={handleNextQuestion}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default TestComponent;
