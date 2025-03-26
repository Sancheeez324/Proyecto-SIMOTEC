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
  
  // Temporizador rescatado de TestComponent.jsx
  const [timeLeft, setTimeLeft] = useState(0);
  const timeInRed = timeLeft <= 60;

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const testRes = await fetch(`${import.meta.env.VITE_API_URL}/assigned-tests/${assigned_test_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!testRes.ok) throw new Error('Error al cargar test');
        const testData = await testRes.json();
        
        setTestInfo(testData);
        setTimeLeft(testData.duration_minutes * 60);
        
        const questionsRes = await fetch(`${import.meta.env.VITE_API_URL}/user-tests/${testData.test_id}/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!questionsRes.ok) throw new Error('Error al cargar preguntas');
        const questionsData = await questionsRes.json();
        
        setQuestions(questionsData);
      } catch (err) {
        setError(err.message);
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: isMultiple 
        ? [...(prev[questionId] || []), optionId]
        : [optionId]
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/user-tests/${testInfo.test_id}/submit`,
        'POST',
        {
          user_id: testInfo.user_id,
          responses: Object.entries(answers).map(([questionId, selectedOptions]) => ({
            question_id: parseInt(questionId),
            selected_options: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions]
          }))
        }
      );

      navigate(`/test-result/${assigned_test_id}`, { state: response });
    } catch (error) {
      setError('Error al enviar respuestas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <Spinner animation="border" />
    </div>
  );

  return (
    <Container className="mt-5 pt-4">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: 0 }}>{testInfo?.test_name}</h2>
        <div style={{
          backgroundColor: timeInRed ? '#e74c3c' : '#3498db',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontWeight: 'bold'
        }}>
          Tiempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <ProgressBar 
        now={((testInfo?.duration_minutes * 60 - timeLeft) / (testInfo?.duration_minutes * 60)) * 100} 
        style={{ marginBottom: '30px', height: '10px' }}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {questions.map((question, qIndex) => (
        <Card key={question.id} className="mb-4" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Card.Body>
            <Card.Title>Pregunta {qIndex + 1}</Card.Title>
            <Card.Text>{question.question_text}</Card.Text>
            
            {question.image_url && (
              <img 
                src={question.image_url} 
                alt="Ilustración pregunta" 
                style={{ maxHeight: '200px', marginBottom: '15px' }}
              />
            )}
            
            <Form.Group>
              {question.options.map(option => (
                <div key={option.id} style={{ marginBottom: '10px' }}>
                  <Form.Check
                    type={question.type === 'simple' ? 'radio' : 'checkbox'}
                    id={`q${question.id}-o${option.id}`}
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
      ))}

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