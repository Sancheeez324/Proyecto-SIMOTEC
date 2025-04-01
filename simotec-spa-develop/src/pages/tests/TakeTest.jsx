import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { sendRequest } from '../../utils/axios';

const TakeTest = () => {
  const { assigned_test_id } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const userData = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const auth_user_id = userData?.id;
  
  useEffect(() => {
    const fetchTestInfo = async () => {
      try {
        const response = await sendRequest(
          `${import.meta.env.VITE_API_URL}/assigned-tests/${assigned_test_id}`,
          'GET',
          null,
          { 'Authorization': `Bearer ${token}` }
        );
        const testData = response.data;
        console.log('Respuesta de testData:', testData);
        if (!testData) {
          setError('No se recibió información del test asignado.');
          setLoading(false);
          return;
        }
        // Convertir el status a string y normalizarlo
        const statusValue = (testData.status || '').toString().trim().toLowerCase();
        setTestInfo(testData);
        setTimeLeft((testData.duration_minutes || 0) * 60);
        
        let questionsData;
        if (statusValue === 'pendiente') {
          const resp = await sendRequest(
            `${import.meta.env.VITE_API_URL}/user-tests/${testData.test_id}/questions?auth_user_id=${auth_user_id}`,
            'GET',
            null,
            { 'Authorization': `Bearer ${token}` }
          );
          questionsData = resp.data;
        } else if (statusValue === 'en_progreso') {
          const resp = await sendRequest(
            `${import.meta.env.VITE_API_URL}/user-tests/${testData.test_id}/savedQuestions?auth_user_id=${auth_user_id}`,
            'GET',
            null,
            { 'Authorization': `Bearer ${token}` }
          );
          questionsData = resp.data;
        } else {
          setError('El test ya fue completado o reiniciado.');
          setLoading(false);
          return;
        }
        
        setQuestions(questionsData.questions || []);
        setAnswers(questionsData.saved_answers || {});
        setProgress(questionsData.progress || 0);
      } catch (err) {
        console.error('Error al cargar el test:', err);
        setError('Error al cargar el test.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestInfo();
  }, [assigned_test_id]);
  
  useEffect(() => {
    const saveProgress = async () => {
      if (!testInfo) return;
      try {
        setSaving(true);
        await sendRequest(
          `${import.meta.env.VITE_API_URL}/user-test/${assigned_test_id}/saveProgress`,
          'POST',
          { auth_user_id, answers, current_question: Object.keys(answers).length },
          { 'Authorization': `Bearer ${token}` }
        );
        if (questions.length > 0) {
          setProgress(Math.floor((Object.keys(answers).length / questions.length) * 100));
        }
      } catch (err) {
        console.error('Error al guardar progreso:', err);
      } finally {
        setSaving(false);
      }
    };
    
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [answers, testInfo, questions, assigned_test_id]);
  
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
    setAnswers(prev => {
      const updatedAnswers = { ...prev };
      if (isMultiple) {
        updatedAnswers[questionId] = updatedAnswers[questionId] || [];
        const idx = updatedAnswers[questionId].indexOf(optionId);
        if (idx === -1) {
          updatedAnswers[questionId].push(optionId);
        } else {
          updatedAnswers[questionId].splice(idx, 1);
        }
      } else {
        updatedAnswers[questionId] = [optionId];
      }
      return updatedAnswers;
    });
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Aquí se utiliza la ruta: /user-tests/{test_id}/submit (sin "s" extra)
      const resp = await sendRequest(
        `${import.meta.env.VITE_API_URL}/user-tests/${testInfo.test_id}/submit`,
        'POST',
        {
          auth_user_id,
          responses: Object.entries(answers).map(([qid, opts]) => ({
            question_id: parseInt(qid, 10),
            selected_options: Array.isArray(opts) ? opts : [opts]
          }))
        },
        { 'Authorization': `Bearer ${token}` }
      );
      navigate(`/test-result/${assigned_test_id}`, { state: resp.data });
    } catch (err) {
      console.error('Error al enviar respuestas:', err);
      setError('Error al enviar respuestas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  return (
    <Container className="mt-5">
      {saving && <Alert variant="info">Guardando progreso...</Alert>}
      <h2>{testInfo?.test_name}</h2>
      <ProgressBar now={progress} className="mb-4" />
      {questions.map((q, idx) => (
        <Card key={q.id} className="mb-3">
          <Card.Body>
            <Card.Title>Pregunta {idx + 1}</Card.Title>
            <Card.Text>{q.question_text}</Card.Text>
            <Form>
              {(q.options || []).map(option => (
                <Form.Check
                  key={option.id}
                  type={q.type === 'simple' ? 'radio' : 'checkbox'}
                  name={`q${q.id}`}
                  label={option.option_text}
                  checked={answers[q.id]?.includes(option.id) || false}
                  onChange={() => handleAnswerChange(q.id, option.id, q.type !== 'simple')}
                />
              ))}
            </Form>
          </Card.Body>
        </Card>
      ))}
      <Button onClick={handleSubmit} disabled={loading || Object.keys(answers).length === 0}>
        Finalizar Test
      </Button>
    </Container>
  );
};

export default TakeTest;
