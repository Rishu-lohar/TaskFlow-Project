import React from 'react';
import { Container } from 'react-bootstrap';

const Header = () => (
  <header className="mb-4">
    <Container>
      <div className="text-center">
        <h1>
          <i className="bi bi-check2-circle me-2"></i>
          TaskFlow
        </h1>

        <p className="mb-0">
          <i className="bi bi-lightning-fill"></i>
          Smart Task Manager
        </p>
      </div>
    </Container>
  </header>
);

export default Header;