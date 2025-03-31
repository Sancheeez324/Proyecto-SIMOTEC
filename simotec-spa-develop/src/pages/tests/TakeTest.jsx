import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { sendRequest } from '../../utils/axios';

const TakeTest = () => {
  const { assigned_test_id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testInfo, setTestInfo] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const timeInRed = timeLeft <= 60;

  const esPSL = testInfo?.test_id === 4 || testInfo?.test_name === 'PSL';

  useEffect(() => {
    const saveProgress = async () => {
      if (Object.keys(answers).length === 0 || !testInfo) return;

      try {
        setSaving(true);
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        await sendRequest(
          `${import.meta.env.VITE_API_URL}/user-tests/${testInfo.test_id}/save-progress`,
          'POST',
          {
            auth_user_id: userData.id,
            answers: answers,
            current_question: Object.keys(answers).length
          },
          {
            'Authorization': `Bearer ${token}`
          }
        );

        const newProgress = Math.floor((Object.keys(answers).length / questions.length) * 100);
        setProgress(newProgress);
      } catch (err) {
        console.error("Error al guardar progreso:", err);
      } finally {
        setSaving(false);
      }
    };

    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [answers, testInfo, questions.length]);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));
        const auth_user_id = userData?.id;

        const testRes = await fetch(
          `${import.meta.env.VITE_API_URL}/assigned-tests/${assigned_test_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!testRes.ok) {
          const errorData = await testRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar el test');
        }

        const testData = await testRes.json();
        setTestInfo(testData);
        setTimeLeft(testData.duration_minutes * 60);

        const questionsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/user-tests/${testData.test_id}/questions?auth_user_id=${auth_user_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!questionsRes.ok) {
          const errorData = await questionsRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar preguntas');
        }

        const questionsData = await questionsRes.json();

        setQuestions(questionsData.questions);
        setTotalQuestions(questionsData.questions[0]?.metadata?.total_questions || 0);

        if (questionsData.saved_answers) {
          setAnswers(questionsData.saved_answers);
        }

        if (questionsData.progress) {
          setProgress(questionsData.progress);
        }

      } catch (err) {
        console.error("Error en fetchTestData:", err);
        setError(err.message || "Error desconocido al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [assigned_test_id]);

  useEffect(() => {
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    const newAnswers = { ...answers };

    if (isMultiple) {
      newAnswers[questionId] = newAnswers[questionId] || [];
      const optionIndex = newAnswers[questionId].indexOf(optionId);

      if (optionIndex === -1) {
        newAnswers[questionId].push(optionId);
      } else {
        newAnswers[questionId].splice(optionIndex, 1);
      }
    } else {
      newAnswers[questionId] = [optionId];
    }

    setAnswers(newAnswers);

    const answeredCount = Object.keys(newAnswers).length;
    const newProgress = Math.floor((answeredCount / questions.length) * 100);
    setProgress(newProgress);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/user-tests/${testInfo.test_id}/submit`,
        'POST',
        {
          auth_user_id: userData.id,
          responses: Object.entries(answers).map(([questionId, selectedOptions]) => ({
            question_id: parseInt(questionId),
            selected_options: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions]
          }))
        },
        {
          'Authorization': `Bearer ${token}`
        }
      );

      navigate(`/test-result/${assigned_test_id}`, { state: response });
    } catch (error) {
      setError('Error al enviar respuestas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const PreguntaLikert = ({ pregunta, onChange, respuesta }) => {
    const etiquetas = ["Nunca", "Casi Nunca", "A veces", "Casi Siempre", "Siempre"];

    return (
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>{pregunta.question_text}</Card.Title>
          <div className="d-flex justify-content-between">
            {etiquetas.map((etiqueta, idx) => {
              const valor = idx + 1;
              return (
                <div key={valor} className="text-center">
                  <label>{etiqueta}</label>
                  <input
                    type="radio"
                    name={`q-${pregunta.id}`}
                    value={valor}
                    checked={respuesta?.includes(valor)}
                    onChange={() => onChange(pregunta.id, valor, false)}
                  />
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <Spinner animation="border" />
    </div>
  );

  return (
    <Container className="mt-5 pt-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{testInfo?.test_name}</h2>
          {totalQuestions > 0 && (
            <small className="text-muted">
              Mostrando {questions.length} de {totalQuestions} preguntas disponibles
            </small>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: timeInRed ? '#e74c3c' : '#3498db', color: 'white', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
            Tiempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div style={{ backgroundColor: '#2ecc71', color: 'white', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
            Progreso: {progress}%
          </div>
        </div>
      </div>

      <ProgressBar now={progress} style={{ marginBottom: '30px', height: '10px' }} variant={progress < 30 ? 'danger' : progress < 70 ? 'warning' : 'success'} />

      {error && <Alert variant="danger">{error}</Alert>}
      {saving && <Alert variant="info">Guardando progreso...</Alert>}

      {esPSL ? (
  Object.entries(
    questions.reduce((acc, pregunta) => {
      const grupo = pregunta.subdimension || 'Sin subdimensión';
      acc[grupo] = acc[grupo] || [];
      acc[grupo].push(pregunta);
      return acc;
    }, {})
  ).map(([subdimension, preguntasGrupo]) => (
    <div key={subdimension}>
      <h4 className="mt-5 mb-3">{subdimension}</h4>
      {preguntasGrupo.map((pregunta) => (
        <PreguntaLikert
          key={pregunta.id}
          pregunta={pregunta}
          respuesta={answers[pregunta.id]}
          onChange={handleAnswerChange}
        />
      ))}
    </div>
  ))
) : (
  questions.map((question, qIndex) => (
    <Card key={question.id} className="mb-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderLeft: answers[question.id]?.length > 0 ? '4px solid #2ecc71' : '4px solid #f8f9fa' }}>
      <Card.Body>
        <Card.Title>Pregunta {qIndex + 1}</Card.Title>
        <Card.Text>{question.question_text}</Card.Text>
        {question.image_url && (
          <img src={question.image_url} alt="Ilustración pregunta" style={{ maxHeight: '200px', marginBottom: '15px' }} />
        )}
        <Form.Group>
          {question.options.map(option => (
            <div key={option.id} style={{ marginBottom: '10px' }}>
              <Form.Check
                type={question.type === 'simple' ? 'radio' : 'checkbox'}
                id={`q${question.id}-o${option.id}`}
                name={`q${question.id}`}
                label={option.option_text}
                checked={answers[question.id]?.includes(option.id) || false}
                onChange={() => handleAnswerChange(
                  question.id,
                  option.id,
                  question.type !== 'simple'
                )}
              />
            </div>
          ))}
        </Form.Group>
      </Card.Body>
    </Card>
  ))
)}



      <div className="text-center mt-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={loading || Object.keys(answers).length === 0}
          style={{ padding: '10px 30px', fontSize: '1.1rem' }}
        >
          {loading ? 'Enviando...' : 'Finalizar Test'}
        </Button>
      </div>
    </Container>
  );
};

export default TakeTest;
