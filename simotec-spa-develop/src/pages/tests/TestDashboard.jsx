import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { sendRequest } from '../../utils/axios';

const TestDashboard = () => {
  const [assignedTests, setAssignedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('id');
    
  useEffect(() => {
    const fetchAssignedTests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            setErrorMessage("No se encontró el token de autenticación");
            return;
        }

        const userData = JSON.parse(localStorage.getItem("user"));
        console.log(userData);
        const userId = userData?.id; // ID del cadmin loggeado
        console.log(userId);
        const response = await sendRequest(
          `${import.meta.env.VITE_API_URL}/assigned-tests/${userId}`,
          'GET'
        );

        if (response.status === 200) {
          setAssignedTests(response.data);
        } else {
          throw new Error(response.data.message || 'Error al cargar tests');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedTests();
  }, [userId]);

  const getStatusBadge = (status) => {
    const variants = {
      pendiente: 'warning',
      completado: 'success',
      reiniciado: 'danger'
    };
    return <Badge bg={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Container className="mt-4" style={{ maxWidth: '1200px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Mis Evaluaciones</h2>
        <Button 
          variant="outline-primary"
          onClick={() => navigate('/userhome')}
        >
          Volver al Inicio
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <Spinner animation="border" />
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {assignedTests.map(test => (
            <Card key={test.assigned_test_id} style={{ 
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              ':hover': { transform: 'translateY(-5px)' }
            }}>
              <Card.Body>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <Card.Title style={{ 
                    color: '#3498db',
                    margin: 0
                  }}>
                    {test.test_name}
                  </Card.Title>
                  {getStatusBadge(test.status)}
                </div>
                
                <Card.Text style={{ color: '#7f8c8d' }}>
                  {test.description || 'Sin descripción'}
                </Card.Text>
                
                <div style={{ margin: '15px 0' }}>
                  <span style={{ fontWeight: '500' }}>Sector:</span> {test.sector}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontWeight: '500' }}>Puntaje mínimo:</span> {test.passing_score}%
                  {test.score && (
                    <span style={{ marginLeft: '15px' }}>
                      <span style={{ fontWeight: '500' }}>Tu puntaje:</span> 
                      <span style={{ 
                        color: test.score >= test.passing_score ? '#27ae60' : '#e74c3c',
                        fontWeight: 'bold'
                      }}>
                        {' '}{test.score}%
                      </span>
                    </span>
                  )}
                </div>

                <Button
                  variant={test.status === 'completado' ? 'outline-success' : 'primary'}
                  onClick={() => {
                    if (test.status === 'completado') {
                      navigate(`/test-result/${test.assigned_test_id}`);
                    } else {
                      navigate(`/take-test/${test.assigned_test_id}`);
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  {test.status === 'completado' ? 'Ver Resultados' : 'Realizar Test'}
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {!loading && assignedTests.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Card.Body>
            <h4 style={{ color: '#7f8c8d' }}>
              No tienes evaluaciones asignadas actualmente
            </h4>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/userhome')}
              style={{ marginTop: '20px' }}
            >
              Volver al inicio
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TestDashboard;