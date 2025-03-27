import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { sendRequest } from '../../utils/axios';

const TestResult = () => {
  const { assigned_test_id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState('');

  useEffect(() => {
    if (state) {
      setResult(state);
      setLoading(false);
    } else {
      const fetchResult = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await sendRequest(
            `${import.meta.env.VITE_API_URL}/assigned-tests/${assigned_test_id}/result`,
            'GET'
          );

          if (response.status === 200) {
            setResult(response.data);
          } else {
            throw new Error(response.data.message || 'Error al cargar resultados');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [assigned_test_id, state]);

  if (loading) {
    return (
      <Container style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh'
      }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!result) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error || 'No se encontraron resultados para este test'}
          <Button 
            variant="outline-danger" 
            onClick={() => navigate('/tests')} 
            className="mt-2"
          >
            Volver a mis tests
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container style={{ 
      maxWidth: '800px',
      padding: '20px',
      marginTop: '40px'
    }}>
      <Card style={{ 
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Card.Body style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>
              Resultado de la Evaluación
            </h2>
            
            <div style={{
              fontSize: '5rem',
              color: result.passed ? '#27ae60' : '#e74c3c',
              margin: '20px 0'
            }}>
              {result.passed ? '✓' : '✗'}
            </div>
            
            <h3 style={{ 
              color: result.passed ? '#27ae60' : '#e74c3c',
              marginBottom: '30px'
            }}>
              {result.passed ? 'APROBADO' : 'REPROBADO'}
            </h3>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span>Tu puntaje:</span>
                <span style={{ fontWeight: 'bold' }}>{result.score}%</span>
              </div>
              
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}>
                <span>Puntaje requerido:</span>
                <span style={{ fontWeight: 'bold' }}>{result.passing_score}%</span>
              </div>
              
              <ProgressBar 
                now={result.score} 
                max={100}
                variant={result.passed ? 'success' : 'danger'}
                style={{ height: '10px' }}
              />
            </div>
            
            {!result.passed && (
              <Alert variant="warning" style={{ marginBottom: '30px' }}>
                Necesitas al menos {result.passing_score}% para aprobar. Puedes intentarlo nuevamente.
              </Alert>
            )}
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <Button 
                variant="primary" 
                onClick={() => navigate('/tests')}
                style={{ padding: '10px 25px' }}
              >
                Volver a mis tests
              </Button>
              
              {!result.passed && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate(`/take-test/${assigned_test_id}`)}
                  style={{ padding: '10px 25px' }}
                >
                  Reintentar evaluación
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestResult;