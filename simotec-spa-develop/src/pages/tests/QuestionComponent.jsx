import React from 'react';
import { Button, Card } from 'react-bootstrap';

const QuestionComponent = ({ question, onOptionSelect, onNext }) => {
    const handleOptionChange = (optionId) => {
        onOptionSelect(question.question_id, optionId);
    };

    return (
        <Card className="w-100">
            <Card.Body>
                <Card.Title>{question.question_text}</Card.Title>
                <div className="mt-3">
                    {question.options.map(option => (
                        <div key={option.option_id} className="mb-2">
                            <input
                                type="radio"
                                id={`option-${option.option_id}`}
                                name={`question-${question.question_id}`}
                                value={option.option_id}
                                onChange={() => handleOptionChange(option.option_id)}
                            />
                            <label htmlFor={`option-${option.option_id}`} className="ml-2">{option.option_text}</label>
                        </div>
                    ))}
                </div>
                <Button className="mt-3" onClick={onNext}>Siguiente</Button>
            </Card.Body>
        </Card>
    );
};

export default QuestionComponent;
