import React from "react";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import DemoCharts from "../../components/DemoCharts";

const Landing = () => {
  const tests = [
    {
      id: 1,
      name: "Psicolaboral",
      link: "/test",
    },
    {
      id: 2,
      name: "En construcción",
      link: "/en-construccion",
    },
    {
      id: 3,
      name: "En construcción",
      link: "/en-construccion",
    },
  ];

  return (
    <Container fluid>
      <Row>
        <Col className="d-flex justify-content-center mt-5">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-around",
            }}
          >
            <DemoCharts />
          </div>
        </Col>
      </Row>

      <Row>
        {tests.map((test) => (
          <Col key={test.id} className="d-flex justify-content-center mt-5">
            <Card style={{ width: "18rem" }}>
              <Card.Body>
                <Card.Title>{test.name}</Card.Title>
                <Card.Text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
                  nec metus ac nisi ultricies.
                </Card.Text>
                <Link to={test.link}>
                  <Button variant="primary">Comenzar</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Landing;
